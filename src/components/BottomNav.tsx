import { Home, Send, Wallet, History, CreditCard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Send, label: "Send", path: "/send" },
  { icon: Wallet, label: "Load", path: "/load" },
  { icon: History, label: "History", path: "/transactions" },
  { icon: CreditCard, label: "Card", path: "/card" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 px-2 pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-1 px-3 py-2 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 h-1 w-8 rounded-full gradient-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon
                size={22}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
