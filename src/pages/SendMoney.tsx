import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search, User, Phone, Loader2, Check, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const WALLET_REGEX = /^WLT\d{10,}$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 500000;
const PIN_MIN = 4;
const PIN_MAX = 6;

interface ValidationError {
  field: string;
  message: string;
}

const SendMoney = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [method, setMethod] = useState<"wallet" | "phone">("wallet");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [done, setDone] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{ name: string; wallet: string; userId: string; avatar?: string } | null>(null);
  const [txResult, setTxResult] = useState<{ reference: string; fee: number; currency: string } | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const getError = (field: string) => errors.find((e) => e.field === field)?.message;
  const clearError = (field: string) => setErrors((prev) => prev.filter((e) => e.field !== field));

  const isRecipientFormatValid = useMemo(() => {
    if (!recipient) return false;
    if (method === "wallet") return WALLET_REGEX.test(recipient.trim());
    return PHONE_REGEX.test(recipient.trim().replace(/\s/g, ""));
  }, [recipient, method]);

  const amountNum = Number(amount);
  const amountErrors = useMemo(() => {
    if (!amount) return null;
    if (isNaN(amountNum) || amountNum <= 0) return "Enter a valid amount";
    if (amountNum < MIN_AMOUNT) return `Minimum amount is ${user?.currency || ""} ${MIN_AMOUNT}`;
    if (amountNum > MAX_AMOUNT) return `Maximum amount is ${user?.currency || ""} ${MAX_AMOUNT.toLocaleString()}`;
    if (user && amountNum > user.walletBalance) return "Insufficient balance";
    return null;
  }, [amount, amountNum, user]);

  const lookupRecipient = async () => {
    clearError("recipient");
    const trimmed = recipient.trim().replace(/\s/g, "");
    if (!trimmed) return;

    if (!isRecipientFormatValid) {
      setErrors((prev) => [
        ...prev.filter((e) => e.field !== "recipient"),
        { field: "recipient", message: method === "wallet" ? "Invalid wallet format. Must start with WLT followed by digits" : "Invalid phone format. Use international format (e.g. +254712345678)" },
      ]);
      setRecipientInfo(null);
      return;
    }

    if (method === "wallet" && trimmed === user?.walletNumber) {
      setErrors((prev) => [...prev.filter((e) => e.field !== "recipient"), { field: "recipient", message: "You cannot send money to yourself" }]);
      setRecipientInfo(null);
      return;
    }

    if (method === "phone" && user?.phone && trimmed === user.phone.replace(/\s/g, "")) {
      setErrors((prev) => [...prev.filter((e) => e.field !== "recipient"), { field: "recipient", message: "You cannot send money to yourself" }]);
      setRecipientInfo(null);
      return;
    }

    setLookingUp(true);
    try {
      const result = await api.recipients.lookup(method, trimmed);
      if (result?.found) {
        setRecipientInfo({ name: result.name!, wallet: result.wallet || "", userId: result.user_id || "", avatar: result.avatar_url });
      } else {
        setRecipientInfo(null);
        setErrors((prev) => [...prev.filter((e) => e.field !== "recipient"), { field: "recipient", message: "Recipient not found." }]);
      }
    } catch (err: any) {
      setRecipientInfo(null);
      toast.error("Failed to look up recipient.");
    } finally {
      setLookingUp(false);
    }
  };

  const validateStep2 = (): boolean => {
    const newErrors: ValidationError[] = [];
    if (!amount || isNaN(amountNum) || amountNum <= 0) newErrors.push({ field: "amount", message: "Enter a valid amount" });
    else if (amountNum < MIN_AMOUNT) newErrors.push({ field: "amount", message: `Minimum amount is ${user?.currency} ${MIN_AMOUNT}` });
    else if (amountNum > MAX_AMOUNT) newErrors.push({ field: "amount", message: `Maximum amount is ${user?.currency} ${MAX_AMOUNT.toLocaleString()}` });
    else if (user && amountNum > user.walletBalance) newErrors.push({ field: "amount", message: `Insufficient balance.` });
    if (!pin) newErrors.push({ field: "pin", message: "Enter your wallet PIN" });
    else if (pin.length < PIN_MIN || pin.length > PIN_MAX) newErrors.push({ field: "pin", message: `PIN must be ${PIN_MIN}-${PIN_MAX} digits` });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSend = async () => {
    if (!user || !validateStep2()) return;
    setProcessing(true);
    try {
      const result = await api.transactions.transfer({
        recipient_wallet: method === "wallet" ? recipient.trim() : undefined,
        recipient_phone: method === "phone" ? recipient.trim().replace(/\s/g, "") : undefined,
        amount: amountNum,
        pin,
      });

      if (!result?.success) {
        const serverError = result?.error || "Transfer failed";
        if (serverError.toLowerCase().includes("pin")) setErrors([{ field: "pin", message: serverError }]);
        else if (serverError.toLowerCase().includes("balance")) setErrors([{ field: "amount", message: serverError }]);
        else toast.error(serverError);
        return;
      }

      setTxResult({ reference: result.reference, fee: result.fee, currency: result.currency });
      await refreshUser();
      setDone(true);
      toast.success(`${result.currency} ${amount} sent successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Transfer failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (done) {
    return (
      <div className="page-container flex flex-col">
        <div className="px-5 pt-6">
          <div className="page-header px-0 pt-0">
            <button onClick={() => navigate("/dashboard")} className="back-btn"><ArrowLeft size={18} className="text-foreground" /></button>
            <h1 className="text-lg font-bold text-foreground">Send Money</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"><Check size={40} className="text-success" /></div>
            <h2 className="text-xl font-bold text-foreground">Money Sent!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{txResult?.currency || user?.currency} {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} to {recipientInfo?.name || recipient}</p>
            {txResult?.fee ? <p className="mt-1 text-xs text-muted-foreground">Fee: {txResult.currency} {txResult.fee.toFixed(2)}</p> : null}
            <p className="mt-1 text-xs text-muted-foreground">Ref: {txResult?.reference}</p>
            <button onClick={() => navigate("/dashboard")} className="mt-6 bg-primary rounded-xl px-8 py-3 text-sm font-semibold text-primary-foreground">Done</button>
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
          <button onClick={() => { if (step > 1) { setStep(step - 1); setErrors([]); } else navigate(-1); }} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Send Money</h1>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (<div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />))}
        </div>

        {step === 1 && (
          <div className="flex rounded-xl border border-border p-1 mb-6 bg-secondary">
            {(["wallet", "phone"] as const).map((m) => (
              <button key={m} onClick={() => { setMethod(m); setRecipient(""); setRecipientInfo(null); setErrors([]); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${method === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {m === "wallet" ? <User size={16} /> : <Phone size={16} />}
                {m === "wallet" ? "To Wallet" : "To Phone"}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="label-text">{method === "wallet" ? "Wallet Number" : "Phone Number"}</label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder={method === "wallet" ? "WLT8880000001" : "+254712345678"} value={recipient}
                    onChange={(e) => { setRecipient(e.target.value); clearError("recipient"); setRecipientInfo(null); }}
                    onBlur={lookupRecipient} onKeyDown={(e) => e.key === "Enter" && lookupRecipient()}
                    className={`input-field pl-11 ${getError("recipient") ? "border-destructive" : ""}`} />
                  {lookingUp && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
                </div>
                {getError("recipient") && <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertCircle size={12} /> {getError("recipient")}</p>}
              </div>
              {recipientInfo && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-card border border-success/30 bg-success/5">
                  <div className="flex items-center gap-3">
                    {recipientInfo.avatar ? (
                      <img src={recipientInfo.avatar} alt={recipientInfo.name} className="h-12 w-12 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shrink-0">
                        {recipientInfo.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{recipientInfo.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{recipientInfo.wallet}</p>
                    </div>
                    <Check size={18} className="text-success shrink-0" />
                  </div>
                </motion.div>
              )}
              <button onClick={() => { if (!recipientInfo) { lookupRecipient(); return; } setStep(2); setErrors([]); }}
                disabled={!recipient.trim() || lookingUp} className="btn-primary">
                {lookingUp ? <Loader2 size={16} className="animate-spin mx-auto" /> : recipientInfo ? "Continue" : "Find Recipient"}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="label-text">Amount ({user?.currency})</label>
                <input type="number" inputMode="decimal" placeholder="0.00" min={MIN_AMOUNT} max={MAX_AMOUNT} value={amount}
                  onChange={(e) => { setAmount(e.target.value); clearError("amount"); }}
                  className={`input-field text-center text-2xl font-bold ${amountErrors || getError("amount") ? "border-destructive" : ""}`} />
                {(amountErrors || getError("amount")) && <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertCircle size={12} /> {amountErrors || getError("amount")}</p>}
                <p className="mt-1 text-xs text-muted-foreground text-center">Min: {user?.currency} {MIN_AMOUNT} · Max: {user?.currency} {MAX_AMOUNT.toLocaleString()}</p>
              </div>
              <div className="section-card space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Recipient</span><span className="font-medium text-foreground">{recipientInfo?.name || recipient}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Available Balance</span>
                  <span className={`font-medium ${user && amountNum > user.walletBalance ? "text-destructive" : "text-foreground"}`}>{user?.currency} {user?.walletBalance.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => { if (amountErrors) { setErrors([{ field: "amount", message: amountErrors }]); return; } setStep(3); setErrors([]); }}
                disabled={!amount || !!amountErrors} className="btn-primary">Continue</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Confirm Transfer</h2>
              <div className="section-card flex items-center gap-3 border border-border bg-muted/30">
                {recipientInfo?.avatar ? (
                  <img src={recipientInfo.avatar} alt={recipientInfo.name} className="h-12 w-12 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shrink-0">
                    {(recipientInfo?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{recipientInfo?.name || recipient}</p>
                  <p className="text-xs text-muted-foreground font-mono">{recipientInfo?.wallet || recipient}</p>
                </div>
              </div>
              <div className="section-card space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-foreground">{user?.currency} {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Your Balance After</span>
                  <span className={`font-medium ${user && user.walletBalance - amountNum < 0 ? "text-destructive" : "text-foreground"}`}>{user?.currency} {user ? (user.walletBalance - amountNum).toFixed(2) : "—"}</span>
                </div>
              </div>
              <div>
                <label className="label-text">Enter Wallet PIN to confirm</label>
                <input type="password" maxLength={PIN_MAX} placeholder={"•".repeat(PIN_MAX)} value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); clearError("pin"); }}
                  className={`input-field text-center text-xl tracking-[0.5em] ${getError("pin") ? "border-destructive" : ""}`} />
                {getError("pin") && <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertCircle size={12} /> {getError("pin")}</p>}
              </div>
              <button onClick={handleSend} disabled={!pin || processing} className="btn-primary flex items-center justify-center gap-2">
                {processing ? <Loader2 size={16} className="animate-spin" /> : `Send ${user?.currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};

export default SendMoney;
