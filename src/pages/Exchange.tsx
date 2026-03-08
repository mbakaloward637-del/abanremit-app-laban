import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const currencies = ["KES", "USD", "NGN", "GBP", "EUR"];

const Exchange = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState("KES");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("");

  const rate = 0.0077; // mock KES to USD
  const converted = amount ? (parseFloat(amount) * rate).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen gradient-hero pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Exchange Currency</h1>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] text-muted-foreground uppercase mb-2">You Send</p>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-glass flex-1 text-xl font-bold"
              />
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="input-glass w-20 text-sm font-semibold">
                {currencies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => { const t = from; setFrom(to); setTo(t); }}
              className="glass-card flex h-12 w-12 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
            >
              <ArrowUpDown size={20} className="text-primary" />
            </button>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] text-muted-foreground uppercase mb-2">You Receive</p>
            <div className="flex gap-3">
              <div className="input-glass flex-1 text-xl font-bold text-foreground/60">{converted}</div>
              <select value={to} onChange={(e) => setTo(e.target.value)} className="input-glass w-20 text-sm font-semibold">
                {currencies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-semibold text-foreground">1 {from} = {rate} {to}</span>
            </div>
          </div>

          <button
            disabled={!amount}
            className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40"
          >
            Convert Currency
          </button>
        </div>
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default Exchange;
