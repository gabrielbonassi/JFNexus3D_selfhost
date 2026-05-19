import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload as UploadIcon, Image as ImageIcon, FileUp } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Upload = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast.error("Título e descrição são obrigatórios");
      return;
    }

    setUploading(true);

    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      const response = await axios.post(
        `${API}/projects`,
        { title, description, tags: tagsArray },
        { withCredentials: true }
      );

      const projectId = response.data.project_id;

      if (thumbnail) {
        const formData = new FormData();
        formData.append('file', thumbnail);
        await axios.post(
          `${API}/projects/${projectId}/upload?file_type=thumbnail`,
          formData,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      }

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await axios.post(
          `${API}/projects/${projectId}/upload?file_type=model`,
          formData,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      }

      toast.success("Projeto criado com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao criar projeto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B061A]">
      <nav className="backdrop-blur-xl bg-black/40 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button 
            data-testid="back-to-dashboard-btn"
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <UploadIcon className="h-10 w-10 text-[#00E5FF]" />
            Novo Projeto
          </h1>
          <p className="text-gray-400">Compartilhe seu projeto de impressão 3D com a comunidade</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Título do Projeto</label>
            <Input
              data-testid="project-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Suporte para Fone de Ouvido"
              className="w-full bg-[#1A102C] border-[#281A45] text-white placeholder:text-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Descrição</label>
            <Textarea
              data-testid="project-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva seu projeto, materiais utilizados, configurações de impressão..."
              className="w-full bg-[#1A102C] border-[#281A45] text-white placeholder:text-gray-500 min-h-32"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Tags (separadas por vírgula)</label>
            <Input
              data-testid="project-tags-input"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: suporte, utilitário, PLA"
              className="w-full bg-[#1A102C] border-[#281A45] text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Thumbnail (Imagem de Capa)
            </label>
            <div className="border-2 border-dashed border-[#281A45] rounded-xl p-8 text-center hover:border-[#3B82F6]/50 transition-all">
              <input
                data-testid="thumbnail-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files[0])}
                className="hidden"
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                <p className="text-white mb-1">{thumbnail ? thumbnail.name : "Clique para selecionar uma imagem"}</p>
                <p className="text-sm text-gray-500">PNG, JPG ou WEBP</p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2 flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Arquivos 3D (STL, OBJ, 3MF)
            </label>
            <div className="border-2 border-dashed border-[#281A45] rounded-xl p-8 text-center hover:border-[#3B82F6]/50 transition-all">
              <input
                data-testid="files-upload-input"
                type="file"
                accept=".stl,.obj,.3mf"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="hidden"
                id="files-upload"
              />
              <label htmlFor="files-upload" className="cursor-pointer">
                <FileUp className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                <p className="text-white mb-1">
                  {files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : "Clique para selecionar arquivos"}
                </p>
                <p className="text-sm text-gray-500">STL, OBJ, 3MF</p>
              </label>
              {files.length > 0 && (
                <div className="mt-4 text-left space-y-1">
                  {files.map((file, i) => (
                    <p key={i} className="text-sm text-gray-400">• {file.name}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button
            data-testid="submit-project-btn"
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 text-lg rounded-xl"
          >
            {uploading ? "Fazendo Upload..." : "Publicar Projeto"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Upload;