import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Zap, title: "Instant Transfers", desc: "Send money in seconds" },
  { icon: Shield, title: "Bank-Grade Security", desc: "Your money is always safe" },
  { icon: Globe, title: "Multi-Currency", desc: "Exchange rates built in" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-sm"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary animate-pulse-glow"
        >
          <span className="text-3xl font-extrabold text-primary-foreground">A</span>
        </motion.div>

        <h1 className="text-4xl font-extrabold gradient-text leading-tight">AbanRemit</h1>
        <p className="mt-3 text-base text-muted-foreground text-balance">
          Your digital wallet for instant payments, transfers & currency exchange.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 grid gap-3 w-full max-w-sm"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="glass-card flex items-center gap-3 rounded-2xl p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <f.icon size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-10 w-full max-w-sm space-y-3"
      >
        <button
          onClick={() => navigate("/register")}
          className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => navigate("/login")}
          className="glass-card-hover w-full rounded-xl py-4 text-sm font-semibold text-foreground"
        >
          Sign In
        </button>
      </motion.div>
    </div>
  );
};

export default Index;
