import { Transaction } from "@/components/TransactionItem";

export const mockUser = {
  firstName: "James",
  lastName: "Mwangi",
  email: "james.mwangi@email.com",
  phone: "+254712345678",
  walletNumber: "WLT8880001023",
  walletBalance: 12450.75,
  currency: "KES",
  avatarInitials: "JM",
};

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "deposit",
    amount: 5000,
    currency: "KES",
    description: "M-Pesa Deposit",
    date: "Today, 2:30 PM",
    status: "completed",
  },
  {
    id: "2",
    type: "send",
    amount: 1200,
    currency: "KES",
    description: "Sent to Sarah Ochieng",
    date: "Today, 11:15 AM",
    status: "completed",
  },
  {
    id: "3",
    type: "receive",
    amount: 3000,
    currency: "KES",
    description: "From David Kimani",
    date: "Yesterday, 4:45 PM",
    status: "completed",
  },
  {
    id: "4",
    type: "withdraw",
    amount: 2000,
    currency: "KES",
    description: "Bank Withdrawal - Equity",
    date: "Yesterday, 9:00 AM",
    status: "pending",
  },
  {
    id: "5",
    type: "exchange",
    amount: 500,
    currency: "KES",
    description: "KES → USD Exchange",
    date: "Mar 5, 3:20 PM",
    status: "completed",
  },
  {
    id: "6",
    type: "deposit",
    amount: 10000,
    currency: "KES",
    description: "Card Deposit - Visa",
    date: "Mar 4, 1:00 PM",
    status: "completed",
  },
];

export const mockCard = {
  cardNumber: "4532891056781234",
  expiry: "09/28",
  cvv: "321",
  name: "JAMES MWANGI",
};
