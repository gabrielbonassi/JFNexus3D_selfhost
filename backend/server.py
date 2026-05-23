from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import logging
import os
import uuid

import bcrypt
import jwt
import requests
from fastapi import (
    APIRouter,
    Depends,
    FastAPI,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
)
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr
from starlette.middleware.cors import CORSMiddleware

# =========================
# CONFIG
# =========================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

APP_NAME = "jfnexus3d"
JWT_ALGORITHM = "HS256"

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
db_name = os.environ.get("DB_NAME", "jfnexus3d")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)

# =========================
# CORS
# =========================
# Aceita localhost, GitHub Codespaces e VS Code Dev Tunnels.
# Isso evita ficar editando CORS toda vez que o link muda.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=(
        r"^https://.*\.app\.github\.dev$|"
        r"^https://.*\.devtunnels\.ms$"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# =========================
# STORAGE
# =========================

def put_object(path: str, data: bytes, content_type: str) -> dict:
    file_path = UPLOAD_DIR / path
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with open(file_path, "wb") as f:
        f.write(data)

    return {
        "path": path,
        "content_type": content_type,
        "size": len(data),
    }


# =========================
# AUTH
# =========================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "dev-secret-change-me")


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access",
    }

    return jwt.encode(
        payload,
        get_jwt_secret(),
        algorithm=JWT_ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "type": "refresh",
    }

    return jwt.encode(
        payload,
        get_jwt_secret(),
        algorithm=JWT_ALGORITHM,
    )


def cookie_options(request: Request) -> dict:
    """Cookies precisam de SameSite=None + Secure quando front/back estão em domínios https diferentes."""
    origin = request.headers.get("origin", "")
    is_https_origin = origin.startswith("https://")

    return {
        "httponly": True,
        "secure": is_https_origin,
        "samesite": "none" if is_https_origin else "lax",
        "path": "/",
    }


def set_auth_cookies(
    response: Response,
    request: Request,
    access_token: str,
    refresh_token: str,
) -> None:
    opts = cookie_options(request)

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=3600,
        **opts,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=30 * 24 * 60 * 60,
        **opts,
    )


def delete_auth_cookies(response: Response, request: Request) -> None:
    opts = cookie_options(request)
    response.delete_cookie(key="access_token", path="/", secure=opts["secure"], samesite=opts["samesite"])
    response.delete_cookie(key="refresh_token", path="/", secure=opts["secure"], samesite=opts["samesite"])
    response.delete_cookie(key="session_token", path="/", secure=opts["secure"], samesite=opts["samesite"])


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None

    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.fromisoformat(value)

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt


def ensure_access_not_expired(user_doc: dict) -> None:
    expires_at = parse_datetime(user_doc.get("expires_at"))

    # Admin sem expires_at não deve ser bloqueado.
    if not expires_at:
        return

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=403,
            detail="Seu acesso expirou. Entre em contato pelo WhatsApp para renovar.",
        )


# =========================
# MODELS
# =========================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str
    email: str
    name: str
    role: str = "user"
    picture: Optional[str] = None
    expires_at: Optional[str] = None
    created_at: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class SessionRequest(BaseModel):
    session_id: str


class ProjectCreate(BaseModel):
    title: str
    description: str
    tags: List[str] = []


# =========================
# USER HELPERS
# =========================

async def get_current_user_from_jwt(request: Request) -> User:
    token = request.cookies.get("access_token")

    if not token:
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
        )

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_doc = await db.users.find_one(
            {"user_id": payload["sub"]},
            {"_id": 0, "password_hash": 0},
        )

        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        ensure_access_not_expired(user_doc)
        return User(**user_doc)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user_from_google(request: Request) -> User:
    token = request.cookies.get("session_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one(
        {"session_token": token},
        {"_id": 0},
    )

    if not session_doc:
        raise HTTPException(status_code=401, detail="Session not found")

    expires_at = parse_datetime(session_doc.get("expires_at"))

    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0, "password_hash": 0},
    )

    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    ensure_access_not_expired(user_doc)
    return User(**user_doc)


async def get_current_user(request: Request) -> User:
    try:
        return await get_current_user_from_jwt(request)
    except HTTPException:
        return await get_current_user_from_google(request)


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


# =========================
# AUTH ROUTES
# =========================

