/**
 * AbanRemit API Service Layer
 * 
 * Drop-in replacement for Supabase client calls.
 * Import: import { api } from '@/services/api';
 * 
 * For production, set VITE_API_BASE_URL=https://abanremit.com/api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://abanremit.com/api/v1';

// ─── Types ───
export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  walletNumber: string;
  walletBalance: number;
  currency: string;
  avatarInitials: string;
  avatarUrl: string | null;
  role: 'user' | 'admin' | 'superadmin';
  status: string;
  kycStatus: string;
  country: string;
  countryCode: string;
  pinSet: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AppUser;
}

export interface TransferResult {
  success: boolean;
  reference: string;
  amount: number;
  fee: number;
  currency: string;
  recipient_name: string;
  new_balance: number;
  error?: string;
}

export interface RecipientLookup {
  found: boolean;
  name?: string;
  wallet?: string;
  user_id?: string;
  avatar_url?: string;
}

export interface VirtualCardData {
  id: string;
  card_number: string;
  last_four: string;
  masked_number: string;
  cvv: string;
  expiry: string;
  cardholder_name: string;
  provider: string;
  is_frozen: boolean;
  created_at: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(method: string, path: string, body?: any, isFormData = false): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 — auto logout
    if (res.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    // Handle file downloads (CSV)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
      const blob = await res.blob();
      return { blob, filename: this.extractFilename(res) } as any;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
    return data;
  }

  private extractFilename(res: Response): string {
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    return match ? match[1].replace(/['"]/g, '') : 'statement.csv';
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  getToken() { return this.token; }
  isAuthenticated() { return !!this.token; }

  // ─── AUTH ───
  auth = {
    register: async (data: {
      email: string; password: string; first_name: string; last_name: string;
      middle_name?: string; phone?: string; country?: string; country_code?: string;
      currency?: string; city?: string; address?: string; gender?: string;
      date_of_birth?: string; pin?: string;
    }) => {
      const res = await this.request<AuthResponse>('POST', '/auth/register', data);
      this.setToken(res.token);
      return res;
    },

    login: async (email: string, password: string) => {
      const res = await this.request<AuthResponse>('POST', '/auth/login', { email, password });
      this.setToken(res.token);
      return res;
    },

    logout: async () => {
      try { await this.request('POST', '/auth/logout'); } catch {}
      this.setToken(null);
    },

    me: () => this.request<AppUser>('GET', '/auth/me'),
    forgotPassword: (email: string) => this.request<{ success: boolean; message: string }>('POST', '/auth/forgot-password', { email }),
    resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
      this.request<{ success: boolean }>('POST', '/auth/reset-password', data),
    changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
      this.request<{ success: boolean }>('PUT', '/auth/change-password', data),
  };

  // ─── WALLET ───
  wallet = {
    get: () => this.request<any>('GET', '/wallet'),
    setPin: (pin: string, current_pin?: string) => this.request<{ success: boolean }>('POST', '/wallet/set-pin', { pin, current_pin }),
    verifyPin: (pin: string) => this.request<{ valid: boolean }>('POST', '/wallet/verify-pin', { pin }),
  };

  // ─── TRANSACTIONS ───
  transactions = {
    list: (params?: { limit?: number; page?: number; type?: string; status?: string; from_date?: string; to_date?: string }) => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.page) qs.set('page', String(params.page));
      if (params?.type) qs.set('type', params.type);
      if (params?.status) qs.set('status', params.status);
      if (params?.from_date) qs.set('from_date', params.from_date);
      if (params?.to_date) qs.set('to_date', params.to_date);
      return this.request<any>('GET', `/transactions?${qs.toString()}`);
    },

    transfer: (data: { recipient_wallet?: string; recipient_phone?: string; amount: number; pin: string; description?: string }) =>
      this.request<TransferResult>('POST', '/transactions/transfer', data),

    deposit: (data: { amount: number; method: 'card' | 'mpesa' | 'bank' }) =>
      this.request<any>('POST', '/transactions/deposit', data),

    withdraw: (data: { amount: number; method: string; destination: string; pin: string }) =>
      this.request<any>('POST', '/transactions/withdraw', data),

    exchange: (data: { amount: number; from_currency: string; to_currency: string }) =>
      this.request<any>('POST', '/transactions/exchange', data),
  };

  // ─── AIRTIME ───
  airtime = {
    purchase: (data: { amount: number; phone: string; network: 'Safaricom' | 'Airtel' | 'Telkom' }) =>
      this.request<any>('POST', '/airtime/purchase', data),
    networks: () => this.request<any[]>('GET', '/airtime/networks'),
  };

  // ─── M-PESA ───
  mpesa = {
    stkPush: (data: { phone: string; amount: number }) =>
      this.request<any>('POST', '/mpesa/stk-push', data),
    b2c: (data: { phone: string; amount: number; pin: string }) =>
      this.request<any>('POST', '/mpesa/b2c', data),
  };

  // ─── VIRTUAL CARD ───
  card = {
    get: () => this.request<{ has_card: boolean; card?: VirtualCardData }>('GET', '/card'),
    create: () => this.request<{ success: boolean; card: VirtualCardData }>('POST', '/card/create'),
    toggleFreeze: () => this.request<{ success: boolean; is_frozen: boolean }>('PUT', '/card/freeze'),
  };

  // ─── STATEMENTS ───
  statements = {
    preview: (from_date: string, to_date: string) =>
      this.request<any>('GET', `/statements/preview?from_date=${from_date}&to_date=${to_date}`),
    download: async (from_date: string, to_date: string, format: 'csv' | 'pdf' = 'csv') => {
      const result = await this.request<{ blob: Blob; filename: string }>('POST', '/statements/download', { from_date, to_date, format });
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return result;
    },
  };

  // ─── RECIPIENTS ───
  recipients = {
    lookup: (lookup_type: 'wallet' | 'phone', lookup_value: string) =>
      this.request<RecipientLookup>('POST', '/recipients/lookup', { lookup_type, lookup_value }),
  };

  // ─── NOTIFICATIONS ───
  notifications = {
    list: (params?: { unread_only?: boolean; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.unread_only) qs.set('unread_only', '1');
      if (params?.limit) qs.set('limit', String(params.limit));
      return this.request<{ notifications: any; unread_count: number }>('GET', `/notifications?${qs.toString()}`);
    },
    markRead: (id: string) => this.request<{ success: boolean }>('PUT', `/notifications/${id}/read`),
    markAllRead: () => this.request<{ success: boolean }>('PUT', '/notifications/read-all'),
  };

  // ─── PROFILE ───
  profile = {
    get: () => this.request<any>('GET', '/profile'),
    update: (data: Record<string, string>) => this.request<any>('PUT', '/profile', data),
    uploadKyc: (formData: FormData) => this.request<{ success: boolean; message: string }>('POST', '/profile/kyc', formData, true),
  };

  // ─── SUPPORT TICKETS ───
  support = {
    list: () => this.request<any[]>('GET', '/support-tickets'),
    create: (data: { subject: string; description: string; category?: string; priority?: string }) =>
      this.request<any>('POST', '/support-tickets', data),
    get: (id: string) => this.request<any>('GET', `/support-tickets/${id}`),
  };

  // ─── PUBLIC DATA ───
  exchangeRates = {
    list: () => this.request<any[]>('GET', '/exchange-rates'),
  };

  fees = {
    list: () => this.request<any[]>('GET', '/fees'),
  };

  // ─── ADMIN ───
  admin = {
    dashboard: () => this.request<any>('GET', '/admin/dashboard'),
    users: (params?: { search?: string; status?: string; kyc_status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set('search', params.search);
      if (params?.status) qs.set('status', params.status);
      if (params?.kyc_status) qs.set('kyc_status', params.kyc_status);
      return this.request<any[]>('GET', `/admin/users?${qs.toString()}`);
    },
    userDetail: (id: string) => this.request<any>('GET', `/admin/users/${id}`),
    updateUserStatus: (id: string, status: string) => this.request<any>('PUT', `/admin/users/${id}/status`, { status }),
    resetUserPassword: (id: string) => this.request<any>('POST', `/admin/users/${id}/reset-password`),
    resetUserPin: (id: string) => this.request<any>('POST', `/admin/users/${id}/reset-pin`),
    transactions: (params?: { status?: string; type?: string; search?: string; from_date?: string; to_date?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.type) qs.set('type', params.type);
      if (params?.search) qs.set('search', params.search);
      if (params?.from_date) qs.set('from_date', params.from_date);
      if (params?.to_date) qs.set('to_date', params.to_date);
      if (params?.limit) qs.set('limit', String(params.limit));
      return this.request<any>('GET', `/admin/transactions?${qs.toString()}`);
    },
    flagTransaction: (id: string) => this.request<any>('POST', `/admin/transactions/${id}/flag`),
    reverseTransaction: (id: string, reason: string) =>
      this.request<any>('POST', `/admin/transactions/${id}/reverse`, { reason }),
    withdrawals: (params?: { status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      return this.request<any>('GET', `/admin/withdrawals?${qs.toString()}`);
    },
    updateWithdrawal: (id: string, status: string, reason?: string) =>
      this.request<any>('PUT', `/admin/withdrawals/${id}`, { status, reason }),
    pendingKyc: () => this.request<any[]>('GET', '/admin/kyc'),
    updateKyc: (id: string, status: 'approved' | 'rejected', reason?: string) =>
      this.request<any>('PUT', `/admin/kyc/${id}`, { status, reason }),
    sendNotification: (data: { user_id: string; title: string; message: string; type?: string }) =>
      this.request<any>('POST', '/admin/notifications', data),
    sendBulkNotification: (data: { title: string; message: string; type?: string; filter?: string; country?: string }) =>
      this.request<any>('POST', '/admin/notifications/bulk', data),
    sendBulkSms: (data: { message: string; filter?: string; country?: string; phone_numbers?: string[] }) =>
      this.request<any>('POST', '/admin/sms/bulk', data),
    activityLogs: (params?: { action?: string; from_date?: string; to_date?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.action) qs.set('action', params.action);
      if (params?.from_date) qs.set('from_date', params.from_date);
      if (params?.to_date) qs.set('to_date', params.to_date);
      if (params?.limit) qs.set('limit', String(params.limit));
      return this.request<any>('GET', `/admin/logs?${qs.toString()}`);
    },
    securityAlerts: (params?: { resolved?: boolean; severity?: string }) => {
      const qs = new URLSearchParams();
      if (params?.resolved !== undefined) qs.set('resolved', params.resolved ? '1' : '0');
      if (params?.severity) qs.set('severity', params.severity);
      return this.request<any>('GET', `/admin/security-alerts?${qs.toString()}`);
    },
    resolveAlert: (id: string) => this.request<any>('PUT', `/admin/security-alerts/${id}`),
    supportTickets: (params?: { status?: string; priority?: string; category?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.priority) qs.set('priority', params.priority);
      if (params?.category) qs.set('category', params.category);
      return this.request<any>('GET', `/admin/support-tickets?${qs.toString()}`);
    },
    updateTicket: (id: string, status: string, comment?: string) =>
      this.request<any>('PUT', `/admin/support-tickets/${id}`, { status, comment }),

    // Super Admin
    exchangeRates: {
      list: () => this.request<any[]>('GET', '/admin/exchange-rates'),
      create: (data: any) => this.request<any>('POST', '/admin/exchange-rates', data),
      update: (id: string, data: any) => this.request<any>('PUT', `/admin/exchange-rates/${id}`, data),
      delete: (id: string) => this.request<any>('DELETE', `/admin/exchange-rates/${id}`),
    },
    fees: {
      list: () => this.request<any[]>('GET', '/admin/fees'),
      create: (data: any) => this.request<any>('POST', '/admin/fees', data),
      update: (id: string, data: any) => this.request<any>('PUT', `/admin/fees/${id}`, data),
    },
    paymentGateways: {
      list: () => this.request<any[]>('GET', '/admin/payment-gateways'),
      update: (id: string, data: any) => this.request<any>('PUT', `/admin/payment-gateways/${id}`, data),
    },
    platformConfig: {
      list: () => this.request<any[]>('GET', '/admin/platform-config'),
      update: (key: string, value: any) => this.request<any>('PUT', '/admin/platform-config', { key, value }),
    },
    roles: {
      get: (userId: string) => this.request<any[]>('GET', `/admin/roles/${userId}`),
      assign: (userId: string, role: string) => this.request<any>('POST', '/admin/roles', { user_id: userId, role }),
      remove: (id: string) => this.request<any>('DELETE', `/admin/roles/${id}`),
    },
    auditLogs: (params?: { action?: string; from_date?: string; to_date?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.action) qs.set('action', params.action);
      if (params?.from_date) qs.set('from_date', params.from_date);
      if (params?.to_date) qs.set('to_date', params.to_date);
      if (params?.limit) qs.set('limit', String(params.limit));
      return this.request<any>('GET', `/admin/audit-logs?${qs.toString()}`);
    },
  };
}

export const api = new ApiClient();
