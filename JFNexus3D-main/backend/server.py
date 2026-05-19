from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Header, Request, Response, UploadFile, File, Query, Depends
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import requests
import bcrypt
import jwt

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

def put_object(path: str, data: bytes, content_type: str) -> dict:
    file_path = UPLOAD_DIR / path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(data)
    return {"path": str(file_path), "content_type": content_type}

def get_object(path: str) -> tuple:
    file_path = UPLOAD_DIR / path
    with open(file_path, "rb") as f:
        content = f.read()
    return content, "application/octet-stream"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str = "user"
    picture: Optional[str] = None
    created_at: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: str
    created_at: str

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    project_id: str
    user_id: str
    title: str
    description: str
    tags: List[str] = []
    thumbnail_url: str
    files: List[Dict[str, str]] = []
    view_count: int = 0
    created_at: str

class ProjectCreate(BaseModel):
    title: str
    description: str
    tags: List[str] = []

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    favorite_id: str
    user_id: str
    project_id: str
    created_at: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    user_id: str
    session_id: str
    amount: float
    currency: str
    status: str
    payment_status: str
    metadata: Optional[Dict] = {}
    created_at: str

class SessionRequest(BaseModel):
    session_id: str

async def get_current_user_from_jwt(request: Request) -> User:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_doc = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_from_google(request: Request) -> User:
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Session not found")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

async def get_current_user(request: Request) -> User:
    try:
        return await get_current_user_from_jwt(request)
    except:
        return await get_current_user_from_google(request)

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@api_router.post("/auth/login")
async def login(login_req: LoginRequest, response: Response):
    email = login_req.email.lower()
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user_doc or "password_hash" not in user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_req.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(user_doc["user_id"], user_doc["email"], user_doc["role"])
    refresh_token = create_refresh_token(user_doc["user_id"])
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=3600,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    user_doc.pop("password_hash", None)
    return User(**user_doc)

@api_router.post("/auth/session-disabled")
async def process_session(session_req: SessionRequest, response: Response):
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_req.session_id},
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": data["name"],
                    "picture": data.get("picture")
                }}
            )
        else:
            user_doc = {
                "user_id": user_id,
                "email": data["email"],
                "name": data["name"],
                "picture": data.get("picture"),
                "role": "user",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
        
        session_token = data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session_doc = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_sessions.insert_one(session_doc)
        
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=False,
            samesite="lax",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        return User(**user)
    except Exception as e:
        logging.error(f"Session processing error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/projects")
async def get_projects(search: Optional[str] = Query(None)):
    query = {}
    if search:
        query = {"$or": [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]}
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return projects

@api_router.post("/projects")
async def create_project(project: ProjectCreate, admin: User = Depends(require_admin)):
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project_doc)
    return {"project_id": project_id}

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, request: Request):
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.update_one(
        {"project_id": project_id},
        {"$inc": {"view_count": 1}}
    )
    
    # Track user view for suggestions
    try:
        user = await get_current_user(request)
        await db.user_views.update_one(
            {"user_id": user.user_id, "project_id": project_id},
            {"$set": {"viewed_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
    except:
        pass
    
    return project

@api_router.get("/suggestions")
async def get_suggestions(user: User = Depends(get_current_user)):
    # Get user's last 10 viewed projects
    recent_views = await db.user_views.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("viewed_at", -1).limit(10).to_list(10)
    
    if not recent_views:
        # No views yet - return latest projects
        projects = await db.projects.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
        return projects
    
    viewed_ids = [v["project_id"] for v in recent_views]
    
    # Collect tags from viewed projects
    viewed_projects = await db.projects.find(
        {"project_id": {"$in": viewed_ids}},
        {"_id": 0, "tags": 1, "title": 1}
    ).to_list(10)
    
    all_tags = []
    keywords = []
    for p in viewed_projects:
        all_tags.extend(p.get("tags", []))
        title_words = [w for w in p.get("title", "").split() if len(w) > 3]
        keywords.extend(title_words)
    
    # Find projects with similar tags or title keywords, excluding already viewed
    search_terms = list(set(all_tags + keywords))
    
    if not search_terms:
        projects = await db.projects.find(
            {"project_id": {"$nin": viewed_ids}},
            {"_id": 0}
        ).sort("view_count", -1).limit(5).to_list(5)
        return projects
    
    # Build regex query for any matching tag or title keyword
    regex_conditions = [{"tags": {"$regex": term, "$options": "i"}} for term in search_terms]
    regex_conditions.extend([{"title": {"$regex": term, "$options": "i"}} for term in search_terms])
    regex_conditions.extend([{"description": {"$regex": term, "$options": "i"}} for term in search_terms])
    
    suggestions = await db.projects.find(
        {
            "$and": [
                {"project_id": {"$nin": viewed_ids}},
                {"$or": regex_conditions}
            ]
        },
        {"_id": 0}
    ).limit(5).to_list(5)
    
    # If not enough, fill with popular projects
    if len(suggestions) < 5:
        existing_ids = [s["project_id"] for s in suggestions] + viewed_ids
        fill = await db.projects.find(
            {"project_id": {"$nin": existing_ids}},
            {"_id": 0}
        ).sort("view_count", -1).limit(5 - len(suggestions)).to_list(5)
        suggestions.extend(fill)
    
    return suggestions

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, project: ProjectCreate, admin: User = Depends(require_admin)):
    existing = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "title": project.title,
            "description": project.description,
            "tags": project.tags
        }}
    )
    return {"message": "Updated"}

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, admin: User = Depends(require_admin)):
    existing = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.delete_one({"project_id": project_id})
    return {"message": "Deleted"}

