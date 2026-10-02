# Depix E-commerce
# Complete Technical Audit & Project Audit Report (Evidence-First Protocol)

## Executive Summary

This document presents a comprehensive, evidence-based **Full Technical Audit** for the **Depix E-commerce** workspace (`depix-ecommerce`). The repository is structured as a monorepo containing two core framework codebases and shared infrastructure:
1. **`medusa/`**: Medusa v2 framework source repository operating as the E-commerce Backend engine.
2. **`payload/`**: Payload CMS v4 framework source repository operating as the Content Backend / CMS / Admin engine.
3. **`infrastructure/`**: Centralized Docker configurations, Nginx reverse proxy configuration (`infrastructure/nginx/nginx.conf`), and orchestration files.

### Audit Principles & Framework vs Project Distinction
- **Source-Code Verified Audit:** Every status assignment is strictly backed by actual repository source files, module configurations, database models, routes, and package configurations in this workspace.
- **Framework Capability vs Project Implementation:** Capabilities provided natively by framework packages in `medusa/packages/*` or `payload/packages/*` that are **not** configured, integrated, or deployed within a project application flow in this workspace are recorded as supporting evidence (`Framework Capability: YES`), but classified as `🔴 NOT_IMPLEMENTED` with **0% project implementation**.
- **No False Positives & Anti-False-Negative Rule:** Package presence in `node_modules` or monorepo source trees does NOT constitute project implementation. Features are only marked `🟢 IMPLEMENTED` if actually integrated, configured, wired to data models/APIs, and deployable in this project. Conversely, absence of specific expected filenames (such as `medusa-config.ts` or `payload.config.ts`) was not assumed to mean absence until repository-wide concept, terminology, dependency, route, model, and infrastructure searches were completed across all workspace directories.
- **Complete Removal of Native Available:** The status `🔵 NATIVE_AVAILABLE` has been completely removed in accordance with strict audit requirements. Framework capability is recorded purely as evidence.

---

## Overall Status Summary

| Status Category | Symbol | Count | Percentage of Total (96 Features) |
|---|:---:|---:|---:|
| **IMPLEMENTED** | 🟢 | 0 | 0.0% |
| **PARTIAL** | 🟡 | 0 | 0.0% |
| **INTEGRATION_REQUIRED** | 🟠 | 6 | 6.3% |
| **NOT_IMPLEMENTED** | 🔴 | 76 | 79.2% |
| **FRONTEND_ONLY / STOREFRONT** | ⚪ | 14 | 14.6% |
| **TOTAL** | | **96** | **100.0%** |

---

## Scores

### A. Actual Project Implementation Score
$$\text{Actual Completion} = \frac{\text{IMPLEMENTED} + (0.5 \times \text{PARTIAL})}{\text{Total Features}} = \frac{0 + 0}{96} = 0.0\%$$

*The workspace repository contains framework source trees (`medusa/` and `payload/`) and central infrastructure (`docker-compose.yml`, `infrastructure/nginx/nginx.conf`), but zero custom application business logic or storefront app implemented.*

### B. Framework Capability Score (Informational Only)
$$\text{Framework Capability} = \frac{\text{Features with Framework Capability YES}}{\text{Total Features}} = \frac{62}{96} = 64.6\%$$

*The underlying frameworks (Medusa v2 and Payload CMS v4) possess built-in architectural capabilities for 62 of the 96 features. However, framework capability is supporting evidence only and does NOT constitute project completion.*

---

## Feature Matrix by Category

| Category | Total | 🟢 Implemented | 🟡 Partial | 🟠 Integration Required | 🔴 Not Implemented | ⚪ Frontend Only |
|---|---:|---:|---:|---:|---:|---:|
| **Storefront / Content** | 12 | 0 | 0 | 0 | 0 | 12 |
| **Admin / Product Management** | 8 | 0 | 0 | 0 | 6 | 2 |
| **Commerce** | 30 | 0 | 0 | 2 | 28 | 0 |
| **Admin / Reporting** | 5 | 0 | 0 | 0 | 5 | 0 |
| **Blog / CMS** | 6 | 0 | 0 | 0 | 6 | 0 |
| **SEO** | 15 | 0 | 0 | 1 | 14 | 0 |
| **Notifications** | 8 | 0 | 0 | 3 | 5 | 0 |
| **Reports / Infrastructure / Advanced** | 12 | 0 | 0 | 0 | 12 | 0 |
| **TOTAL** | **96** | **0** | **0** | **6** | **76** | **14** |

---

## Detailed Feature Audit

### 1. صفحه اصلی (Home Page)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Nginx reverse proxy configuration in `infrastructure/nginx/nginx.conf` proxies `/` route.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront frontend package / repository. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Nginx reverse proxy configuration in `infrastructure/nginx/nginx.conf` proxies `/` route.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Complete Storefront frontend web application (e.g., Next.js / Remix / Nuxt).).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront application directory present in workspace root.. Framework availability (Nginx reverse proxy configuration in `infrastructure/nginx/nginx.conf` proxies `/` route.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Build Next.js storefront application and connect to Medusa Store API and Payload CMS API.

### 2. Header / Footer / منو (Header / Footer / Menu)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Payload CMS framework package `payload/packages/plugin-nested-docs` natively available for nested menu structures.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront frontend application, Payload Globals/Collections. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Payload CMS framework package `payload/packages/plugin-nested-docs` natively available for nested menu structures.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Storefront Header, Footer, and Menu navigation UI components.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront application in repository.. Framework availability (Payload CMS framework package `payload/packages/plugin-nested-docs` natively available for nested menu structures.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Configure navigation global in Payload CMS and render in Storefront UI.

### 3. طراحی Responsive (Responsive Design)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Payload Admin UI (`payload/packages/ui`) contains responsive CSS/React layouts.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront CSS framework setup. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Payload Admin UI (`payload/packages/ui`) contains responsive CSS/React layouts.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Responsive Tailwind CSS / CSS grid/flex layout for Storefront.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront application in workspace.. Framework availability (Payload Admin UI (`payload/packages/ui`) contains responsive CSS/React layouts.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Implement mobile-first responsive layout in storefront app.

### 4. UI اختصاصی (Custom UI)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Default framework assets in `medusa/` and `payload/`.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Frontend design system and UI library. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Default framework assets in `medusa/` and `payload/`.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Custom design system, branding theme, custom React components.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront application in workspace.. Framework availability (Default framework assets in `medusa/` and `payload/`.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Build custom UI theme and design system for storefront.

### 5. درباره ما (About Us)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Payload CMS core package (`payload/packages/payload`) supports static pages capability.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload Pages collection, Storefront page route. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Payload CMS core package (`payload/packages/payload`) supports static pages capability.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (About Us page collection item in Payload CMS and frontend page route.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront routing app found.. Framework availability (Payload CMS core package (`payload/packages/payload`) supports static pages capability.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Create About Us page in Payload CMS and route in Storefront.

