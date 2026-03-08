import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-extrabold gradient-text">AbanRemit</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your digital wallet</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Mail size={12}/>Email</label>
            <input type="email" className="input-glass w-full" placeholder="james@email.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Lock size={12}/>Password</label>
            <input type="password" className="input-glass w-full" placeholder="••••••••" />
          </div>

          <button className="text-xs text-primary font-semibold">Forgot password?</button>

          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all flex items-center justify-center gap-2"
          >
            Sign In
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <button onClick={() => navigate("/register")} className="text-primary font-semibold">Create Account</button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
