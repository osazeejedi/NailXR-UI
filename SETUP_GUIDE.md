# NailXR White-Label Onboarding System - Setup Guide

This guide will walk you through setting up all external services required for the self-service onboarding system with free trials.

---

## Table of Contents
1. [Database Setup (Supabase)](#1-database-setup-supabase)
2. [Stripe Setup](#2-stripe-setup)
3. [SendGrid Setup](#3-sendgrid-setup)
4. [Environment Configuration](#4-environment-configuration)
5. [DNS Configuration](#5-dns-configuration)
6. [Testing](#6-testing)

---

## 1. Database Setup (Supabase)

### Run the Migration

1. **Access Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Run SQL Migration**
   - Navigate to SQL Editor (left sidebar)
   - Click "New Query"
   - Copy the contents of `supabase/migrations/001_onboarding_system.sql`
   - Paste and click "Run"
   - Wait for completion message

3. **Verify Tables Created**
   ```sql
   -- Run this query to verify:
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'tenants', 
     'onboarding_applications', 
     'subdomain_reservations',
     'tenant_payments',
     'payment_transactions',
     'trial_notifications',
     'tenant_users',
     'tenant_analytics'
   );
   ```

---

## 2. Stripe Setup

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Sign up for a new account
3. Complete business verification (required for live mode later)

### Step 2: Enable Test Mode

1. In Stripe Dashboard, toggle "Test mode" ON (top right)
2. This allows testing without real payments

### Step 3: Create Products & Prices

**For Starter Plan:**
```
Product Name: NailXR White-Label - Starter
Description: Starter tier white-label platform access

Prices to create:
1. Setup Fee (One-time): $199
2. Monthly Subscription: $49/month
3. Annual Subscription: $490/year
```

**For Professional Plan:**
```
Product Name: NailXR White-Label - Professional
Description: Professional tier white-label platform access

Prices to create:
1. Setup Fee (One-time): $499
2. Monthly Subscription: $99/month
3. Annual Subscription: $990/year
```

**For Enterprise Plan:**
```
Product Name: NailXR White-Label - Enterprise
Description: Enterprise tier white-label platform access

Prices to create:
1. Setup Fee (One-time): $999
2. Monthly Subscription: $199/month
3. Annual Subscription: $1,990/year
```

### Step 4: Configure Trial Settings

For each subscription price:
1. Click on the price
2. Scroll to "Trial period"
3. Set: **14 days**
4. Save

### Step 5: Get API Keys

1. Navigate to Developers → API keys
2. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
3. Save these for environment variables

### Step 6: Set Up Webhooks

1. Navigate to Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

### Step 7: Configure Customer Portal

1. Navigate to Settings → Customer portal
2. Enable features:
   - ✅ Cancel subscription
   - ✅ Update payment method
   - ✅ View invoices
3. Save

---

## 3. SendGrid Setup

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up for free account (40,000 emails/month for 30 days, then 100/day)
3. Or upgrade to paid plan for higher limits

### Step 2: Verify Sender Identity

**Option A: Single Sender Verification (Quick)**
1. Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter:
   - From Name: `NailXR Team`
   - From Email: `noreply@your-domain.com`
   - Reply To: `support@your-domain.com`
4. Verify email address

**Option B: Domain Authentication (Recommended for Production)**
1. Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Enter your domain (e.g., `nailxr.com`)
4. Add DNS records provided by SendGrid to your DNS:
   ```
   Type: CNAME
   Host: em1234.nailxr.com
   Value: [provided by SendGrid]
   
   Type: CNAME
   Host: s1._domainkey.nailxr.com
   Value: [provided by SendGrid]
   
   Type: CNAME
   Host: s2._domainkey.nailxr.com
   Value: [provided by SendGrid]
   ```
5. Wait for verification (can take up to 48 hours)

### Step 3: Create API Key

1. Settings → API Keys
2. Click "Create API Key"
3. Name: `NailXR Onboarding`
4. Permissions: **Full Access** (or restrict to Mail Send only)
5. Copy the API key (starts with `SG.`)
6. Save securely - you won't see it again!

### Step 4: Create Email Templates

Navigate to Email API → Dynamic Templates and create these templates:

**1. Welcome Email** (ID: `d-welcome123`)
```html
Subject: Welcome to {{business_name}} - Powered by NailXR!

Hi {{contact_name}},

Welcome to your new white-label nail visualization platform! 🎨

Your Platform Details:
- Business Name: {{business_name}}
- Subdomain: {{subdomain}}.nailxr.com
- Trial Period: 14 days (ends {{trial_end_date}})

Getting Started:
1. Login at: {{platform_url}}
2. Email: {{email}}
3. Temporary Password: {{temp_password}}

Your free trial includes:
✅ Virtual Try-On Technology
✅ {{saved_looks_limit}} Saved Looks
✅ Custom Branding
✅ Full Analytics Dashboard

Need help? Reply to this email or visit our support center.

Best regards,
The NailXR Team
```

**2. Trial Reminder** (ID: `d-trial-reminder123`)
```html
Subject: {{business_name}} - Your trial ends in {{days_remaining}} days

Hi {{contact_name}},

Just a friendly reminder that your free trial ends in {{days_remaining}} days.

To continue enjoying your white-label platform:
→ Add payment method: {{billing_url}}

Questions? We're here to help!

Best regards,
The NailXR Team
```

**3. Trial Ending** (ID: `d-trial-ending123`)
```html
Subject: Final reminder: {{business_name}} trial ends tomorrow

Hi {{contact_name}},

Your trial ends tomorrow at {{trial_end_time}}.

To avoid service interruption:
→ Add payment: {{billing_url}}

Your platform stats during trial:
- Total Visitors: {{total_visitors}}
- Try-On Sessions: {{tryon_sessions}}
- Saved Looks: {{saved_looks}}

Keep the momentum going!

Best regards,
The NailXR Team
```

**4. Trial Converted** (ID: `d-trial-converted123`)
```html
Subject: Thank you! Your {{business_name}} platform is now active

Hi {{contact_name}},

🎉 Your platform is now fully activated!

Subscription Details:
- Plan: {{plan_tier}}
- Monthly Fee: ${{monthly_fee}}
- Next Billing: {{next_billing_date}}

Thank you for choosing NailXR!

Best regards,
The NailXR Team
```

---

## 4. Environment Configuration

Create/update `.env.local` file in your project root:

```bash
# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # From Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_... # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe Webhooks

# SendGrid Configuration
SENDGRID_API_KEY=SG.... # From SendGrid
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=NailXR Team

# SendGrid Template IDs (from templates you created)
SENDGRID_TEMPLATE_WELCOME=d-welcome123
SENDGRID_TEMPLATE_TRIAL_REMINDER=d-trial-reminder123
SENDGRID_TEMPLATE_TRIAL_ENDING=d-trial-ending123
SENDGRID_TEMPLATE_TRIAL_CONVERTED=d-trial-converted123

# Trial Configuration
TRIAL_DAYS=14
TRIAL_GRACE_DAYS=3

# Application URLs
NEXT_PUBLIC_APP_URL=https://nailxr.com
NEXT_PUBLIC_BASE_DOMAIN=nailxr.com

# Feature Flags
ENABLE_ONBOARDING=true
ENABLE_FREE_TRIALS=true
```

---

## 5. DNS Configuration

### Wildcard Subdomain Setup

**If using Cloudflare:**
1. Login to Cloudflare Dashboard
2. Select your domain
3. Go to DNS → Records
4. Add new record:
   ```
   Type: CNAME
   Name: *
   Target: your-server.com (or your hosting provider)
   Proxy: Enabled (orange cloud)
   ```

**If using other DNS providers:**
1. Login to your DNS provider
2. Add wildcard A record:
   ```
   Type: A
   Name: *
   Value: Your server IP address
   TTL: Auto or 3600
   ```

### SSL Certificate

**Option A: Cloudflare (Automatic)**
- SSL/TLS mode: Full (recommended) or Flexible
- Wildcard certificates handled automatically

**Option B: Let's Encrypt**
```bash
# Install certbot
sudo apt-get install certbot

# Get wildcard certificate
sudo certbot certonly --manual --preferred-challenges dns -d "*.nailxr.com" -d "nailxr.com"
```

---

## 6. Testing

### Test Database Connection

```bash
# In your terminal
npm run dev
```

Visit: http://localhost:3000

### Test Stripe Integration

1. Use Stripe test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date (e.g., 12/25)
   - Any 3-digit CVV

2. Test webhook locally:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test SendGrid Emails

Create a test script `test-email.ts`:

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const msg = {
  to: 'your-email@example.com',
  from: 'noreply@your-domain.com',
  subject: 'Test Email',
  text: 'This is a test email from NailXR onboarding system',
}

sgMail.send(msg).then(() => {
  console.log('Email sent successfully!')
}).catch((error) => {
  console.error('Email error:', error)
})
```

Run: `ts-node test-email.ts`

---

## Post-Setup Checklist

- [ ] Supabase migration completed successfully
- [ ] All 8 tables visible in Supabase dashboard
- [ ] Stripe test mode enabled
- [ ] Stripe products and prices created
- [ ] Stripe webhook endpoint configured
- [ ] SendGrid sender verified
- [ ] SendGrid API key created
- [ ] Email templates created
- [ ] `.env.local` file configured with all keys
- [ ] DNS wildcard subdomain configured
- [ ] SSL certificate active
- [ ] Test payment successful
- [ ] Test email received

---

## Troubleshooting

### Stripe Issues

**Webhook not receiving events:**
- Check webhook URL is publicly accessible
- Verify webhook secret matches `.env.local`
- Use Stripe CLI to test locally
- Check Stripe Dashboard → Developers → Webhooks for errors

**Payment not processing:**
- Ensure test mode is enabled
- Use test card numbers only
- Check API key (should start with `pk_test_` and `sk_test_`)

### SendGrid Issues

**Emails not sending:**
- Verify sender email is authenticated
- Check API key permissions (needs Mail Send)
- Look for errors in SendGrid Activity Feed
- Verify template IDs match `.env.local`

**Emails going to spam:**
- Complete domain authentication (not just single sender)
- Add SPF and DKIM records
- Warm up sending with gradually increasing volume

### Database Issues

**Tables not created:**
- Check for SQL syntax errors in migration
- Ensure you have proper permissions in Supabase
- Run migration in SQL Editor, not via CLI

**RLS preventing access:**
- Temporarily disable RLS for testing
- Check policies match your auth setup
- Use service role key for admin operations

---

## Production Checklist

Before going live:

- [ ] Switch Stripe to live mode
- [ ] Update Stripe API keys to live (`pk_live_`, `sk_live_`)
- [ ] Update webhook URL to production domain
- [ ] Move SendGrid from free tier to paid plan (if needed)
- [ ] Complete domain authentication for SendGrid
- [ ] Update `.env` (not `.env.local`) on production server
- [ ] Enable SSL certificate for production domain
- [ ] Test full onboarding flow on production
- [ ] Set up monitoring and alerts
- [ ] Add error tracking (Sentry, etc.)
- [ ] Configure backup strategy for database
- [ ] Set up rate limiting on API endpoints
- [ ] Review and update privacy policy
- [ ] Review and update terms of service

---

## Support

For issues or questions:
- Email: support@nailxr.com
- Documentation: https://docs.nailxr.com
- GitHub Issues: https://github.com/nailxr/nailxr-ui/issues

---

**Next Step:** After completing this setup, proceed to implement the onboarding wizard UI and API endpoints.
