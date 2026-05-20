import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Lock, Github, Sparkles, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("options"); // options | email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    alert("Google login disabled in self-host version");
  };

  const handleGithubLogin = () => {
    toast.info("Login com GitHub em breve!");
  };

  const handleGuestAccess = () => {
    localStorage.setItem("guest_mode", "true");
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
      toast.success(`Bem-vindo, ${response.data.name}!`);
      navigate("/dashboard", { state: { user: response.data } });
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
                <h2 className="text-4xl font-bold text-white mb-2">Bem-vindo</h2>
                <p className="text-gray-400">Escolha como deseja entrar</p>
              </div>

              <Button
                data-testid="login-google-btn"
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 py-6 rounded-xl text-base font-medium flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </Button>

              <Button
                data-testid="login-email-btn"
                onClick={() => setView("email")}
                className="w-full bg-[#130A24] hover:bg-[#1A102C] text-white py-6 rounded-xl text-base font-medium border border-[#281A45] flex items-center justify-center gap-3"
              >
                <Mail className="w-5 h-5" />
                Entrar com Email
              </Button>

              <Button
                data-testid="login-github-btn"
                onClick={handleGithubLogin}
                className="w-full bg-[#24292e] hover:bg-[#1b1f23] text-white py-6 rounded-xl text-base font-medium flex items-center justify-center gap-3"
              >
                <Github className="w-5 h-5" />
                Entrar com GitHub
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#281A45]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#0B061A] text-gray-500 text-sm">ou</span>
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
                <h2 className="text-4xl font-bold text-white mb-2">Entrar com Email</h2>
                <p className="text-gray-400">Acesse com seu email e senha</p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Email</label>
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
                  <label className="block text-white text-sm font-medium mb-2">Senha</label>
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
                  <Link to="/register" className="text-blue-400 hover:text-blue-300">
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