@api_router.post("/projects/{project_id}/upload")
async def upload_file(project_id: str, file: UploadFile, file_type: str, admin: User = Depends(require_admin)):
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/projects/{project_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    file_doc = {
        "file_id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    
    if file_type == "thumbnail":
        await db.projects.update_one(
            {"project_id": project_id},
            {"$set": {"thumbnail_url": result["path"]}}
        )
    else:
        await db.projects.update_one(
            {"project_id": project_id},
            {"$push": {"files": {
                "file_id": file_doc["file_id"],
                "filename": file.filename,
                "path": result["path"],
                "size": result["size"]
            }}}
        )
    
    return {"path": result["path"], "file_id": file_doc["file_id"]}

@api_router.get("/files/{path:path}")
async def download_file(path: str, request: Request):
    # Require authentication (no guest downloads)
    try:
        user = await get_current_user(request)
    except:
        raise HTTPException(status_code=401, detail="Faça login para baixar arquivos")
    
    file_record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Track download for analytics
    await db.downloads.insert_one({
        "user_id": user.user_id,
        "storage_path": path,
        "downloaded_at": datetime.now(timezone.utc).isoformat()
    })
    
    data, content_type = get_object(path)
    return Response(content=data, media_type=file_record.get("content_type", content_type))

@api_router.get("/thumbnails/{path:path}")
async def get_thumbnail(path: str):
    # Public endpoint - allow guests to see thumbnails
    file_record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    data, content_type = get_object(path)
    return Response(content=data, media_type=file_record.get("content_type", content_type))

@api_router.get("/favorites")
async def get_favorites(user: User = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    project_ids = [f["project_id"] for f in favorites]
    projects = await db.projects.find({"project_id": {"$in": project_ids}}, {"_id": 0}).to_list(100)
    return projects

@api_router.post("/favorites/{project_id}")
async def add_favorite(project_id: str, user: User = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user.user_id, "project_id": project_id})
    if existing:
        return {"message": "Already favorited"}
    
    favorite_doc = {
        "favorite_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "project_id": project_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.favorites.insert_one(favorite_doc)
    return {"message": "Favorited"}

@api_router.delete("/favorites/{project_id}")
async def remove_favorite(project_id: str, user: User = Depends(get_current_user)):
    await db.favorites.delete_one({"user_id": user.user_id, "project_id": project_id})
    return {"message": "Removed"}

@api_router.post("/payments/checkout")
async def create_checkout(*args, **kwargs):
    raise HTTPException(status_code=501, detail="Stripe integration disabled for self-host version")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, user: User = Depends(get_current_user)):
    stripe_key = os.environ.get("STRIPE_API_KEY")
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if transaction and status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": status.status, "payment_status": status.payment_status}}
        )
    
    return status

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    return {"status": "disabled"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def seed_admins():
    admins = [
        {"email": "admin1@jfnexus3d.com", "password": "Admin@123", "name": "JFNexus3D Dev 1"},
        {"email": "admin2@jfnexus3d.com", "password": "Admin@456", "name": "JFNexus3D Dev 2"}
    ]
    
    for admin in admins:
        existing = await db.users.find_one({"email": admin["email"]})
        if existing is None:
            hashed = hash_password(admin["password"])
            await db.users.insert_one({
                "user_id": f"admin_{uuid.uuid4().hex[:12]}",
                "email": admin["email"],
                "password_hash": hashed,
                "name": admin["name"],
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Admin created: {admin['email']}")
        elif "password_hash" in existing and not verify_password(admin["password"], existing["password_hash"]):
            await db.users.update_one(
                {"email": admin["email"]},
                {"$set": {"password_hash": hash_password(admin["password"])}}
            )
            logger.info(f"Admin password updated: {admin['email']}")
    
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Accounts (Dev Login)\n")
        f.write("- Email: admin1@3dprint.com | Password: Admin@123\n")
        f.write("- Email: admin2@3dprint.com | Password: Admin@456\n\n")
        f.write("## User Accounts\n")
        f.write("Users are created via Google OAuth (any Google account).\n")
        f.write("Role: 'user' (can view, favorite, download, pay - cannot upload)\n\n")
        f.write("## Endpoints\n")
        f.write("/api/auth/login - Admin login (email/password)\n")
        f.write("/api/auth/session - Google OAuth callback\n")
        f.write("/api/auth/me - Get current user\n")
        f.write("/api/auth/logout - Logout\n")

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
        await seed_admins()
        logger.info("Admin seeding complete")
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id")
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()