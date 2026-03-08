import { motion } from "framer-motion";
import WalletCard from "@/components/WalletCard";
import QuickActions from "@/components/QuickActions";
import TransactionItem from "@/components/TransactionItem";
import BottomNav from "@/components/BottomNav";
import { mockUser, mockTransactions } from "@/data/mockData";
import { Bell, Settings } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen gradient-hero pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-5 pt-6 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
            {mockUser.avatarInitials}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Good morning</p>
            <h1 className="text-base font-bold text-foreground">{mockUser.firstName} {mockUser.lastName}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <Bell size={18} className="text-muted-foreground" />
          </button>
          <button className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <Settings size={18} className="text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      <div className="px-5 space-y-6">
        {/* Wallet Card */}
        <WalletCard
          balance={mockUser.walletBalance}
          currency={mockUser.currency}
          walletNumber={mockUser.walletNumber}
          userName={`${mockUser.firstName} ${mockUser.lastName}`}
        />

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Recent Transactions</h2>
            <button className="text-xs font-semibold text-primary" onClick={() => {}}>
              See All
            </button>
          </div>
          <div className="glass-card rounded-2xl divide-y divide-border/30">
            {mockTransactions.slice(0, 4).map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
