# AbanRemit PHP (Laravel) Backend API

## Requirements
- PHP 8.1+
- Composer
- MySQL 8.0+ / PostgreSQL
- Redis (optional, for caching/queues)

## Setup

```bash
# 1. Install dependencies
composer install

# 2. Copy and configure environment
cp .env.example .env
php artisan key:generate

# 3. Configure database in .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_DATABASE=abanremit
# DB_USERNAME=root
# DB_PASSWORD=

# 4. Run migrations & seed
php artisan migrate
php artisan db:seed

# 5. Generate JWT secret
php artisan jwt:secret

# 6. Start server
php artisan serve
```

## cPanel Deployment
1. Upload all files to your cPanel `public_html` or a subdomain folder
2. Point the document root to `public/`
3. Create a MySQL database via cPanel and update `.env`
4. Run `php artisan migrate --seed` via SSH or cPanel terminal
5. Set storage symlink: `php artisan storage:link`

## API Base URL
All API endpoints are prefixed with `/api/v1/`

## Authentication
All protected endpoints require `Authorization: Bearer {token}` header.
Tokens are JWT, issued on login/register.

## API Endpoints

### Auth
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/logout` — Logout (invalidate token)
- `POST /api/v1/auth/forgot-password` — Send password reset email
- `POST /api/v1/auth/reset-password` — Reset password with token
- `GET  /api/v1/auth/me` — Get current user profile + wallet + roles

### Wallet
- `GET  /api/v1/wallet` — Get user wallet
- `POST /api/v1/wallet/set-pin` — Set/change wallet PIN
- `POST /api/v1/wallet/verify-pin` — Verify wallet PIN

### Transactions
- `GET  /api/v1/transactions` — List user transactions (paginated)
- `POST /api/v1/transactions/transfer` — Send money (wallet-to-wallet)
- `POST /api/v1/transactions/deposit` — Deposit/load wallet
- `POST /api/v1/transactions/withdraw` — Withdraw funds
- `POST /api/v1/transactions/airtime` — Buy airtime
- `POST /api/v1/transactions/exchange` — Currency exchange

### Recipients
- `POST /api/v1/recipients/lookup` — Lookup recipient by wallet/phone

### Notifications
- `GET  /api/v1/notifications` — List user notifications
- `PUT  /api/v1/notifications/{id}/read` — Mark as read

### Profile
- `GET  /api/v1/profile` — Get profile
- `PUT  /api/v1/profile` — Update profile
- `POST /api/v1/profile/kyc` — Upload KYC documents
- `PUT  /api/v1/auth/change-password` — Change password

### Exchange Rates (public)
- `GET  /api/v1/exchange-rates` — List active exchange rates

### Fee Config (public)
- `GET  /api/v1/fees` — List active fee configs

---

### Admin Endpoints (require admin/superadmin role)
- `GET  /api/v1/admin/dashboard` — Dashboard stats
- `GET  /api/v1/admin/users` — List all users
- `GET  /api/v1/admin/users/{id}` — User details
- `PUT  /api/v1/admin/users/{id}/status` — Suspend/freeze/activate
- `POST /api/v1/admin/users/{id}/reset-password` — Admin reset user password
- `POST /api/v1/admin/users/{id}/reset-pin` — Admin reset user PIN
- `GET  /api/v1/admin/transactions` — All transactions
- `POST /api/v1/admin/transactions/{id}/flag` — Flag transaction
- `POST /api/v1/admin/transactions/{id}/reverse` — Reverse transaction
- `GET  /api/v1/admin/withdrawals` — Pending withdrawals
- `PUT  /api/v1/admin/withdrawals/{id}` — Approve/reject withdrawal
- `GET  /api/v1/admin/kyc` — Pending KYC
- `PUT  /api/v1/admin/kyc/{id}` — Approve/reject KYC
- `GET  /api/v1/admin/notifications` — Send bulk notifications
- `POST /api/v1/admin/notifications` — Create notification
- `GET  /api/v1/admin/logs` — Activity logs
- `GET  /api/v1/admin/security-alerts` — Security alerts
- `PUT  /api/v1/admin/security-alerts/{id}` — Resolve alert
- `GET  /api/v1/admin/support-tickets` — Support tickets
- `PUT  /api/v1/admin/support-tickets/{id}` — Update ticket status

### Super Admin Endpoints (require superadmin role)
- `GET/POST/PUT/DELETE /api/v1/admin/exchange-rates` — Manage exchange rates
- `GET/POST/PUT /api/v1/admin/fees` — Manage fees
- `GET/POST/PUT /api/v1/admin/payment-gateways` — Manage payment gateways
- `GET/PUT /api/v1/admin/platform-config` — Platform settings
- `GET/POST/DELETE /api/v1/admin/roles` — Manage user roles
- `GET /api/v1/admin/audit-logs` — Full audit logs
