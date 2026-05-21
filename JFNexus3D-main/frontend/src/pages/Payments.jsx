import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MessageCircle,
  Check,
  Sparkles,
  Rocket,
  Headphones,
} from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5546999752206";

const features = [
  "Renovação manual do acesso",
  "Suporte para dúvidas sobre o acervo",
  "Ajuda com login e conta",
  "Atendimento direto pelo WhatsApp",
];

const Payments = () => {
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    window.open(
      `${WHATSAPP_URL}?text=${encodeURIComponent(
        "Olá! Quero renovar meu acesso ao JFNexus3D."
      )}`,
      "_blank"
    );
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
              <Headphones className="h-6 w-6 text-[#00E5FF]" />
              Suporte e Renovação
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 mb-6">
            <Rocket className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-sm text-[#00E5FF] font-medium">
              ATENDIMENTO DIRETO
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Precisa renovar seu acesso?
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Fale com nossa equipe pelo WhatsApp para renovar sua conta, tirar
            dúvidas ou solicitar suporte.
          </p>
        </div>

        <div className="relative rounded-2xl bg-gradient-to-br from-[#130A24] to-[#1A102C] border-2 border-[#3B82F6]/50 overflow-hidden hover:border-[#3B82F6] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00E5FF]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative p-8 md:p-12">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-[#00E5FF]" />
                  <h3 className="text-3xl font-bold text-white">
                    Renovação JFNexus3D
                  </h3>
                </div>

                <p className="text-gray-400">
                  Acesso renovado manualmente pela equipe
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold text-white">R$ 5</span>
                  <span className="text-xl text-gray-400">BRL</span>
                </div>

                <p className="text-sm text-[#00E5FF] font-medium mt-1">
                  Renovação mensal
                </p>
              </div>
            </div>

            <div className="bg-[#0B061A]/50 rounded-xl p-6 mb-8 border border-[#281A45]">
              <p className="text-gray-300 leading-relaxed mb-4">
                A renovação do acesso é feita manualmente pela nossa equipe.
                Após confirmação, seu usuário recebe mais 30 dias de acesso ao
                acervo.
              </p>

              <p className="text-gray-300 leading-relaxed">
                Clique no botão abaixo para falar conosco pelo WhatsApp.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center mt-0.5">
                    <Check className="h-4 w-4 text-[#00E5FF]" />
                  </div>

                  <span className="text-white text-lg">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              data-testid="support-whatsapp-btn"
              onClick={handleWhatsApp}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-7 text-lg rounded-xl transition-transform hover:scale-[1.02] shadow-lg shadow-green-600/20"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Falar no WhatsApp
            </Button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Atendimento manual. O pagamento e a renovação são combinados com a
              equipe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;