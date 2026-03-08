import { motion } from "framer-motion";
import { ArrowLeft, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransactionItem from "@/components/TransactionItem";
import BottomNav from "@/components/BottomNav";
import { mockTransactions } from "@/data/mockData";

const Transactions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
              <ArrowLeft size={18} className="text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Transactions</h1>
          </div>
          <button className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <Filter size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="glass-card rounded-2xl divide-y divide-border/30">
          {mockTransactions.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} />
          ))}
        </div>
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default Transactions;
