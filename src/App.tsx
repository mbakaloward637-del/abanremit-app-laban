import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import InstallPWA from "@/components/InstallPWA";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PageLoader from "./components/PageLoader";

// Eager load critical pages for instant navigation
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// Lazy load secondary pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SendMoney = lazy(() => import("./pages/SendMoney"));
const LoadWallet = lazy(() => import("./pages/LoadWallet"));
const Transactions = lazy(() => import("./pages/Transactions"));
const CardPage = lazy(() => import("./pages/CardPage"));
const Exchange = lazy(() => import("./pages/Exchange"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const BuyAirtime = lazy(() => import("./pages/BuyAirtime"));
const StatementDownload = lazy(() => import("./pages/StatementDownload"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages - lazy loaded
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminKYC = lazy(() => import("./pages/admin/AdminKYC"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminAirtime = lazy(() => import("./pages/admin/AdminAirtime"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));

// Super Admin pages - lazy loaded
const SuperAdminDashboard = lazy(() => import("./pages/admin/SuperAdminDashboard"));
const SuperAdminManagement = lazy(() => import("./pages/admin/SuperAdminManagement"));
const SuperAdminWalletConfig = lazy(() => import("./pages/admin/SuperAdminWalletConfig"));
const SuperAdminPaymentGateway = lazy(() => import("./pages/admin/SuperAdminPaymentGateway"));
const SuperAdminExchangeRates = lazy(() => import("./pages/admin/SuperAdminExchangeRates"));
const SuperAdminFees = lazy(() => import("./pages/admin/SuperAdminFees"));
const SuperAdminSettings = lazy(() => import("./pages/admin/SuperAdminSettings"));
const SuperAdminAuditLogs = lazy(() => import("./pages/admin/SuperAdminAuditLogs"));

// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPWA />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected user routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/send" element={<ProtectedRoute><SendMoney /></ProtectedRoute>} />
              <Route path="/load" element={<ProtectedRoute><LoadWallet /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/card" element={<ProtectedRoute><CardPage /></ProtectedRoute>} />
              <Route path="/exchange" element={<ProtectedRoute><Exchange /></ProtectedRoute>} />
              <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
              <Route path="/buy-airtime" element={<ProtectedRoute><BuyAirtime /></ProtectedRoute>} />
              <Route path="/statement" element={<ProtectedRoute><StatementDownload /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="kyc" element={<AdminKYC />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="airtime" element={<AdminAirtime />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="security" element={<AdminSecurity />} />
                <Route path="logs" element={<AdminLogs />} />

                {/* Super Admin exclusive routes */}
                <Route path="super-dashboard" element={<SuperAdminDashboard />} />
                <Route path="admin-management" element={<SuperAdminManagement />} />
                <Route path="wallet-config" element={<SuperAdminWalletConfig />} />
                <Route path="payment-gateways" element={<SuperAdminPaymentGateway />} />
                <Route path="exchange-rates" element={<SuperAdminExchangeRates />} />
                <Route path="fees" element={<SuperAdminFees />} />
                <Route path="settings" element={<SuperAdminSettings />} />
                <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
