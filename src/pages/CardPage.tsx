import { ArrowLeft, Lock, Copy, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VirtualCard from "@/components/VirtualCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const CardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: card, isLoading } = useQuery({
    queryKey: ["virtual-card", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        return await api.virtualCards.get();
      } catch {
        return null;
      }
    },
  });

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={18} className="text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">My Card</h1>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : card ? (
          <>
            <div className="flex justify-center mb-8">
              <VirtualCard cardNumber={card.card_number} expiry={card.expiry} cvv={card.cvv} name={card.cardholder_name} />
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Card Actions</h2>
              <button onClick={() => { navigator.clipboard.writeText(card.card_number); toast.success("Card number copied"); }}
                className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Copy size={18} className="text-primary" /></div>
                <div className="text-left"><p className="text-sm font-medium text-foreground">Copy Card Details</p><p className="text-xs text-muted-foreground">Copy number, expiry, and CVV</p></div>
              </button>
              <button onClick={async () => {
                try {
                  if (card.is_frozen) await api.virtualCards.unfreeze(card.id);
                  else await api.virtualCards.freeze(card.id);
                  toast.success(card.is_frozen ? "Card unfrozen" : "Card frozen");
                } catch (err: any) { toast.error(err.message); }
              }} className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10"><Lock size={18} className="text-warning" /></div>
                <div className="text-left"><p className="text-sm font-medium text-foreground">{card.is_frozen ? "Unfreeze Card" : "Freeze Card"}</p><p className="text-xs text-muted-foreground">{card.is_frozen ? "Re-enable your card" : "Temporarily disable your card"}</p></div>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-4">No virtual card yet</p>
            <p className="text-xs text-muted-foreground">Virtual cards are issued via Paystack when available.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default CardPage;
