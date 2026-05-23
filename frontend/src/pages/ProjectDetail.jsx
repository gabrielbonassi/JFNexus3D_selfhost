import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Eye, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isGuest = localStorage.getItem("guest_mode") === "true";

  useEffect(() => {
    const load = async () => {
      await fetchUser();
      await fetchProject();
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUser = async () => {
    if (isGuest) {
      setUser(null);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
      });

      setUser(response.data);
    } catch (error) {
      setUser(null);
    }
  };

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${id}`, {
        withCredentials: true,
      });

      setProject(response.data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Erro ao carregar projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filePath) => {
    if (isGuest || !user) {
      toast.error("Faça login para baixar arquivos");
      navigate("/login");
      return;
    }

    window.open(`${API}/files/${filePath}`, "_blank");
  };

  const handleDeleteProject = async () => {
    const confirmDelete = window.confirm(
      "Deseja deletar este projeto e todos os arquivos dele?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/projects/${id}`, {
        withCredentials: true,
      });

      toast.success("Projeto deletado");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Erro ao deletar projeto");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B061A] flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0B061A] flex items-center justify-center">
        <div className="text-white text-lg">Projeto não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B061A]">
      <nav className="backdrop-blur-xl bg-black/40 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            data-testid="back-to-dashboard-btn"
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>

          {user?.role === "admin" && (
            <Button
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar Projeto
            </Button>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div data-testid="project-detail-container">
            {project.thumbnail_url ? (
              <img
                src={`${API}/files/${project.thumbnail_url}`}
                alt={project.title}
                className="w-full rounded-xl border border-[#281A45]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#1A102C] to-[#130A24] border border-[#281A45] flex items-center justify-center">
                <Sparkles className="h-24 w-24 text-[#00E5FF]/30" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1
                data-testid="project-title"
                className="text-4xl font-bold text-white mb-4"
              >
                {project.title}
              </h1>

              <p
                data-testid="project-description"
                className="text-lg text-gray-400 leading-relaxed"
              >
                {project.description}
              </p>
            </div>

            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-full bg-[#1A102C] text-[#00E5FF] border border-[#281A45] text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-400">
              <Eye className="h-5 w-5" />
              <span data-testid="view-count">
                {project.view_count} visualizações
              </span>
            </div>

            {project.files && project.files.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">
                  Arquivos Disponíveis
                </h2>

                <div className="space-y-3">
                  {project.files.map((file) => (
                    <div
                      key={file.file_id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#130A24] border border-[#281A45] hover:border-[#3B82F6]/50 transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {file.filename}
                        </p>

                        <p className="text-sm text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>

                      <Button
                        onClick={() => handleDownload(file.path)}
                        className={
                          isGuest || !user
                            ? "bg-gray-700 hover:bg-gray-700 text-gray-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isGuest || !user ? "Login necessário" : "Baixar"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!project.files || project.files.length === 0) && (
              <div className="rounded-xl bg-[#130A24] border border-[#281A45] p-4 text-gray-400">
                Nenhum arquivo disponível para download neste projeto.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
