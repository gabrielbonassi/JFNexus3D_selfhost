import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Search, Sparkles, Shield } from "lucide-react";
import { toast } from "sonner";
import SideMenu from "@/components/SideMenu";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const isGuest = !user && localStorage.getItem("guest_mode") === "true";

  useEffect(() => {
    fetchUser();
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
      localStorage.removeItem("guest_mode");
    } catch (error) {
      if (localStorage.getItem("guest_mode") !== "true") {
        navigate("/login");
      }
    }
  };

  const fetchProjects = async (search = "") => {
    try {
      const url = search ? `${API}/projects?search=${encodeURIComponent(search)}` : `${API}/projects`;
      const response = await axios.get(url, { withCredentials: true });
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects(searchQuery);
  };

  const toggleFavorite = async (projectId, e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Faça login para favoritar");
      navigate("/login");
      return;
    }
    try {
      await axios.post(`${API}/favorites/${projectId}`, {}, { withCredentials: true });
      toast.success("Adicionado aos favoritos");
    } catch (error) {
      console.error("Favorite error:", error);
      toast.error("Erro ao favoritar");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B061A]">
      <nav className="backdrop-blur-xl bg-black/40 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <SideMenu user={user} isGuest={isGuest} />
              {user?.role === "admin" && (
                <span data-testid="admin-badge" className="px-2 py-1 text-xs rounded-full bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  ADMIN
                </span>
              )}
              {isGuest && (
                <span data-testid="guest-badge" className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                  CONVIDADO
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              data-testid="search-input"
              type="text"
              placeholder="Buscar projetos por palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-6 rounded-full bg-[#1A102C] border-[#281A45] text-white placeholder:text-gray-500 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20"
            />
          </div>
        </form>

        {loading ? (
          <div className="text-center text-white py-20">Carregando projetos...</div>
        ) : projects.length === 0 ? (
          <div data-testid="no-projects-message" className="text-center text-gray-400 py-20">
            <p className="text-xl mb-4">Nenhum projeto encontrado</p>
            {user?.role === "admin" && (
              <Button 
                data-testid="upload-first-project-btn"
                onClick={() => navigate("/upload")}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Fazer Upload do Primeiro Projeto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project.project_id}
                data-testid={`project-card-${project.project_id}`}
                className="group relative rounded-xl overflow-hidden bg-[#130A24] border border-[#281A45] hover:border-[#3B82F6]/50 transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => navigate(`/project/${project.project_id}`)}
              >
                <div className="aspect-square relative overflow-hidden">
                  {project.thumbnail_url ? (
                    <img
                      src={`${API}/files/${project.thumbnail_url}?auth=${document.cookie.split('session_token=')[1]?.split(';')[0] || document.cookie.split('access_token=')[1]?.split(';')[0]}`}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1A102C] to-[#130A24] flex items-center justify-center">
                      <Sparkles className="h-16 w-16 text-[#00E5FF]/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {user && (
                    <Button
                      data-testid={`favorite-btn-${project.project_id}`}
                      onClick={(e) => toggleFavorite(project.project_id, e)}
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1 truncate">{project.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-[#1A102C] text-[#00E5FF] border border-[#281A45]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
