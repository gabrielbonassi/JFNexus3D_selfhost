import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Lightbulb, Home, CreditCard, Upload, LogOut, LogIn, X } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SideMenu = ({ user, isGuest }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleNavigate = (path) => {
    setOpen(false);
    setTimeout(() => navigate(path), 100);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem("guest_mode");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleExitGuest = () => {
    localStorage.removeItem("guest_mode");
    navigate("/login");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          data-testid="open-side-menu-btn"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity group cursor-pointer"
        >
          <Sparkles className="h-8 w-8 text-[#00E5FF] group-hover:scale-110 transition-transform" />
          <h1 className="text-2xl font-bold text-white">JFNexus3D</h1>
        </button>
      </SheetTrigger>

      <SheetContent 
        side="left" 
        className="bg-[#0B061A] border-r border-[#281A45] w-80 p-0"
      >
        <div className="flex flex-col h-full">
          <div className="relative px-8 pt-12 pb-8 border-b border-[#281A45] bg-gradient-to-br from-[#1A102C] to-[#0B061A]">
            <button
              data-testid="close-side-menu-btn"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Sparkles className="h-20 w-20 text-[#00E5FF]" strokeWidth={1.5} />
                <div className="absolute inset-0 bg-[#00E5FF] blur-2xl opacity-20"></div>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">JFNexus3D</h2>
              {user && (
                <p data-testid="side-menu-user-name" className="text-sm text-[#00E5FF] mt-2">
                  {user.name}
                </p>
              )}
              {isGuest && (
                <p className="text-sm text-gray-400 mt-2">Modo Convidado</p>
              )}
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              data-testid="menu-home-btn"
              onClick={() => handleNavigate("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#1A102C] hover:text-white transition-all group"
            >
              <Home className="h-5 w-5 text-[#00E5FF] group-hover:scale-110 transition-transform" />
              <span className="font-medium">Início</span>
            </button>

            {user && (
              <button
                data-testid="menu-favorites-btn"
                onClick={() => handleNavigate("/favorites")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#1A102C] hover:text-white transition-all group"
              >
                <Heart className="h-5 w-5 text-[#00E5FF] group-hover:scale-110 transition-transform" />
                <span className="font-medium">Favoritos</span>
              </button>
            )}

            {user && (
              <button
                data-testid="menu-suggestions-btn"
                onClick={() => handleNavigate("/suggestions")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#1A102C] hover:text-white transition-all group"
              >
                <Lightbulb className="h-5 w-5 text-[#00E5FF] group-hover:scale-110 transition-transform" />
                <span className="font-medium">Sugestões</span>
              </button>
            )}

            {user?.role === "admin" && (
              <button
                data-testid="menu-upload-btn"
                onClick={() => handleNavigate("/upload")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#1A102C] hover:text-white transition-all group"
              >
                <Upload className="h-5 w-5 text-[#00E5FF] group-hover:scale-110 transition-transform" />
                <span className="font-medium">Upload Projeto</span>
              </button>
            )}

            {user && (
              <button
                data-testid="menu-payments-btn"
                onClick={() => handleNavigate("/payments")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#1A102C] hover:text-white transition-all group"
              >
                <CreditCard className="h-5 w-5 text-[#00E5FF] group-hover:scale-110 transition-transform" />
                <span className="font-medium">Pagamentos</span>
              </button>
            )}
          </nav>

          <div className="px-4 py-6 border-t border-[#281A45]">
            {isGuest ? (
              <Button
                data-testid="menu-login-btn"
                onClick={handleExitGuest}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Fazer Login
              </Button>
            ) : user ? (
              <Button
                data-testid="menu-logout-btn"
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-gray-300 hover:bg-[#1A102C] hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideMenu;
