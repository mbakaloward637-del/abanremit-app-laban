import { useState } from "react";
import { ArrowLeft, Building2, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Withdraw = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"bank" | "mobile">("bank");
  const [amount, setAmount] = useState("");

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Withdraw</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label-text">Amount (KES)</label>
            <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field text-center text-2xl font-bold" />
          </div>

          <div className="flex rounded-xl border border-border p-1 bg-secondary">
            {([{ id: "bank" as const, icon: Building2, label: "Bank" }, { id: "mobile" as const, icon: Smartphone, label: "Mobile Money" }]).map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-medium transition-all ${
                  method === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <m.icon size={14} />
                {m.label}
              </button>
            ))}
          </div>

          <div className="section-card space-y-3">
            {method === "bank" ? (
              <>
                <input placeholder="Bank Name" className="input-field" />
                <input placeholder="Account Number" className="input-field" />
                <input placeholder="Account Holder Name" className="input-field" />
              </>
            ) : (
              <input placeholder="M-Pesa Number (+254...)" className="input-field" />
            )}
          </div>

          <div>
            <label className="label-text">Wallet PIN</label>
            <input type="password" maxLength={6} className="input-field text-center text-xl tracking-[0.5em]" placeholder="••••" />
          </div>

          <button disabled={!amount} className="btn-primary">
            Withdraw KES {amount || "0.00"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Withdraw;
