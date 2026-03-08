import { useState } from "react";
import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const currencies = ["KES", "USD", "NGN", "GBP", "EUR"];

const Exchange = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState("KES");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("");

  const rate = 0.0077;
  const converted = amount ? (parseFloat(amount) * rate).toFixed(2) : "0.00";

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Exchange Currency</h1>
        </div>

        <div className="space-y-4">
          <div className="section-card">
            <p className="text-[10px] text-muted-foreground uppercase mb-2 font-medium">You Send</p>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field flex-1 text-xl font-bold"
              />
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-20 text-sm font-medium">
                {currencies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => { const t = from; setFrom(to); setTo(t); }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary transition-colors"
            >
              <ArrowUpDown size={20} className="text-primary" />
            </button>
          </div>

          <div className="section-card">
            <p className="text-[10px] text-muted-foreground uppercase mb-2 font-medium">You Receive</p>
            <div className="flex gap-3">
              <div className="input-field flex-1 text-xl font-bold text-muted-foreground">{converted}</div>
              <select value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-20 text-sm font-medium">
                {currencies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="section-card">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium text-foreground">1 {from} = {rate} {to}</span>
            </div>
          </div>

          <button disabled={!amount} className="btn-primary">
            Convert Currency
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Exchange;
