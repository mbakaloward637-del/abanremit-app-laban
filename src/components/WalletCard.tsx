import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface WalletCardProps {
  balance: number;
  currency: string;
  walletNumber: string;
  userName: string;
}

const WalletCard = ({ balance, currency, walletNumber, userName }: WalletCardProps) => {
  const [showBalance, setShowBalance] = useState(true);

  const formatBalance = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const currencySymbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    NGN: "₦",
    GBP: "£",
    EUR: "€",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl p-6 gradient-primary"
      style={{ boxShadow: "0 20px 60px hsl(217 91% 60% / 0.3)" }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-foreground/5" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-foreground/5" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-primary-foreground/70">Total Balance</p>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        <motion.h2
          className="mt-2 text-3xl font-bold text-primary-foreground"
          key={showBalance ? "show" : "hide"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {showBalance
            ? `${currencySymbols[currency] || currency} ${formatBalance(balance)}`
            : "••••••"}
        </motion.h2>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-xs text-primary-foreground/50">Wallet Number</p>
            <p className="mt-0.5 text-sm font-semibold text-primary-foreground/90 tracking-wider">
              {walletNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-foreground/50">{userName}</p>
            <p className="mt-0.5 text-sm font-bold text-primary-foreground/90">{currency}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletCard;