@api_router.post("/auth/login")
async def login(
    login_req: LoginRequest,
    request: Request,
    response: Response,
):
    email = login_req.email.lower()

    user_doc = await db.users.find_one(
        {"email": email},
        {"_id": 0},
    )

    if not user_doc or "password_hash" not in user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    ensure_access_not_expired(user_doc)

    if not verify_password(login_req.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        user_doc["user_id"],
        user_doc["email"],
        user_doc["role"],
    )

    refresh_token = create_refresh_token(user_doc["user_id"])

    set_auth_cookies(response, request, access_token, refresh_token)

    user_doc.pop("password_hash", None)

    return {
        "user": User(**user_doc),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


@api_router.post("/auth/register")
async def register(
    register_req: RegisterRequest,
    request: Request,
    response: Response,
):
    email = register_req.email.lower()

    existing_user = await db.users.find_one({"email": email})

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"

    user_doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(register_req.password),
        "name": register_req.name,
        "role": "user",
        "expires_at": (
            datetime.now(timezone.utc) + timedelta(days=30)
        ).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.users.insert_one(user_doc)

    access_token = create_access_token(user_id, email, "user")
    refresh_token = create_refresh_token(user_id)

    set_auth_cookies(response, request, access_token, refresh_token)

    user_doc.pop("password_hash", None)

    return {
        "user": User(**user_doc),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


@api_router.post("/auth/session-disabled")
async def process_session(
    session_req: SessionRequest,
    request: Request,
    response: Response,
):
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_req.session_id},
            timeout=10,
        )

        resp.raise_for_status()
        data = resp.json()

        user_id = f"user_{uuid.uuid4().hex[:12]}"

        existing_user = await db.users.find_one(
            {"email": data["email"]},
            {"_id": 0},
        )

        if existing_user:
            user_id = existing_user["user_id"]

            await db.users.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "name": data["name"],
                        "picture": data.get("picture"),
                    }
                },
            )

        else:
            user_doc = {
                "user_id": user_id,
                "email": data["email"],
                "name": data["name"],
                "picture": data.get("picture"),
                "role": "user",
                "expires_at": (
                    datetime.now(timezone.utc) + timedelta(days=30)
                ).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

            await db.users.insert_one(user_doc)

        session_token = data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        session_doc = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        await db.user_sessions.insert_one(session_doc)

        opts = cookie_options(request)
        response.set_cookie(
            key="session_token",
            value=session_token,
            max_age=7 * 24 * 60 * 60,
            **opts,
        )

        user = await db.users.find_one(
            {"user_id": user_id},
            {"_id": 0, "password_hash": 0},
        )

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return User(**user)

    except Exception as e:
        logging.error(f"Session processing error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    delete_auth_cookies(response, request)
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user


# =========================
# PROJECTS
# =========================

@api_router.get("/projects")
async def get_projects(search: Optional[str] = Query(None)):
    query = {}

    if search:
        query = {
            "$or": [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}},
            ]
        }

    projects = await db.projects.find(
        query,
        {"_id": 0},
    ).sort("created_at", -1).to_list(100)

    return projects


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one(
        {"project_id": project_id},
        {"_id": 0},
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.projects.update_one(
        {"project_id": project_id},
        {"$inc": {"view_count": 1}},
    )

    return project


@api_router.post("/projects")
async def create_project(
    project: ProjectCreate,
    admin: User = Depends(require_admin),
):
    project_id = f"proj_{uuid.uuid4().hex[:12]}"

    project_doc = {
        "project_id": project_id,
        "user_id": admin.user_id,
        "title": project.title,
        "description": project.description,
        "tags": project.tags,
        "thumbnail_url": "",
        "files": [],
        "view_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.projects.insert_one(project_doc)

    return {"project_id": project_id}


@api_router.post("/projects/{project_id}/upload")
async def upload_file(
    project_id: str,
    file: UploadFile,
    file_type: str,
    admin: User = Depends(require_admin),
):
    project = await db.projects.find_one(
        {"project_id": project_id},
        {"_id": 0},
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    filename = file.filename or "file.bin"
    ext = filename.split(".")[-1] if "." in filename else "bin"

    path = f"{APP_NAME}/projects/{project_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()

    result = put_object(
        path,
        data,
        file.content_type or "application/octet-stream",
    )

    file_doc = {
        "file_id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": filename,
        "content_type": file.content_type,
        "size": result["size"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.files.insert_one(file_doc)

    if file_type == "thumbnail":
        await db.projects.update_one(
            {"project_id": project_id},
            {"$set": {"thumbnail_url": result["path"]}},
        )

    else:
        await db.projects.update_one(
            {"project_id": project_id},
            {
                "$push": {
                    "files": {
                        "file_id": file_doc["file_id"],
                        "filename": filename,
                        "path": result["path"],
                        "size": result["size"],
                    }
                }
            },
        )

    return {
        "path": result["path"],
        "file_id": file_doc["file_id"],
    }


@api_router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    admin: User = Depends(require_admin),
):
    project = await db.projects.find_one(
        {"project_id": project_id},
        {"_id": 0},
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    paths_to_delete = []

    if project.get("thumbnail_url"):
        paths_to_delete.append(project["thumbnail_url"])

    for file in project.get("files", []):
        if file.get("path"):
            paths_to_delete.append(file["path"])

    for path in paths_to_delete:
        full_path = UPLOAD_DIR / path

        if full_path.exists():
            full_path.unlink()

    await db.files.delete_many({"storage_path": {"$in": paths_to_delete}})
    await db.favorites.delete_many({"project_id": project_id})
    await db.projects.delete_one({"project_id": project_id})

    return {"message": "Project deleted"}


@api_router.get("/files/{file_path:path}")
async def serve_file(file_path: str):
    full_path = UPLOAD_DIR / file_path

    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    return FileResponse(
        full_path,
        filename=full_path.name,
        media_type="application/octet-stream",
    )


# =========================
# FAVORITES
# =========================

@api_router.get("/favorites")
async def get_favorites(user: User = Depends(get_current_user)):
    favorites = await db.favorites.find(
        {"user_id": user.user_id},
        {"_id": 0},
    ).to_list(100)

    project_ids = [fav["project_id"] for fav in favorites]

    projects = await db.projects.find(
        {"project_id": {"$in": project_ids}},
        {"_id": 0},
    ).to_list(100)

    return projects


@api_router.post("/favorites/{project_id}")
async def add_favorite(
    project_id: str,
    user: User = Depends(get_current_user),
):
    project = await db.projects.find_one({"project_id": project_id})

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = await db.favorites.find_one(
        {
            "user_id": user.user_id,
            "project_id": project_id,
        }
    )

    if existing:
        return {"message": "Already favorited"}

    favorite_doc = {
        "favorite_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "project_id": project_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.favorites.insert_one(favorite_doc)

    return {"message": "Favorited"}


@api_router.delete("/favorites/{project_id}")
async def remove_favorite(
    project_id: str,
    user: User = Depends(get_current_user),
):
    await db.favorites.delete_one(
        {
            "user_id": user.user_id,
            "project_id": project_id,
        }
    )

    return {"message": "Removed"}


# =========================
# ADMIN
# =========================

@api_router.get("/admin/users")
async def get_admin_users(admin: User = Depends(require_admin)):
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0},
    ).sort("created_at", -1).to_list(200)

    return users


@api_router.post("/admin/users/{user_id}/renew")
async def renew_user_access(
    user_id: str,
    admin: User = Depends(require_admin),
):
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0},
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current_expiration = parse_datetime(user.get("expires_at"))

    if not current_expiration or current_expiration < datetime.now(timezone.utc):
        current_expiration = datetime.now(timezone.utc)

    new_expiration = current_expiration + timedelta(days=30)

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"expires_at": new_expiration.isoformat()}},
    )

    return {
        "message": "Access renewed",
        "expires_at": new_expiration.isoformat(),
    }


