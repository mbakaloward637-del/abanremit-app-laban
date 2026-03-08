import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const networks = [
  { id: "safaricom", name: "Safaricom", color: "bg-success/10", iconColor: "text-success", prefix: "+254 7" },
  { id: "airtel", name: "Airtel", color: "bg-destructive/10", iconColor: "text-destructive", prefix: "+254 7" },
  { id: "telkom", name: "Telkom", color: "bg-primary/10", iconColor: "text-primary", prefix: "+254 7" },
];

const amounts = [10, 20, 50, 100, 200, 500, 1000, 2500];

const BuyAirtime = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [phone, setPhone] = useState(user?.phone || "");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePurchase = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      toast.success(`KES ${amount} airtime sent to ${phone}`);
    }, 2000);
  };

  if (done) {
    return (
      <div className="page-container flex flex-col">
        <div className="px-5 pt-6">
          <div className="page-header px-0 pt-0">
            <button onClick={() => navigate("/dashboard")} className="back-btn">
              <ArrowLeft size={18} className="text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Buy Airtime</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <Check size={40} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Airtime Sent!</h2>
            <p className="mt-1 text-sm text-muted-foreground">KES {amount} to {phone}</p>
            <p className="mt-0.5 text-xs text-muted-foreground capitalize">{selectedNetwork}</p>
            <button onClick={() => navigate("/dashboard")} className="mt-6 bg-primary rounded-xl px-8 py-3 text-sm font-semibold text-primary-foreground">
              Done
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Buy Airtime</h1>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {["Network", "Amount", "Confirm"].map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i < step ? "bg-primary" : "bg-border"}`} />
              <p className={`mt-1 text-[10px] font-medium ${i < step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground mb-2">Select Network</p>
            {networks.map((n) => (
              <button
                key={n.id}
                onClick={() => { setSelectedNetwork(n.id); setStep(2); }}
                className="section-card w-full flex items-center gap-4 hover:bg-secondary/50 transition-colors"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${n.color}`}>
                  <Smartphone size={22} className={n.iconColor} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{n.name}</p>
                  <p className="text-xs text-muted-foreground">Kenya • Mobile Airtime</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label-text">Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+254 7XX XXX XXX" />
            </div>

            <div>
              <label className="label-text">Amount (KES)</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {amounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`rounded-xl border py-3 text-xs font-semibold transition-all ${
                      amount === String(a) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/30"
                    }`}
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Or enter custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field text-center"
              />
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!amount || !phone}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="section-card space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Confirm Purchase</h3>
              {[
                { label: "Network", value: networks.find(n => n.id === selectedNetwork)?.name || "" },
                { label: "Phone", value: phone },
                { label: "Amount", value: `KES ${parseFloat(amount).toLocaleString()}` },
                { label: "Fee", value: "Free" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="label-text">Wallet PIN</label>
              <input type="password" maxLength={6} className="input-field text-center text-xl tracking-[0.5em]" placeholder="••••" />
            </div>

            <button
              onClick={handlePurchase}
              disabled={processing}
              className="btn-primary"
            >
              {processing ? "Processing..." : `Buy KES ${parseFloat(amount).toLocaleString()} Airtime`}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default BuyAirtime;
