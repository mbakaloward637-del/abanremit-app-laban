import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Withdraw = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"bank" | "mobile">("bank");
  const [amount, setAmount] = useState("");

  return (
    <div className="min-h-screen gradient-hero pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Withdraw</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Amount (KES)</label>
            <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-glass w-full text-center text-2xl font-bold" />
          </div>

          <div className="glass-card flex rounded-xl p-1">
            {([{ id: "bank" as const, icon: Building2, label: "Bank" }, { id: "mobile" as const, icon: Smartphone, label: "Mobile Money" }]).map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold transition-all ${
                  method === m.id ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <m.icon size={14} />
                {m.label}
              </button>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-3">
            {method === "bank" ? (
              <>
                <input placeholder="Bank Name" className="input-glass w-full" />
                <input placeholder="Account Number" className="input-glass w-full" />
                <input placeholder="Account Holder Name" className="input-glass w-full" />
              </>
            ) : (
              <input placeholder="M-Pesa Number (+254...)" className="input-glass w-full" />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Wallet PIN</label>
            <input type="password" maxLength={6} className="input-glass w-full text-center text-xl tracking-[0.5em]" placeholder="••••" />
          </div>

          <button disabled={!amount} className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40">
            Withdraw KES {amount || "0.00"}
          </button>
        </div>
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default Withdraw;
