import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Lock, Sparkles, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

 const handleGuestAccess = () => {
  localStorage.setItem("guest_mode", "true");
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  toast.success("Acesso como convidado");
  navigate("/dashboard");
};

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      localStorage.removeItem("guest_mode");
      toast.success(
  `Bem-vindo, ${response.data.user?.name || "usuário"}!`
);
      navigate("/dashboard", { state: { user: response.data.user } });
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B061A] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A102C] via-[#0B061A] to-[#0B061A]"></div>

      <nav className="relative z-10 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Button
            data-testid="back-to-landing-btn"
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-[#00E5FF]" />
            <h1 className="text-xl font-bold text-white">JFNexus3D</h1>
          </div>

          <div className="w-20"></div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {view === "options" ? (
            <div data-testid="login-options-container" className="space-y-4">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-2">
                  Bem-vindo
                </h2>
                <p className="text-gray-400">Escolha como deseja entrar</p>
              </div>

              <Button
                data-testid="login-email-btn"
                onClick={() => setView("email")}
                className="w-full bg-[#130A24] hover:bg-[#1A102C] text-white py-6 rounded-xl text-base font-medium border border-[#281A45] flex items-center justify-center gap-3"
              >
                <Mail className="w-5 h-5" />
                Entrar com Email
              </Button>

              <Link
                to="/register"
                className="w-full block text-center bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-base font-medium"
              >
                Criar conta
              </Link>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#281A45]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#0B061A] text-gray-500 text-sm">
                    ou
                  </span>
                </div>
              </div>

              <Button
                data-testid="login-guest-btn"
                onClick={handleGuestAccess}
                variant="ghost"
                className="w-full text-gray-300 hover:bg-white/5 py-6 rounded-xl text-base font-medium flex items-center justify-center gap-3"
              >
                <UserCircle2 className="w-5 h-5" />
                Continuar como Convidado
              </Button>
            </div>
          ) : (
            <div data-testid="email-login-container" className="space-y-4">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-2">
                  Entrar com Email
                </h2>
                <p className="text-gray-400">Acesse com seu email e senha</p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      data-testid="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10 bg-[#1A102C] border-[#281A45] text-white py-6"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      data-testid="password-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-[#1A102C] border-[#281A45] text-white py-6"
                      required
                    />
                  </div>
                </div>

                <Button
                  data-testid="submit-email-login-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-xl"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <Button
                  data-testid="back-to-options-btn"
                  type="button"
                  onClick={() => setView("options")}
                  variant="ghost"
                  className="w-full text-gray-400 hover:bg-white/5"
                >
                  ← Voltar para opções de login
                </Button>

                <p className="text-center text-gray-400 mt-4">
                  Não tem conta?{" "}
                  <Link
                    to="/register"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Criar conta
                  </Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;