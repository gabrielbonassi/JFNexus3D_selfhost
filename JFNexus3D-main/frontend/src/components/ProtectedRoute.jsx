import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProtectedRoute = ({ children, requireAuth = false, requireAdmin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true
        });
        const user = response.data;
        
        if (requireAdmin && user.role !== "admin") {
          toast.error("Acesso restrito a administradores");
          navigate("/dashboard");
          return;
        }
        
        setIsAuthorized(true);
      } catch (error) {
        if (requireAuth || requireAdmin) {
          toast.error("Faça login para acessar esta página");
          navigate("/login");
        } else {
          setIsAuthorized(true);
        }
      }
    };
    
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, requireAuth, requireAdmin]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B061A]">
        <div data-testid="loading-spinner" className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return isAuthorized ? children : null;
};

export default ProtectedRoute;
