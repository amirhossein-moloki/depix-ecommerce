# Depix E-commerce
# Complete Technical Audit & Project Audit Report

## Executive Summary

This document presents a comprehensive, evidence-based **Full Technical Audit** for the **Depix E-commerce** workspace (`depix-ecommerce`). The repository is structured as a monorepo containing two core framework codebases and shared infrastructure:
1. **`medusa/`**: Medusa v2 framework source repository operating as the E-commerce Backend engine.
2. **`payload/`**: Payload CMS v4 framework source repository operating as the Content Backend / CMS / Admin engine.
3. **`infrastructure/`**: Centralized Docker configurations, Nginx reverse proxy configuration (`infrastructure/nginx/nginx.conf`), and orchestration files.

### Audit Principles & Framework vs Project Distinction
- **Source-Code Verified Audit:** Every status assignment is strictly backed by actual repository source files, module configurations, database models, routes, and package configurations in this workspace.
- **Framework Capability vs Project Integration:** Capabilities provided natively by framework packages in `medusa/packages/*` or `payload/packages/*` that are **not** configured, integrated, or deployed within a project application flow in this workspace are classified as `🔵 NATIVE_AVAILABLE` with **0% project implementation**.
- **No False Positives:** Package presence in `node_modules` or monorepo source trees does NOT constitute project implementation. Features are only marked `🟢 IMPLEMENTED` if actually integrated, configured, wired to data models/APIs, and deployable in this project.

---

## Overall Status Summary

| Status Category | Symbol | Count | Percentage of Total (96 Features) |
|---|:---:|---:|---:|
| **IMPLEMENTED** | 🟢 | 0 | 0.0% |
| **PARTIAL** | 🟡 | 0 | 0.0% |
| **NATIVE_AVAILABLE** | 🔵 | 56 | 58.3% |
| **INTEGRATION_REQUIRED** | 🟠 | 6 | 6.3% |
| **NOT_IMPLEMENTED** | 🔴 | 20 | 20.8% |
| **FRONTEND_ONLY / STOREFRONT** | ⚪ | 14 | 14.6% |
| **TOTAL** | | **96** | **100.0%** |

---

## Scores

### A. Actual Project Implementation Score
$$\text{Actual Completion} = \frac{\text{IMPLEMENTED} + (0.5 \times \text{PARTIAL})}{\text{Total Features}} = \frac{0 + 0}{96} = 0.0\%$$

*The workspace repository contains framework source trees (`medusa/` and `payload/`) and central infrastructure (`docker-compose.yml`, `infrastructure/nginx/nginx.conf`), but zero custom application business logic or storefront app implemented.*

### B. Platform Coverage Score
$$\text{Platform Coverage} = \frac{\text{IMPLEMENTED} + \text{PARTIAL} + \text{NATIVE_AVAILABLE} + \text{INTEGRATION_REQUIRED}}{\text{Total Features}} = \frac{0 + 0 + 56 + 6}{96} = 64.6\%$$

*Combining native Medusa v2 and Payload CMS v4 capabilities with required external integrations provides 64.6% platform coverage ready to be activated.*

---

## Feature Matrix by Category

| Category | Total | 🟢 Implemented | 🟡 Partial | 🔵 Native Available | 🟠 Integration Required | 🔴 Not Implemented | ⚪ Frontend Only |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Storefront / Content** | 12 | 0 | 0 | 0 | 0 | 0 | 12 |
| **Admin / Product Management** | 8 | 0 | 0 | 6 | 0 | 0 | 2 |
| **Commerce** | 30 | 0 | 0 | 19 | 2 | 9 | 0 |
| **Admin / Reporting** | 5 | 0 | 0 | 4 | 0 | 1 | 0 |
| **Blog / CMS** | 6 | 0 | 0 | 5 | 0 | 1 | 0 |
| **SEO** | 15 | 0 | 0 | 11 | 1 | 3 | 0 |
| **Notifications** | 8 | 0 | 0 | 2 | 3 | 3 | 0 |
| **Reports / Infrastructure / Advanced** | 12 | 0 | 0 | 9 | 0 | 3 | 0 |
| **TOTAL** | **96** | **0** | **0** | **56** | **6** | **20** | **14** |

---

## Detailed Feature Audit

## 1. Storefront / Content

### 1. صفحه اصلی (Home Page)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront application directory present in workspace root.
**What exists:** Nginx reverse proxy configuration in `infrastructure/nginx/nginx.conf` proxies `/` route.
**What is missing:** Complete Storefront frontend web application (e.g., Next.js / Remix / Nuxt).

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront application directory present in workspace root.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront frontend package / repository. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Complete Storefront frontend web application (e.g., Next.js / Remix / Nuxt).)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront frontend package / repository.
**Required Work:** Build Next.js storefront application and connect to Medusa Store API and Payload CMS API.
**Conclusion:** Feature represents frontend UI only.

### 2. Header / Footer / منو (Header / Footer / Menu)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront application in repository.
**What exists:** Payload CMS framework package `payload/packages/plugin-nested-docs` natively available for nested menu structures.
**What is missing:** Storefront Header, Footer, and Menu navigation UI components.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront application in repository.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront frontend application, Payload Globals/Collections. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Storefront Header, Footer, and Menu navigation UI components.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront frontend application, Payload Globals/Collections.
**Required Work:** Configure navigation global in Payload CMS and render in Storefront UI.
**Conclusion:** Storefront layout components absent.

### 3. طراحی Responsive (Responsive Design)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront application in workspace.
**What exists:** Payload Admin UI (`payload/packages/ui`) contains responsive CSS/React layouts.
**What is missing:** Responsive Tailwind CSS / CSS grid/flex layout for Storefront.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront application in workspace.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront CSS framework setup. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Responsive Tailwind CSS / CSS grid/flex layout for Storefront.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront CSS framework setup.
**Required Work:** Implement mobile-first responsive layout in storefront app.
**Conclusion:** Frontend presentation capability.

### 4. UI اختصاصی (Custom UI)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront application in workspace.
**What exists:** Default framework assets in `medusa/` and `payload/`.
**What is missing:** Custom design system, branding theme, custom React components.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront application in workspace.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Frontend design system and UI library. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Custom design system, branding theme, custom React components.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Frontend design system and UI library.
**Required Work:** Build custom UI theme and design system for storefront.
**Conclusion:** Frontend design task.

