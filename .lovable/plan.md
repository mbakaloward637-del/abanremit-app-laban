

## Project Analysis

Your project is a fully migrated full-stack fintech application:

- **Frontend**: Vite + React 18 + TypeScript + Tailwind + shadcn/ui (PWA-enabled)
- **Backend**: Laravel 10 REST API with JWT auth, UUID models, atomic transactions
- **Target**: cPanel shared hosting on `abanremit.com` (same-domain architecture)
- **Services**: M-Pesa (Safaricom), Paystack, Instalipa (airtime), TalkSasa (SMS), ExchangeRate-API

All Supabase dependencies have been removed from active frontend code. The app is ready for production deployment.

---

## GitHub Copilot Prompt for VS Code

Open **GitHub Copilot Chat** in Visual Studio Code and paste this prompt:

```text
@workspace I need to deploy this full-stack app (React frontend + Laravel backend) to production on cPanel at abanremit.com.

Please review #file:php-backend/DEPLOYMENT.md and #file:.github/copilot-instructions.md for the full architecture and rules.

Walk me through deployment step-by-step, one at a time. Wait for my confirmation before proceeding to the next step.

Here's what I need help with:

### Step 1: Local Preparation
- Create `.env.production` with `VITE_API_BASE_URL=https://abanremit.com/api/v1`
- Build the React frontend: `npm run build`
- Verify the `dist/` output

### Step 2: Upload Laravel Backend
- Tell me exactly which files/folders from `php-backend/` to zip and upload to `/home/abancool/laravel/` via cPanel File Manager
- Exclude: `node_modules`, `.git`, `frontend-api-service/`, `deployment-files/`

### Step 3: Server Setup (SSH or cPanel Terminal)
- `cd /home/abancool/laravel && composer install --no-dev --optimize-autoloader`
- `php artisan key:generate`
- `php artisan jwt:secret`
- `chmod -R 755 storage bootstrap/cache`
- `php artisan storage:link`

### Step 4: Database
- `php artisan migrate`
- `php artisan db:seed`
- Confirm seeded super admin: admin@abanremit.com / Admin@123456

### Step 5: Symlink API
- `ln -s /home/abancool/laravel/public /home/abancool/public_html/api`

### Step 6: Upload React Frontend
- Upload contents of `dist/` to `public_html/` (DO NOT overwrite the `api` symlink)
- Copy `php-backend/deployment-files/public_html/.htaccess` to `public_html/.htaccess`

### Step 7: Cron Job
- Set up Laravel scheduler: `* * * * * cd /home/abancool/laravel && php artisan schedule:run >> /dev/null 2>&1`

### Step 8: Verification
- Test: `curl https://abanremit.com/api/v1/exchange-rates`
- Test: Visit https://abanremit.com (should show login page)
- Test: Login with seeded admin credentials

### Step 9: Webhooks
- Configure Paystack webhook: `https://abanremit.com/api/v1/webhooks/paystack`
- Configure M-Pesa C2B: `https://abanremit.com/api/v1/webhooks/mpesa/c2b`
- Configure M-Pesa B2C: `https://abanremit.com/api/v1/webhooks/mpesa/b2c`
- Configure Instalipa: `https://abanremit.com/api/v1/webhooks/airtime`

### Step 10: Security Checklist
- Change super admin password immediately after first login
- Confirm APP_DEBUG=false in .env
- Verify SSL is active
- Remove .env.example from production
- Set up log rotation for storage/logs/

IMPORTANT RULES:
- Never modify supabase/ files — they are legacy and unused
- The Notification model uses table name `notifications_custom`
- All foreign keys use UUID type, never bigint
- Transaction references: TRF, AIR, DEP, WDR, EXC, REV, MPD, MPW, STM
- M-Pesa amounts are integers (no decimals)
- Paystack amounts are in kobo (divide by 100)
- Webhook routes must stay OUTSIDE auth:api middleware

Let's start with Step 1. Tell me the exact commands to run.
```

