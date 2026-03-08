import { ArrowDownLeft, ArrowUpRight, ArrowUpDown, Download, Wallet } from "lucide-react";
import { motion } from "framer-motion";

export interface Transaction {
  id: string;
  type: "deposit" | "send" | "receive" | "withdraw" | "exchange";
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

const iconMap = {
  deposit: Wallet,
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  withdraw: Download,
  exchange: ArrowUpDown,
};

const colorMap = {
  deposit: "text-success",
  send: "text-destructive",
  receive: "text-success",
  withdraw: "text-warning",
  exchange: "text-accent",
};

const bgMap = {
  deposit: "bg-success/10",
  send: "bg-destructive/10",
  receive: "bg-success/10",
  withdraw: "bg-warning/10",
  exchange: "bg-accent/10",
};

const TransactionItem = ({ tx }: { tx: Transaction }) => {
  const Icon = iconMap[tx.type];
  const isPositive = tx.type === "deposit" || tx.type === "receive";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/50"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgMap[tx.type]}`}>
        <Icon size={18} className={colorMap[tx.type]} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
        <p className="text-xs text-muted-foreground">{tx.date}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${isPositive ? "text-success" : "text-foreground"}`}>
          {isPositive ? "+" : "-"}{tx.currency} {Math.abs(tx.amount).toFixed(2)}
        </p>
        <p className={`text-[10px] font-medium capitalize ${
          tx.status === "completed" ? "text-success" : tx.status === "pending" ? "text-warning" : "text-destructive"
        }`}>
          {tx.status}
        </p>
      </div>
    </motion.div>
  );
};

export default TransactionItem;
