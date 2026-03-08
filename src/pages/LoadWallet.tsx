import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Load Wallet</h1>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="label-text">Amount (KES)</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field text-center text-3xl font-bold"
          />
          <div className="flex gap-2 mt-3">
            {[500, 1000, 5000, 10000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-all ${
                  amount === String(v) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Method Toggle */}
        <div className="flex rounded-xl border border-border p-1 mb-6 bg-secondary">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-3 text-xs font-medium transition-all ${
                method === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
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
              <div className="section-card">
                <p className="text-[10px] text-muted-foreground uppercase mb-3 font-medium">Card Details</p>
                <input placeholder="Card Number" className="input-field mb-3 tracking-widest" />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input placeholder="MM/YY" className="input-field" />
                  <input placeholder="CVV" type="password" maxLength={4} className="input-field" />
                </div>
                <input placeholder="Cardholder Name" className="input-field" />
              </div>

              <button disabled={!amount} className="btn-primary">
                Pay KES {amount || "0.00"}
              </button>
            </motion.div>
          )}

          {method === "mpesa" && (
            <motion.div key="mpesa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="section-card">
                <p className="text-[10px] text-muted-foreground uppercase mb-3 font-medium">M-Pesa Number</p>
                <input placeholder="+254 7XX XXX XXX" className="input-field" />
              </div>

              <button disabled={!amount} className="btn-primary">
                Send STK Push
              </button>

              <p className="text-center text-xs text-muted-foreground">
                You'll receive an M-Pesa prompt on your phone
              </p>
            </motion.div>
          )}

          {method === "bank" && (
            <motion.div key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="section-card space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase mb-1 font-medium">Bank Transfer Details</p>
                {[
                  { label: "Bank", value: "AbanRemit Trust" },
                  { label: "Account", value: "8880001023" },
                  { label: "Reference", value: "WLT8880001023" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-foreground font-mono">{row.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Transfer funds to the account above and your wallet will be credited automatically
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};

export default LoadWallet;
