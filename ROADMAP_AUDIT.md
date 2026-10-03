# Medusa Remaining Features — Implementation Priority & Roadmap Audit

## Executive Summary & Architecture Overview

This report presents an evidence-based **Implementation Priority Plan and Execution Roadmap** for the remaining **29 features** of the **Depix E-commerce** workspace (`depix-ecommerce`).

The previous technical audit (`FEATURE_AUDIT.md`) evaluated 96 total features across the workspace, determining that **53 features (55.2%) are fully IMPLEMENTED**, **14 features (14.6%) are FRONTEND_ONLY / STOREFRONT**, and **29 features (30.2%) remain in active backlog**:
- 🟡 **1 × PARTIAL** (#76 Performance Optimization)
- 🟠 **8 × INTEGRATION_REQUIRED** (#24, #26, #27, #42, #63, #77, #78, #81)
- 🔴 **20 × NOT_IMPLEMENTED** (#29, #30, #36, #37, #40, #41, #45, #49, #50, #55, #60, #69, #73, #74, #79, #80, #83, #93, #94, #95)

### Summary of Remaining Work
- **Total Remaining Features:** 29 features
- **Actual Implementation Tasks (Custom Backend Code):** 18 features
- **Configuration Tasks Only:** 2 features (#76, #81)
- **Configuration / Medusa Native Usage:** 2 features (#36, #69)
- **External Integration Tasks:** 8 features (#24, #26, #27, #42, #63, #77, #78, #81)
- **Custom Backend Work:** 18 features
- **Custom Frontend Work:** 5 features (#29, #40, #73, #74, #80)
- **Infrastructure / Architectural Tasks:** 1 feature (#76)
- **Parallelizable Workstreams:** 23 features across 3 parallel tracks

---

# 1. Executive Summary

| Category | Count | Percentage of Backlog (29 Features) | Primary Technical Focus |
|---|---:|---:|---|
| **Configuration / Infrastructure** | 2 | 6.9% | Redis adapter in `medusa-config.ts`, Nginx edge cache, SMTP settings |
| **Native Medusa Usage** | 2 | 6.9% | Metadata configuration for Related Products (#36) & Product Video (#69) |
| **External Service Integrations** | 8 | 27.6% | Iranian SMS Gateway (Kavenegar), Payment Gateways (ZarinPal), Couriers |
| **Custom Backend Modules/Services** | 12 | 41.4% | Reviews, Invoices, Sales Reports, Back-in-Stock alerts, Profit/Margin |
| **Custom Frontend Components** | 5 | 17.2% | Compare Table, Product Schema JSON-LD, Article Schema JSON-LD, Notification Drawer |
| **TOTAL REMAINING BACKLOG** | **29** | **100.0%** | **Targeted execution from Phase 0 to Phase 5** |

---

# 2. Remaining Feature Breakdown

Every remaining feature has been audited against Medusa v2 modules, Payload CMS collections, and current repository source code to determine the exact nature of the required work.

### A. Configuration Only
1. **#81 اعلان ایمیلی (Email Notifications)** — `🟠 INTEGRATION_REQUIRED`
   - *Platform Capability:* Payload CMS natively supports `@payloadcms/email-nodemailer` and `@payloadcms/email-resend`.
   - *Work Required:* Set environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) in `.env`.

### B. Configuration / Infrastructure
2. **#76 بهینه‌سازی Performance (Performance Optimization)** — `🟡 PARTIAL`
   - *Platform Capability:* Redis and Nginx containers are running in `docker-compose.yml`.
   - *Work Required:* Configure application-level Redis cache adapter in `medusa-config.ts` and HTTP cache headers in `infrastructure/nginx/nginx.conf`.

### C. Medusa Native Usage (Zero Custom Database Logic)
3. **#36 محصولات مرتبط (Related Products)** — `🔴 NOT_IMPLEMENTED`
   - *Platform Capability:* Supported via Medusa product JSONB `metadata` field.
   - *Work Required:* Expose and populate `related_product_ids` array in `metadata` on Medusa Product API.
4. **#69 ویدئوی محصول (Product Video Support)** — `🔴 NOT_IMPLEMENTED`
   - *Platform Capability:* Supported via Medusa product JSONB `metadata` field.
   - *Work Required:* Store `video_url` in product `metadata` and expose on Store Product API response.

### D. External Service Integrations
5. **#42 ورود با OTP (SMS OTP Login)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Implement custom `AuthIdentityProvider` adapter for Iranian SMS gateway (e.g., Kavenegar).
6. **#77 پیامک OTP (SMS OTP Notification)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Develop custom Medusa Notification Provider plugin connecting to Iranian SMS Gateway API.
7. **#24 درگاه پرداخت (Payment Gateway - Single)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Configure ZarinPal merchant credentials and payment provider plugin in `medusa-config.ts`.
8. **#26 روش‌های ارسال (Shipping Methods)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Register local courier service provider plugins and configure shipping option profiles in Medusa Admin.
9. **#27 محاسبه هزینه ارسال (Shipping Cost Calculation)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Integrate live courier rate API adapter for dynamic shipping price quotes.
10. **#63 چند درگاه پرداخت (Multiple Payment Gateways)** — `🟠 INTEGRATION_REQUIRED`
    - *Work Required:* Register secondary Iranian payment providers (Mellat, Saman) in `medusa-config.ts`.
11. **#78 پیامک وضعیت سفارش (Order Status SMS)** — `🟠 INTEGRATION_REQUIRED`
    - *Work Required:* Create Medusa event subscribers listening to `order.placed`, `order.fulfilled`, `order.canceled` calling SMS provider API.

### E. Custom Backend Logic
12. **#29 نظرات محصولات (Product Reviews)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Create `ProductReviews` collection in Payload CMS or custom Medusa Reviews module.
13. **#30 امتیازدهی محصولات (Product Ratings)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build rating score aggregation service updating average rating on product records.
14. **#37 محصولات جدید / ویژه / پرفروش (Featured / Best Seller)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build background sales rank calculation cron/worker and tag logic.
15. **#41 علاقه‌مندی‌ها (Wishlist)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build Customer metadata JSONB wishlist storage or custom Medusa Wishlist module and API endpoints.
16. **#45 صدور فاکتور (Invoice Generation)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build Persian PDF invoice generator service with HTML template (`PDFKit`/`Puppeteer`).
17. **#49 تأیید / رد نظرات (Review Approval Workflow)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Implement status state machine (`pending`, `approved`, `rejected`) and moderation API.
18. **#50 پاسخ مدیر به نظر (Admin Reply to Reviews)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Add `admin_reply` field to review schema and expose on API response.
19. **#55 گزارش فروش (Sales Reporting)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build sales reporting service with date filtering and CSV exporter endpoint (`GET /admin/orders/export`).
20. **#60 نظرات مقالات (Blog Comments)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Create `BlogComments` collection in Payload CMS with public submission route and moderation.
21. **#79 اعلان موجودی محصول (Back in Stock Notification)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build stock alert subscription entity and inventory level update event subscriber.
22. **#95 گزارش سود (Profit & Margin Reporting)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Add `cogs` (cost of goods sold) price field to variant metadata and create profit margin calculation export service.
23. **#80 مرکز اعلان‌ها (Notification Center UI)** — `🔴 NOT_IMPLEMENTED` (Deferred)
    - *Work Required:* Build in-app notification entity and API drawer.
24. **#83 هشدار تغییر قیمت (Price Change Alert)** — `🔴 NOT_IMPLEMENTED` (Deferred)
    - *Work Required:* Build price watch subscription entity and price change event listener.
25. **#93 پیشنهاد محصول (Product Recommendation Engine)** — `🔴 NOT_IMPLEMENTED` (Deferred)
    - *Work Required:* Build co-purchased order analysis worker and recommendation service.
26. **#94 کیف پول (Customer Wallet System)** — `🔴 NOT_IMPLEMENTED` (Deferred)
    - *Work Required:* Build custom Medusa Wallet module, ledger entity, top-up API, and Wallet Payment Provider plugin.

### F. Custom Frontend Presentation Logic
27. **#40 مقایسه محصولات (Product Comparison)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build product comparison matrix table component and client-side comparison state manager.
28. **#73 Schema محصولات (Product JSON-LD Schema)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build Product `schema.org` JSON-LD script tag generator on Storefront PDP.
29. **#74 Schema مقالات (Article JSON-LD Schema)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build Article `schema.org` JSON-LD script tag generator on blog post page.

---

# 3. Priority Matrix

| ID | Feature Name | Current Status | Real Work Type | Priority | Business Impact (1-5) | Dependency (1-5) | Risk (1-5) | Effort (Days) | External Service | Can Parallelize | Phase |
|---|---|---|---|---|---:|---:|---:|---:|---|---|---|
| **76** | بهینه‌سازی Performance | 🟡 PARTIAL | CONFIG / ARCH | **P0** | 4 | 4 | 2 | 1.5 | None (Redis/Nginx) | Yes (Track A) | Phase 0 |
| **42** | ورود با OTP (SMS Login) | 🟠 INTEGRATION | EXT INT + CUSTOM | **P0** | 5 | 4 | 3 | 2.5 | Kavenegar SMS API | No (Critical Path) | Phase 1 |
| **77** | پیامک OTP Notification | 🟠 INTEGRATION | EXT INT + CUSTOM | **P0** | 5 | 4 | 3 | 2.0 | Kavenegar SMS API | Yes (Track B) | Phase 1 |
| **81** | اعلان ایمیلی (Email) | 🟠 INTEGRATION | CONFIGURATION | **P0** | 4 | 3 | 1 | 0.5 | SMTP Server / Resend | Yes (Track B) | Phase 1 |
| **24** | درگاه پرداخت (Payment) | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P1** | 5 | 5 | 3 | 2.0 | ZarinPal / Shaparak | No (Critical Path) | Phase 2 |
| **26** | روش‌های ارسال (Shipping) | 🟠 INTEGRATION | EXT INT / CONFIG | **P1** | 4 | 4 | 2 | 1.5 | Local Courier API | Yes (Track A) | Phase 2 |
| **27** | محاسبه هزینه ارسال | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P2** | 3 | 3 | 3 | 2.0 | Courier Rate API | Yes (Track A) | Phase 3 |
| **63** | چند درگاه پرداخت | 🟠 INTEGRATION | EXT INT / CONFIG | **P2** | 3 | 3 | 2 | 1.5 | Mellat / Saman Gateways | Yes (Track C) | Phase 3 |
| **78** | پیامک وضعیت سفارش | 🟠 INTEGRATION | EXT INT + CUSTOM | **P2** | 4 | 3 | 2 | 2.0 | Kavenegar SMS API | Yes (Track B) | Phase 3 |
| **29** | نظرات محصولات (Reviews) | 🔴 NOT_IMPL | CUSTOM BACKEND+FE | **P2** | 3 | 2 | 2 | 3.0 | None | Yes (Track A) | Phase 3 |
| **30** | امتیازدهی محصولات | 🔴 NOT_IMPL | CUSTOM BACKEND | **P2** | 3 | 2 | 2 | 1.5 | None | Yes (Track A) | Phase 3 |
| **37** | محصولات جدید / پرفروش | 🔴 NOT_IMPL | CUSTOM BACKEND | **P2** | 4 | 2 | 2 | 2.0 | None | Yes (Track B) | Phase 3 |
| **41** | علاقه‌مندی‌ها (Wishlist) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P2** | 3 | 2 | 2 | 2.0 | None | Yes (Track C) | Phase 3 |
| **45** | صدور فاکتور (Invoices) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P2** | 4 | 2 | 2 | 3.0 | None (PDFKit) | Yes (Track B) | Phase 3 |
| **49** | تأیید / رد نظرات | 🔴 NOT_IMPL | CUSTOM BACKEND | **P2** | 3 | 2 | 2 | 1.5 | None | Yes (Track A) | Phase 3 |
| **55** | گزارش فروش (Sales) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P2** | 4 | 2 | 2 | 2.5 | None | Yes (Track B) | Phase 3 |
| **73** | Schema محصولات JSON-LD | 🔴 NOT_IMPL | CUSTOM FRONTEND | **P2** | 3 | 1 | 1 | 1.0 | None (schema.org) | Yes (Track C) | Phase 3 |
| **74** | Schema مقالات JSON-LD | 🔴 NOT_IMPL | CUSTOM FRONTEND | **P2** | 3 | 1 | 1 | 1.0 | None (schema.org) | Yes (Track C) | Phase 3 |
| **36** | محصولات مرتبط | 🔴 NOT_IMPL | MEDUSA NATIVE USAGE | **P3** | 3 | 1 | 1 | 1.0 | None | Yes (Track A) | Phase 4 |
| **40** | مقایسه محصولات | 🔴 NOT_IMPL | CUSTOM FRONTEND | **P3** | 2 | 1 | 1 | 2.0 | None | Yes (Track B) | Phase 4 |
| **50** | پاسخ مدیر به نظر | 🔴 NOT_IMPL | CUSTOM BACKEND | **P3** | 2 | 2 | 1 | 1.0 | None | Yes (Track A) | Phase 4 |
| **60** | نظرات مقالات (Blog) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P3** | 2 | 2 | 2 | 2.0 | None | Yes (Track C) | Phase 4 |
| **69** | ویدئوی محصول | 🔴 NOT_IMPL | MEDUSA NATIVE USAGE | **P3** | 2 | 1 | 1 | 0.5 | None (Video URL) | Yes (Track A) | Phase 4 |
| **79** | اعلان موجودی کالا | 🔴 NOT_IMPL | CUSTOM BACKEND | **P3** | 3 | 3 | 2 | 3.0 | SMS / Email API | Yes (Track B) | Phase 4 |
| **95** | گزارش سود (Margin) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P3** | 3 | 2 | 2 | 2.0 | None | Yes (Track C) | Phase 4 |
| **80** | مرکز اعلان‌ها (In-App) | 🔴 NOT_IMPL | CUSTOM BACKEND+FE | **P4** | 2 | 2 | 2 | 3.5 | None | Deferred | Phase 5 |
| **83** | هشدار تغییر قیمت | 🔴 NOT_IMPL | CUSTOM BACKEND | **P4** | 2 | 3 | 2 | 2.5 | SMS / Email API | Deferred | Phase 5 |
| **93** | پیشنهاد محصول (ML) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P4** | 3 | 3 | 3 | 4.0 | None | Deferred | Phase 5 |
| **94** | کیف پول (Wallet) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P4** | 3 | 4 | 4 | 5.0 | Payment Gateway | Deferred | Phase 5 |

---

# 4. Dependency Graph

```text
[ Infrastructure & Caching (#76) ]
                 │
                 ▼
[ SMS Gateway Integration (#77) ] ──────► [ Email SMTP Config (#81) ]
                 │
                 ▼
[ Customer SMS OTP Auth (#42) ]
                 │
                 ├──────────────────────────────────────────┐
                 ▼                                          ▼
[ Primary Payment Gateway (#24) ]             [ Shipping Options (#26) ]
                 │                                          │
                 ├──────────────────┬───────────────────────┤
                 ▼                  ▼                       ▼
    [ Order Status SMS (#78) ]  [ Multi-Gateway (#63) ] [ Dynamic Courier Rates (#27) ]
                 │
                 ├──────────────────────────────────────────┐
                 ▼                                          ▼
   [ Invoice PDF Generation (#45) ]            [ Sales CSV Export (#55) ]
                                                            │
                                                            ▼
                                               [ Profit Margin Reports (#95) ]

─────────────────────────────────────────────────────────────────────────────
INDEPENDENT WORKSTREAMS:
  • CMS & Reviews: #29 (Product Reviews) ──► #30 (Ratings) & #49 (Moderation) ──► #50 (Admin Reply)
  • Catalog Utilities: #36 (Related Products), #69 (Product Video), #37 (Featured & Best Sellers)
  • Storefront Enhancements: #40 (Product Compare), #41 (Wishlist), #73 (Product Schema), #74 (Article Schema)
  • Blog Features: #60 (Blog Comments)
```

---

# 5. Critical Path

The absolute minimum sequence of technical dependencies required to reach a operational, production-ready commerce transaction lifecycle is:

```text
Step 1: #76 Performance Optimization (Redis Cache in medusa-config.ts & Nginx)
   ↓
Step 2: #77 SMS OTP Notification Provider (Iranian SMS Gateway Provider Plugin)
   ↓
Step 3: #42 Customer SMS OTP Auth (Custom AuthIdentityProvider Plugin)
   ↓
Step 4: #24 Primary Payment Gateway (ZarinPal Merchant Integration in medusa-config.ts)
   ↓
Step 5: #26 Shipping Methods (Courier Profiles & Regional Shipping Options)
   ↓
Step 6: #78 Order Status SMS Subscribers (Listening to order.placed / order.fulfilled)
   ↓
Step 7: #45 PDF Invoice Generation Service (GET /admin/orders/:id/invoice)
```

### Critical Path Milestones
- **First Major Blocker:** SMS Gateway Integration (#77 & #42). Customer registration/login cannot proceed in the Iranian market without SMS OTP authentication.
- **Core Commerce Path:** #42 (Auth) → #24 (Payment) → #26 (Shipping). Enables end-to-end checkout and order placement.
- **Highest-Risk Integration:** Primary Payment Gateway (#24) and SMS Auth Provider (#42) due to external network callbacks, verification handshakes, and failure state management.
- **Final Completion Dependencies:** Invoice Generation (#45) and Sales Reporting (#55) for accounting compliance.

---

# 6. Parallel Workstreams

To optimize development time, engineering work can be divided into three concurrent execution tracks once Phase 0 is complete.

```text
                          ┌── Track A (Logistics & CMS Reviews)
                          │    ├── #26 Shipping Methods
                          │    ├── #27 Dynamic Courier Rates
                          │    ├── #29 Product Reviews
                          │    ├── #30 Product Ratings
                          │    └── #49 Review Moderation
                          │
Phase 0 (Performance) ────┼── Track B (Core Transactions & Operations)
Phase 1 (SMS & Auth)      │    ├── #24 Primary Payment Gateway
                          │    ├── #78 Order Status SMS
                          │    ├── #37 Featured / Best Seller Job
                          │    ├── #45 PDF Invoice Generation
                          │    └── #55 Sales Reporting
                          │
                          └── Track C (Customer Profile & SEO)
                               ├── #81 Email SMTP Config
                               ├── #63 Multiple Payment Gateways
                               ├── #41 Customer Wishlist
                               ├── #73 Product Schema JSON-LD
                               └── #74 Article Schema JSON-LD
```

---

# 7. Implementation Phases

## Phase 0 — Preparation & Architectural Foundation
- **Features:** #76 (Performance Optimization)
- **Objective:** Establish production Redis caching adapter in `medusa-config.ts` and edge CDN caching headers in Nginx to support high API throughput.
- **Dependencies:** Workspace Docker infrastructure (`docker-compose.yml`, `infrastructure/nginx/nginx.conf`).
- **Estimated Effort:** 1.5 Engineering Days
- **Risk:** Low
- **Parallelizable:** Independent infrastructure task.
- **Exit Criteria:**
  - `medusa-config.ts` configures `redis_url` and cache module.
  - HTTP cache-control headers served correctly by Nginx reverse proxy.
  - API load tests demonstrate reduced database query counts.

---

## Phase 1 — Critical Dependencies & Authentication
- **Features:** #77 (SMS OTP Notification), #42 (SMS OTP Auth), #81 (Email Notifications)
- **Objective:** Enable customer registration, login, and transactional notifications via Iranian SMS gateway and SMTP.
- **Dependencies:** Phase 0 complete; Medusa Auth Module (`@medusajs/auth`) and Notification Module (`@medusajs/notification`).
- **Estimated Effort:** 4.5 Engineering Days
- **Risk:** Medium (Third-party API key dependency).
- **Parallelizable:** Track B (Notifications & Email) can run parallel to SMS Auth Provider plugin development.
- **Exit Criteria:**
  - SMS OTP code generated and delivered via Iranian SMS Gateway API.
  - `POST /store/auth/otp/verify` verifies code and returns JWT session token.
  - Transactional emails delivered via SMTP server settings.

---

## Phase 2 — Core Commerce Lifecycle
- **Features:** #24 (Single Payment Gateway), #26 (Shipping Methods)
- **Objective:** Complete the primary purchase lifecycle enabling customers to choose shipping and pay via Iranian payment gateway (ZarinPal).
- **Dependencies:** Phase 1 complete; Medusa Payment Module (`@medusajs/payment`) and Fulfillment Module (`@medusajs/fulfillment`).
- **Estimated Effort:** 3.5 Engineering Days
- **Risk:** Medium (Gateway callback & transaction verification).
- **Parallelizable:** Payment integration and Shipping option configuration can proceed in parallel.
- **Exit Criteria:**
  - Payment collection initialized and redirected to payment gateway URL.
  - Gateway callback verifies signature and marks payment collection as `captured`.
  - Admin shipping option profiles assigned to regional zones.

---

## Phase 3 — Operational Capabilities & Merchandising
- **Features:** #27, #63, #78, #29, #30, #37, #41, #45, #49, #55, #73, #74
- **Objective:** Provide store operations (Invoices, Sales Reports, SMS alerts) and core customer merchandising (Reviews, Ratings, Wishlist, SEO Schemas).
- **Dependencies:** Phase 2 complete.
- **Estimated Effort:** 24.5 Engineering Days
- **Risk:** Low to Medium.
- **Parallelizable:** High parallelization across Track A (CMS/Reviews), Track B (Operations/Invoices), Track C (SEO/Wishlist).
- **Exit Criteria:**
  - `GET /admin/orders/:id/invoice` streams generated Persian PDF.
  - Sales report CSV export functions with date filtering.
  - Customer review submission, moderation approval, and star rating aggregation function seamlessly.
  - JSON-LD script tags valid on PDP and blog posts according to `schema.org`.

---

## Phase 4 — Enhancements & Secondary Features
- **Features:** #36, #40, #50, #60, #69, #79, #95
- **Objective:** Deliver supplementary catalog tools (Related Products, Videos, Product Compare), Blog Comments, Back-in-Stock SMS alerts, and Profit/Margin reporting.
- **Dependencies:** Phase 3 complete.
- **Estimated Effort:** 12.5 Engineering Days
- **Risk:** Low.
- **Parallelizable:** Fully parallelizable across tracks.
- **Exit Criteria:**
  - Related product IDs and video URLs present on Store Product API.
  - Back-in-stock listener dispatches SMS when inventory item quantity > 0.
  - Profit margin report exports variant COGS vs selling prices.

---

## Phase 5 — Deferred / Optional Features
- **Features:** #80 (Notification Center UI), #83 (Price Change Alert), #93 (Product Recommendation Engine), #94 (Customer Wallet System)
- **Objective:** Advanced optional extensions deferred until verified business demand.
- **Dependencies:** Phases 0–4 complete.
- **Estimated Effort:** 15.0 Engineering Days
- **Risk:** High (Custom business logic complexity).
- **Parallelizable:** Deferred.
- **Exit Criteria:** Documented requirement specifications and dedicated sprint plan before initiation.

---

# 8. Integration Plan (For 8 🟠 Features)

| Feature | Provider / Service | Requirement | Credentials Required | Mock/Test Strategy | Dependency | Timing Classification |
|---|---|---|---|---|---|---|
| **#81 Email Notifications** | SMTP / Nodemailer | Transmit emails | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | `ethereal.email` / Mailtrap | Payload Email Adapter | `INTEGRATE_NOW` |
| **#77 SMS OTP Notification** | Kavenegar / Ghasedak | SMS Gateway API | `KAVENEGAR_API_KEY`, `SMS_SENDER_LINE` | Mock SMS logger class | Medusa Notification Module | `INTEGRATE_NOW` |
| **#42 SMS OTP Login** | Iranian SMS Gateway | SMS Auth Verification | `SMS_PROVIDER_KEY`, OTP Template ID | Memory OTP store mock | Feature #77 | `INTEGRATE_BEFORE_DEPENDENTS` |
| **#24 Payment Gateway (Single)** | ZarinPal / Shaparak | Payment Processing | `ZARINPAL_MERCHANT_ID`, Callback URL | ZarinPal Sandbox API | Medusa Payment Module | `INTEGRATE_BEFORE_DEPENDENTS` |
| **#26 Shipping Methods** | Local Courier / Post | Courier Shipping Options | Carrier API Key, Origin City ID | Flat-rate manual option | Medusa Fulfillment Module | `CAN_MOCK_TEMPORARILY` |
| **#27 Shipping Cost Calculation** | Courier Rate API | Dynamic Price Quotes | Courier API Credentials | Rule-based weight matrix | Feature #26 | `CAN_MOCK_TEMPORARILY` |
| **#63 Multiple Payment Gateways** | Mellat / Saman | Multi-Gateway Fallback | Secondary Merchant IDs | Secondary Gateway Mock | Feature #24 | `DEFER_INTEGRATION` |
| **#78 Order Status SMS** | Kavenegar / Ghasedak | Order Event SMS Alerts | SMS API Key, Event Template IDs | Event bus logger subscriber | Feature #77, Order Module | `DEFER_INTEGRATION` |

---

# 9. Effort Estimate

| Area | Minimum Realistic (Days) | Expected Effort (Days) | Conservative Effort (Days) |
|---|---:|---:|---:|
| **Backend (Custom Modules & Services)** | 22.0 | 27.5 | 37.0 |
| **Frontend (Storefront Components & Schemas)** | 6.0 | 8.0 | 11.0 |
| **Integrations (SMS, Payment, Couriers)** | 10.0 | 13.0 | 18.0 |
| **Infrastructure & Configuration** | 2.0 | 2.5 | 3.5 |
| **Testing, QA & Documentation** | 6.5 | 8.5 | 11.0 |
| **TOTAL ESTIMATED WORK** | **46.5** | **59.5** | **80.5** |

*Note: Estimates cover Phases 0 through 4 (Phase 5 deferred items excluded).*

---

# 10. Testing Plan

To maintain application reliability and avoid regressions across the monorepo workspace, every phase requires structured automated testing.

### Phase 0: Infrastructure & Caching
- **Tests Required:** HTTP caching header assertion tests in `infrastructure/nginx`.
- **Framework:** `curl` / HTTP integration scripts.

### Phase 1: Auth & Notifications
- **Tests Required:**
  - Unit tests for SMS OTP generator and expiration check.
  - Integration tests for `AuthIdentityProvider` subclassing `@medusajs/auth`.
  - Mocked HTTP tests for Kavenegar SMS API error responses.

### Phase 2: Payment & Checkout
- **Tests Required:**
  - Medusa integration test suite (`medusa/integration-tests`) simulating `POST /store/carts/:id/payment-collections`.
  - Payment callback webhook signature verification tests.
  - Idempotency tests ensuring double callbacks do not duplicate payment captures.

### Phase 3: Operational Capabilities & Merchandising
- **Tests Required:**
  - PDF Invoice generation buffer validation tests (`PDFKit`).
  - Sales report CSV formatting and date filter boundary tests.
  - Reviews moderation state transition tests (`pending` → `approved`).
  - W3C JSON-LD schema validity tests against `schema.org` validator.

### Phase 4: Enhancements
- **Tests Required:**
  - Back-in-stock event subscriber integration test asserting SMS API call when stock increases above 0.
  - Profit margin calculation unit tests comparing COGS vs item sale prices.

---

# 11. Explicitly Deferred

The following 4 features are **explicitly deferred** to Phase 5 and should NOT consume immediate engineering resources:

1. **#94 کیف پول (Customer Wallet System)**
   - *Why it can wait:* Store credit wallets add substantial ledger complexity and security risk. Core payment gateway transactions fulfill all initial purchasing requirements.
   - *Trigger for Implementation:* Verified business requirement for prepaid store balances or loyalty cash-back programs.
   - *Blocks anything:* Nothing.

2. **#93 پیشنهاد محصول (Product Recommendation Engine)**
   - *Why it can wait:* Requires significant historical purchase data volume to produce meaningful collaborative filtering results. Manual related products (#36) and category listings fulfill early catalog discovery needs.
   - *Trigger for Implementation:* Store achieves >1,000 monthly orders to feed recommendation algorithms.
   - *Blocks anything:* Nothing.

3. **#80 مرکز اعلان‌ها (Notification Center UI)**
   - *Why it can wait:* In-app notification drawers require duplicate state tracking. Direct SMS (#78) and Email (#81) notifications provide superior customer reach.
   - *Trigger for Implementation:* Mobile application launch or customer account dashboard overhaul.
   - *Blocks anything:* Nothing.

4. **#83 هشدار تغییر قیمت (Price Change Alert)**
   - *Why it can wait:* Low business conversion impact compared to Back-in-Stock alerts (#79) and promotional campaigns (#64).
   - *Trigger for Implementation:* Customer feature requests on storefront wishlist items.
   - *Blocks anything:* Nothing.

---

# 12. Final Recommended Execution Order

```text
 1. #76  بهینه‌سازی Performance            │ Priority: P0 │ Effort: 1.5d │ Why Now: Reduces DB load & stabilizes runtime before load testing │ Unblocks: Fast API response
 2. #81  اعلان ایمیلی (Email Config)       │ Priority: P0 │ Effort: 0.5d │ Why Now: Foundational SMTP transport needed for password resets   │ Unblocks: System emails
 3. #77  پیامک OTP Notification           │ Priority: P0 │ Effort: 2.0d │ Why Now: Core SMS dispatch service needed for authentication     │ Unblocks: #42 SMS Login
 4. #42  ورود با OTP (SMS OTP Login)       │ Priority: P0 │ Effort: 2.5d │ Why Now: Primary customer login method in Iranian market          │ Unblocks: Customer Auth
 5. #24  درگاه پرداخت (ZarinPal)           │ Priority: P1 │ Effort: 2.0d │ Why Now: Core transaction engine required for checkout            │ Unblocks: Order Placement
 6. #26  روش‌های ارسال (Shipping Options)   │ Priority: P1 │ Effort: 1.5d │ Why Now: Required step in cart checkout lifecycle                 │ Unblocks: Cart Completion
 7. #78  پیامک وضعیت سفارش (Order SMS)     │ Priority: P2 │ Effort: 2.0d │ Why Now: Essential customer communication on order updates        │ Unblocks: Order Tracking Alerts
 8. #27  محاسبه هزینه ارسال (Courier Rate) │ Priority: P2 │ Effort: 2.0d │ Why Now: Dynamic shipping costs based on weight/destination       │ Unblocks: Live shipping quotes
 9. #63  چند درگاه پرداخت (Multi-Gateway)  │ Priority: P2 │ Effort: 1.5d │ Why Now: Payment gateway fallback and redundancy                 │ Unblocks: Backup payment routes
10. #45  صدور فاکتور (PDF Invoices)        │ Priority: P2 │ Effort: 3.0d │ Why Now: Operational necessity for order fulfillment              │ Unblocks: Order PDF download
11. #55  گزارش فروش (Sales CSV Export)     │ Priority: P2 │ Effort: 2.5d │ Why Now: Core merchant financial reporting                        │ Unblocks: Merchant accounting
12. #29  نظرات محصولات (Product Reviews)  │ Priority: P2 │ Effort: 3.0d │ Why Now: Customer social proof and trust engine                   │ Unblocks: #30, #49, #50
13. #30  امتیازدهی محصولات (Ratings)      │ Priority: P2 │ Effort: 1.5d │ Why Now: Star ratings aggregate on catalog and PDP                │ Unblocks: Catalog rating filters
14. #49  تأیید / رد نظرات (Moderation)    │ Priority: P2 │ Effort: 1.5d │ Why Now: Prevents spam/unmoderated content publication             │ Unblocks: Moderated review feed
15. #37  محصولات جدید / پرفروش            │ Priority: P2 │ Effort: 2.0d │ Why Now: Merchandising collections on homepage and catalog        │ Unblocks: Sales-driven displays
16. #41  علاقه‌مندی‌ها (Customer Wishlist)  │ Priority: P2 │ Effort: 2.0d │ Why Now: Customer engagement and save-for-later functionality     │ Unblocks: Wishlist UI
17. #73  Schema محصولات JSON-LD           │ Priority: P2 │ Effort: 1.0d │ Why Now: Essential SEO rich snippet indexing for products        │ Unblocks: Google Rich Results
18. #74  Schema مقالات JSON-LD            │ Priority: P2 │ Effort: 1.0d │ Why Now: Essential SEO rich snippet indexing for blog articles    │ Unblocks: Article Rich Snippets
19. #36  محصولات مرتبط (Related Products)  │ Priority: P3 │ Effort: 1.0d │ Why Now: Simple metadata configuration for cross-selling         │ Unblocks: PDP cross-sell links
20. #69  ویدئوی محصول (Product Video)     │ Priority: P3 │ Effort: 0.5d │ Why Now: Simple metadata configuration for PDP media              │ Unblocks: PDP video player
21. #40  مقایسه محصولات (Product Compare) │ Priority: P3 │ Effort: 2.0d │ Why Now: Frontend comparison table for variant specifications     │ Unblocks: Compare drawer UI
22. #50  پاسخ مدیر به نظر (Admin Reply)    │ Priority: P3 │ Effort: 1.0d │ Why Now: Merchant interaction on customer product reviews         │ Unblocks: Admin reply thread
23. #60  نظرات مقالات (Blog Comments)      │ Priority: P3 │ Effort: 2.0d │ Why Now: Reader engagement on Payload CMS blog articles           │ Unblocks: Blog comment section
24. #79  اعلان موجودی کالا (Back in Stock)  │ Priority: P3 │ Effort: 3.0d │ Why Now: Recovers lost sales when out-of-stock items replenish    │ Unblocks: Back-in-stock SMS
25. #95  گزارش سود (Profit Margin Report) │ Priority: P3 │ Effort: 2.0d │ Why Now: Advanced merchant financial reporting (COGS vs Revenue)  │ Unblocks: Profit margin export
```

---

# 13. First 5 Implementation Tasks

The following five concrete engineering tasks should be initiated immediately to establish the core platform foundation:

### Task 1: Redis Application Caching Configuration
```text
Task: Configure application-level Redis cache adapter in medusa-config.ts and Nginx caching rules.
Reason: Required to complete Feature #76 (Performance Optimization) and ensure system stability under load.
Evidence: FEATURE_AUDIT.md Feature #76 (Status: PARTIAL). Redis container running on port 6379 in docker-compose.yml.
Dependencies: Redis container service in docker-compose.yml.
Expected Output: Updated medusa-config.ts with Redis cache module configuration and updated infrastructure/nginx/nginx.conf with cache-control headers.
Definition of Done:
  1. Redis cache adapter initialized in medusa/medusa-config.ts.
  2. Nginx proxy passes caching headers for static assets and API responses.
  3. API response times verified under 100ms for catalog endpoints.
Estimated Effort: 1.5 Engineering Days
```

### Task 2: Transactional Email SMTP Configuration
```text
Task: Configure SMTP server environment variables in .env and verify Payload email transport.
Reason: Fulfills Feature #81 (Email Notifications) and enables transactional emails.
Evidence: FEATURE_AUDIT.md Feature #81 (Status: INTEGRATION_REQUIRED). Payload email package @payloadcms/email-nodemailer present in workspace.
Dependencies: Task 1 complete; active SMTP credentials.
Expected Output: Updated .env.example and .env with SMTP configuration parameters.
Definition of Done:
  1. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS configured in .env.
  2. Test email dispatched successfully via POST /payload/api/email.
Estimated Effort: 0.5 Engineering Days
```

### Task 3: Iranian SMS Gateway Notification Provider Plugin
```text
Task: Develop custom Medusa Notification Provider plugin connecting to Iranian SMS Gateway API (Kavenegar).
Reason: Fulfills Feature #77 (SMS OTP Notification) and acts as the prerequisite for SMS OTP Login (#42).
Evidence: FEATURE_AUDIT.md Feature #77 (Status: INTEGRATION_REQUIRED). Medusa Notification Module active in medusa/packages/modules/notification.
Dependencies: Task 1 and Task 2 complete; Kavenegar API key.
Expected Output: Custom notification provider plugin under medusa/packages/medusa/src/providers/notification-kavenegar.
Definition of Done:
  1. Provider plugin registers with Medusa Notification Module.
  2. Outgoing SMS dispatched successfully to target mobile number via Kavenegar REST API.
  3. Unit test mocks SMS HTTP call and asserts request payload.
Estimated Effort: 2.0 Engineering Days
```

### Task 4: Customer SMS OTP Authentication Provider
```text
Task: Implement custom AuthIdentityProvider adapter for SMS OTP verification.
Reason: Fulfills Feature #42 (SMS OTP Login) enabling mobile number registration/login in Iran.
Evidence: FEATURE_AUDIT.md Feature #42 (Status: INTEGRATION_REQUIRED). Medusa Auth Module (@medusajs/auth) active in runtime.
Dependencies: Task 3 (SMS Notification Provider) complete.
Expected Output: Auth provider module exposing POST /store/auth/otp/send and POST /store/auth/otp/verify.
Definition of Done:
  1. OTP generation and 2-minute expiration logic active in Redis.
  2. Verified OTP returns valid Medusa Customer JWT token.
  3. Integration test verifies OTP lifecycle.
Estimated Effort: 2.5 Engineering Days
```

### Task 5: Primary Iranian Payment Gateway Integration (ZarinPal)
```text
Task: Register ZarinPal payment provider plugin and configure merchant ID in medusa-config.ts.
Reason: Fulfills Feature #24 (Payment Gateway) required for checkout completion.
Evidence: FEATURE_AUDIT.md Feature #24 (Status: INTEGRATION_REQUIRED). Medusa Payment Module (@medusajs/payment) active in application runtime.
Dependencies: Task 4 (Customer Auth) complete; ZarinPal Merchant ID.
Expected Output: ZarinPal payment provider registered in medusa-config.ts with callback verification route handler.
Definition of Done:
  1. Cart payment collection initializes ZarinPal payment session.
  2. Payment callback verifies transaction signature with ZarinPal API.
  3. Payment collection status transitions to CAPTURED upon successful payment.
Estimated Effort: 2.0 Engineering Days
```
