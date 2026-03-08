import { useState } from "react";
import { ArrowLeft, FileText, Download, Calendar, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const STATEMENT_FEE = 50;

const StatementDownload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"1month" | "3months" | "6months" | "1year">("1month");
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const periods = [
    { id: "1month" as const, label: "1 Month" },
    { id: "3months" as const, label: "3 Months" },
    { id: "6months" as const, label: "6 Months" },
    { id: "1year" as const, label: "1 Year" },
  ];

  const handleDownload = () => {
    if (!agreed) { toast.error("Please agree to the statement fee"); return; }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toast.success("Statement downloaded! KES 50 deducted from wallet.");
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Download Statement</h1>
        </div>

        <div className="space-y-5">
          {/* Fee Notice */}
          <div className="section-card flex items-start gap-3 border-warning/30">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 shrink-0 mt-0.5">
              <AlertCircle size={18} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Statement Fee: KES {STATEMENT_FEE}</p>
              <p className="text-xs text-muted-foreground mt-0.5">A fee of KES {STATEMENT_FEE} will be deducted from your wallet.</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="section-card space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-primary" />
              <p className="text-xs font-medium text-muted-foreground uppercase">Account</p>
            </div>
            {[
              { label: "Name", value: `${user?.firstName} ${user?.lastName}` },
              { label: "Wallet", value: user?.walletNumber },
              { label: "Currency", value: user?.currency },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Period */}
          <div>
            <label className="label-text flex items-center gap-1"><Calendar size={12}/> Statement Period</label>
            <div className="grid grid-cols-2 gap-2">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-xl border py-3 text-xs font-semibold transition-all ${
                    period === p.id ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/30"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="label-text">Format</label>
            <div className="flex rounded-xl border border-border p-1 bg-secondary">
              {(["pdf", "csv"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded-lg py-3 text-xs font-medium uppercase transition-all ${
                    format === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Agree */}
          <button onClick={() => setAgreed(!agreed)} className="flex items-center gap-3 w-full">
            <div className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
              agreed ? "bg-primary border-transparent" : "border-muted-foreground/30"
            }`}>
              {agreed && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
            </div>
            <p className="text-xs text-muted-foreground text-left">
              I agree to pay <span className="font-semibold text-foreground">KES {STATEMENT_FEE}</span> for this statement
            </p>
          </button>

          <button
            onClick={handleDownload}
            disabled={processing || !agreed}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {processing ? "Generating Statement..." : `Download Statement (KES ${STATEMENT_FEE})`}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default StatementDownload;