### 6. تماس با ما (Contact Us)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Payload Form Builder plugin (`payload/packages/plugin-form-builder`).
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload Form Builder, Storefront UI form. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Payload Form Builder plugin (`payload/packages/plugin-form-builder`).`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Contact form component and submission API handler in storefront.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront contact route or form component.. Framework availability (Payload Form Builder plugin (`payload/packages/plugin-form-builder`).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Configure contact form in Payload CMS and build UI on storefront.

### 7. نمایش محصولات (Product Listing / Catalog)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Medusa Product Module API (`GET /store/products`) in `medusa/packages/medusa/src/api/store/products`.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product API, Storefront UI. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Medusa Product Module API (`GET /store/products`) in `medusa/packages/medusa/src/api/store/products`.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Storefront product catalog grid, filters, and product card components.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront catalog app found.. Framework availability (Medusa Product Module API (`GET /store/products`) in `medusa/packages/medusa/src/api/store/products`.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Implement product catalog page in storefront fetching from Medusa API.

### 8. دسته‌بندی محصولات (Product Categories Listing)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Medusa Product Category API (`GET /store/product-categories`) in `medusa/packages/medusa/src/api/store/product-categories`.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module, Storefront UI. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Medusa Product Category API (`GET /store/product-categories`) in `medusa/packages/medusa/src/api/store/product-categories`.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Category listing page and category navigation menu in storefront.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront category page.. Framework availability (Medusa Product Category API (`GET /store/product-categories`) in `medusa/packages/medusa/src/api/store/product-categories`.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Fetch product categories from Medusa API and render in storefront.

### 9. صفحه محصول (Product Details Page)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Medusa Product API (`GET /store/products/:id`) in `medusa/packages/medusa/src/api/store/products`.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product & Pricing Modules, Storefront PDP UI. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Medusa Product API (`GET /store/products/:id`) in `medusa/packages/medusa/src/api/store/products`.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Storefront PDP (Product Details Page) component, variant selector, price display.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront product detail route.. Framework availability (Medusa Product API (`GET /store/products/:id`) in `medusa/packages/medusa/src/api/store/products`.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Create product detail page component in storefront app.

### 10. گالری تصاویر (Product Image Gallery)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Medusa product schema supports `images` array in `medusa/packages/modules/product/src/models/product.ts`.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront image slider component. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Medusa product schema supports `images` array in `medusa/packages/modules/product/src/models/product.ts`.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Frontend image carousel / lightbox / thumbnail selector component.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront media components.. Framework availability (Medusa product schema supports `images` array in `medusa/packages/modules/product/src/models/product.ts`.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Build product image gallery component in storefront.

### 11. جستجوی ساده (Simple Search UI)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Medusa Product API query filter (`GET /store/products?q=`) in `medusa/packages/medusa/src/api/store/products`.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront header search input. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Medusa Product API query filter (`GET /store/products?q=`) in `medusa/packages/medusa/src/api/store/products`.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Search input header bar and search results page on storefront.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No search bar component in storefront.. Framework availability (Medusa Product API query filter (`GET /store/products?q=`) in `medusa/packages/medusa/src/api/store/products`.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Add search input control to storefront header.

### 12. سفارش از WhatsApp (WhatsApp Order Link)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront PDP / Cart UI. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No WhatsApp order button component.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Build helper function formatting product/cart details into WhatsApp URL link.

### 13. پنل مدیریت ساده (Basic Admin Panel)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Admin Dashboard package and Payload Admin UI package exist in framework source trees.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Admin, Payload Admin. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa Admin Dashboard package and Payload Admin UI package exist in framework source trees.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/admin/dashboard`, `payload/packages/ui` | Project integration: NOT FOUND. Framework availability (Medusa Admin Dashboard package and Payload Admin UI package exist in framework source trees.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "پنل مدیریت ساده (Basic Admin Panel)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure and deploy admin dashboard applications.

### 14. مدیریت محصولات (Product Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Full CRUD capabilities for products, titles, descriptions, options, and variants in Medusa Product Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Full CRUD capabilities for products, titles, descriptions, options, and variants in Medusa Product Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND. Framework availability (Full CRUD capabilities for products, titles, descriptions, options, and variants in Medusa Product Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت محصولات (Product Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Deploy Medusa backend and use Admin API/UI for product CRUD.

### 15. مدیریت دسته‌بندی (Category Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Hierarchical category tree management service and API (`/admin/product-categories`) in Medusa Product Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Hierarchical category tree management service and API (`/admin/product-categories`) in Medusa Product Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND. Framework availability (Hierarchical category tree management service and API (`/admin/product-categories`) in Medusa Product Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت دسته‌بندی (Category Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure and manage product categories via Medusa Admin API.

### 16. مدیریت بنر (Banner Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payload CMS Global / Collection architectural capabilities for slide banners.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Payload CMS Global / Collection architectural capabilities for slide banners.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload` | Project integration: NOT FOUND. Framework availability (Payload CMS Global / Collection architectural capabilities for slide banners.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت بنر (Banner Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Define `Banners` collection in project Payload configuration.

### 17. ثبت‌نام و ورود (Registration & Login UI/Flow)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Medusa Auth Module (`medusa/packages/modules/auth`) provides `/store/auth/emailpass` endpoints.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Auth Module, Storefront Auth UI. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Medusa Auth Module (`medusa/packages/modules/auth`) provides `/store/auth/emailpass` endpoints.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Storefront Sign Up and Login pages and form handlers.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No storefront auth pages in repository.. Framework availability (Medusa Auth Module (`medusa/packages/modules/auth`) provides `/store/auth/emailpass` endpoints.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Build customer login and registration pages on storefront.

### 18. پروفایل کاربری (User Profile UI)

**Status:** ⚪ FRONTEND_ONLY / STOREFRONT

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** PARTIAL — Framework provides supporting APIs/collections, but storefront UI is absent. Medusa Customer Module API (`/store/customers/me`) in `medusa/packages/modules/customer`.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Customer Module, Storefront UI. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Framework Store API route natively available (`Medusa Customer Module API (`/store/customers/me`) in `medusa/packages/modules/customer`.`).
- **Frontend / Admin:** Storefront UI / route component missing in workspace (Customer profile page, account settings forms, and address manager UI on storefront.).
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No customer account dashboard in storefront.. Framework availability (Medusa Customer Module API (`/store/customers/me`) in `medusa/packages/modules/customer`.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Create customer profile dashboard page on storefront.

### 19. مدیریت آدرس‌ها (Address Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Customer address CRUD API (`/store/customers/me/addresses`) and entity in Medusa Customer Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Customer Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Customer address CRUD API (`/store/customers/me/addresses`) and entity in Medusa Customer Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND. Framework availability (Customer address CRUD API (`/store/customers/me/addresses`) and entity in Medusa Customer Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت آدرس‌ها (Address Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Integrate Medusa Customer Address API with storefront address book component.

### 20. خرید مهمان (Guest Checkout)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Cart Module allows creating carts with `email` without requiring `customer_id`.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Cart Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa Cart Module allows creating carts with `email` without requiring `customer_id`.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND. Framework availability (Medusa Cart Module allows creating carts with `email` without requiring `customer_id`.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "خرید مهمان (Guest Checkout)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Implement guest checkout form and email prompt on storefront.

### 21. سبد خرید (Cart Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Complete Cart lifecycle API (`/store/carts`, add/update/remove line items) in Medusa Cart Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Cart Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Complete Cart lifecycle API (`/store/carts`, add/update/remove line items) in Medusa Cart Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND. Framework availability (Complete Cart lifecycle API (`/store/carts`, add/update/remove line items) in Medusa Cart Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "سبد خرید (Cart Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Connect storefront cart drawer to Medusa Cart Store API.

### 22. ثبت سفارش (Order Placement)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Order creation from completed cart workflow (`POST /store/carts/:id/complete`) in Medusa Order Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Cart & Order Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Order creation from completed cart workflow (`POST /store/carts/:id/complete`) in Medusa Order Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND. Framework availability (Order creation from completed cart workflow (`POST /store/carts/:id/complete`) in Medusa Order Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "ثبت سفارش (Order Placement)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Wire storefront checkout submit button to cart completion API.

### 23. Checkout

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Address selection, shipping method assignment, and payment collection initialization APIs in Medusa core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Cart, Fulfillment, Payment Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Address selection, shipping method assignment, and payment collection initialization APIs in Medusa core.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/cart`, `medusa/packages/modules/payment` | Project integration: NOT FOUND. Framework availability (Address selection, shipping method assignment, and payment collection initialization APIs in Medusa core.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "Checkout", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build multi-step checkout UI in storefront app.

### 24. درگاه پرداخت (Payment Gateway - Single)

**Status:** 🟠 INTEGRATION_REQUIRED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Payment Module engine and default system payment provider (`system`).
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Payment Provider Plugin, Iranian Payment Gateway REST API. (installed in monorepo packages, project integration missing)..
- **Backend:** Requires external provider/service integration. (Medusa Payment Module engine and default system payment provider (`system`).)
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND. Framework availability (Medusa Payment Module engine and default system payment provider (`system`).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Build or install a Medusa payment provider plugin for Iranian payment gateway.

### 25. مدیریت تراکنش (Transaction Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payment collections, payment captures, refunds, and transaction status models in Medusa Payment Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Payment Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Payment collections, payment captures, refunds, and transaction status models in Medusa Payment Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND. Framework availability (Payment collections, payment captures, refunds, and transaction status models in Medusa Payment Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت تراکنش (Transaction Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Utilize Medusa payment capture/refund APIs in admin operations.

### 26. روش‌های ارسال (Shipping Methods)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Shipping options, fulfillment providers architecture, and shipping profile models in Medusa Fulfillment Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Fulfillment Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Shipping options, fulfillment providers architecture, and shipping profile models in Medusa Fulfillment Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND. Framework availability (Shipping options, fulfillment providers architecture, and shipping profile models in Medusa Fulfillment Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "روش‌های ارسال (Shipping Methods)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure shipping options and fulfillment providers in Medusa Admin.

### 27. محاسبه هزینه ارسال (Shipping Cost Calculation)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Flat rate and calculated price rules engine for shipping options in Medusa Fulfillment Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Fulfillment & Pricing Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Flat rate and calculated price rules engine for shipping options in Medusa Fulfillment Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND. Framework availability (Flat rate and calculated price rules engine for shipping options in Medusa Fulfillment Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "محاسبه هزینه ارسال (Shipping Cost Calculation)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Set flat rate shipping prices or build dynamic fulfillment provider.

### 28. کد تخفیف (Discount / Coupon Code)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Promo codes, rule-based discounts, and promotion application service in Medusa Promotion Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Promotion Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Promo codes, rule-based discounts, and promotion application service in Medusa Promotion Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND. Framework availability (Promo codes, rule-based discounts, and promotion application service in Medusa Promotion Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "کد تخفیف (Discount / Coupon Code)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add coupon code input field to storefront cart/checkout.

### 29. نظرات محصولات (Product Reviews)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Custom Medusa Module or Payload CMS collection. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No review database model or module found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "نظرات محصولات (Product Reviews)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build custom `Reviews` collection in Payload CMS or custom Medusa module.

### 30. امتیازدهی محصولات (Product Ratings)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Product Reviews feature. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No rating model found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "امتیازدهی محصولات (Product Ratings)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add average rating calculation and field to product metadata or review module.

### 31. مدیریت سفارش‌ها (Order Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Order status state machine, fulfillment creation, cancellation, item edits in Medusa Order Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Order Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Order status state machine, fulfillment creation, cancellation, item edits in Medusa Order Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND. Framework availability (Order status state machine, fulfillment creation, cancellation, item edits in Medusa Order Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت سفارش‌ها (Order Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Use Medusa Admin for order processing and status management.

### 32. مدیریت موجودی (Inventory Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Multi-location inventory tracking, stock reservations, and inventory levels in Medusa Inventory Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Inventory Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Multi-location inventory tracking, stock reservations, and inventory levels in Medusa Inventory Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/inventory`, `medusa/packages/modules/stock-location` | Project integration: NOT FOUND. Framework availability (Multi-location inventory tracking, stock reservations, and inventory levels in Medusa Inventory Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت موجودی (Inventory Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Manage inventory levels and stock locations via Medusa Admin API.

### 33. احراز هویت و دسترسی پایه (Basic Auth & RBAC)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa RBAC module, JWT sessions, Admin and Customer authentication in framework source code.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa RBAC & Auth Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa RBAC module, JWT sessions, Admin and Customer authentication in framework source code.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/rbac`, `medusa/packages/modules/auth` | Project integration: NOT FOUND. Framework availability (Medusa RBAC module, JWT sessions, Admin and Customer authentication in framework source code.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "احراز هویت و دسترسی پایه (Basic Auth & RBAC)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure custom RBAC roles and permissions policies.

### 34. ویژگی‌های محصول (Product Attributes)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Product options and key-value JSONB `metadata` field on products in Medusa Product Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Product options and key-value JSONB `metadata` field on products in Medusa Product Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND. Framework availability (Product options and key-value JSONB `metadata` field on products in Medusa Product Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "ویژگی‌های محصول (Product Attributes)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Define product attributes in product metadata and render on storefront.

### 35. رنگ، سایز و تنوع محصول (Product Variants - Color, Size)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Product variants with arbitrary option combinations (e.g., Size, Color) in Medusa Product Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Product variants with arbitrary option combinations (e.g., Size, Color) in Medusa Product Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND. Framework availability (Product variants with arbitrary option combinations (e.g., Size, Color) in Medusa Product Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "رنگ، سایز و تنوع محصول (Product Variants - Color, Size)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Create product variants with options in Medusa Admin and build variant selector on storefront.

### 36. محصولات مرتبط (Related Products)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module extension or metadata. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No related product relationship module found in repository.. Framework availability (Product Collections in Medusa can group products.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "محصولات مرتبط (Related Products)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Store array of related product IDs in product metadata or build custom link module.

### 37. محصولات جدید / ویژه / پرفروش (Featured / New / Best Seller Products)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product & Order Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No sales badge logic or featured tags collection in workspace custom code.. Framework availability (Product tags in Medusa (`medusa/packages/modules/product`).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "محصولات جدید / ویژه / پرفروش (Featured / New / Best Seller Products)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add custom flags to product metadata or construct sales query subscribers.

### 38. فیلتر پیشرفته محصولات (Advanced Product Filtering)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Filter parameters by price, category, collection, tags, and options in Medusa Store API.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Filter parameters by price, category, collection, tags, and options in Medusa Store API.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND. Framework availability (Filter parameters by price, category, collection, tags, and options in Medusa Store API.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "فیلتر پیشرفته محصولات (Advanced Product Filtering)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build multi-attribute filter sidebar in storefront app.

### 39. مرتب‌سازی محصولات (Product Sorting)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Sorting parameters (`created_at`, `title`, price) in Medusa `/store/products` API.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Sorting parameters (`created_at`, `title`, price) in Medusa `/store/products` API.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/product` | Project integration: NOT FOUND. Framework availability (Sorting parameters (`created_at`, `title`, price) in Medusa `/store/products` API.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مرتب‌سازی محصولات (Product Sorting)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add sort dropdown component to storefront product catalog.

### 40. مقایسه محصولات (Product Comparison)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront state management / Product options. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No comparison module or storefront component found.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مقایسه محصولات (Product Comparison)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build product comparison drawer and comparison table component in storefront.

### 41. علاقه‌مندی‌ها (Wishlist)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Customer Module & Custom Module/Plugin. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No wishlist module or entity found in repository.. Framework availability (None (Wishlist is not a core Medusa v2 module).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "علاقه‌مندی‌ها (Wishlist)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build custom Medusa module for Wishlist or store items in Customer metadata.

### 42. ورود با OTP (SMS OTP Login)

**Status:** 🟠 INTEGRATION_REQUIRED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Auth Module supports custom identity providers (`AuthIdentityProvider`).
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Auth Module, Iranian SMS Gateway REST API. (installed in monorepo packages, project integration missing)..
- **Backend:** Requires external provider/service integration. (Medusa Auth Module supports custom identity providers (`AuthIdentityProvider`).)
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/auth` | Project integration: NOT FOUND. Framework availability (Medusa Auth Module supports custom identity providers (`AuthIdentityProvider`).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Build custom Medusa Auth Provider plugin for SMS OTP.

### 43. تاریخچه سفارش‌ها (Customer Order History)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Customer order listing API (`GET /store/orders?customer_id=me`) in Medusa Order Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Order & Customer Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Customer order listing API (`GET /store/orders?customer_id=me`) in Medusa Order Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND. Framework availability (Customer order listing API (`GET /store/orders?customer_id=me`) in Medusa Order Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "تاریخچه سفارش‌ها (Customer Order History)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build customer order history page on storefront dashboard.

### 44. پیگیری سفارش (Order Tracking)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Fulfillment tracking numbers field on order fulfillments in Medusa Fulfillment Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Fulfillment Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Fulfillment tracking numbers field on order fulfillments in Medusa Fulfillment Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND. Framework availability (Fulfillment tracking numbers field on order fulfillments in Medusa Fulfillment Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "پیگیری سفارش (Order Tracking)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build guest order tracking lookup form on storefront.

### 45. صدور فاکتور (Invoice Generation)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Order Module, PDF generation library. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No invoice generation service found in workspace.. Framework availability (Order line items and amounts in Medusa Order Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "صدور فاکتور (Invoice Generation)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build workflow generating downloadable PDF invoices for completed orders.

### 46. لغو سفارش (Order Cancellation)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Order cancellation API and refund workflow (`POST /admin/orders/:id/cancel`) in Medusa Order Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Order Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Order cancellation API and refund workflow (`POST /admin/orders/:id/cancel`) in Medusa Order Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/order` | Project integration: NOT FOUND. Framework availability (Order cancellation API and refund workflow (`POST /admin/orders/:id/cancel`) in Medusa Order Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "لغو سفارش (Order Cancellation)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add order cancellation request button to customer storefront account.

### 47. تخفیف محصول / دسته‌بندی (Product & Category Discounts)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Target promotion rules restricting discounts to specific product IDs or Category IDs in Medusa Promotion Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Promotion Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Target promotion rules restricting discounts to specific product IDs or Category IDs in Medusa Promotion Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND. Framework availability (Target promotion rules restricting discounts to specific product IDs or Category IDs in Medusa Promotion Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "تخفیف محصول / دسته‌بندی (Product & Category Discounts)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure product/category promotions via Medusa Admin API.

### 48. فروش ویژه (Flash Sales / Special Deals)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Time-bounded campaign promotions with start and end dates in Medusa Promotion Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Promotion Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Time-bounded campaign promotions with start and end dates in Medusa Promotion Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND. Framework availability (Time-bounded campaign promotions with start and end dates in Medusa Promotion Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "فروش ویژه (Flash Sales / Special Deals)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure campaign in Medusa Admin and add countdown component to storefront PDP.

### 49. تأیید / رد نظرات (Review Approval / Rejection Workflow)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Product Reviews feature. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No review moderation logic found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "تأیید / رد نظرات (Review Approval / Rejection Workflow)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add approval status workflow to Payload CMS reviews collection or custom Medusa module.

### 50. پاسخ مدیر به نظر (Admin Reply to Reviews)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Product Reviews feature. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No review reply field found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "پاسخ مدیر به نظر (Admin Reply to Reviews)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add admin reply field to review schema and display on storefront.

### 51. داشبورد مدیریتی (Admin Analytics Dashboard)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Admin panel package with order metrics, sales overview, and customer list widgets.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Admin. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa Admin panel package with order metrics, sales overview, and customer list widgets.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/admin` | Project integration: NOT FOUND. Framework availability (Medusa Admin panel package with order metrics, sales overview, and customer list widgets.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "داشبورد مدیریتی (Admin Analytics Dashboard)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build and deploy Medusa Admin dashboard app.

### 52. مدیریت کاربران (Customer Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Customer listing, detail editing, customer groups, and metadata management in Medusa Customer Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Customer Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Customer listing, detail editing, customer groups, and metadata management in Medusa Customer Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND. Framework availability (Customer listing, detail editing, customer groups, and metadata management in Medusa Customer Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت کاربران (Customer Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Manage customers via Medusa Admin panel.

### 53. مدیریت مدیران (Admin User Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Admin user creation, invite system, and password reset flows in Medusa User Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa User Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Admin user creation, invite system, and password reset flows in Medusa User Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/user` | Project integration: NOT FOUND. Framework availability (Admin user creation, invite system, and password reset flows in Medusa User Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت مدیران (Admin User Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Invite admin users via Medusa Admin API.

### 54. نقش‌ها و دسترسی‌ها (Roles & Permissions)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Granular access policy definitions for routes and resources in Medusa RBAC Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa RBAC Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Granular access policy definitions for routes and resources in Medusa RBAC Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/rbac` | Project integration: NOT FOUND. Framework availability (Granular access policy definitions for routes and resources in Medusa RBAC Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "نقش‌ها و دسترسی‌ها (Roles & Permissions)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure permission policies for custom admin roles.

### 55. گزارش فروش (Sales Reporting)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Order Module, CSV export utility. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No custom sales report exporter found in repository.. Framework availability (Basic order metrics in Medusa Admin.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "گزارش فروش (Sales Reporting)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build custom sales report exporter service/API endpoint.

### 56. وبلاگ (Blog Base System)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Full CMS capabilities in Payload for posts, rich text content, and draft/publish workflows.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Full CMS capabilities in Payload for posts, rich text content, and draft/publish workflows.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload` | Project integration: NOT FOUND. Framework availability (Full CMS capabilities in Payload for posts, rich text content, and draft/publish workflows.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "وبلاگ (Blog Base System)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Define `Posts` collection in project Payload CMS config file.

### 57. مدیریت مقالات (Article Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Lexical rich text editor, article drafting, media embedding, and scheduled publishing in Payload framework.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Lexical rich text editor, article drafting, media embedding, and scheduled publishing in Payload framework.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload`, `payload/packages/richtext-lexical` | Project integration: NOT FOUND. Framework availability (Lexical rich text editor, article drafting, media embedding, and scheduled publishing in Payload framework.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت مقالات (Article Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure Lexical editor on `Posts` collection in Payload CMS.

### 58. دسته‌بندی مقالات (Blog Categories)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payload relationship fields allow linking posts to category collections (with hierarchy via plugin-nested-docs).
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Payload relationship fields allow linking posts to category collections (with hierarchy via plugin-nested-docs).
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload`, `payload/packages/plugin-nested-docs` | Project integration: NOT FOUND. Framework availability (Payload relationship fields allow linking posts to category collections (with hierarchy via plugin-nested-docs).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "دسته‌بندی مقالات (Blog Categories)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Define `BlogCategories` collection in Payload config.

### 59. تگ مقالات (Blog Tags)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Multi-select relationship or array tag field capabilities in Payload CMS.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Multi-select relationship or array tag field capabilities in Payload CMS.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload` | Project integration: NOT FOUND. Framework availability (Multi-select relationship or array tag field capabilities in Payload CMS.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "تگ مقالات (Blog Tags)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Define `Tags` collection in Payload config.

### 60. نظرات مقالات (Blog Comments)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No blog comment collection found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "نظرات مقالات (Blog Comments)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Create `BlogComments` collection in Payload CMS with moderation hooks.

### 61. SEO مقالات (Blog Article SEO)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Official Payload SEO Plugin provides meta title, description, social preview image, and evaluation tools.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload SEO Plugin. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Official Payload SEO Plugin provides meta title, description, social preview image, and evaluation tools.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND. Framework availability (Official Payload SEO Plugin provides meta title, description, social preview image, and evaluation tools.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "SEO مقالات (Blog Article SEO)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Register `@payloadcms/plugin-seo` in project Payload configuration.

### 62. SEO فنی پایه (Basic Technical SEO)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Canonical URL, robots meta tags, title template generation in Payload SEO plugin.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload SEO Plugin, Storefront routes. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Canonical URL, robots meta tags, title template generation in Payload SEO plugin.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND. Framework availability (Canonical URL, robots meta tags, title template generation in Payload SEO plugin.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "SEO فنی پایه (Basic Technical SEO)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build `sitemap.xml` and `robots.txt` dynamic routes in storefront app.

### 63. چند درگاه پرداخت (Multiple Payment Gateways)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Payment Module supports multiple simultaneous payment providers per region.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Payment Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa Payment Module supports multiple simultaneous payment providers per region.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND. Framework availability (Medusa Payment Module supports multiple simultaneous payment providers per region.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "چند درگاه پرداخت (Multiple Payment Gateways)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure multiple payment provider plugins in Medusa config.

### 64. کمپین‌های فروش (Sales Campaigns)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Campaign management with spending budgets, identifier codes, start/end dates in Medusa Promotion Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Promotion Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Campaign management with spending budgets, identifier codes, start/end dates in Medusa Promotion Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/promotion` | Project integration: NOT FOUND. Framework availability (Campaign management with spending budgets, identifier codes, start/end dates in Medusa Promotion Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "کمپین‌های فروش (Sales Campaigns)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Create campaigns via Medusa Admin and build landing pages on storefront.

### 65. سیستم بازگشت وجه (Refund System)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Refund creation workflow, payment refund captures, and order edits in Medusa core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Payment & Order Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Refund creation workflow, payment refund captures, and order edits in Medusa core.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/payment`, `medusa/packages/modules/order` | Project integration: NOT FOUND. Framework availability (Refund creation workflow, payment refund captures, and order edits in Medusa core.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "سیستم بازگشت وجه (Refund System)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Process refunds via Medusa Admin panel.

### 66. درخواست مرجوعی کالا (Return Request System)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Return creation, return reason configuration, and return shipping options in Medusa core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Fulfillment & Order Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Return creation, return reason configuration, and return shipping options in Medusa core.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/fulfillment`, `medusa/packages/modules/order` | Project integration: NOT FOUND. Framework availability (Return creation, return reason configuration, and return shipping options in Medusa core.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "درخواست مرجوعی کالا (Return Request System)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build return request form on customer storefront dashboard.

### 67. مدیریت کد رهگیری ارسال (Shipping Tracking Code Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Admin API to attach tracking numbers to order fulfillments in Medusa Fulfillment Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Fulfillment Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Admin API to attach tracking numbers to order fulfillments in Medusa Fulfillment Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND. Framework availability (Admin API to attach tracking numbers to order fulfillments in Medusa Fulfillment Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت کد رهگیری ارسال (Shipping Tracking Code Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Enter tracking numbers in Medusa Admin and wire SMS notification subscriber.

### 68. محدوده و قوانین ارسال پیشرفته (Advanced Shipping Zones & Rules)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Shipping zones, region assignment, and price rules (min/max cart total, weight) in Medusa Fulfillment Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Fulfillment Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Shipping zones, region assignment, and price rules (min/max cart total, weight) in Medusa Fulfillment Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/fulfillment` | Project integration: NOT FOUND. Framework availability (Shipping zones, region assignment, and price rules (min/max cart total, weight) in Medusa Fulfillment Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "محدوده و قوانین ارسال پیشرفته (Advanced Shipping Zones & Rules)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Configure shipping zones and rules in Medusa Admin.

### 69. ویدئوی محصول (Product Video Support)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module extension or metadata. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No video field on products in repository.. Framework availability (Medusa image attachments support images only.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "ویدئوی محصول (Product Video Support)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add video URL string to product metadata or Payload CMS catalog block.

### 70. سیستم نویسندگان وبلاگ (Blog Author Management)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payload CMS supports linking `Posts` to `Users` collection or custom `Authors` collection via relationship fields.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Payload CMS supports linking `Posts` to `Users` collection or custom `Authors` collection via relationship fields.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload` | Project integration: NOT FOUND. Framework availability (Payload CMS supports linking `Posts` to `Users` collection or custom `Authors` collection via relationship fields.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "سیستم نویسندگان وبلاگ (Blog Author Management)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Define `Authors` collection in Payload config.

### 71. مقالات مرتبط (Related Blog Articles)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Self-referential relationship fields in Payload CMS allow selecting related articles.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Self-referential relationship fields in Payload CMS allow selecting related articles.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload` | Project integration: NOT FOUND. Framework availability (Self-referential relationship fields in Payload CMS allow selecting related articles.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مقالات مرتبط (Related Blog Articles)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add `relatedPosts` field to `Posts` collection in project Payload config.

### 72. SEO پیشرفته (Advanced SEO Capabilities)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payload SEO Plugin provides structured metadata fields, image preview cards, and evaluation tools.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload SEO Plugin. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Payload SEO Plugin provides structured metadata fields, image preview cards, and evaluation tools.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND. Framework availability (Payload SEO Plugin provides structured metadata fields, image preview cards, and evaluation tools.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "SEO پیشرفته (Advanced SEO Capabilities)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Enable `@payloadcms/plugin-seo` in project Payload configuration.

### 73. Schema محصولات (Product JSON-LD Schema)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront PDP component. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No JSON-LD schema builder found in repository.. Framework availability (Product data in Medusa API.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "Schema محصولات (Product JSON-LD Schema)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build JSON-LD script tag generator component in Storefront PDP.

### 74. Schema مقالات (Article JSON-LD Schema)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Storefront Blog detail page. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No Article JSON-LD schema builder found in repository.. Framework availability (Blog post data in Payload CMS API.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "Schema مقالات (Article JSON-LD Schema)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Add Article JSON-LD script tag in storefront blog route.

### 75. Open Graph / Social Meta

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Open Graph title, description, and image fields generated automatically by Payload SEO plugin.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload SEO Plugin, Storefront head manager. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Open Graph title, description, and image fields generated automatically by Payload SEO plugin.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/plugin-seo` | Project integration: NOT FOUND. Framework availability (Open Graph title, description, and image fields generated automatically by Payload SEO plugin.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "Open Graph / Social Meta", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Render Open Graph meta tags in Storefront head manager.

### 76. بهینه‌سازی Performance (Performance Optimization)

**Status:** 🟠 INTEGRATION_REQUIRED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Redis caching service running in Docker Compose (`redis:7-alpine`), Nginx reverse proxy.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Redis, External CDN / Image Provider. (installed in monorepo packages, project integration missing)..
- **Backend:** Requires external provider/service integration. (Redis caching service running in Docker Compose (`redis:7-alpine`), Nginx reverse proxy.)
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
`docker-compose.yml`, `infrastructure/nginx/nginx.conf`. Framework availability (Redis caching service running in Docker Compose (`redis:7-alpine`), Nginx reverse proxy.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Configure Nginx caching headers and external image CDN provider.

### 77. پیامک OTP (SMS OTP Notification)

**Status:** 🟠 INTEGRATION_REQUIRED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Notification Module engine in framework source code.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Notification Module, Iranian SMS Gateway REST API. (installed in monorepo packages, project integration missing)..
- **Backend:** Requires external provider/service integration. (Medusa Notification Module engine in framework source code.)
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/notification` | Project integration: NOT FOUND. Framework availability (Medusa Notification Module engine in framework source code.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Develop custom Notification Provider plugin for Iranian SMS gateway.

### 78. پیامک وضعیت سفارش (Order Status SMS)

**Status:** 🟠 INTEGRATION_REQUIRED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Event-driven notification bus system in Medusa (`order.placed`, `order.fulfilled`).
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Event Bus, Notification Module, Iranian SMS Gateway. (installed in monorepo packages, project integration missing)..
- **Backend:** Requires external provider/service integration. (Event-driven notification bus system in Medusa (`order.placed`, `order.fulfilled`).)
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/notification` | Project integration: NOT FOUND. Framework availability (Event-driven notification bus system in Medusa (`order.placed`, `order.fulfilled`).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Register subscriber functions for order events triggering SMS API calls.

### 79. اعلان موجودی محصول (Back in Stock Notification)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Inventory & Notification Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No stock alert subscriber or table found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "اعلان موجودی محصول (Back in Stock Notification)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build customer stock alert subscription model and inventory update event listener.

### 80. مرکز اعلان‌ها (Notification Center UI)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Custom Notification Entity / Storefront component. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No notification center model or UI found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مرکز اعلان‌ها (Notification Center UI)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build notification storage entity and storefront notification drawer component.

### 81. اعلان ایمیلی (Email Notifications)

**Status:** 🟠 INTEGRATION_REQUIRED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payload email adapters for Nodemailer and Resend in framework packages.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: SMTP Server / Resend API. (installed in monorepo packages, project integration missing)..
- **Backend:** Requires external provider/service integration. (Payload email adapters for Nodemailer and Resend in framework packages.)
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/email-nodemailer`, `payload/packages/email-resend` | Project integration: NOT FOUND. Framework availability (Payload email adapters for Nodemailer and Resend in framework packages.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Missing / Remaining Work
Configure SMTP environment variables and design HTML email templates.

### 82. هشدار کاهش موجودی (Low Stock Admin Alert)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Stock level monitoring and inventory level entities in Medusa Inventory Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Inventory & Notification Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Stock level monitoring and inventory level entities in Medusa Inventory Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/inventory` | Project integration: NOT FOUND. Framework availability (Stock level monitoring and inventory level entities in Medusa Inventory Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "هشدار کاهش موجودی (Low Stock Admin Alert)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Create event listener on inventory update triggering admin alert.

### 83. هشدار تغییر قیمت (Price Change Alert)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Pricing & Notification Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No price tracking subscription logic found in repository.. Framework availability (Medusa Pricing Module (`medusa/packages/modules/pricing`).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "هشدار تغییر قیمت (Price Change Alert)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build price watch subscription model and pricing update event listener.

### 84. سبد خرید رهاشده (Abandoned Cart Recovery)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa tracks incomplete carts with customer email and update timestamp.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Cart & Workflow Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa tracks incomplete carts with customer email and update timestamp.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/cart` | Project integration: NOT FOUND. Framework availability (Medusa tracks incomplete carts with customer email and update timestamp.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "سبد خرید رهاشده (Abandoned Cart Recovery)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Create scheduled workflow querying inactive carts > 24 hours and sending recovery reminders.

### 85. گزارش مشتریان (Customer Reports / Analytics)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Customer purchase history, customer group relationships, and order counts in Medusa.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Customer & Order Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Customer purchase history, customer group relationships, and order counts in Medusa.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/customer` | Project integration: NOT FOUND. Framework availability (Customer purchase history, customer group relationships, and order counts in Medusa.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "گزارش مشتریان (Customer Reports / Analytics)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Query customer order metrics via Medusa Admin API.

### 86. گزارش موجودی (Inventory Reports)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Inventory level querying APIs across stock locations in Medusa Inventory Module.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Inventory Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Inventory level querying APIs across stock locations in Medusa Inventory Module.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/inventory` | Project integration: NOT FOUND. Framework availability (Inventory level querying APIs across stock locations in Medusa Inventory Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "گزارش موجودی (Inventory Reports)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Export inventory list from Medusa Admin.

### 87. گزارش تراکنش‌ها (Transaction Reports)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payment collections, captured amounts, and pending captures listing in Medusa.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Payment Module. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Payment collections, captured amounts, and pending captures listing in Medusa.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/payment` | Project integration: NOT FOUND. Framework availability (Payment collections, captured amounts, and pending captures listing in Medusa.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "گزارش تراکنش‌ها (Transaction Reports)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Filter and export payment logs from Medusa Admin.

### 88. مستندات API / Swagger (API Documentation / Swagger / OpenAPI)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa OAS generator package (`@medusajs/medusa-oas`) and Payload GraphQL Playground endpoint in framework packages.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa OAS CLI, Payload GraphQL. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa OAS generator package (`@medusajs/medusa-oas`) and Payload GraphQL Playground endpoint in framework packages.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/cli/oas`, `payload/packages/graphql` | Project integration: NOT FOUND. Framework availability (Medusa OAS generator package (`@medusajs/medusa-oas`) and Payload GraphQL Playground endpoint in framework packages.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مستندات API / Swagger (API Documentation / Swagger / OpenAPI)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Generate OAS spec file and host Swagger UI endpoint in workspace deployment.

### 89. تست‌های جامع سیستم (Comprehensive System Testing)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Extensive test suites, helpers, and fixtures built into Medusa and Payload framework repositories.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Jest, Vitest, Playwright. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Extensive test suites, helpers, and fixtures built into Medusa and Payload framework repositories.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/integration-tests`, `payload/test` | Project integration: NOT FOUND. Framework availability (Extensive test suites, helpers, and fixtures built into Medusa and Payload framework repositories.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "تست‌های جامع سیستم (Comprehensive System Testing)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Write custom E2E integration test suite for workspace e-commerce user flows.

### 90. مدیریت صفحات پیشرفته (Advanced Page Management / Page Builder)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payload Block-based layout builder fields allow assembling modular page layouts visually.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Payload Block-based layout builder fields allow assembling modular page layouts visually.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload`, `payload/packages/richtext-lexical` | Project integration: NOT FOUND. Framework availability (Payload Block-based layout builder fields allow assembling modular page layouts visually.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "مدیریت صفحات پیشرفته (Advanced Page Management / Page Builder)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Define layout blocks in project Payload CMS config file.

### 91. چندزبانه (Multi-language / Localization)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Translation Module and Payload native localization (i18n) support in framework packages.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Translation Module, Payload i18n. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa Translation Module and Payload native localization (i18n) support in framework packages.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/translation`, `payload/packages/translations` | Project integration: NOT FOUND. Framework availability (Medusa Translation Module and Payload native localization (i18n) support in framework packages.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "چندزبانه (Multi-language / Localization)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Set Persian (`fa`) as active default locale in project configuration files.

### 92. جستجوی پیشرفته (Advanced Search Engine Integration)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Medusa Search Module interface and Payload Search Plugin (`@payloadcms/plugin-search`).
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Search Engine Instance (Meilisearch / Algolia). (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Medusa Search Module interface and Payload Search Plugin (`@payloadcms/plugin-search`).
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `medusa/packages/modules/search`, `payload/packages/plugin-search` | Project integration: NOT FOUND. Framework availability (Medusa Search Module interface and Payload Search Plugin (`@payloadcms/plugin-search`).) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "جستجوی پیشرفته (Advanced Search Engine Integration)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Connect Meilisearch or Algolia credentials in project configuration files.

### 93. پیشنهاد محصول (Product Recommendation Engine)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product & Order Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No recommendation service found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "پیشنهاد محصول (Product Recommendation Engine)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Develop product recommendation workflow based on co-purchased items.

### 94. کیف پول (Customer Wallet System)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Payment & Customer Modules. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No wallet entity or module found in repository.. Framework availability (None.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "کیف پول (Customer Wallet System)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Build custom Medusa module for Wallet and Payment Provider plugin using wallet balance.

### 95. گزارش سود (Profit & Margin Reporting)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** NO — Not provided out-of-the-box by underlying framework core.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Medusa Product Module extension or metadata. (installed in monorepo packages, project integration missing)..
- **Backend:** Not found
- **Database:** Not found
- **API / Routes:** Not found
- **Frontend / Admin:** Not found
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
No COGS (Cost of Goods Sold) model found in repository.. Framework availability (Item selling prices in Medusa Pricing Module.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "گزارش سود (Profit & Margin Reporting)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Store cost price in variant metadata and build profit calculation workflow script.

### 96. Audit Log (Administrative Action Audit Logging)

**Status:** 🔴 NOT_IMPLEMENTED

**Implementation:** 0%

### Evidence

- **Project Source:** No project-owned source code found after workspace-wide investigation.
- **Framework Capability:** YES — Provided natively by framework core packages in monorepo (`medusa/packages/` or `payload/packages/`). Payload CMS document versions, change history, and user attribution on edits.
- **Configuration:** No project-level application configuration found in medusa/, payload/, or root.
- **Dependencies:** Framework packages exist in monorepo packages. Project application manifest: Payload CMS Versioning / Custom Medusa Subscriber. (installed in monorepo packages, project integration missing)..
- **Backend:** Framework service natively available in monorepo package tree. Payload CMS document versions, change history, and user attribution on edits.
- **Database:** Framework ORM models/entities exist in framework source tree; no active project database migration or schema configured.
- **API / Routes:** Framework API controllers/routes exist in framework source tree; no project routing layer activated.
- **Frontend / Admin:** Framework admin dashboard components exist in framework source tree; no project deployment configured.
- **Authentication / Authorization:** Not found
- **Tests:** Framework tests exist in upstream package repositories; no project application unit/integration tests found.
- **Runtime Verification:** Docker compose and Nginx proxy configured in infrastructure/, but no project application runtime active.

### Evidence Trace
Framework capability: `payload/packages/payload` | Project integration: NOT FOUND. Framework availability (Payload CMS document versions, change history, and user attribution on edits.) was evaluated against project source trees, package manifests, and infrastructure wiring. No project-specific application logic or configuration connects this feature in the workspace.

### Negative Evidence

- **Repository-wide search performed across:** `medusa/`, `payload/`, `infrastructure/`, `apps/`, `packages/`, `src/`, `server/`, `backend/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, `docker-compose.yml`, `infrastructure/nginx/nginx.conf`.
- **Search terms & domain concepts:** Terminology related to "Audit Log (Administrative Action Audit Logging)", synonyms, API routes, database models, services, controllers, and module configurations.
- **Implementation patterns checked:** Custom module registration, dependency injection, custom handlers/subscribers, route exports, database schema definitions, and environment bindings.
- **Result:** No project-owned implementation or active integration trace found in the workspace repository.

### Missing / Remaining Work
Enable versions and audit logging on Payload collections and Medusa admin events.

## Audit Summary

| Status Category | Symbol | Count | Percentage |
|---|:---:|---:|---:|
| **IMPLEMENTED** | 🟢 | 0 | 0.0% |
| **PARTIAL** | 🟡 | 0 | 0.0% |
| **INTEGRATION_REQUIRED** | 🟠 | 6 | 6.3% |
| **NOT_IMPLEMENTED** | 🔴 | 76 | 79.2% |
| **FRONTEND_ONLY / STOREFRONT** | ⚪ | 14 | 14.6% |
| **TOTAL** | | **96** | **100.0%** |

---

## Audit Methodology

### 1. Workspace Scope
The audit examined the entire `depix-ecommerce` monorepo workspace, including:
- Root files (`.env.example`, `docker-compose.yml`, `README.md`, `FEATURE_AUDIT.md`)
- Centralized infrastructure (`infrastructure/nginx/nginx.conf`)
- E-commerce framework repository (`medusa/`)
- Content CMS framework repository (`payload/`)

### 2. Evidence-First Search Protocol
Rather than searching solely for specific filenames (e.g., `medusa-config.ts` or `payload.config.ts`), a multi-layered concept-based investigation was performed across all directories (`apps/`, `packages/`, `src/`, `server/`, `services/`, `modules/`, `api/`, `routes/`, `controllers/`, `models/`, `migrations/`, `config/`, `scripts/`, `package.json`, Docker/Nginx files):
1. **Terminology & Synonyms:** Domain terms, feature names, Persian titles, and technical concepts.
2. **Technical Patterns:** Classes, functions, handlers, subscribers, controllers, models, and migrations.
3. **Integration Wiring:** Imports, exports, dependency injection, module/plugin registration, and configuration files.
4. **Data & Runtime Exposure:** Database tables/schemas, API routes, webhooks, CLI commands, Docker containers, and Nginx reverse proxy routes.

### 3. Framework vs Project Evidence Separation
Code located inside upstream framework packages (`medusa/packages/*`, `payload/packages/*`) was strictly classified under `Framework Capability` and separated from `Project Source`. Package presence in monorepo source trees or `node_modules` was treated as supporting evidence of platform capability, but never as proof of project implementation.

### 4. Establishment of Negative Evidence
Features were classified as `🔴 NOT_IMPLEMENTED` only after completing a repository-wide search confirming that no project-owned application code, module configuration, API route, custom database model, event subscriber, or UI component exists to execute the feature workflow.

---

## Implementation Backlog

| Priority | Feature | Current Status | Implementation | Main Missing Work | Dependencies |
| :---: | --- | :---: | :---: | --- | --- |
| **P0** | Basic Admin Panel (`#13`) | 🔴 NOT_IMPLEMENTED | 0% | Create `medusa-config.ts` & `payload.config.ts` workspace configs | Medusa & Payload Core |
| **P0** | Home Page (`#1`) | ⚪ FRONTEND_ONLY / STOREFRONT | 0% | Initialize Next.js storefront application | Storefront Package |
| **P0** | Product Management (`#14`) | 🔴 NOT_IMPLEMENTED | 0% | Deploy Medusa server and configure product catalog seed | Medusa Config |
| **P0** | Category Management (`#15`) | 🔴 NOT_IMPLEMENTED | 0% | Configure category tree in Medusa Admin | Medusa Product Module |
| **P0** | Cart Management (`#21`) | 🔴 NOT_IMPLEMENTED | 0% | Connect storefront cart drawer to Medusa Cart Store API | Medusa Cart Module |
| **P0** | Checkout (`#23`) | 🔴 NOT_IMPLEMENTED | 0% | Build storefront multi-step checkout wizard | Medusa Cart & Payment |
| **P0** | Payment Gateway (`#24`) | 🟠 INTEGRATION_REQUIRED | 0% | Build Medusa payment provider plugin for ZarinPal | ZarinPal API |
| **P1** | Registration & Login (`#17`) | ⚪ FRONTEND_ONLY / STOREFRONT | 0% | Build Login/Register forms on storefront | Medusa Auth Module |
| **P1** | SMS OTP Login (`#42`) | 🟠 INTEGRATION_REQUIRED | 0% | Build Medusa auth provider plugin for Kavenegar SMS OTP | Kavenegar API |
| **P1** | Customer Profile UI (`#18`) | ⚪ FRONTEND_ONLY / STOREFRONT | 0% | Build customer account dashboard on storefront | Medusa Customer Module |
| **P1** | Shipping Methods (`#26`) | 🔴 NOT_IMPLEMENTED | 0% | Configure shipping options in Medusa Admin | Medusa Fulfillment |
| **P1** | Order Placement (`#22`) | 🔴 NOT_IMPLEMENTED | 0% | Connect storefront checkout submit to cart complete API | Medusa Order Module |
| **P1** | Product Catalog (`#7`) | ⚪ FRONTEND_ONLY / STOREFRONT | 0% | Build catalog grid component fetching from Medusa API | Medusa Product API |
| **P1** | Product Details Page (`#9`) | ⚪ FRONTEND_ONLY / STOREFRONT | 0% | Build PDP component with variant selector | Medusa Product API |
| **P1** | Weblog System (`#56`) | 🔴 NOT_IMPLEMENTED | 0% | Define `Posts` collection in project Payload config | Payload CMS |
| **P2** | Product Reviews (`#29`) | 🔴 NOT_IMPLEMENTED | 0% | Create `Reviews` collection in Payload CMS or Medusa module | Customer Auth |
| **P2** | Product Ratings (`#30`) | 🔴 NOT_IMPLEMENTED | 0% | Implement average score calculation on product metadata | Product Reviews (#29) |
| **P2** | Discount / Coupons (`#28`) | 🔴 NOT_IMPLEMENTED | 0% | Add coupon code input to storefront checkout | Medusa Promotion Module |
| **P2** | Wishlist (`#41`) | 🔴 NOT_IMPLEMENTED | 0% | Build custom Medusa Wishlist module or metadata sync | Medusa Customer Module |
| **P2** | Basic Technical SEO (`#62`) | 🔴 NOT_IMPLEMENTED | 0% | Add dynamic `sitemap.xml` and `robots.txt` storefront routes | Payload SEO Plugin |
| **P2** | Article Management (`#57`) | 🔴 NOT_IMPLEMENTED | 0% | Configure Lexical editor on `Posts` in Payload CMS | Payload CMS |
| **P2** | Order Status SMS (`#78`) | 🟠 INTEGRATION_REQUIRED | 0% | Register subscriber for order events calling SMS API | Kavenegar SMS API |
| **P2** | Email Notifications (`#81`) | 🟠 INTEGRATION_REQUIRED | 0% | Configure SMTP credentials and design HTML email templates | SMTP / Resend |
| **P3** | Invoice Generation (`#45`) | 🔴 NOT_IMPLEMENTED | 0% | Build PDF invoice generation service for orders | Medusa Order Module |
| **P3** | Product Comparison (`#40`) | 🔴 NOT_IMPLEMENTED | 0% | Build product comparison matrix table on storefront | Storefront UI |
| **P3** | Back in Stock Alert (`#79`) | 🔴 NOT_IMPLEMENTED | 0% | Create stock alert subscription model and inventory listener | Medusa Inventory |
| **P3** | Customer Wallet (`#94`) | 🔴 NOT_IMPLEMENTED | 0% | Build Wallet module and Payment Provider for store credit | Medusa Payment Module |
| **P3** | Profit & Margin Report (`#95`) | 🔴 NOT_IMPLEMENTED | 0% | Add COGS cost price to variant metadata and build profit report | Medusa Pricing Module |
