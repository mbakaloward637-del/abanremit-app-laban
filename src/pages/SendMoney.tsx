import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, User, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const SendMoney = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"wallet" | "phone">("wallet");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen gradient-hero pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Send Money</h1>
        </div>

        {/* Method Toggle */}
        <div className="glass-card flex rounded-xl p-1 mb-6">
          {(["wallet", "phone"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); setRecipient(""); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all ${
                method === m ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "wallet" ? <User size={16} /> : <Phone size={16} />}
              {m === "wallet" ? "To Wallet" : "To Phone"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  {method === "wallet" ? "Wallet Number" : "Phone Number"}
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={method === "wallet" ? "WLT888000XXXX" : "+254 7XX XXX XXX"}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="input-glass w-full pl-11"
                  />
                </div>
              </div>

              {recipient.length > 8 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                    SO
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Sarah Ochieng</p>
                    <p className="text-xs text-muted-foreground">{method === "wallet" ? "WLT8880001234" : "+254 712 345 678"}</p>
                  </div>
                </motion.div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={recipient.length < 8}
                className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Amount (KES)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-glass w-full text-center text-2xl font-bold"
                />
              </div>

              <div className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-semibold text-foreground">Sarah Ochieng</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-semibold text-success">Free</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Wallet PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  className="input-glass w-full text-center text-xl tracking-[0.5em]"
                />
              </div>

              <button
                disabled={!amount}
                className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40"
              >
                Send KES {amount || "0.00"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default SendMoney;
