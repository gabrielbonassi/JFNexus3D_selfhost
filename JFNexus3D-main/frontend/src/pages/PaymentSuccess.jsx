import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      toast.error("Session ID não encontrado");
      navigate("/payments");
      return;
    }

    pollPaymentStatus(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  const pollPaymentStatus = async (sessionId, currentAttempt = 0) => {
    if (currentAttempt >= maxAttempts) {
      setStatus("timeout");
      toast.error("Tempo esgotado. Verifique seu email para confirmação.");
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`, {
        withCredentials: true
      });

      if (response.data.payment_status === "paid") {
        setStatus("success");
        toast.success("Pagamento confirmado!");
        return;
      } else if (response.data.status === "expired") {
        setStatus("expired");
        toast.error("Sessão de pagamento expirada");
        return;
      }

      setAttempts(currentAttempt + 1);
      setTimeout(() => pollPaymentStatus(sessionId, currentAttempt + 1), 2000);
    } catch (error) {
      console.error("Payment status error:", error);
      setStatus("error");
      toast.error("Erro ao verificar status do pagamento");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B061A] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {status === "checking" && (
          <div data-testid="payment-checking" className="space-y-6">
            <Loader2 className="h-16 w-16 text-[#00E5FF] animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-white">Verificando Pagamento...</h2>
            <p className="text-gray-400">Aguarde enquanto confirmamos sua transação</p>
          </div>
        )}

        {status === "success" && (
          <div data-testid="payment-success" className="space-y-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-3xl font-bold text-white">Pagamento Confirmado!</h2>
            <p className="text-gray-400">Obrigado pela sua assinatura. Seus recursos foram ativados.</p>
            <Button
              data-testid="goto-dashboard-btn"
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl"
            >
              Ir para Dashboard
            </Button>
          </div>
        )}

        {status === "error" && (
          <div data-testid="payment-error" className="space-y-6">
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-3xl">✕</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Erro ao Verificar Pagamento</h2>
            <p className="text-gray-400">Por favor, tente novamente ou entre em contato com o suporte.</p>
            <Button
              data-testid="retry-btn"
              onClick={() => navigate("/payments")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {status === "timeout" && (
          <div data-testid="payment-timeout" className="space-y-6">
            <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Verificação em Andamento</h2>
            <p className="text-gray-400">Seu pagamento está sendo processado. Verifique seu email para confirmação.</p>
            <Button
              data-testid="goto-dashboard-btn"
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl"
            >
              Ir para Dashboard
            </Button>
          </div>
        )}

        {status === "expired" && (
          <div data-testid="payment-expired" className="space-y-6">
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-3xl">⏱️</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Sessão Expirada</h2>
            <p className="text-gray-400">Sua sessão de pagamento expirou. Por favor, tente novamente.</p>
            <Button
              data-testid="retry-btn"
              onClick={() => navigate("/payments")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl"
            >
              Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;