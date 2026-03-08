import { motion } from "framer-motion";
import { Send, Download, ArrowUpDown, CreditCard, Wallet, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { icon: Wallet, label: "Load", path: "/load", color: "from-primary to-accent" },
  { icon: Send, label: "Send", path: "/send", color: "from-accent to-primary" },
  { icon: Download, label: "Withdraw", path: "/withdraw", color: "from-success to-accent" },
  { icon: ArrowUpDown, label: "Exchange", path: "/exchange", color: "from-warning to-primary" },
  { icon: CreditCard, label: "My Card", path: "/card", color: "from-primary to-primary" },
  { icon: ArrowUpRight, label: "History", path: "/transactions", color: "from-muted-foreground to-primary" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-3"
    >
      {actions.map((action) => (
        <motion.button
          key={action.label}
          variants={item}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(action.path)}
          className="glass-card-hover flex flex-col items-center gap-2 rounded-2xl p-4"
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color}`}>
            <action.icon size={22} className="text-primary-foreground" />
          </div>
          <span className="text-xs font-semibold text-foreground/80">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