@api_router.delete("/admin/users/{user_id}")
async def delete_admin_user(
    user_id: str,
    admin: User = Depends(require_admin),
):
    if admin.user_id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Você não pode deletar seu próprio usuário admin.",
        )

    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0},
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.favorites.delete_many({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})

    return {"message": "User deleted"}


# =========================
# PAYMENTS DISABLED
# =========================

@api_router.post("/payments/checkout")
async def create_checkout():
    raise HTTPException(status_code=501, detail="Stripe disabled")


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    session_id: str,
    user: User = Depends(get_current_user),
):
    return {
        "status": "disabled",
        "payment_status": "disabled",
        "session_id": session_id,
    }


# =========================
# LOGGING
# =========================

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s - "
        "%(name)s - "
        "%(levelname)s - "
        "%(message)s"
    ),
)

logger = logging.getLogger(__name__)


# =========================
# STARTUP
# =========================

async def seed_admins():
    admins = [
        {
            "email": "admin1@jfnexus3d.com",
            "password": "Admin@123",
            "name": "JFNexus3D Dev 1",
        },
        {
            "email": "admin2@jfnexus3d.com",
            "password": "Admin@456",
            "name": "JFNexus3D Dev 2",
        },
    ]

    for admin in admins:
        existing = await db.users.find_one({"email": admin["email"]})

        if existing is None:
            hashed = hash_password(admin["password"])

            await db.users.insert_one(
                {
                    "user_id": f"admin_{uuid.uuid4().hex[:12]}",
                    "email": admin["email"],
                    "password_hash": hashed,
                    "name": admin["name"],
                    "role": "admin",
                    "expires_at": None,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )

            logger.info(f"Admin created: {admin['email']}")


@app.on_event("startup")
async def startup():
    try:
        logger.info("Storage initialized")

        await seed_admins()

        logger.info("Admin seeding complete")

        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id")

    except Exception as e:
        logger.error(f"Startup error: {e}")


app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
