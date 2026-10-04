# Medusa Remaining Features — Implementation Priority & Roadmap Audit

## Executive Summary & Architecture Overview

This report presents an evidence-based **Implementation Priority Plan and Execution Roadmap** for the remaining **13 in-scope features** of the **Depix E-commerce** workspace (`depix-ecommerce`).

The technical audit (`FEATURE_AUDIT.md`) evaluated 96 total features across the workspace. With the frontend/storefront completely removed from project scope, 15 features are classified as **OUT_OF_SCOPE**. Of the **81 total in-scope backend/platform features**:
- 🟢 **68 features (84.0%) are fully IMPLEMENTED** (or provided natively by Medusa v2 / Payload CMS v4 runtimes, custom Medusa workspace modules, or configured infrastructure).
- 🟡 **1 feature (1.2%) is PARTIAL** (#76 Performance Optimization).
- 🟠 **8 features (9.9%) are INTEGRATION_REQUIRED** (#24, #26, #27, #42, #63, #77, #78, #81).
- 🔴 **4 features (4.9%) are NOT_IMPLEMENTED** (#80 Notification Center, #83 Price Change Alert, #94 Wallet, #95 Profit & Margin Reporting).

### Summary of Remaining Work
- **Total Remaining Backlog Features:** 13 features
- **Configuration / Infrastructure Tasks:** 2 features (#76, #81)
- **External Integration Tasks:** 7 features (#24, #26, #27, #42, #63, #77, #78)
- **Custom Backend Work:** 4 features (#80, #83, #94, #95)
- **Storefront / Frontend Work:** 0 features (Storefront presentation layer removed from project scope)
- **Parallelizable Workstreams:** 13 features across 3 parallel execution tracks

---

# 1. Executive Summary

| Category | Count | Percentage of Backlog (13 Features) | Primary Technical Focus |
|---|---:|---:|---|
| **Configuration / Infrastructure** | 2 | 15.4% | Application-level Redis cache adapter in `medusa-config.ts`, Nginx edge cache, SMTP settings |
| **External Service Integrations** | 7 | 53.8% | Iranian SMS Gateway (Kavenegar), Payment Gateways (ZarinPal, Mellat/Saman), Courier Rate APIs |
| **Custom Backend Modules/Services** | 4 | 30.8% | Customer In-App Notification Center, Price Change Alerts, Customer Wallet, Profit & Margin Reporting |
| **TOTAL REMAINING BACKLOG** | **13** | **100.0%** | **Targeted execution from Phase 0 to Phase 4** |

---

# 2. Remaining Feature Breakdown

Every remaining feature has been audited against Medusa v2 modules, Payload CMS collections, and current repository source code to determine the exact nature of the required work.

### A. Configuration & Infrastructure
1. **#76 بهینه‌سازی Performance (Performance Optimization)** — `🟡 PARTIAL`
   - *Platform Capability:* Redis and Nginx containers are running in `docker-compose.yml`.
   - *Work Required:* Configure application-level Redis cache adapter in `medusa-config.ts` and HTTP cache headers in `infrastructure/nginx/nginx.conf`.
2. **#81 اعلان ایمیلی (Email Notifications)** — `🟠 INTEGRATION_REQUIRED`
   - *Platform Capability:* Payload CMS natively supports `@payloadcms/email-nodemailer` and `@payloadcms/email-resend`.
   - *Work Required:* Set environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) in `.env`.

### B. External Service Integrations
3. **#77 پیامک OTP Notification (SMS OTP Notification)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Configure production credentials for Iranian SMS Gateway API (e.g., Kavenegar) in `notification-sms` provider module.
4. **#42 ورود با OTP (SMS OTP Login)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Configure SMS provider credentials for customer mobile login auth provider adapter (`POST /store/auth/otp/send` and `POST /store/auth/otp/verify`).
5. **#24 درگاه پرداخت (Payment Gateway - Single)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Configure ZarinPal merchant credentials and payment provider credentials in environment variables/config.
6. **#26 روش‌های ارسال (Shipping Methods)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Register local courier service options and carrier profiles in Medusa Admin.
7. **#27 محاسبه هزینه ارسال (Shipping Cost Calculation)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Integrate live courier rate calculation API adapter for dynamic shipping price quotes.
8. **#63 چند درگاه پرداخت (Multiple Payment Gateways)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Register secondary Iranian payment providers (Mellat, Saman) in `medusa-config.ts`.
9. **#78 پیامک وضعیت سفارش (Order Status SMS)** — `🟠 INTEGRATION_REQUIRED`
   - *Work Required:* Register event subscribers listening to `order.placed`, `order.fulfilled`, `order.canceled` calling SMS provider API.

### C. Custom Backend Logic
10. **#80 مرکز اعلان‌ها (In-App Notification Center)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build persistent customer in-app notification database model and Store API endpoints (`GET /store/notifications`, `POST /store/notifications/:id/read`).
11. **#83 هشدار تغییر قیمت (Price Change Alert)** — `🔴 NOT_IMPLEMENTED`
    - *Work Required:* Build price watch subscription model and pricing update event listener subscriber.
12. **#94 کیف پول (Customer Wallet System)** — `🔴 NOT_IMPLEMENTED` (Deferred)
    - *Work Required:* Build custom Medusa Wallet module, ledger balance model, top-up API, and Wallet Payment Provider plugin.
13. **#95 گزارش سود (Profit & Margin Reporting)** — `🔴 NOT_IMPLEMENTED` (Deferred)
    - *Work Required:* Add variant COGS cost price field and profit margin export report service.

---

# 3. Priority Matrix

| ID | Feature Name | Current Status | Real Work Type | Priority | Business Impact (1-5) | Dependency (1-5) | Risk (1-5) | Effort (Days) | External Service | Can Parallelize | Phase |
|---|---|---|---|---|---:|---:|---:|---:|---|---|---|
| **76** | بهینه‌سازی Performance | 🟡 PARTIAL | INFRASTRUCTURE | **P0** | 4 | 4 | 2 | 1.5 | None (Redis/Nginx) | Yes (Track A) | Phase 0 |
| **81** | اعلان ایمیلی (Email) | 🟠 INTEGRATION | CONFIGURATION | **P0** | 4 | 3 | 1 | 0.5 | SMTP Server / Resend | Yes (Track B) | Phase 1 |
| **77** | پیامک OTP Notification | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P0** | 5 | 4 | 3 | 2.0 | Kavenegar SMS API | Yes (Track B) | Phase 1 |
| **42** | ورود با OTP (SMS Login) | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P0** | 5 | 4 | 3 | 2.5 | Kavenegar SMS API | No (Critical Path) | Phase 1 |
| **24** | درگاه پرداخت (Payment) | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P1** | 5 | 5 | 3 | 2.0 | ZarinPal Gateway | No (Critical Path) | Phase 2 |
| **26** | روش‌های ارسال (Shipping) | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P1** | 4 | 4 | 2 | 1.5 | Local Courier API | Yes (Track A) | Phase 2 |
| **27** | محاسبه هزینه ارسال | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P2** | 3 | 3 | 3 | 2.0 | Courier Rate API | Yes (Track A) | Phase 3 |
| **63** | چند درگاه پرداخت | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P2** | 3 | 3 | 2 | 1.5 | Mellat / Saman Gateways | Yes (Track C) | Phase 3 |
| **78** | پیامک وضعیت سفارش | 🟠 INTEGRATION | EXTERNAL INTEGRATION | **P2** | 4 | 3 | 2 | 2.0 | Kavenegar SMS API | Yes (Track B) | Phase 3 |
| **80** | مرکز اعلان‌ها (In-App) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P3** | 2 | 2 | 2 | 3.5 | None | Yes (Track A) | Phase 4 |
| **83** | هشدار تغییر قیمت | 🔴 NOT_IMPL | CUSTOM BACKEND | **P3** | 2 | 3 | 2 | 2.5 | SMS / Email API | Yes (Track B) | Phase 4 |
| **94** | کیف پول (Wallet) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P4** | 3 | 4 | 4 | 5.0 | Payment Gateway | Deferred | Phase 4 |
| **95** | گزارش سود (Margin) | 🔴 NOT_IMPL | CUSTOM BACKEND | **P4** | 3 | 2 | 2 | 2.0 | None | Deferred | Phase 4 |

---

# 4. Dependency Graph

```text
[ Performance & Infrastructure Caching (#76) ]
                     │
                     ▼
  [ Transactional Email SMTP Config (#81) ] ──► [ SMS OTP Notification Provider (#77) ]
                                                            │
                                                            ▼
                                           [ Customer SMS OTP Auth (#42) ]
                                                            │
                                 ┌──────────────────────────┴──────────────────────────┐
                                 ▼                                                     ▼
              [ Primary Payment Gateway (#24) ]                        [ Shipping Options (#26) ]
                                 │                                                     │
               ┌─────────────────┴──────────────────┐                                  │
               ▼                                    ▼                                  ▼
[ Multi-Gateway Fallback (#63) ]       [ Order Status SMS (#78) ]        [ Dynamic Courier Rates (#27) ]
                                                    │
                                 ┌──────────────────┴──────────────────┐
                                 ▼                                     ▼
                [ In-App Notification Center (#80) ]         [ Price Change Alert (#83) ]
                                 │                                     │
                                 ▼                                     ▼
                  [ Customer Wallet System (#94) ]             [ Profit Margin Report (#95) ]
```

---

# 5. Critical Path

The absolute minimum sequence of technical dependencies required to achieve full production readiness for backend commerce operations:

```text
Step 1: #76 Performance Optimization (Redis Cache in medusa-config.ts & Nginx edge caching)
   ↓
Step 2: #81 Transactional Email Config & #77 SMS OTP Provider (Kavenegar Gateway Integration)
   ↓
Step 3: #42 Customer SMS OTP Auth (OTP send/verify endpoints)
   ↓
Step 4: #24 Primary Payment Gateway (ZarinPal Merchant integration)
   ↓
Step 5: #26 Shipping Methods (Regional Courier Profiles)
   ↓
Step 6: #78 Order Status SMS Subscribers & #27 Dynamic Courier Rates
```

### Critical Path Milestones
- **First Major Blocker:** SMS Gateway Integration (#77 & #42). Customer OTP verification is required for Iranian mobile authentication.
- **Core Commerce Path:** #42 (Auth) → #24 (Payment) → #26 (Shipping). Enables end-to-end checkout transactions.
- **Highest-Risk Integration:** Primary Payment Gateway (#24) and SMS Auth Provider (#42) due to third-party network verification callbacks and credentials.

---

# 6. Parallel Workstreams

To optimize development throughput, engineering work can be divided into three concurrent execution tracks:

```text
                          ┌── Track A (Infrastructure & Logistics)
                          │    ├── #76 Performance Optimization
                          │    ├── #26 Shipping Methods
                          │    ├── #27 Dynamic Courier Rates
                          │    └── #80 Customer In-App Notification Center
                          │
Phase 0 (Performance) ────┼── Track B (Auth, SMS & Notifications)
Phase 1 (SMS & Auth)      │    ├── #81 Transactional Email Config
                          │    ├── #77 SMS OTP Provider
                          │    ├── #42 Customer SMS OTP Auth
                          │    ├── #78 Order Status SMS
                          │    └── #83 Price Change Alert
                          │
                          └── Track C (Payment & Advanced Financials)
                               ├── #24 Primary Payment Gateway
                               ├── #63 Multiple Payment Gateways
                               ├── #95 Profit & Margin Reporting (Deferred)
                               └── #94 Customer Wallet System (Deferred)
```

---

# 7. Implementation Phases

## Phase 0 — Preparation & Architectural Foundation
- **Features:** #76 (Performance Optimization)
- **Objective:** Configure application-level Redis caching adapter in `medusa-config.ts` and HTTP edge caching headers in Nginx reverse proxy.
- **Dependencies:** Workspace Docker infrastructure (`docker-compose.yml`, `infrastructure/nginx/nginx.conf`).
- **Estimated Effort:** 1.5 Engineering Days
- **Risk:** Low
- **Exit Criteria:**
  - `medusa-config.ts` configures `redis_url` and cache module.
  - Cache-Control headers served correctly by Nginx proxy.

---

## Phase 1 — Critical Dependencies & Authentication
- **Features:** #81 (Email Notifications), #77 (SMS OTP Notification), #42 (SMS OTP Auth)
- **Objective:** Enable customer OTP registration, mobile authentication, and transactional email dispatches.
- **Dependencies:** Phase 0 complete; active SMS gateway & SMTP API keys.
- **Estimated Effort:** 5.0 Engineering Days
- **Risk:** Medium (Third-party API credentials).
- **Exit Criteria:**
  - SMS OTP dispatched and verified via `POST /store/auth/otp/verify`.
  - Transactional emails delivered via SMTP configuration.

---

## Phase 2 — Core Commerce Lifecycle
- **Features:** #24 (Single Payment Gateway), #26 (Shipping Methods)
- **Objective:** Complete core purchasing transaction flow via Iranian payment gateway (ZarinPal) and regional courier options.
- **Dependencies:** Phase 1 complete.
- **Estimated Effort:** 3.5 Engineering Days
- **Risk:** Medium (Payment gateway verification callback).
- **Exit Criteria:**
  - Payment session initialized and verified via ZarinPal callback.
  - Shipping options selectable per customer delivery address.

---

## Phase 3 — Operations & Secondary Integrations
- **Features:** #27 (Shipping Cost Calculation), #63 (Multiple Payment Gateways), #78 (Order Status SMS)
- **Objective:** Provide dynamic shipping calculation rates, payment gateway redundancy, and automated order state SMS notifications.
- **Dependencies:** Phase 2 complete.
- **Estimated Effort:** 5.5 Engineering Days
- **Risk:** Low to Medium.
- **Exit Criteria:**
  - Dynamic shipping cost rates calculated via courier API.
  - Secondary payment gateways available for payment sessions.
  - Order state updates (`placed`, `fulfilled`, `canceled`) trigger SMS alerts.

---

## Phase 4 — Custom Backend Work & Advanced Modules
- **Features:** #80 (Notification Center), #83 (Price Change Alert), #94 (Customer Wallet System), #95 (Profit & Margin Reporting)
- **Objective:** Build persistent customer in-app notification center, price drop alerts, and optional financial modules.
- **Dependencies:** Phase 3 complete.
- **Estimated Effort:** 13.0 Engineering Days
- **Risk:** Medium (Custom business logic).
- **Exit Criteria:**
  - Persistent customer in-app notification store and Store APIs operational.
  - Price watch subscriptions trigger notification event subscriber.
  - Customer Wallet module and Profit Margin reports ready for deployment when enabled.

---

# 8. Integration Plan (For 8 🟠 Features)

| Feature | Provider / Service | Requirement | Credentials Required | Mock/Test Strategy | Timing Classification |
|---|---|---|---|---|---|
| **#81 Email Notifications** | SMTP / Resend / Nodemailer | Transmit emails | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Mailtrap / Ethereal Email | `INTEGRATE_NOW` |
| **#77 SMS OTP Notification** | Kavenegar / Ghasedak | SMS Gateway API | `KAVENEGAR_API_KEY`, `SMS_SENDER_LINE` | Mock SMS logger class | `INTEGRATE_NOW` |
| **#42 SMS OTP Login** | Iranian SMS Gateway | SMS Auth Verification | `SMS_PROVIDER_KEY`, OTP Template ID | Memory OTP store mock | `INTEGRATE_BEFORE_DEPENDENTS` |
| **#24 Payment Gateway (Single)** | ZarinPal / Shaparak | Payment Processing | `ZARINPAL_MERCHANT_ID`, Callback URL | ZarinPal Sandbox API | `INTEGRATE_BEFORE_DEPENDENTS` |
| **#26 Shipping Methods** | Local Courier / Post | Courier Shipping Options | Carrier API Key, Origin City ID | Manual flat-rate profiles | `CAN_MOCK_TEMPORARILY` |
| **#27 Shipping Cost Calculation** | Courier Rate API | Dynamic Price Quotes | Courier API Credentials | Rule-based matrix | `CAN_MOCK_TEMPORARILY` |
| **#63 Multiple Payment Gateways** | Mellat / Saman | Multi-Gateway Fallback | Secondary Merchant IDs | Secondary Gateway Mock | `DEFER_INTEGRATION` |
| **#78 Order Status SMS** | Kavenegar / Ghasedak | Order Event SMS Alerts | SMS API Key, Event Template IDs | Event bus logger subscriber | `DEFER_INTEGRATION` |

---

# 9. Effort Estimate

| Area | Minimum Realistic (Days) | Expected Effort (Days) | Conservative Effort (Days) |
|---|---:|---:|---:|
| **Infrastructure & Configuration (#76, #81)** | 1.5 | 2.0 | 2.5 |
| **Integrations (#42, #77, #24, #26, #27, #63, #78)** | 10.0 | 13.0 | 17.0 |
| **Custom Backend Modules (#80, #83, #94, #95)** | 10.0 | 13.0 | 17.0 |
| **Testing, QA & Verification** | 3.5 | 5.0 | 7.0 |
| **TOTAL ESTIMATED WORK** | **25.0** | **33.0** | **43.5** |

---

# 10. Testing Plan

### Phase 0: Infrastructure & Caching
- **Tests Required:** Nginx reverse proxy cache header verification and Redis connection checks.
- **Command:** `docker compose exec depix-medusa yarn test` or `curl -I` proxy headers.

### Phase 1: Auth & Notifications
- **Tests Required:**
  - Unit tests for SMS OTP generator and Redis key expiration.
  - Integration tests for `POST /store/auth/otp/send` and `POST /store/auth/otp/verify`.
  - Mocked HTTP tests for Kavenegar SMS API dispatches.

### Phase 2: Payment & Checkout
- **Tests Required:**
  - Medusa payment collection integration test simulating `POST /store/payment-collections`.
  - ZarinPal payment callback verification signature handler tests.
  - Payment capture idempotency tests.

### Phase 3: Secondary Operations
- **Tests Required:**
  - Dynamic shipping cost calculation rule unit tests.
  - Event subscriber integration tests for `order.placed` and `order.fulfilled` triggering SMS provider handlers.

### Phase 4: Custom Backend Work
- **Tests Required:**
  - Customer notification entity CRUD and read-status flag unit/integration tests.
  - Price watch subscriber event trigger tests.

---

# 11. Explicitly Deferred

The following 2 features are **explicitly deferred** in Phase 4 until verified business demand:

1. **#94 کیف پول (Customer Wallet System)**
   - *Why it can wait:* Store credit wallets add substantial ledger complexity and security risk. Core payment gateway transactions (#24) fulfill initial purchasing requirements.
   - *Trigger for Implementation:* Business requirement for prepaid customer store balances or loyalty rewards.

2. **#95 گزارش سود (Profit & Margin Reporting)**
   - *Why it can wait:* Core sales reporting (#55) is already fully implemented. Variant COGS tracking and margin exports can be introduced when inventory accounting requirements scale.
   - *Trigger for Implementation:* Financial accounting request for automated COGS margin exports.

---

# 12. Final Recommended Execution Order

```text
 1. #76  بهینه‌سازی Performance            │ Priority: P0 │ Effort: 1.5d │ Why Now: Reduces DB load & stabilizes API performance  │ Unblocks: High-throughput API
 2. #81  اعلان ایمیلی (Email Config)       │ Priority: P0 │ Effort: 0.5d │ Why Now: Foundational SMTP transport for system emails │ Unblocks: Transactional emails
 3. #77  پیامک OTP Notification           │ Priority: P0 │ Effort: 2.0d │ Why Now: Core SMS dispatch service needed for OTP     │ Unblocks: #42 SMS Login
 4. #42  ورود با OTP (SMS OTP Login)       │ Priority: P0 │ Effort: 2.5d │ Why Now: Primary customer login method in Iranian market│ Unblocks: Customer Auth
 5. #24  درگاه پرداخت (ZarinPal)           │ Priority: P1 │ Effort: 2.0d │ Why Now: Core transaction engine required for checkout  │ Unblocks: Order Placement
 6. #26  روش‌های ارسال (Shipping Options)   │ Priority: P1 │ Effort: 1.5d │ Why Now: Required step in checkout lifecycle           │ Unblocks: Cart Completion
 7. #78  پیامک وضعیت سفارش (Order SMS)     │ Priority: P2 │ Effort: 2.0d │ Why Now: Essential customer order update alerts        │ Unblocks: Order tracking SMS
 8. #27  محاسبه هزینه ارسال (Courier Rate) │ Priority: P2 │ Effort: 2.0d │ Why Now: Dynamic shipping pricing based on destination  │ Unblocks: Live shipping quotes
 9. #63  چند درگاه پرداخت (Multi-Gateway)  │ Priority: P2 │ Effort: 1.5d │ Why Now: Payment gateway redundancy and fallback       │ Unblocks: Redundant payment
10. #80  مرکز اعلان‌ها (Notification Center) │ Priority: P3 │ Effort: 3.5d │ Why Now: Persistent customer in-app notification store  │ Unblocks: In-app alerts
11. #83  هشدار تغییر قیمت (Price Watch)    │ Priority: P3 │ Effort: 2.5d │ Why Now: Price drop watch subscriptions and alerts    │ Unblocks: Price alerts
12. #95  گزارش سود (Profit Margin Report) │ Priority: P4 │ Effort: 2.0d │ Why Now: Merchant financial reporting (COGS vs Revenue)│ Deferred
13. #94  کیف پول (Customer Wallet System)  │ Priority: P4 │ Effort: 5.0d │ Why Now: Customer wallet ledger and balance top-ups    │ Deferred
```

---

# 13. First 5 Implementation Tasks

The following five concrete engineering tasks should be initiated immediately:

### Task 1: Application Caching Configuration
```text
Task: Configure application-level Redis cache adapter in medusa-config.ts and Nginx caching rules.
Reason: Fulfills Feature #76 (Performance Optimization) and ensures system stability under load.
Evidence: FEATURE_AUDIT.md Feature #76 (Status: PARTIAL). Redis container running on port 6379 in docker-compose.yml.
Dependencies: Redis container service in docker-compose.yml.
Expected Output: Updated medusa-config.ts with Redis cache module configuration and updated infrastructure/nginx/nginx.conf with cache-control headers.
Definition of Done:
  1. Redis cache adapter initialized in medusa/medusa-config.ts.
  2. Nginx proxy passes caching headers for static assets and API responses.
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

### Task 3: Iranian SMS Gateway Notification Provider Configuration
```text
Task: Configure production API credentials for Iranian SMS Gateway (Kavenegar) in notification-sms provider module.
Reason: Fulfills Feature #77 (SMS OTP Notification) and acts as the prerequisite for SMS OTP Login (#42).
Evidence: FEATURE_AUDIT.md Feature #77 (Status: INTEGRATION_REQUIRED). Custom SMS provider module active in medusa/packages/modules/providers/notification-sms.
Dependencies: Task 1 and Task 2 complete; Kavenegar API key.
Expected Output: Provider module registered and configured with Kavenegar API credentials in environment variables.
Definition of Done:
  1. Provider plugin registers with Medusa Notification Module.
  2. Outgoing SMS dispatched successfully to target mobile number via Kavenegar REST API.
Estimated Effort: 2.0 Engineering Days
```

### Task 4: Customer SMS OTP Authentication Provider
```text
Task: Configure SMS provider credentials for customer mobile login auth provider adapter.
Reason: Fulfills Feature #42 (SMS OTP Login) enabling mobile number registration/login in Iran.
Evidence: FEATURE_AUDIT.md Feature #42 (Status: INTEGRATION_REQUIRED). Medusa Auth Module (@medusajs/auth) active in runtime.
Dependencies: Task 3 (SMS Notification Provider) complete.
Expected Output: Auth provider module exposing POST /store/auth/otp/send and POST /store/auth/otp/verify.
Definition of Done:
  1. OTP generation and 2-minute expiration logic active in Redis.
  2. Verified OTP returns valid Medusa Customer JWT token.
Estimated Effort: 2.5 Engineering Days
```

### Task 5: Primary Iranian Payment Gateway Integration (ZarinPal)
```text
Task: Configure ZarinPal merchant ID and payment provider credentials in medusa-config.ts.
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
