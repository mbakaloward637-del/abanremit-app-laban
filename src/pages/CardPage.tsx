import { ArrowLeft, Lock, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VirtualCard from "@/components/VirtualCard";
import BottomNav from "@/components/BottomNav";
import { mockCard } from "@/data/mockData";

const CardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">My Card</h1>
        </div>

        <div className="flex justify-center mb-8">
          <VirtualCard {...mockCard} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Card Actions</h2>

          <button className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Copy size={18} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Copy Card Details</p>
              <p className="text-xs text-muted-foreground">Copy number, expiry, and CVV</p>
            </div>
          </button>

          <button className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Lock size={18} className="text-warning" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Freeze Card</p>
              <p className="text-xs text-muted-foreground">Temporarily disable your card</p>
            </div>
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default CardPage;
