import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Search, Download, Sparkles, ArrowRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (response.ok) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.log("Not authenticated");
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B061A] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A102C] via-[#0B061A] to-[#0B061A]"></div>
      
      <div className="relative z-10">
        <nav className="backdrop-blur-xl bg-black/40 border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-[#00E5FF]" />
              <h1 className="text-2xl font-bold text-white">JFNexus3D</h1>
            </div>
            <Button 
              data-testid="login-nav-btn"
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full"
            >
              Entrar
            </Button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Acervo de Projetos
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#00E5FF] mt-2">
                de Impressão 3D
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-12 leading-relaxed">
              Descubra e baixe projetos exclusivos de impressão 3D criados pelos
              desenvolvedores da JFNexus3D.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-20">
              <Button 
                data-testid="get-started-btn"
                onClick={() => navigate("/login")}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-lg rounded-full transition-transform hover:scale-105 flex items-center gap-2"
              >
                Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-20">
              <div className="p-8 rounded-xl bg-[#130A24]/60 border border-[#281A45] hover:border-[#3B82F6]/50 transition-all duration-300">
                <Search className="h-12 w-12 text-[#00E5FF] mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-3">Busca Inteligente</h3>
                <p className="text-gray-400">Encontre projetos por palavras-chave e tags</p>
              </div>
              <div className="p-8 rounded-xl bg-[#130A24]/60 border border-[#281A45] hover:border-[#3B82F6]/50 transition-all duration-300">
                <Heart className="h-12 w-12 text-[#00E5FF] mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-3">Favoritos</h3>
                <p className="text-gray-400">Salve seus projetos preferidos para depois</p>
              </div>
              <div className="p-8 rounded-xl bg-[#130A24]/60 border border-[#281A45] hover:border-[#3B82F6]/50 transition-all duration-300">
                <Download className="h-12 w-12 text-[#00E5FF] mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-3">Downloads Diretos</h3>
                <p className="text-gray-400">Baixe arquivos STL, OBJ e 3MF em alta qualidade</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
