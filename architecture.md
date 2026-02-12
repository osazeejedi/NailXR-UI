# NailXR Architecture — Nigeria-First Platform

## Overview

NailXR is an **Infrastructure-as-a-Service (IaaS)** platform for the Nigerian nail beauty industry. Salon owners and independent nail technicians sign up, customise their brand, and get a fully-featured booking + virtual try-on platform — powered by NailXR under the hood.

**Business Model:** White-label SaaS — each salon/nail tech gets their own subdomain (e.g., `luxe.nailxr.com`) with custom branding, WhatsApp integration, and booking capabilities. NailXR provides the infrastructure; salons operate independently.

---

## Target Market

- **Primary:** Nigeria 🇳🇬
- **Currency:** Nigerian Naira (₦ / NGN)
- **Timezone:** Africa/Lagos (WAT, UTC+1)
- **Locale:** en-NG
- **Payment Provider:** Paystack (card, bank transfer, USSD, mobile money)
- **Communication:** WhatsApp (primary), Email (secondary)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Animations | Framer Motion |
| 3D Rendering | Three.js / React Three Fiber |
| AR/AI Pipeline | ONNX Runtime (browser) |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Payments | Paystack (NGN) |
| Hosting | Vercel |
| Communication | WhatsApp Click-to-Chat (v1) |

---

## Directory Structure

```
src/
├── ai/                          # AI/ML pipeline
│   ├── enhancement/             # Lighting enhancement
│   ├── inference/               # ONNX engine
│   ├── nail-detection/          # Nail segmentation
│   ├── preprocessing/           # Image preprocessing
│   ├── rendering/               # Nail overlay rendering
│   └── stabilization/           # Hand tracking stabilization
├── app/                         # Next.js App Router pages
│   ├── page.tsx                 # Homepage (Nigeria-focused)
│   ├── layout.tsx               # Root layout
│   ├── admin/                   # Admin dashboard
│   ├── api/
│   │   ├── onboarding/          # Onboarding API routes
│   │   │   ├── check-subdomain/
│   │   │   ├── create-application/
│   │   │   ├── provision-tenant/
│   │   │   ├── trial-status/
│   │   │   └── update-application/
│   │   └── webhooks/
│   │       ├── paystack/        # Paystack webhook handler (NGN)
│   │       └── stripe/          # Legacy (to be removed)
│   ├── onboarding/              # Salon onboarding wizard
│   │   ├── wizard/steps/
│   │   │   ├── BusinessInfo.tsx  # + State, Area, WhatsApp, Service Type
│   │   │   ├── BrandingSetup.tsx
│   │   │   ├── PricingPlan.tsx   # NGN pricing via Paystack
│   │   │   ├── SubdomainSelect.tsx
│   │   │   └── TrialConfirm.tsx
│   │   └── success/
│   ├── salon/dashboard/         # Salon owner dashboard
│   ├── saved-looks/             # User saved nail designs
│   ├── try-on/                  # AR virtual try-on
│   └── white-label-demo/        # Demo of white-label system
├── components/
│   ├── 3d/HandModel.tsx         # 3D hand with nail overlay
│   ├── ar/                      # AR components
│   │   ├── ARCamera.tsx
│   │   ├── ARDesignUploader.tsx
│   │   ├── ARMultiPreview.tsx
│   │   ├── ARNailOverlay.tsx
│   │   ├── ARPhotoMode.tsx
│   │   └── ARSegmentationOverlay.tsx
│   ├── auth/
│   │   ├── AuthModal.tsx
│   │   └── AuthProvider.tsx
│   ├── onboarding/
│   │   ├── OnboardingContext.tsx
│   │   └── StepIndicator.tsx
│   ├── BookingModal.tsx          # Salon + Home visit booking (NGN)
│   ├── Navigation.tsx
│   └── ThemeProvider.tsx
├── hooks/
│   └── useNailSegmentation.ts
└── lib/
    ├── ar-export.ts
    ├── database.ts
    ├── database.types.ts
    ├── inventory.ts
    ├── onboarding.ts             # Onboarding service (Paystack, NGN)
    ├── payment.ts                # Paystack integration (NGN/kobo)
    ├── performance.ts
    ├── revenue.ts
    ├── saved-looks.ts
    ├── storage.ts
    ├── subdomain.ts
    ├── supabase-admin.ts
    ├── supabase-client.ts
    ├── supabase-server.ts
    ├── supabase-typed.ts
    ├── supabase.ts
    ├── tenant.ts                 # Multi-tenant config + WhatsApp
    └── types.ts                  # DB types + Nigerian states/areas
```

---

## Core Architecture

### 1. Multi-Tenant / White-Label System

Each salon/nail tech is a **tenant** with:
- Custom subdomain (`*.nailxr.com`)
- Custom branding (logo, colours, fonts)
- Custom hero content
- WhatsApp integration (click-to-chat)
- Service type configuration (salon visits, home visits, or both)
- Location data (Nigerian state, area, landmark)

