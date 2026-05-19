import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Check, Sparkles, Rocket, Infinity as InfinityIcon } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const features = [
  "Acesso ilimitado ao acervo",
  "Projetos e designs exclusivos",
  "Atualizações constantes",
  "Pagamento único, sem mensalidades"
];

const Payments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/payments/checkout?package_id=complete`,
        {},
        { 
          withCredentials: true,
          headers: {
            'Origin': window.location.origin
          }
        }
      );
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erro ao iniciar pagamento");
      setLoading(false);
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
              <CreditCard className="h-6 w-6 text-[#00E5FF]" />
              Plano Exclusivo JFNexus3D
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 mb-6">
            <Rocket className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-sm text-[#00E5FF] font-medium">PLANO EXCLUSIVO</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Desbloqueie o Acervo Completo
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Acesso vitalício a todos os projetos, designs e materiais da equipe JFNexus3D.
          </p>
        </div>

        <div 
          data-testid="plan-card"
          className="relative rounded-2xl bg-gradient-to-br from-[#130A24] to-[#1A102C] border-2 border-[#3B82F6]/50 overflow-hidden hover:border-[#3B82F6] transition-all duration-300 group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00E5FF]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative p-8 md:p-12">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-[#00E5FF]" />
                  <h3 className="text-3xl font-bold text-white">Cofre Criativo</h3>
                </div>
                <p className="text-gray-400">Acesso completo e definitivo</p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold text-white">R$ 50</span>
                  <span className="text-xl text-gray-400">BRL</span>
                </div>
                <p className="text-sm text-[#00E5FF] font-medium mt-1">Pagamento único</p>
              </div>
            </div>

            <div className="bg-[#0B061A]/50 rounded-xl p-6 mb-8 border border-[#281A45]">
              <p className="text-gray-300 leading-relaxed mb-4">
                Adquira nosso plano exclusivo e desbloqueie acesso completo a todo o acervo de projetos, designs e materiais criados pela nossa equipe.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Conteúdos modernos, profissionais e prontos para elevar suas ideias a outro nível.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {features.map((feature) => (
                <div 
                  key={feature}
                  data-testid={`feature-${feature.replace(/\s+/g, '-').toLowerCase()}`}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center mt-0.5">
                    <Check className="h-4 w-4 text-[#00E5FF]" />
                  </div>
                  <span className="text-white text-lg">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/20 mb-8">
              <InfinityIcon className="h-6 w-6 text-[#00E5FF] flex-shrink-0" />
              <p className="text-gray-300 italic">
                Um verdadeiro cofre criativo na palma da sua mão. ✨
              </p>
            </div>

            <Button
              data-testid="checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-7 text-lg rounded-xl transition-transform hover:scale-[1.02] shadow-lg shadow-blue-600/20"
            >
              {loading ? "Processando..." : "Adquirir Agora - R$ 50"}
            </Button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Pagamento processado com segurança via Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
