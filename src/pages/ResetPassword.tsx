import { useState, useEffect } from "react";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // The recovery link sets the session automatically via the URL hash
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    // Also check if already in a session (user clicked link and page loaded)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
  }, []);

  const handleReset = async () => {
    if (!password || !confirmPassword) { toast.error("Please fill in both fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Password Updated!</h1>
          <p className="text-sm text-muted-foreground">Your password has been reset successfully. You can now sign in with your new password.</p>
          <button onClick={() => navigate("/login")} className="btn-primary">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your new password below</p>
        </div>
        {!sessionReady && (
          <div className="section-card text-center">
            <Loader2 size={20} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Verifying reset link...</p>
          </div>
        )}
        {sessionReady && (
          <div className="space-y-4">
            <div>
              <label className="label-text flex items-center gap-1"><Lock size={12}/>New Password</label>
              <input type="password" className="input-field" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label-text flex items-center gap-1"><Lock size={12}/>Confirm Password</label>
              <input type="password" className="input-field" placeholder="••••••••" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()} />
            </div>
            <button onClick={handleReset} disabled={loading} className="btn-primary flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