**Tenant Config** (`src/lib/tenant.ts`):
```typescript
interface TenantConfig {
  id, name, domain, subdomain
  branding: { logo, primaryColor, secondaryColor, ... }
  content: { heroTitle, heroSubtitle, tagline, ... }
  features: { virtualTryOn, savedLooks, salonBooking, homeVisits, ... }
  whatsapp: { enabled, phoneNumber, chatLinkMessage, ... }
  serviceType: 'salon_only' | 'home_only' | 'both'
  location: { state, area, address, landmark, homeVisitAreas, homeVisitFee }
  pricing: { commissionRate, setupFee, monthlyFee, tier }
  settings: { timezone: 'Africa/Lagos', currency: 'NGN', locale: 'en-NG' }
  social: { instagram, tiktok, ... }
}
```

### 2. Booking System

Supports **two visit types**:

| Type | Description |
|---|---|
| **Salon Visit** | Customer goes to the salon location |
| **Home Visit** | Nail tech goes to the customer — additional transport fee (₦) |

**Booking Flow:**
1. Customer browses salons/nail techs → selects one
2. Chooses visit type (salon or home)
3. Selects date & time
4. If home visit: provides address, area, landmark
5. Sees price breakdown (service + home visit fee)
6. Confirms booking
7. WhatsApp confirmation link generated → opens chat with salon

### 3. Payment System (Paystack)

- **Currency:** NGN (Nigerian Naira), stored in kobo internally
- **Provider:** Paystack (supports card, bank transfer, USSD, mobile money)
- **Subscription Plans:**

| Plan | Setup Fee | Monthly | Annual | Commission |
|---|---|---|---|---|
| Starter | ₦25,000 | ₦15,000 | ₦150,000 | 12% |
| Professional | ₦50,000 | ₦35,000 | ₦350,000 | 8.5% |
| Enterprise | ₦100,000 | ₦75,000 | ₦750,000 | 5% |

- **Trial:** 14 days free, no payment required upfront
- **Webhook Handler:** `/api/webhooks/paystack/` handles:
  - `charge.success` — payment confirmation
  - `subscription.create` / `subscription.disable` — subscription lifecycle
  - `invoice.payment_failed` — failed payment notifications
  - `transfer.success` / `transfer.failed` — salon payouts

### 4. WhatsApp Integration (v1 — Click-to-Chat)

Currently uses WhatsApp `wa.me` deep links (no Business API required):
- **Salon chat link:** Pre-fills message with salon greeting
- **Booking confirmation:** Pre-fills booking details (name, date, time, service, visit type)
- **Each salon sets their own WhatsApp number** during onboarding

Future: WhatsApp Business API for automated confirmations and reminders.

### 5. Onboarding Wizard

5-step wizard for salon/nail tech registration:

1. **Business Info** — Name, contact, email, phone, WhatsApp number, business type (salon/home service/both), state, area
2. **Branding** — Logo, colours, tagline, hero content
3. **Subdomain** — Choose `*.nailxr.com` subdomain
4. **Pricing Plan** — Select tier, billing cycle (monthly/annual in ₦)
5. **Confirmation** — Start 14-day free trial

### 6. AI/AR Virtual Try-On Pipeline

Browser-based AI nail visualization:
1. **Image Preprocessing** → normalize input
2. **Nail Detection** → ONNX-based segmentation
3. **Hand Stabilization** → smooth tracking
4. **Nail Rendering** → overlay selected design
5. **Lighting Enhancement** → realistic blending
6. **AR Camera** → real-time live preview

### 7. Database Schema (Supabase)

Key tables with Nigerian fields:

- **profiles** — user accounts (state, area)
- **salons** — salon/nail tech businesses (state, area, landmark, whatsapp_phone, service_type, home_visit_fee, home_visit_areas)
- **technicians** — individual nail techs (whatsapp_phone, does_home_visits, home_visit_areas)
- **bookings** — appointments (visit_type: salon/home, home_visit_fee, customer_address, customer_area, customer_landmark, payment_reference)
- **nail_colors** / **materials** — inventory (prices in NGN)
- **design_templates** — includes ankara & tribal categories
- **saved_looks** — user's saved nail designs
- **onboarding_applications** — salon registration flow
- **tenants** — provisioned multi-tenant configs

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Paystack (Nigeria)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=

# App Config
NEXT_PUBLIC_APP_URL=https://nailxr.com
TRIAL_DAYS=14
```

---

## Key Design Decisions

1. **Nigeria-first** — All currency in NGN, Nigerian states/areas, Africa/Lagos timezone, en-NG locale
2. **Paystack over Stripe** — Paystack is the dominant payment gateway in Nigeria; supports card, bank, USSD, bank transfer
3. **WhatsApp-first communication** — WhatsApp is the primary messaging platform in Nigeria; click-to-chat v1 requires zero setup from salons
4. **Home visit support** — Many Nigerian nail techs operate mobile/home service businesses; booking system supports both salon and home visits with configurable transport fees
5. **Infrastructure-as-a-Service model** — Salons set up their own WhatsApp, manage their own bookings; NailXR provides the platform infrastructure
6. **Browser-based AI** — ONNX Runtime runs entirely in-browser, no server GPU costs
7. **Multi-tenant SaaS** — Each salon gets branded subdomain with isolated config

---

## Revenue Model

1. **Subscription fees** — Monthly/annual tiers in NGN via Paystack
2. **Setup fees** — One-time onboarding fee per tier
3. **Booking commission** — Percentage of each booking (5-12% depending on tier)
4. **Future: Premium features** — API access, custom domains, advanced analytics
