import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CreditCard,
  Heart,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  Upload,
  X,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SideMenu = ({ user, isGuest }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const clearClientSession = () => {
    localStorage.removeItem("guest_mode");
    localStorage.clear();
    sessionStorage.clear();

    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearClientSession();
      window.location.href = "/login";
    }
  };

  const handleExitGuest = () => {
    clearClientSession();
    navigate("/login");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-white hover:bg-white/10"
        title="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-80 bg-[#0B061A] border-r border-[#281A45] text-white flex flex-col">
            <div className="p-6 border-b border-[#281A45] relative text-center">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-[#00E5FF] text-6xl mb-3">✧</div>
              <h2 className="text-2xl font-bold">JFNexus3D</h2>

              <p className="text-sm text-[#00E5FF] mt-2">
                {isGuest ? "Convidado" : user?.name || "Usuário"}
              </p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => goTo("/dashboard")}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#1A102C] text-left"
              >
                <Home className="h-5 w-5 text-[#00E5FF]" />
                Início
              </button>

              {!isGuest && (
                <button
                  onClick={() => goTo("/favorites")}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#1A102C] text-left"
                >
                  <Heart className="h-5 w-5 text-[#00E5FF]" />
                  Favoritos
                </button>
              )}

              {!isGuest && (
                <button
                  onClick={() => goTo("/suggestions")}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#1A102C] text-left"
                >
                  <Lightbulb className="h-5 w-5 text-[#00E5FF]" />
                  Sugestões
                </button>
              )}

              {user?.role === "admin" && (
                <button
                  onClick={() => goTo("/upload")}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#1A102C] text-left"
                >
                  <Upload className="h-5 w-5 text-[#00E5FF]" />
                  Upload Projeto
                </button>
              )}

              {!isGuest && (
                <button
                  onClick={() => goTo("/payments")}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#1A102C] text-left"
                >
                  <CreditCard className="h-5 w-5 text-[#00E5FF]" />
                  Suporte & Renovação
                </button>
              )}

              {user?.role === "admin" && (
                <button
                  onClick={() => goTo("/admin")}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#1A102C] text-left"
                >
                  <CreditCard className="h-5 w-5 text-[#00E5FF]" />
                  Painel Admin
                </button>
              )}
            </nav>

            <div className="p-4 border-t border-[#281A45]">
              <button
                onClick={isGuest ? handleExitGuest : handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1A102C] text-gray-300"
              >
                <LogOut className="h-5 w-5" />
                {isGuest ? "Sair do convidado" : "Sair"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default SideMenu;
