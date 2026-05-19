import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`, { withCredentials: true });
      setFavorites(response.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Erro ao carregar favoritos");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (projectId) => {
    try {
      await axios.delete(`${API}/favorites/${projectId}`, { withCredentials: true });
      setFavorites(favorites.filter(p => p.project_id !== projectId));
      toast.success("Removido dos favoritos");
    } catch (error) {
      console.error("Remove favorite error:", error);
      toast.error("Erro ao remover favorito");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B061A]">
      <nav className="backdrop-blur-xl bg-black/40 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              data-testid="back-to-dashboard-btn"
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Heart className="h-6 w-6 text-[#00E5FF]" />
              Meus Favoritos
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center text-white py-20">Carregando favoritos...</div>
        ) : favorites.length === 0 ? (
          <div data-testid="no-favorites-message" className="text-center text-gray-400 py-20">
            <Heart className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl mb-4">Você ainda não tem favoritos</p>
            <Button 
              data-testid="browse-projects-btn"
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Explorar Projetos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((project) => (
              <div
                key={project.project_id}
                data-testid={`favorite-card-${project.project_id}`}
                className="group relative rounded-xl overflow-hidden bg-[#130A24] border border-[#281A45] hover:border-[#3B82F6]/50 transition-all duration-300"
              >
                <div 
                  className="aspect-square relative overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/project/${project.project_id}`)}
                >
                  {project.thumbnail_url ? (
                    <img
                      src={`${API}/files/${project.thumbnail_url}?auth=${document.cookie.split('session_token=')[1]?.split(';')[0]}`}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1A102C] to-[#130A24] flex items-center justify-center">
                      <Sparkles className="h-16 w-16 text-[#00E5FF]/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    data-testid={`remove-favorite-btn-${project.project_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(project.project_id);
                    }}
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 bg-black/50 hover:bg-red-600/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1 truncate">{project.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;