import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Lightbulb, Sparkles } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Suggestions = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const isGuest = localStorage.getItem("guest_mode") === "true";

  const fetchSuggestions = useCallback(async () => {
    try {
      const endpoint = isGuest ? `${API}/projects` : `${API}/suggestions`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      const projects = isGuest ? response.data.slice(0, 10) : response.data;
      setSuggestions(projects);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("Erro ao carregar sugestões");
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  const fetchFavorites = useCallback(async () => {
    if (isGuest) return;

    try {
      const response = await axios.get(`${API}/favorites`, {
        withCredentials: true,
      });

      const ids = response.data.map((project) => project.project_id);
      setFavoriteIds(ids);
    } catch (error) {
      // Usuário não logado não carrega favoritos.
    }
  }, [isGuest]);

  useEffect(() => {
    fetchSuggestions();
    fetchFavorites();
  }, [fetchSuggestions, fetchFavorites]);

  const toggleFavorite = async (projectId, e) => {
    e.stopPropagation();

    if (isGuest) {
      toast.error("Faça login para favoritar projetos");
      navigate("/login");
      return;
    }

    const isFavorited = favoriteIds.includes(projectId);

    try {
      if (isFavorited) {
        await axios.delete(`${API}/favorites/${projectId}`, {
          withCredentials: true,
        });

        setFavoriteIds((prev) => prev.filter((id) => id !== projectId));
        toast.success("Removido dos favoritos");
      } else {
        await axios.post(
          `${API}/favorites/${projectId}`,
          {},
          {
            withCredentials: true,
          }
        );

        setFavoriteIds((prev) => [...prev, projectId]);
        toast.success("Adicionado aos favoritos");
      }
    } catch (error) {
      console.error("Favorite error:", error);
      toast.error("Erro ao atualizar favorito");
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
              <Lightbulb className="h-6 w-6 text-[#00E5FF]" />
              {isGuest ? "Projetos em Destaque" : "Sugestões para Você"}
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-gray-400 text-lg">
            {isGuest
              ? "Explore alguns projetos disponíveis. Para favoritar ou baixar arquivos, faça login."
              : "Baseado nos projetos que você visualizou recentemente, selecionamos estes para inspirar suas próximas criações."}
          </p>
        </div>

        {loading ? (
          <div className="text-center text-white py-20">
            Carregando sugestões...
          </div>
        ) : suggestions.length === 0 ? (
          <div
            data-testid="no-suggestions-message"
            className="text-center text-gray-400 py-20"
          >
            <Lightbulb className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl mb-4">Nenhuma sugestão disponível ainda</p>
            <p className="text-sm mb-6">
              Visualize alguns projetos para receber recomendações
            </p>

            <Button
              data-testid="explore-projects-btn"
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Explorar Projetos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {suggestions.map((project, index) => {
              const isFavorited = favoriteIds.includes(project.project_id);

              return (
                <div
                  key={project.project_id}
                  data-testid={`suggestion-card-${project.project_id}`}
                  className="group relative rounded-xl overflow-hidden bg-[#130A24] border border-[#281A45] hover:border-[#00E5FF]/50 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => navigate(`/project/${project.project_id}`)}
                >
                  <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/40 backdrop-blur-sm">
                    <span className="text-xs font-bold text-[#00E5FF]">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="aspect-square relative overflow-hidden">
                    {project.thumbnail_url ? (
                      <img
                        src={`${API}/files/${project.thumbnail_url}`}
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
                      data-testid={`favorite-suggestion-btn-${project.project_id}`}
                      onClick={(e) => toggleFavorite(project.project_id, e)}
                      variant="ghost"
                      size="icon"
                      className={`absolute top-3 right-3 bg-black/50 hover:bg-red-500/70 text-white transition-opacity ${
                        isFavorited
                          ? "opacity-100 text-red-400"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Heart
                        className="h-5 w-5"
                        fill={isFavorited ? "currentColor" : "none"}
                      />
                    </Button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-bold text-white mb-1 truncate">
                      {project.title}
                    </h3>

                    <p className="text-xs text-gray-400 line-clamp-2">
                      {project.description}
                    </p>

                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-[#1A102C] text-[#00E5FF] border border-[#281A45]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Suggestions;