### 5. درباره ما (About Us)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront routing app found.
**What exists:** Payload CMS core package (`payload/packages/payload`) supports static pages capability.
**What is missing:** About Us page collection item in Payload CMS and frontend page route.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront routing app found.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload Pages collection, Storefront page route. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (About Us page collection item in Payload CMS and frontend page route.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload Pages collection, Storefront page route.
**Required Work:** Create About Us page in Payload CMS and route in Storefront.
**Conclusion:** Page content and frontend route missing.

### 6. تماس با ما (Contact Us)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront contact route or form component.
**What exists:** Payload Form Builder plugin (`payload/packages/plugin-form-builder`).
**What is missing:** Contact form component and submission API handler in storefront.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront contact route or form component.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload Form Builder, Storefront UI form. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Contact form component and submission API handler in storefront.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload Form Builder, Storefront UI form.
**Required Work:** Configure contact form in Payload CMS and build UI on storefront.
**Conclusion:** Storefront UI form missing.

### 7. نمایش محصولات (Product Listing / Catalog)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront catalog app found.
**What exists:** Medusa Product Module API (`GET /store/products`) in `medusa/packages/medusa/src/api/store/products`.
**What is missing:** Storefront product catalog grid, filters, and product card components.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront catalog app found.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product API, Storefront UI. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Storefront product catalog grid, filters, and product card components.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product API, Storefront UI.
**Required Work:** Implement product catalog page in storefront fetching from Medusa API.
**Conclusion:** Backend API natively available in framework; Storefront UI missing.

### 8. دسته‌بندی محصولات (Product Categories Listing)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront category page.
**What exists:** Medusa Product Category API (`GET /store/product-categories`) in `medusa/packages/medusa/src/api/store/product-categories`.
**What is missing:** Category listing page and category navigation menu in storefront.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront category page.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module, Storefront UI. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Category listing page and category navigation menu in storefront.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module, Storefront UI.
**Required Work:** Fetch product categories from Medusa API and render in storefront.
**Conclusion:** Storefront category page missing.

### 9. صفحه محصول (Product Details Page)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront product detail route.
**What exists:** Medusa Product API (`GET /store/products/:id`) in `medusa/packages/medusa/src/api/store/products`.
**What is missing:** Storefront PDP (Product Details Page) component, variant selector, price display.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront product detail route.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product & Pricing Modules, Storefront PDP UI. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Storefront PDP (Product Details Page) component, variant selector, price display.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product & Pricing Modules, Storefront PDP UI.
**Required Work:** Create product detail page component in storefront app.
**Conclusion:** Storefront UI component missing.

### 10. گالری تصاویر (Product Image Gallery)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront media components.
**What exists:** Medusa product schema supports `images` array in `medusa/packages/modules/product/src/models/product.ts`.
**What is missing:** Frontend image carousel / lightbox / thumbnail selector component.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront media components.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront image slider component. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Frontend image carousel / lightbox / thumbnail selector component.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront image slider component.
**Required Work:** Build product image gallery component in storefront.
**Conclusion:** Storefront UI component missing.

### 11. جستجوی ساده (Simple Search UI)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No search bar component in storefront.
**What exists:** Medusa Product API query filter (`GET /store/products?q=`) in `medusa/packages/medusa/src/api/store/products`.
**What is missing:** Search input header bar and search results page on storefront.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No search bar component in storefront.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront header search input. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Search input header bar and search results page on storefront.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront header search input.
**Required Work:** Add search input control to storefront header.
**Conclusion:** Storefront UI component missing.

### 12. سفارش از WhatsApp (WhatsApp Order Link)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No WhatsApp order button component.
**What exists:** None.
**What is missing:** Storefront WhatsApp deep-link builder (`https://wa.me/...`) formatting cart/product items into message text.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No WhatsApp order button component.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront PDP / Cart UI. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Storefront WhatsApp deep-link builder (`https://wa.me/...`) formatting cart/product items into message text.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront PDP / Cart UI.
**Required Work:** Build helper function formatting product/cart details into WhatsApp URL link.
**Conclusion:** Storefront UI feature.

### 13. پنل مدیریت ساده (Basic Admin Panel)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/admin/dashboard`, `payload/packages/ui` | Project integration: NOT FOUND
**What exists:** Medusa Admin Dashboard package and Payload Admin UI package exist in framework source trees.
**What is missing:** Custom admin workspace application configuration, build step, and deployed admin routes.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/admin/dashboard`, `payload/packages/ui` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Admin, Payload Admin. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa Admin Dashboard package and Payload Admin UI package exist in framework source trees.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Admin, Payload Admin.
**Required Work:** Configure and deploy admin dashboard applications.
**Conclusion:** Framework capability exists, project integration missing.

### 14. مدیریت محصولات (Product Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND
**What exists:** Full CRUD capabilities for products, titles, descriptions, options, and variants in Medusa Product Module.
**What is missing:** Custom product schema extensions, workspace seed scripts, or configured product management instance.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Full CRUD capabilities for products, titles, descriptions, options, and variants in Medusa Product Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module.
**Required Work:** Deploy Medusa backend and use Admin API/UI for product CRUD.
**Conclusion:** Framework capability exists natively; project integration missing.

### 15. مدیریت دسته‌بندی (Category Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND
**What exists:** Hierarchical category tree management service and API (`/admin/product-categories`) in Medusa Product Module.
**What is missing:** Workspace category configuration or seed data.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Hierarchical category tree management service and API (`/admin/product-categories`) in Medusa Product Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module.
**Required Work:** Configure and manage product categories via Medusa Admin API.
**Conclusion:** Native Medusa framework feature; project integration missing.

### 16. مدیریت بنر (Banner Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload` | Project integration: NOT FOUND
**What exists:** Payload CMS Global / Collection architectural capabilities for slide banners.
**What is missing:** `Banners` collection definition in custom `payload.config.ts`.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Payload CMS Global / Collection architectural capabilities for slide banners.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Define `Banners` collection in project Payload configuration.
**Conclusion:** Framework capability exists in Payload; project configuration missing.

### 17. ثبت‌نام و ورود (Registration & Login UI/Flow)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront auth pages in repository.
**What exists:** Medusa Auth Module (`medusa/packages/modules/auth`) provides `/store/auth/emailpass` endpoints.
**What is missing:** Storefront Sign Up and Login pages and form handlers.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No storefront auth pages in repository.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Auth Module, Storefront Auth UI. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Storefront Sign Up and Login pages and form handlers.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Auth Module, Storefront Auth UI.
**Required Work:** Build customer login and registration pages on storefront.
**Conclusion:** Storefront authentication UI missing.

### 18. پروفایل کاربری (User Profile UI)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No customer account dashboard in storefront.
**What exists:** Medusa Customer Module API (`/store/customers/me`) in `medusa/packages/modules/customer`.
**What is missing:** Customer profile page, account settings forms, and address manager UI on storefront.

### Evidence
- **Source:** Framework capability: PARTIAL | Project implementation: NOT FOUND. (No customer account dashboard in storefront.)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Customer Module, Storefront UI. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** Storefront UI / route component missing in workspace. (Customer profile page, account settings forms, and address manager UI on storefront.)
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Customer Module, Storefront UI.
**Required Work:** Create customer profile dashboard page on storefront.
**Conclusion:** Storefront UI component missing.

### 19. مدیریت آدرس‌ها (Address Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND
**What exists:** Customer address CRUD API (`/store/customers/me/addresses`) and entity in Medusa Customer Module.
**What is missing:** Storefront address book forms and workspace address schema customizations.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Customer Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Customer address CRUD API (`/store/customers/me/addresses`) and entity in Medusa Customer Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Customer Module.
**Required Work:** Integrate Medusa Customer Address API with storefront address book component.
**Conclusion:** Native Medusa framework capability; project storefront integration missing.

### 20. خرید مهمان (Guest Checkout)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND
**What exists:** Medusa Cart Module allows creating carts with `email` without requiring `customer_id`.
**What is missing:** Storefront guest checkout UI workflow step.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Cart Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa Cart Module allows creating carts with `email` without requiring `customer_id`.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Cart Module.
**Required Work:** Implement guest checkout form and email prompt on storefront.
**Conclusion:** Native Medusa framework capability; project storefront workflow missing.

### 21. سبد خرید (Cart Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND
**What exists:** Complete Cart lifecycle API (`/store/carts`, add/update/remove line items) in Medusa Cart Module.
**What is missing:** Storefront cart drawer / cart page UI components and local storage synchronization logic.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Cart Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Complete Cart lifecycle API (`/store/carts`, add/update/remove line items) in Medusa Cart Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Cart Module.
**Required Work:** Connect storefront cart drawer to Medusa Cart Store API.
**Conclusion:** Native framework feature; project storefront integration missing.

### 22. ثبت سفارش (Order Placement)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND
**What exists:** Order creation from completed cart workflow (`POST /store/carts/:id/complete`) in Medusa Order Module.
**What is missing:** Custom order completion handler or post-order processing logic in workspace.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Cart & Order Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Order creation from completed cart workflow (`POST /store/carts/:id/complete`) in Medusa Order Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Cart & Order Modules.
**Required Work:** Wire storefront checkout submit button to cart completion API.
**Conclusion:** Native framework capability; project integration missing.

### 23. Checkout
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/cart`, `medusa/packages/modules/payment` | Project integration: NOT FOUND
**What exists:** Address selection, shipping method assignment, and payment collection initialization APIs in Medusa core.
**What is missing:** Storefront multi-step checkout wizard component.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/cart`, `medusa/packages/modules/payment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Cart, Fulfillment, Payment Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Address selection, shipping method assignment, and payment collection initialization APIs in Medusa core.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Cart, Fulfillment, Payment Modules.
**Required Work:** Build multi-step checkout UI in storefront app.
**Conclusion:** Native Medusa capability; storefront UI missing.

### 24. درگاه پرداخت (Payment Gateway - Single)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND
**What exists:** Medusa Payment Module engine and default system payment provider (`system`).
**What is missing:** Custom payment provider plugin for Iranian payment gateways (ZarinPal, Shaparak, IdPay).

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Payment Provider Plugin, Iranian Payment Gateway REST API. (installed in monorepo packages, project integration missing).
- **Backend:** Requires external provider/service integration. (Medusa Payment Module engine and default system payment provider (`system`).)
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Payment Provider Plugin, Iranian Payment Gateway REST API.
**Required Work:** Build or install a Medusa payment provider plugin for Iranian payment gateway.
**Conclusion:** Requires third-party external payment provider integration.

### 25. مدیریت تراکنش (Transaction Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND
**What exists:** Payment collections, payment captures, refunds, and transaction status models in Medusa Payment Module.
**What is missing:** Iranian bank reference number tracking customization.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Payment Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Payment collections, payment captures, refunds, and transaction status models in Medusa Payment Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Payment Module.
**Required Work:** Utilize Medusa payment capture/refund APIs in admin operations.
**Conclusion:** Native Medusa framework capability; project integration missing.

### 26. روش‌های ارسال (Shipping Methods)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND
**What exists:** Shipping options, fulfillment providers architecture, and shipping profile models in Medusa Fulfillment Module.
**What is missing:** Project configuration for local delivery options or courier plugins.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Fulfillment Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Shipping options, fulfillment providers architecture, and shipping profile models in Medusa Fulfillment Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Fulfillment Module.
**Required Work:** Configure shipping options and fulfillment providers in Medusa Admin.
**Conclusion:** Native Medusa framework capability; project configuration missing.

### 27. محاسبه هزینه ارسال (Shipping Cost Calculation)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND
**What exists:** Flat rate and calculated price rules engine for shipping options in Medusa Fulfillment Module.
**What is missing:** API integration with Iranian courier/post services (Tipax, Pishro) for dynamic rate calculation.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Fulfillment & Pricing Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Flat rate and calculated price rules engine for shipping options in Medusa Fulfillment Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Fulfillment & Pricing Modules.
**Required Work:** Set flat rate shipping prices or build dynamic fulfillment provider.
**Conclusion:** Native framework capability; project integration missing.

### 28. کد تخفیف (Discount / Coupon Code)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND
**What exists:** Promo codes, rule-based discounts, and promotion application service in Medusa Promotion Module.
**What is missing:** Storefront promo code input field and cart discount display.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Promotion Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Promo codes, rule-based discounts, and promotion application service in Medusa Promotion Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Promotion Module.
**Required Work:** Add coupon code input field to storefront cart/checkout.
**Conclusion:** Native Medusa framework capability; storefront UI missing.

### 29. نظرات محصولات (Product Reviews)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No review database model or module found in repository.
**What exists:** None.
**What is missing:** Product review database entity, submission API, review list endpoint, and admin moderation.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Custom Medusa Module or Payload CMS collection. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Custom Medusa Module or Payload CMS collection.
**Required Work:** Build custom `Reviews` collection in Payload CMS or custom Medusa module.
**Conclusion:** Capability completely absent from workspace.

### 30. امتیازدهی محصولات (Product Ratings)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No rating model found in repository.
**What exists:** None.
**What is missing:** Rating aggregation calculation logic, rating score field on products.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Product Reviews feature. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Product Reviews feature.
**Required Work:** Add average rating calculation and field to product metadata or review module.
**Conclusion:** Capability completely absent.

### 31. مدیریت سفارش‌ها (Order Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND
**What exists:** Order status state machine, fulfillment creation, cancellation, item edits in Medusa Order Module.
**What is missing:** Custom invoice PDF exporter or Persian SMS status dispatches.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Order Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Order status state machine, fulfillment creation, cancellation, item edits in Medusa Order Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Order Module.
**Required Work:** Use Medusa Admin for order processing and status management.
**Conclusion:** Native Medusa framework capability; project integration missing.

### 32. مدیریت موجودی (Inventory Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/inventory`, `medusa/packages/modules/stock-location` | Project integration: NOT FOUND
**What exists:** Multi-location inventory tracking, stock reservations, and inventory levels in Medusa Inventory Module.
**What is missing:** Low stock SMS/email alerts or custom inventory sync scripts.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/inventory`, `medusa/packages/modules/stock-location` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Inventory Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Multi-location inventory tracking, stock reservations, and inventory levels in Medusa Inventory Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Inventory Module.
**Required Work:** Manage inventory levels and stock locations via Medusa Admin API.
**Conclusion:** Native Medusa framework capability; project configuration missing.

### 33. احراز هویت و دسترسی پایه (Basic Auth & RBAC)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/rbac`, `medusa/packages/modules/auth` | Project integration: NOT FOUND
**What exists:** Medusa RBAC module, JWT sessions, Admin and Customer authentication in framework source code.
**What is missing:** Project specific role definitions and permission policies.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/rbac`, `medusa/packages/modules/auth` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa RBAC & Auth Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa RBAC module, JWT sessions, Admin and Customer authentication in framework source code.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa RBAC & Auth Modules.
**Required Work:** Configure custom RBAC roles and permissions policies.
**Conclusion:** Native framework capability; project configuration missing.

### 34. ویژگی‌های محصول (Product Attributes)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND
**What exists:** Product options and key-value JSONB `metadata` field on products in Medusa Product Module.
**What is missing:** Project-specific attribute schema definitions and attribute filtering UI.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Product options and key-value JSONB `metadata` field on products in Medusa Product Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module.
**Required Work:** Define product attributes in product metadata and render on storefront.
**Conclusion:** Native Medusa framework capability; project configuration missing.

### 35. رنگ، سایز و تنوع محصول (Product Variants - Color, Size)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND
**What exists:** Product variants with arbitrary option combinations (e.g., Size, Color) in Medusa Product Module.
**What is missing:** Storefront color swatch picker and size selection UI components.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Product variants with arbitrary option combinations (e.g., Size, Color) in Medusa Product Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module.
**Required Work:** Create product variants with options in Medusa Admin and build variant selector on storefront.
**Conclusion:** Native Medusa framework capability; storefront UI missing.

### 36. محصولات مرتبط (Related Products)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No related product relationship module found in repository.
**What exists:** Product Collections in Medusa can group products.
**What is missing:** Explicit cross-sell / upsell / related products entity or join relationship.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module extension or metadata. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module extension or metadata.
**Required Work:** Store array of related product IDs in product metadata or build custom link module.
**Conclusion:** Capability absent.

### 37. محصولات جدید / ویژه / پرفروش (Featured / New / Best Seller Products)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No sales badge logic or featured tags collection in workspace custom code.
**What exists:** Product tags in Medusa (`medusa/packages/modules/product`).
**What is missing:** Automated sales calculation for "Best Sellers" badge or custom "Featured" flag logic.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product & Order Modules. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product & Order Modules.
**Required Work:** Add custom flags to product metadata or construct sales query subscribers.
**Conclusion:** Capability absent.

### 38. فیلتر پیشرفته محصولات (Advanced Product Filtering)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND
**What exists:** Filter parameters by price, category, collection, tags, and options in Medusa Store API.
**What is missing:** Storefront sidebar filter control component and query string state manager.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Filter parameters by price, category, collection, tags, and options in Medusa Store API.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module.
**Required Work:** Build multi-attribute filter sidebar in storefront app.
**Conclusion:** Native framework capability; storefront UI missing.

### 39. مرتب‌سازی محصولات (Product Sorting)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND
**What exists:** Sorting parameters (`created_at`, `title`, price) in Medusa `/store/products` API.
**What is missing:** Storefront sort selector dropdown component.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Sorting parameters (`created_at`, `title`, price) in Medusa `/store/products` API.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module.
**Required Work:** Add sort dropdown component to storefront product catalog.
**Conclusion:** Native Medusa framework capability; storefront UI missing.

### 40. مقایسه محصولات (Product Comparison)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No comparison module or storefront component found.
**What exists:** None.
**What is missing:** Product comparison drawer, matrix logic comparing variant attributes.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront state management / Product options. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront state management / Product options.
**Required Work:** Build product comparison drawer and comparison table component in storefront.
**Conclusion:** Capability completely absent.

### 41. علاقه‌مندی‌ها (Wishlist)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No wishlist module or entity found in repository.
**What exists:** None (Wishlist is not a core Medusa v2 module).
**What is missing:** `Wishlist` database entity, CRUD API endpoints, storefront toggle button.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Customer Module & Custom Module/Plugin. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Customer Module & Custom Module/Plugin.
**Required Work:** Build custom Medusa module for Wishlist or store items in Customer metadata.
**Conclusion:** Capability absent.

### 42. ورود با OTP (SMS OTP Login)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/auth` | Project integration: NOT FOUND
**What exists:** Medusa Auth Module supports custom identity providers (`AuthIdentityProvider`).
**What is missing:** Iranian SMS Provider plugin (Kavenegar, FarazSMS, Ghasedak) and OTP generation/validation service.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/auth` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Auth Module, Iranian SMS Gateway REST API. (installed in monorepo packages, project integration missing).
- **Backend:** Requires external provider/service integration. (Medusa Auth Module supports custom identity providers (`AuthIdentityProvider`).)
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Auth Module, Iranian SMS Gateway REST API.
**Required Work:** Build custom Medusa Auth Provider plugin for SMS OTP.
**Conclusion:** External SMS gateway integration required.

### 43. تاریخچه سفارش‌ها (Customer Order History)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND
**What exists:** Customer order listing API (`GET /store/orders?customer_id=me`) in Medusa Order Module.
**What is missing:** Storefront customer order history table and detail page.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Order & Customer Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Customer order listing API (`GET /store/orders?customer_id=me`) in Medusa Order Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Order & Customer Modules.
**Required Work:** Build customer order history page on storefront dashboard.
**Conclusion:** Native Medusa framework capability; storefront UI missing.

### 44. پیگیری سفارش (Order Tracking)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND
**What exists:** Fulfillment tracking numbers field on order fulfillments in Medusa Fulfillment Module.
**What is missing:** Public guest order tracking lookup page on storefront.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Fulfillment Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Fulfillment tracking numbers field on order fulfillments in Medusa Fulfillment Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Fulfillment Module.
**Required Work:** Build guest order tracking lookup form on storefront.
**Conclusion:** Native framework capability; storefront page missing.

### 45. صدور فاکتور (Invoice Generation)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No invoice generation service found in workspace.
**What exists:** Order line items and amounts in Medusa Order Module.
**What is missing:** PDF generation library integration (e.g. PDFKit / Puppeteer), Persian invoice HTML layout template.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Order Module, PDF generation library. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Order Module, PDF generation library.
**Required Work:** Build workflow generating downloadable PDF invoices for completed orders.
**Conclusion:** Capability absent.

### 46. لغو سفارش (Order Cancellation)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND
**What exists:** Order cancellation API and refund workflow (`POST /admin/orders/:id/cancel`) in Medusa Order Module.
**What is missing:** Storefront customer-initiated order cancellation request button.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Order Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Order cancellation API and refund workflow (`POST /admin/orders/:id/cancel`) in Medusa Order Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Order Module.
**Required Work:** Add order cancellation request button to customer storefront account.
**Conclusion:** Native Medusa framework capability; storefront button missing.

### 47. تخفیف محصول / دسته‌بندی (Product & Category Discounts)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND
**What exists:** Target promotion rules restricting discounts to specific product IDs or Category IDs in Medusa Promotion Module.
**What is missing:** Storefront discount tags on product cards and workspace rule seeds.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Promotion Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Target promotion rules restricting discounts to specific product IDs or Category IDs in Medusa Promotion Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Promotion Module.
**Required Work:** Configure product/category promotions via Medusa Admin API.
**Conclusion:** Native Medusa framework capability; project configuration missing.

### 48. فروش ویژه (Flash Sales / Special Deals)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND
**What exists:** Time-bounded campaign promotions with start and end dates in Medusa Promotion Module.
**What is missing:** Storefront countdown timer banner component and workspace campaign instances.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Promotion Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Time-bounded campaign promotions with start and end dates in Medusa Promotion Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Promotion Module.
**Required Work:** Configure campaign in Medusa Admin and add countdown component to storefront PDP.
**Conclusion:** Native Medusa framework capability; storefront UI component missing.

### 49. تأیید / رد نظرات (Review Approval / Rejection Workflow)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No review moderation logic found in repository.
**What exists:** None.
**What is missing:** Review approval status field (`pending`, `approved`, `rejected`), admin moderation dashboard interface.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Product Reviews feature. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Product Reviews feature.
**Required Work:** Add approval status workflow to Payload CMS reviews collection or custom Medusa module.
**Conclusion:** Capability absent.

### 50. پاسخ مدیر به نظر (Admin Reply to Reviews)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No review reply field found in repository.
**What exists:** None.
**What is missing:** Admin reply field on review entity, storefront reply display layout.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Product Reviews feature. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Product Reviews feature.
**Required Work:** Add admin reply field to review schema and display on storefront.
**Conclusion:** Capability absent.

### 51. داشبورد مدیریتی (Admin Analytics Dashboard)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/admin` | Project integration: NOT FOUND
**What exists:** Medusa Admin panel package with order metrics, sales overview, and customer list widgets.
**What is missing:** Persian localization and Jalali calendar integration.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/admin` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Admin. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa Admin panel package with order metrics, sales overview, and customer list widgets.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Admin.
**Required Work:** Build and deploy Medusa Admin dashboard app.
**Conclusion:** Native framework capability; project deployment missing.

### 52. مدیریت کاربران (Customer Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND
**What exists:** Customer listing, detail editing, customer groups, and metadata management in Medusa Customer Module.
**What is missing:** Custom customer tagging or segments configuration in workspace.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Customer Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Customer listing, detail editing, customer groups, and metadata management in Medusa Customer Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Customer Module.
**Required Work:** Manage customers via Medusa Admin panel.
**Conclusion:** Native Medusa framework capability; project configuration missing.

### 53. مدیریت مدیران (Admin User Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/user` | Project integration: NOT FOUND
**What exists:** Admin user creation, invite system, and password reset flows in Medusa User Module.
**What is missing:** Custom administrative onboarding workflow in workspace.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/user` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa User Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Admin user creation, invite system, and password reset flows in Medusa User Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa User Module.
**Required Work:** Invite admin users via Medusa Admin API.
**Conclusion:** Native Medusa framework capability; project configuration missing.

### 54. نقش‌ها و دسترسی‌ها (Roles & Permissions)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/rbac` | Project integration: NOT FOUND
**What exists:** Granular access policy definitions for routes and resources in Medusa RBAC Module.
**What is missing:** Project-specific role definitions (e.g. store manager, order packer).

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/rbac` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa RBAC Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Granular access policy definitions for routes and resources in Medusa RBAC Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa RBAC Module.
**Required Work:** Configure permission policies for custom admin roles.
**Conclusion:** Native Medusa framework capability; project configuration missing.

### 55. گزارش فروش (Sales Reporting)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No custom sales report exporter found in repository.
**What exists:** Basic order metrics in Medusa Admin.
**What is missing:** Date-filtered sales report exporter (CSV/Excel), revenue breakdown logic.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Order Module, CSV export utility. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Order Module, CSV export utility.
**Required Work:** Build custom sales report exporter service/API endpoint.
**Conclusion:** Capability absent.

### 56. وبلاگ (Blog Base System)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload` | Project integration: NOT FOUND
**What exists:** Full CMS capabilities in Payload for posts, rich text content, and draft/publish workflows.
**What is missing:** `Posts` collection definition in project `payload.config.ts`.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Full CMS capabilities in Payload for posts, rich text content, and draft/publish workflows.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Define `Posts` collection in project Payload CMS config file.
**Conclusion:** Native Payload framework capability; project configuration missing.

### 57. مدیریت مقالات (Article Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload`, `payload/packages/richtext-lexical` | Project integration: NOT FOUND
**What exists:** Lexical rich text editor, article drafting, media embedding, and scheduled publishing in Payload framework.
**What is missing:** Custom article schema definition in project configuration.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload`, `payload/packages/richtext-lexical` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Lexical rich text editor, article drafting, media embedding, and scheduled publishing in Payload framework.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Configure Lexical editor on `Posts` collection in Payload CMS.
**Conclusion:** Native Payload framework capability; project configuration missing.

### 58. دسته‌بندی مقالات (Blog Categories)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload`, `payload/packages/plugin-nested-docs` | Project integration: NOT FOUND
**What exists:** Payload relationship fields allow linking posts to category collections (with hierarchy via plugin-nested-docs).
**What is missing:** `BlogCategories` collection definition in project payload config.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload`, `payload/packages/plugin-nested-docs` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Payload relationship fields allow linking posts to category collections (with hierarchy via plugin-nested-docs).)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Define `BlogCategories` collection in Payload config.
**Conclusion:** Native Payload framework capability; project configuration missing.

### 59. تگ مقالات (Blog Tags)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload` | Project integration: NOT FOUND
**What exists:** Multi-select relationship or array tag field capabilities in Payload CMS.
**What is missing:** `Tags` collection definition in project payload config.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Multi-select relationship or array tag field capabilities in Payload CMS.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Define `Tags` collection in Payload config.
**Conclusion:** Native Payload framework capability; project configuration missing.

### 60. نظرات مقالات (Blog Comments)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No blog comment collection found in repository.
**What exists:** None.
**What is missing:** Blog comment database collection, public submission endpoint, moderation system.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Create `BlogComments` collection in Payload CMS with moderation hooks.
**Conclusion:** Capability absent.

### 61. SEO مقالات (Blog Article SEO)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND
**What exists:** Official Payload SEO Plugin provides meta title, description, social preview image, and evaluation tools.
**What is missing:** Registration of `seoPlugin` in project payload configuration.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload SEO Plugin. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Official Payload SEO Plugin provides meta title, description, social preview image, and evaluation tools.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload SEO Plugin.
**Required Work:** Register `@payloadcms/plugin-seo` in project Payload configuration.
**Conclusion:** Native Payload framework capability; project plugin registration missing.

### 62. SEO فنی پایه (Basic Technical SEO)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND
**What exists:** Canonical URL, robots meta tags, title template generation in Payload SEO plugin.
**What is missing:** Storefront sitemap (`sitemap.xml`) and `robots.txt` generation routes.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload SEO Plugin, Storefront routes. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Canonical URL, robots meta tags, title template generation in Payload SEO plugin.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload SEO Plugin, Storefront routes.
**Required Work:** Build `sitemap.xml` and `robots.txt` dynamic routes in storefront app.
**Conclusion:** Native capability available; storefront route missing.

### 63. چند درگاه پرداخت (Multiple Payment Gateways)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND
**What exists:** Medusa Payment Module supports multiple simultaneous payment providers per region.
**What is missing:** Installation and setup of multiple Iranian payment provider plugins.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Payment Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa Payment Module supports multiple simultaneous payment providers per region.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Payment Module.
**Required Work:** Configure multiple payment provider plugins in Medusa config.
**Conclusion:** Native Medusa framework capability; project plugin installation missing.

### 64. کمپین‌های فروش (Sales Campaigns)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND
**What exists:** Campaign management with spending budgets, identifier codes, start/end dates in Medusa Promotion Module.
**What is missing:** Storefront promotional campaign landing pages and workspace campaign instances.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Promotion Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Campaign management with spending budgets, identifier codes, start/end dates in Medusa Promotion Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Promotion Module.
**Required Work:** Create campaigns via Medusa Admin and build landing pages on storefront.
**Conclusion:** Native Medusa framework capability; storefront integration missing.

### 65. سیستم بازگشت وجه (Refund System)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/payment`, `medusa/packages/modules/order` | Project integration: NOT FOUND
**What exists:** Refund creation workflow, payment refund captures, and order edits in Medusa core.
**What is missing:** Iranian banking API integration for automated manual refund processing.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/payment`, `medusa/packages/modules/order` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Payment & Order Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Refund creation workflow, payment refund captures, and order edits in Medusa core.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Payment & Order Modules.
**Required Work:** Process refunds via Medusa Admin panel.
**Conclusion:** Native Medusa framework capability; project integration missing.

### 66. درخواست مرجوعی کالا (Return Request System)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/fulfillment`, `medusa/packages/modules/order` | Project integration: NOT FOUND
**What exists:** Return creation, return reason configuration, and return shipping options in Medusa core.
**What is missing:** Storefront customer return request portal UI component.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/fulfillment`, `medusa/packages/modules/order` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Fulfillment & Order Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Return creation, return reason configuration, and return shipping options in Medusa core.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Fulfillment & Order Modules.
**Required Work:** Build return request form on customer storefront dashboard.
**Conclusion:** Native Medusa framework capability; storefront UI component missing.

### 67. مدیریت کد رهگیری ارسال (Shipping Tracking Code Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND
**What exists:** Admin API to attach tracking numbers to order fulfillments in Medusa Fulfillment Module.
**What is missing:** Automated SMS dispatch trigger sending tracking code to customer upon update.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Fulfillment Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Admin API to attach tracking numbers to order fulfillments in Medusa Fulfillment Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Fulfillment Module.
**Required Work:** Enter tracking numbers in Medusa Admin and wire SMS notification subscriber.
**Conclusion:** Native Medusa framework capability; workspace subscriber missing.

### 68. محدوده و قوانین ارسال پیشرفته (Advanced Shipping Zones & Rules)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND
**What exists:** Shipping zones, region assignment, and price rules (min/max cart total, weight) in Medusa Fulfillment Module.
**What is missing:** Iranian province and city location taxonomy rules configuration.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Fulfillment Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Shipping zones, region assignment, and price rules (min/max cart total, weight) in Medusa Fulfillment Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Fulfillment Module.
**Required Work:** Configure shipping zones and rules in Medusa Admin.
**Conclusion:** Native Medusa framework capability; project configuration missing.

### 69. ویدئوی محصول (Product Video Support)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No video field on products in repository.
**What exists:** Medusa image attachments support images only.
**What is missing:** Product video URL / embed model, video player UI component on storefront PDP.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module extension or metadata. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module extension or metadata.
**Required Work:** Add video URL string to product metadata or Payload CMS catalog block.
**Conclusion:** Capability absent.

### 70. سیستم نویسندگان وبلاگ (Blog Author Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload` | Project integration: NOT FOUND
**What exists:** Payload CMS supports linking `Posts` to `Users` collection or custom `Authors` collection via relationship fields.
**What is missing:** `Authors` collection definition in project payload config.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Payload CMS supports linking `Posts` to `Users` collection or custom `Authors` collection via relationship fields.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Define `Authors` collection in Payload config.
**Conclusion:** Native Payload framework capability; project configuration missing.

### 71. مقالات مرتبط (Related Blog Articles)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload` | Project integration: NOT FOUND
**What exists:** Self-referential relationship fields in Payload CMS allow selecting related articles.
**What is missing:** `relatedPosts` field definition in project `Posts` collection schema.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Self-referential relationship fields in Payload CMS allow selecting related articles.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Add `relatedPosts` field to `Posts` collection in project Payload config.
**Conclusion:** Native Payload framework capability; project configuration missing.

### 72. SEO پیشرفته (Advanced SEO Capabilities)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND
**What exists:** Payload SEO Plugin provides structured metadata fields, image preview cards, and evaluation tools.
**What is missing:** Registration of SEO plugin in project payload configuration.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload SEO Plugin. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Payload SEO Plugin provides structured metadata fields, image preview cards, and evaluation tools.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload SEO Plugin.
**Required Work:** Enable `@payloadcms/plugin-seo` in project Payload configuration.
**Conclusion:** Native Payload capability; project configuration missing.

### 73. Schema محصولات (Product JSON-LD Schema)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No JSON-LD schema builder found in repository.
**What exists:** Product data in Medusa API.
**What is missing:** JSON-LD structured data generator component for Product, Offer, and AggregateRating.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront PDP component. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront PDP component.
**Required Work:** Build JSON-LD script tag generator component in Storefront PDP.
**Conclusion:** Capability absent.

### 74. Schema مقالات (Article JSON-LD Schema)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No Article JSON-LD schema builder found in repository.
**What exists:** Blog post data in Payload CMS API.
**What is missing:** JSON-LD structured data generator for Article / BlogPosting.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Storefront Blog detail page. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Storefront Blog detail page.
**Required Work:** Add Article JSON-LD script tag in storefront blog route.
**Conclusion:** Capability absent.

### 75. Open Graph / Social Meta
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND
**What exists:** Open Graph title, description, and image fields generated automatically by Payload SEO plugin.
**What is missing:** Storefront `<meta property="og:..." />` HTML head mapping.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload SEO Plugin, Storefront head manager. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Open Graph title, description, and image fields generated automatically by Payload SEO plugin.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload SEO Plugin, Storefront head manager.
**Required Work:** Render Open Graph meta tags in Storefront head manager.
**Conclusion:** Native framework capability; storefront rendering missing.

### 76. بهینه‌سازی Performance (Performance Optimization)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** `docker-compose.yml`, `infrastructure/nginx/nginx.conf`
**What exists:** Redis caching service running in Docker Compose (`redis:7-alpine`), Nginx reverse proxy.
**What is missing:** External CDN edge integration, image optimization service (Sharp / Cloudflare Images), page caching headers.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (`docker-compose.yml`, `infrastructure/nginx/nginx.conf`)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Redis, External CDN / Image Provider. (installed in monorepo packages, project integration missing).
- **Backend:** Requires external provider/service integration. (Redis caching service running in Docker Compose (`redis:7-alpine`), Nginx reverse proxy.)
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Redis, External CDN / Image Provider.
**Required Work:** Configure Nginx caching headers and external image CDN provider.
**Conclusion:** Infrastructure integration required.

### 77. پیامک OTP (SMS OTP Notification)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/notification` | Project integration: NOT FOUND
**What exists:** Medusa Notification Module engine in framework source code.
**What is missing:** Custom notification provider plugin for Iranian SMS providers (Kavenegar, Ghasedak, FarazSMS).

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/notification` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Notification Module, Iranian SMS Gateway REST API. (installed in monorepo packages, project integration missing).
- **Backend:** Requires external provider/service integration. (Medusa Notification Module engine in framework source code.)
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Notification Module, Iranian SMS Gateway REST API.
**Required Work:** Develop custom Notification Provider plugin for Iranian SMS gateway.
**Conclusion:** External SMS gateway integration required.

### 78. پیامک وضعیت سفارش (Order Status SMS)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/notification` | Project integration: NOT FOUND
**What exists:** Event-driven notification bus system in Medusa (`order.placed`, `order.fulfilled`).
**What is missing:** Event subscribers wiring order state changes to Iranian SMS provider.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/notification` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Event Bus, Notification Module, Iranian SMS Gateway. (installed in monorepo packages, project integration missing).
- **Backend:** Requires external provider/service integration. (Event-driven notification bus system in Medusa (`order.placed`, `order.fulfilled`).)
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Event Bus, Notification Module, Iranian SMS Gateway.
**Required Work:** Register subscriber functions for order events triggering SMS API calls.
**Conclusion:** External SMS gateway integration required.

### 79. اعلان موجودی محصول (Back in Stock Notification)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No stock alert subscriber or table found in repository.
**What exists:** None.
**What is missing:** Back-in-stock subscription database entity, stock level update listener logic.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Inventory & Notification Modules. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Inventory & Notification Modules.
**Required Work:** Build customer stock alert subscription model and inventory update event listener.
**Conclusion:** Capability absent.

### 80. مرکز اعلان‌ها (Notification Center UI)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No notification center model or UI found in repository.
**What exists:** None.
**What is missing:** In-app notification database model, unread badge counter, notification drawer UI component on storefront.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Custom Notification Entity / Storefront component. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Custom Notification Entity / Storefront component.
**Required Work:** Build notification storage entity and storefront notification drawer component.
**Conclusion:** Capability absent.

### 81. اعلان ایمیلی (Email Notifications)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/email-nodemailer`, `payload/packages/email-resend` | Project integration: NOT FOUND
**What exists:** Payload email adapters for Nodemailer and Resend in framework packages.
**What is missing:** SMTP server credentials and HTML email templates for Persian transactional emails.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/email-nodemailer`, `payload/packages/email-resend` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** SMTP Server / Resend API. (installed in monorepo packages, project integration missing).
- **Backend:** Requires external provider/service integration. (Payload email adapters for Nodemailer and Resend in framework packages.)
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** SMTP Server / Resend API.
**Required Work:** Configure SMTP environment variables and design HTML email templates.
**Conclusion:** External SMTP service integration required.

### 82. هشدار کاهش موجودی (Low Stock Admin Alert)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/inventory` | Project integration: NOT FOUND
**What exists:** Stock level monitoring and inventory level entities in Medusa Inventory Module.
**What is missing:** Admin email/SMS notification subscriber when inventory drops below threshold.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/inventory` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Inventory & Notification Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Stock level monitoring and inventory level entities in Medusa Inventory Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Inventory & Notification Modules.
**Required Work:** Create event listener on inventory update triggering admin alert.
**Conclusion:** Native Medusa framework capability; subscriber missing.

### 83. هشدار تغییر قیمت (Price Change Alert)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No price tracking subscription logic found in repository.
**What exists:** Medusa Pricing Module (`medusa/packages/modules/pricing`).
**What is missing:** Price drop watch subscription model and pricing update subscriber function.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Pricing & Notification Modules. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Pricing & Notification Modules.
**Required Work:** Build price watch subscription model and pricing update event listener.
**Conclusion:** Capability absent.

### 84. سبد خرید رهاشده (Abandoned Cart Recovery)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND
**What exists:** Medusa tracks incomplete carts with customer email and update timestamp.
**What is missing:** Scheduled cron job / workflow dispatching reminder emails/SMS for abandoned carts.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Cart & Workflow Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa tracks incomplete carts with customer email and update timestamp.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Cart & Workflow Modules.
**Required Work:** Create scheduled workflow querying inactive carts > 24 hours and sending recovery reminders.
**Conclusion:** Native Medusa framework capability; scheduled workflow missing.

### 85. گزارش مشتریان (Customer Reports / Analytics)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND
**What exists:** Customer purchase history, customer group relationships, and order counts in Medusa.
**What is missing:** Exportable LTV (Lifetime Value) report table script.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Customer & Order Modules. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Customer purchase history, customer group relationships, and order counts in Medusa.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Customer & Order Modules.
**Required Work:** Query customer order metrics via Medusa Admin API.
**Conclusion:** Native Medusa framework capability; report export script missing.

### 86. گزارش موجودی (Inventory Reports)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/inventory` | Project integration: NOT FOUND
**What exists:** Inventory level querying APIs across stock locations in Medusa Inventory Module.
**What is missing:** Stock valuation CSV export script.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/inventory` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Inventory Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Inventory level querying APIs across stock locations in Medusa Inventory Module.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Inventory Module.
**Required Work:** Export inventory list from Medusa Admin.
**Conclusion:** Native Medusa framework capability; export script missing.

### 87. گزارش تراکنش‌ها (Transaction Reports)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND
**What exists:** Payment collections, captured amounts, and pending captures listing in Medusa.
**What is missing:** Reconciliation report exporter formatted for Iranian accounting systems.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Payment Module. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Payment collections, captured amounts, and pending captures listing in Medusa.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Payment Module.
**Required Work:** Filter and export payment logs from Medusa Admin.
**Conclusion:** Native Medusa framework capability; export script missing.

### 88. مستندات API / Swagger (API Documentation / Swagger / OpenAPI)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/cli/oas`, `payload/packages/graphql` | Project integration: NOT FOUND
**What exists:** Medusa OAS generator package (`@medusajs/medusa-oas`) and Payload GraphQL Playground endpoint in framework packages.
**What is missing:** Hosted Swagger UI route in custom workspace deployment.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/cli/oas`, `payload/packages/graphql` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa OAS CLI, Payload GraphQL. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa OAS generator package (`@medusajs/medusa-oas`) and Payload GraphQL Playground endpoint in framework packages.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa OAS CLI, Payload GraphQL.
**Required Work:** Generate OAS spec file and host Swagger UI endpoint in workspace deployment.
**Conclusion:** Native framework capability; hosted route missing.

### 89. تست‌های جامع سیستم (Comprehensive System Testing)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/integration-tests`, `payload/test` | Project integration: NOT FOUND
**What exists:** Extensive test suites, helpers, and fixtures built into Medusa and Payload framework repositories.
**What is missing:** Custom end-to-end (E2E) test suite for Depix workspace e-commerce user journeys.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/integration-tests`, `payload/test` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Jest, Vitest, Playwright. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Extensive test suites, helpers, and fixtures built into Medusa and Payload framework repositories.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Jest, Vitest, Playwright.
**Required Work:** Write custom E2E integration test suite for workspace e-commerce user flows.
**Conclusion:** Native framework test setup present; workspace test suite missing.

### 90. مدیریت صفحات پیشرفته (Advanced Page Management / Page Builder)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload`, `payload/packages/richtext-lexical` | Project integration: NOT FOUND
**What exists:** Payload Block-based layout builder fields allow assembling modular page layouts visually.
**What is missing:** Custom block definitions (Hero, Features, Pricing, Testimonials) in project payload config.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload`, `payload/packages/richtext-lexical` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Payload Block-based layout builder fields allow assembling modular page layouts visually.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS.
**Required Work:** Define layout blocks in project Payload CMS config file.
**Conclusion:** Native Payload framework capability; project block definitions missing.

### 91. چندزبانه (Multi-language / Localization)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/translation`, `payload/packages/translations` | Project integration: NOT FOUND
**What exists:** Medusa Translation Module and Payload native localization (i18n) support in framework packages.
**What is missing:** Persian (`fa`) locale default configuration in project config files.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/translation`, `payload/packages/translations` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Translation Module, Payload i18n. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa Translation Module and Payload native localization (i18n) support in framework packages.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Translation Module, Payload i18n.
**Required Work:** Set Persian (`fa`) as active default locale in project configuration files.
**Conclusion:** Native framework capability; project localization configuration missing.

### 92. جستجوی پیشرفته (Advanced Search Engine Integration)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `medusa/packages/modules/search`, `payload/packages/plugin-search` | Project integration: NOT FOUND
**What exists:** Medusa Search Module interface and Payload Search Plugin (`@payloadcms/plugin-search`).
**What is missing:** Configuration with external search engine instance (Meilisearch / Algolia / Elasticsearch).

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `medusa/packages/modules/search`, `payload/packages/plugin-search` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Search Engine Instance (Meilisearch / Algolia). (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Medusa Search Module interface and Payload Search Plugin (`@payloadcms/plugin-search`).)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Search Engine Instance (Meilisearch / Algolia).
**Required Work:** Connect Meilisearch or Algolia credentials in project configuration files.
**Conclusion:** Native framework capability ready for external search engine integration.

### 93. پیشنهاد محصول (Product Recommendation Engine)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No recommendation service found in repository.
**What exists:** None.
**What is missing:** Recommendation service (collaborative filtering or co-purchased item algorithm).

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product & Order Modules. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product & Order Modules.
**Required Work:** Develop product recommendation workflow based on co-purchased items.
**Conclusion:** Capability absent.

### 94. کیف پول (Customer Wallet System)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No wallet entity or module found in repository.
**What exists:** None.
**What is missing:** Customer Wallet database entity, balance top-up API, payment provider for wallet balance.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Payment & Customer Modules. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Payment & Customer Modules.
**Required Work:** Build custom Medusa module for Wallet and Payment Provider plugin using wallet balance.
**Conclusion:** Capability absent.

### 95. گزارش سود (Profit & Margin Reporting)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No COGS (Cost of Goods Sold) model found in repository.
**What exists:** Item selling prices in Medusa Pricing Module.
**What is missing:** Cost price (COGS) field on product variants, margin calculator service, profit report exporter.

### Evidence
- **Source:** Framework capability: NO | Project implementation: NOT FOUND.
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Medusa Product Module extension or metadata. (installed in monorepo packages, project integration missing).
- **Backend:** No backend route or service implemented for project.
- **Database:** N/A or model missing.
- **Frontend/Admin:** N/A
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Medusa Product Module extension or metadata.
**Required Work:** Store cost price in variant metadata and build profit calculation workflow script.
**Conclusion:** Capability absent.

### 96. Audit Log (Administrative Action Audit Logging)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** Framework capability: `payload/packages/payload` | Project integration: NOT FOUND
**What exists:** Payload CMS document versions, change history, and user attribution on edits.
**What is missing:** Global admin action audit logging table in Medusa backend.

### Evidence
- **Source:** Framework capability: YES | Project implementation: NOT VERIFIED / NOT FOUND. (Framework capability: `payload/packages/payload` | Project integration: NOT FOUND)
- **Configuration:** Project configuration missing (no project medusa-config.ts or payload.config.ts).
- **Dependencies:** Payload CMS Versioning / Custom Medusa Subscriber. (installed in monorepo packages, project integration missing).
- **Backend:** Framework API/Service natively available in monorepo packages. (Payload CMS document versions, change history, and user attribution on edits.)
- **Database:** Framework database models exist in package sources; no active project database migration/instance configured.
- **Frontend/Admin:** Admin UI available in framework packages; custom project storefront/admin app not deployed.
- **Authentication/Authorization:** Authentication / Access control not configured for project instance.
- **Tests:** Framework test suites exist in monorepo; no project-specific integration tests.
- **Runtime Verification:** Docker infrastructure present (`docker-compose.yml`, Nginx), but application project configurations are absent.

**Dependencies:** Payload CMS Versioning / Custom Medusa Subscriber.
**Required Work:** Enable versions and audit logging on Payload collections and Medusa admin events.
**Conclusion:** Native Payload framework capability; project configuration missing.

## Audit Summary

### Repository Reality
The **Depix E-commerce** repository (`depix-ecommerce`) is configured as a monorepo containing upstream source code for two frameworks:
1. **Medusa v2 (`medusa/`)**: E-commerce backend engine.
2. **Payload CMS v4 (`payload/`)**: Content backend, CMS, and admin platform engine.
3. **Infrastructure (`infrastructure/`, `docker-compose.yml`)**: Centralized local Docker orchestration and Nginx reverse proxy.

While the shared infrastructure and container orchestration are fully functional (`docker-compose.yml` and `infrastructure/nginx/nginx.conf`), **neither application framework has been configured for custom project execution**, and **no storefront frontend application exists** in the repository. As a result, the actual project implementation score is **0.0%**.

### Native Features
Of the 96 audited features, **56 features (58.3%)** are supported natively by packages in `medusa/packages/*` and `payload/packages/*`. However, these are framework capabilities rather than project implementations because:
- No custom `medusa-config.js` / `medusa-config.ts` project configuration exists in `medusa/`.
- No custom `payload.config.ts` project configuration exists in `payload/`.
- No custom collections, globals, plugins, or subscribers have been created for the project.

### Features Requiring Integration
**6 features (6.3%)** require external services or third-party provider integrations that cannot be fulfilled by framework capabilities alone:
- **Iranian Payment Gateways (`#24`)**: ZarinPal / Shaparak plugin needed.
- **Iranian SMS OTP Auth & Notifications (`#42`, `#77`, `#78`)**: Kavenegar / FarazSMS API integration needed.
- **Transactional Email (`#81`)**: SMTP / Resend credentials needed.
- **CDN Edge & Image Optimization (`#76`)**: Image CDN / Sharp / Cloudflare Images setup needed.

### Features Not Implemented
**20 features (20.8%)** have no native implementation in either framework core or the project:
- Product Reviews & Ratings (`#29`, `#30`, `#49`, `#50`)
- Wishlist (`#41`)
- Related Products & Featured Badges (`#36`, `#37`)
- Product Comparison (`#40`)
- Invoice Generation (`#45`)
- Blog Comments (`#60`)
- Product & Article JSON-LD Schema (`#73`, `#74`)
- Back in Stock Alerts (`#79`)
- Notification Center UI (`#80`)
- Price Change Alerts (`#83`)
- Sales, Profit, and Custom Analytics Reports (`#55`, `#95`)
- Product Video Support (`#69`)
- Product Recommendation Engine (`#93`)
- Customer Wallet System (`#94`)

### Highest-Priority Missing Dependencies
To transition the workspace from raw framework source code into an active, functional e-commerce platform, the following foundational items must be created first:
1. **Workspace Project Configurations**:
   - `medusa-config.ts` inside `medusa/` to initialize the Medusa application server.
   - `payload.config.ts` inside `payload/` to initialize Payload CMS collections.
2. **Storefront Frontend Application**:
   - A Next.js / Remix application package (e.g., `apps/storefront/` or root storefront) connecting to Medusa Store API and Payload CMS REST/GraphQL APIs.
3. **Local Iranian Gateway Plugins**:
   - Medusa Payment Provider Plugin for ZarinPal.
   - Medusa Auth / Notification Provider Plugin for Iranian SMS OTP (Kavenegar / FarazSMS).

### Recommended Implementation Order

```text
Phase 1 — Core Infrastructure & Application Setup (Foundational Prerequisites)
          ├── Create workspace `medusa/medusa-config.ts` and initialize Medusa app
          ├── Create workspace `payload/payload.config.ts` and initialize Payload CMS
          └── Initialize Storefront web application package (Next.js)

Phase 2 — Authentication & Localization
          ├── Implement Medusa Iranian SMS OTP Auth Provider plugin
          ├── Configure Persian (`fa`) locale and Jalali calendar support
          └── Build Storefront Login / Register pages

Phase 3 — Core Commerce & Payment Integration
          ├── Implement Medusa Iranian Payment Provider plugin (ZarinPal / Shaparak)
          ├── Configure Shipping Options & Service Zones in Medusa Admin
          └── Build Storefront Cart, Catalog, PDP, and Checkout wizard

Phase 4 — CMS & Content Collections
          ├── Define Payload CMS Collections (Pages, Posts, Categories, Banners)
          └── Connect Storefront to Payload CMS APIs (Header, Footer, Blog, Static Pages)

Phase 5 — Essential E-Commerce Extensions
          ├── Build Product Reviews & Ratings collection/module in Payload or Medusa
          └── Implement Customer Wishlist module/metadata sync

Phase 6 — SEO, Notifications, & Performance
          ├── Register `@payloadcms/plugin-seo` and build dynamic sitemap / JSON-LD routes
          ├── Wire order status events to SMS notification subscribers
          └── Configure Nginx caching headers and image CDN

Phase 7 — Advanced Reporting & Custom Features
          ├── Build PDF Invoice generation service
          ├── Implement Customer Wallet system
          └── Build custom Sales & COGS Profit/Margin export reports
```

---

## Implementation Backlog

| Priority | Feature | Current Status | Implementation | Main Missing Work | Dependencies |
| :---: | --- | :---: | :---: | --- | --- |
| **P0** | Basic Admin Panel (`#13`) | 🔵 NATIVE_AVAILABLE | 0% | Create `medusa-config.ts` & `payload.config.ts` workspace configs | Medusa & Payload Core |
| **P0** | Home Page (`#1`) | ⚪ FRONTEND_ONLY | 0% | Initialize Next.js storefront application | Storefront Package |
| **P0** | Product Management (`#14`) | 🔵 NATIVE_AVAILABLE | 0% | Deploy Medusa server and configure product catalog seed | Medusa Config |
| **P0** | Category Management (`#15`) | 🔵 NATIVE_AVAILABLE | 0% | Configure category tree in Medusa Admin | Medusa Product Module |
| **P0** | Cart Management (`#21`) | 🔵 NATIVE_AVAILABLE | 0% | Connect storefront cart drawer to Medusa Cart Store API | Medusa Cart Module |
| **P0** | Checkout (`#23`) | 🔵 NATIVE_AVAILABLE | 0% | Build storefront multi-step checkout wizard | Medusa Cart & Payment |
| **P0** | Payment Gateway (`#24`) | 🟠 INTEGRATION_REQUIRED | 0% | Build Medusa payment provider plugin for ZarinPal | ZarinPal API |
| **P1** | Registration & Login (`#17`) | ⚪ FRONTEND_ONLY | 0% | Build Login/Register forms on storefront | Medusa Auth Module |
| **P1** | SMS OTP Login (`#42`) | 🟠 INTEGRATION_REQUIRED | 0% | Build Medusa auth provider plugin for Kavenegar SMS OTP | Kavenegar API |
| **P1** | Customer Profile UI (`#18`) | ⚪ FRONTEND_ONLY | 0% | Build customer account dashboard on storefront | Medusa Customer Module |
| **P1** | Shipping Methods (`#26`) | 🔵 NATIVE_AVAILABLE | 0% | Configure shipping options in Medusa Admin | Medusa Fulfillment |
| **P1** | Order Placement (`#22`) | 🔵 NATIVE_AVAILABLE | 0% | Connect storefront checkout submit to cart complete API | Medusa Order Module |
| **P1** | Product Catalog (`#7`) | ⚪ FRONTEND_ONLY | 0% | Build catalog grid component fetching from Medusa API | Medusa Product API |
| **P1** | Product Details Page (`#9`) | ⚪ FRONTEND_ONLY | 0% | Build PDP component with variant selector | Medusa Product API |
| **P1** | Weblog System (`#56`) | 🔵 NATIVE_AVAILABLE | 0% | Define `Posts` collection in project Payload config | Payload CMS |
| **P2** | Product Reviews (`#29`) | 🔴 NOT_IMPLEMENTED | 0% | Create `Reviews` collection in Payload CMS or Medusa module | Customer Auth |
| **P2** | Product Ratings (`#30`) | 🔴 NOT_IMPLEMENTED | 0% | Implement average score calculation on product metadata | Product Reviews (#29) |
| **P2** | Discount / Coupons (`#28`) | 🔵 NATIVE_AVAILABLE | 0% | Add coupon code input to storefront checkout | Medusa Promotion Module |
| **P2** | Wishlist (`#41`) | 🔴 NOT_IMPLEMENTED | 0% | Build custom Medusa Wishlist module or metadata sync | Medusa Customer Module |
| **P2** | Basic Technical SEO (`#62`) | 🔵 NATIVE_AVAILABLE | 0% | Add dynamic `sitemap.xml` and `robots.txt` storefront routes | Payload SEO Plugin |
| **P2** | Article Management (`#57`) | 🔵 NATIVE_AVAILABLE | 0% | Configure Lexical editor on `Posts` in Payload CMS | Payload CMS |
| **P2** | Order Status SMS (`#78`) | 🟠 INTEGRATION_REQUIRED | 0% | Register subscriber for order events calling SMS API | Kavenegar SMS API |
| **P2** | Email Notifications (`#81`) | 🟠 INTEGRATION_REQUIRED | 0% | Configure SMTP credentials and design HTML email templates | SMTP / Resend |
| **P3** | Invoice Generation (`#45`) | 🔴 NOT_IMPLEMENTED | 0% | Build PDF invoice generation service for orders | Medusa Order Module |
| **P3** | Product Comparison (`#40`) | 🔴 NOT_IMPLEMENTED | 0% | Build product comparison matrix table on storefront | Storefront UI |
| **P3** | Back in Stock Alert (`#79`) | 🔴 NOT_IMPLEMENTED | 0% | Create stock alert subscription model and inventory listener | Medusa Inventory |
| **P3** | Customer Wallet (`#94`) | 🔴 NOT_IMPLEMENTED | 0% | Build Wallet module and Payment Provider for store credit | Medusa Payment Module |
| **P3** | Profit & Margin Report (`#95`) | 🔴 NOT_IMPLEMENTED | 0% | Add COGS cost price to variant metadata and build profit report | Medusa Pricing Module |
