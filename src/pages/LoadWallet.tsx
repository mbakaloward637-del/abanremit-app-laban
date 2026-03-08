import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, Smartphone, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

type Method = "card" | "mpesa" | "bank";

const methods = [
  { id: "card" as Method, icon: CreditCard, label: "Card" },
  { id: "mpesa" as Method, icon: Smartphone, label: "M-Pesa" },
  { id: "bank" as Method, icon: Building2, label: "Bank" },
];

const LoadWallet = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("card");
  const [amount, setAmount] = useState("");

  return (
    <div className="min-h-screen gradient-hero pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Load Wallet</h1>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Amount (KES)</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-glass w-full text-center text-3xl font-bold"
          />
          <div className="flex gap-2 mt-3">
            {[500, 1000, 5000, 10000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="flex-1 glass-card rounded-lg py-2 text-xs font-semibold text-foreground/80 hover:border-primary/30 transition-all"
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Method Toggle */}
        <div className="glass-card flex rounded-xl p-1 mb-6">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-3 text-xs font-semibold transition-all ${
                method === m.id ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <m.icon size={14} />
              {m.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {method === "card" && (
            <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Animated card preview */}
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10" />
                <p className="text-[10px] text-muted-foreground uppercase mb-3">Card Details</p>
                <input placeholder="Card Number" className="input-glass w-full mb-3 tracking-widest" />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input placeholder="MM/YY" className="input-glass" />
                  <input placeholder="CVV" type="password" maxLength={4} className="input-glass" />
                </div>
                <input placeholder="Cardholder Name" className="input-glass w-full" />
              </div>

              <button
                disabled={!amount}
                className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40"
              >
                Pay KES {amount || "0.00"}
              </button>
            </motion.div>
          )}

          {method === "mpesa" && (
            <motion.div key="mpesa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-card rounded-2xl p-5">
                <p className="text-[10px] text-muted-foreground uppercase mb-3">M-Pesa Number</p>
                <input placeholder="+254 7XX XXX XXX" className="input-glass w-full" />
              </div>

              <button
                disabled={!amount}
                className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40"
              >
                Send STK Push
              </button>

              <p className="text-center text-xs text-muted-foreground">
                You'll receive an M-Pesa prompt on your phone
              </p>
            </motion.div>
          )}

          {method === "bank" && (
            <motion.div key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Bank Transfer Details</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-semibold text-foreground">AbanRemit Trust</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-semibold text-foreground font-mono">8880001023</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-semibold text-foreground font-mono">WLT8880001023</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Transfer funds to the account above and your wallet will be credited automatically
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default LoadWallet;
