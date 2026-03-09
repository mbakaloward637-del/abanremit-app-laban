import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10"><CheckCircle size={32} className="text-success" /></div>
          <h1 className="text-xl font-bold text-foreground">Check Your Email</h1>
          <p className="text-sm text-muted-foreground">We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.</p>
          <p className="text-xs text-muted-foreground">Didn't receive it? Check your spam folder or try again.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setSent(false)} className="btn-primary">Try Again</button>
            <button onClick={() => navigate("/login")} className="text-sm text-primary font-semibold">Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">
        <button onClick={() => navigate("/login")} className="back-btn"><ArrowLeft size={18} /></button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send you a reset link</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label-text flex items-center gap-1"><Mail size={12}/>Email Address</label>
            <input type="email" className="input-field" placeholder="your@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleReset()} />
          </div>
          <button onClick={handleReset} disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Send Reset Link"}
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Remember your password? <button onClick={() => navigate("/login")} className="text-primary font-semibold">Sign In</button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
