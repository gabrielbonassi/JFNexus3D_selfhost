import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];

      if (!sessionId) {
        toast.error("Erro na autenticação");
        navigate("/");
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        const user = response.data;
        // Clear hash to prevent infinite re-render of AuthCallback
        window.history.replaceState(null, '', '/dashboard');
        toast.success(`Bem-vindo, ${user.name}!`);
        navigate("/dashboard", { state: { user }, replace: true });
      } catch (error) {
        console.error("Auth error:", error);
        window.history.replaceState(null, '', '/');
        toast.error("Erro ao processar autenticação");
        navigate("/");
      }
    };

    processAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B061A]">
      <div className="text-white text-lg">Processando autenticação...</div>
    </div>
  );
};

export default AuthCallback;