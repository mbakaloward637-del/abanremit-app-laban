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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
          <span className="text-3xl font-extrabold text-primary-foreground">A</span>
        </div>

        <h1 className="text-3xl font-extrabold text-foreground">AbanRemit</h1>
        <p className="mt-3 text-base text-muted-foreground text-balance">
          Your digital wallet for instant payments, transfers & currency exchange.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-10 grid gap-3 w-full max-w-sm"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="section-card flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <f.icon size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 w-full max-w-sm space-y-3"
      >
        <button
          onClick={() => navigate("/register")}
          className="btn-primary flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => navigate("/login")}
          className="btn-outline"
        >
          Sign In
        </button>
      </motion.div>
    </div>
  );
};

export default Index;
