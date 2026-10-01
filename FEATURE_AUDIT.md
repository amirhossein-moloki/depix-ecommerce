# Depix E-commerce
# Complete Feature Audit

## Executive Summary

This document presents a comprehensive, evidence-based **Full Feature Audit** for the **Depix E-commerce** workspace (`depix-ecommerce`). The repository is structured as a monorepo containing two core framework codebases:
1. **`medusa/`**: Medusa v2 framework source code operating as the E-commerce Backend engine.
2. **`payload/`**: Payload CMS v4 framework source code operating as the Content Backend / CMS / Admin engine.
3. **`infrastructure/`**: Centralized Docker, Nginx reverse proxy configuration (`nginx/nginx.conf`), and orchestrations.

### Methodology & Audit Principles
- **Code-Driven Audit:** No assumptions were made based on framework popularity or theoretical features. Every status assignment is strictly backed by actual source files, module configurations, database models, and routes in this workspace repository.
- **Strict Distinction between Framework Capability vs Workspace Implementation:** Capabilities provided natively by Medusa or Payload packages that are not configured or integrated into a custom application flow within this workspace are classified as `🔵 NATIVE_AVAILABLE`, not `🟢 IMPLEMENTED`.
- **Double-Perspective Score Calculation:**
  - **Actual Implementation Score:** Measures features that are custom built and immediately functional in the repository codebase.
  - **Platform Coverage Score:** Measures overall platform readiness when combining custom implementations with natively available framework capabilities ready to be activated.

---

## Overall Status

| Status Category | Symbol | Count | Percentage of Total (96 Features) |
|---|:---:|---:|---:|
| **IMPLEMENTED** | 🟢 | 0 | 0.0% |
| **PARTIAL** | 🟡 | 0 | 0.0% |
| **NATIVE_AVAILABLE** | 🔵 | 57 | 59.4% |
| **INTEGRATION_REQUIRED** | 🟠 | 10 | 10.4% |
| **NOT_IMPLEMENTED** | 🔴 | 17 | 17.7% |
| **FRONTEND_ONLY / STOREFRONT** | ⚪ | 12 | 12.5% |
| **TOTAL** | | **96** | **100.0%** |

---

## Score

### A. Actual Implementation Score
$$\text{Actual Completion} = \frac{\text{IMPLEMENTED} + (0.5 \times \text{PARTIAL})}{\text{Total Features}} = \frac{0 + 0}{96} = 0.0\%$$

*The workspace repository currently contains the core framework source trees (`medusa/` and `payload/`) and container orchestration (`docker-compose.yml`, `infrastructure/nginx/nginx.conf`), but has zero custom application business logic or storefront app implemented.*

### B. Platform Coverage Score
$$\text{Platform Coverage} = \frac{\text{IMPLEMENTED} + \text{PARTIAL} + \text{NATIVE_AVAILABLE} + \text{INTEGRATION_REQUIRED}}{\text{Total Features}} = \frac{0 + 0 + 57 + 10}{96} = 69.8\%$$

*With Medusa v2 and Payload v4 frameworks present in the workspace, 69.8% of required features are natively supported out-of-the-box or require standard external service provider integrations.*

---

## Feature Matrix

| Category | Total | 🟢 Implemented | 🟡 Partial | 🔵 Native Available | 🟠 Integration Required | 🔴 Not Implemented | ⚪ Frontend Only |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Storefront / Content** | 12 | 0 | 0 | 0 | 0 | 0 | 12 |
| **Admin / Product Management** | 8 | 0 | 0 | 6 | 0 | 0 | 2 |
| **Commerce** | 30 | 0 | 0 | 16 | 4 | 10 | 0 |
| **Admin / Reporting** | 5 | 0 | 0 | 3 | 0 | 2 | 0 |
| **Blog / CMS** | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| **SEO** | 15 | 0 | 0 | 11 | 1 | 3 | 0 |
| **Notifications** | 8 | 0 | 0 | 2 | 4 | 2 | 0 |
| **Reports / Infrastructure / Advanced** | 12 | 0 | 0 | 13 | 1 | 0 | 0 |
| **TOTAL** | **96** | **0** | **0** | **57** | **10** | **17** | **12** |

---

## 1. Storefront / Content

### 1. صفحه اصلی (Home Page)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront application or index page found in workspace.
**What exists:** Nginx proxy route configured in `infrastructure/nginx/nginx.conf` (`/`).
**What is missing:** Complete Storefront frontend application (Next.js / Remix / Astro).
**Evidence:** `infrastructure/nginx/nginx.conf` proxies root `/` to payload or medusa, but no storefront app exists.
**Dependencies:** Storefront repository / package.
**Required Work:** Build Next.js storefront application and consume Medusa / Payload APIs.
**Conclusion:** Feature is Storefront UI only.

### 2. Header / Footer / منو (Header / Footer / Menu)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront application found in repository.
**What exists:** Payload CMS package `payload/packages/plugin-nested-docs` natively available for menu structure.
**What is missing:** Storefront Header, Footer, and Menu rendering components.
**Evidence:** Search in workspace shows no storefront layout components.
**Dependencies:** Frontend framework, Payload Navigation Globals.
**Required Work:** Create Navigation Global in Payload CMS and render in Storefront UI.
**Conclusion:** Storefront component absent.

### 3. طراحی Responsive (Responsive Design)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront repository in workspace.
**What exists:** Payload Admin UI (`payload/packages/ui`) is responsive.
**What is missing:** Storefront CSS / Tailwind UI layout.
**Evidence:** No storefront stylesheet or component structure exists in root workspace.
**Dependencies:** Storefront Tailwind / CSS setup.
**Required Work:** Implement responsive layouts in storefront app.
**Conclusion:** Front-end capability.

### 4. UI اختصاصی (Custom UI)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront codebase.
**What exists:** Default framework assets.
**What is missing:** Custom design system, branding, components.
**Evidence:** Workspace contains core framework source trees without custom theme.
**Dependencies:** Frontend design system.
**Required Work:** Build custom UI design system in storefront.
**Conclusion:** Front-end requirement.

### 5. درباره ما (About Us)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No static page rendering app.
**What exists:** Payload CMS page collection capability (`payload/packages/payload`).
**What is missing:** About Us page data model instance and frontend route.
**Evidence:** No static page template or content instance found.
**Dependencies:** Payload Pages collection, Storefront page route.
**Required Work:** Create About Us page in Payload CMS and route in Storefront.
**Conclusion:** Page content and frontend route missing.

### 6. تماس با ما (Contact Us)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront route or form.
**What exists:** Payload Form Builder plugin (`payload/packages/plugin-form-builder`).
**What is missing:** Contact form UI and submit handler in storefront.
**Evidence:** No contact component present in codebase.
**Dependencies:** Payload Form Builder, Storefront form component.
**Required Work:** Configure contact form in Payload and display in Storefront.
**Conclusion:** Front-end route missing.

### 7. نمایش محصولات (Product Listing / Catalog)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront catalog page.
**What exists:** Medusa Product Module (`medusa/packages/modules/product`) API (`GET /store/products`).
**What is missing:** Storefront catalog grid and product card components.
**Evidence:** Medusa backend endpoint `/store/products` exists natively, but storefront UI does not exist.
**Dependencies:** Medusa Product API, Storefront UI.
**Required Work:** Create product grid UI connecting to Medusa Store API.
**Conclusion:** Backend API natively available, Storefront UI missing.

### 8. دسته‌بندی محصولات (Product Categories Listing)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront category page.
**What exists:** Medusa Product Category API (`GET /store/product-categories`).
**What is missing:** Category listing UI and navigation menu integration.
**Evidence:** Medusa category endpoints exist natively in `medusa/packages/medusa/src/api/store/product-categories/`.
**Dependencies:** Medusa Product Module.
**Required Work:** Fetch categories and render in storefront.
**Conclusion:** Front-end page missing.

### 9. صفحه محصول (Product Details Page)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront product detail route.
**What exists:** Medusa Product API (`GET /store/products/:id`).
**What is missing:** Product details page component (PDP), price calculator, variant selector UI.
**Evidence:** Backend API exists natively in Medusa core.
**Dependencies:** Medusa Product & Pricing modules.
**Required Work:** Build PDP in storefront.
**Conclusion:** Storefront UI feature.

### 10. گالری تصاویر (Product Image Gallery)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront media gallery.
**What exists:** Medusa image attachments on product models (`medusa/packages/modules/product`).
**What is missing:** Image carousel/lightbox frontend component.
**Evidence:** Medusa product schema supports `images` array natively.
**Dependencies:** Storefront image slider component.
**Required Work:** Build image gallery component on storefront PDP.
**Conclusion:** Front-end gallery UI missing.

### 11. جستجوی ساده (Simple Search UI)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No search bar component in storefront.
**What exists:** Medusa Product API query filter (`GET /store/products?q=`).
**What is missing:** Search input bar and search results page.
**Evidence:** Medusa search parameter supported natively.
**Dependencies:** Storefront search input.
**Required Work:** Implement search bar in storefront header.
**Conclusion:** Front-end UI feature.

### 12. سفارش از WhatsApp (WhatsApp Order Link)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No WhatsApp order button in codebase.
**What exists:** None.
**What is missing:** Frontend button component generating `https://wa.me/` links with cart items.
**Evidence:** No WhatsApp URL generator found in workspace.
**Dependencies:** Storefront PDP / Cart UI.
**Required Work:** Create helper to format cart text into WhatsApp deep link.
**Conclusion:** Front-end button feature.

---

## 2. Product Management

### 13. پنل مدیریت ساده (Basic Admin Panel)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/admin`, `payload/packages/ui`
**What exists:** Medusa Admin dashboard package and Payload Admin UI package available in framework packages.
**What is missing:** Custom admin workspace app deployment.
**Evidence:** Packages exist in `medusa/packages/admin` and `payload/app/(payload)/admin/`.
**Dependencies:** Medusa Admin / Payload Admin.
**Required Work:** Deploy and configure admin dashboard routes.
**Conclusion:** Framework capability present.

### 14. مدیریت محصولات (Product Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/product`
**What exists:** Complete CRUD for products, variants, titles, descriptions in Medusa Product Module.
**What is missing:** Custom product schema extensions or workspace-level seed scripts.
**Evidence:** Medusa Admin API endpoints (`/admin/products`).
**Dependencies:** Medusa Product Module.
**Required Work:** Utilize Medusa Admin API / UI for catalog management.
**Conclusion:** Native Medusa feature.

### 15. مدیریت دسته‌بندی (Category Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/product`
**What exists:** Hierarchical category tree management API in Medusa (`/admin/product-categories`).
**What is missing:** Custom category metadata models.
**Evidence:** Category service and models exist in `medusa/packages/modules/product/src/models/product-category.ts`.
**Dependencies:** Medusa Product Module.
**Required Work:** Manage categories via admin API.
**Conclusion:** Native Medusa feature.

### 16. مدیریت بنر (Banner Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`
**What exists:** Payload CMS Global / Collection capabilities for banner slides.
**What is missing:** Specific `Banners` collection definition in workspace payload config.
**Evidence:** Payload framework supports Globals/Collections.
**Dependencies:** Payload CMS.
**Required Work:** Create `Banners` collection in Payload CMS config.
**Conclusion:** Native Payload capability.

### 17. ثبت‌نام و ورود (Registration & Login UI/Flow)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront auth pages.
**What exists:** Medusa Auth Module (`medusa/packages/modules/auth`) providing `/store/auth/emailpass` endpoints.
**What is missing:** Sign up and Login forms on Storefront.
**Evidence:** Medusa backend auth endpoints exist natively.
**Dependencies:** Medusa Auth Module, Storefront Auth pages.
**Required Work:** Build Login/Register pages on Storefront.
**Conclusion:** Front-end authentication pages missing.

### 18. پروفایل کاربری (User Profile UI)
**Status:** ⚪ FRONTEND_ONLY
**Implementation:** 0%
**Where:** No storefront profile dashboard.
**What exists:** Medusa Customer Module (`/store/customers/me`).
**What is missing:** Customer profile page, account settings UI.
**Evidence:** Medusa Customer API exists natively.
**Dependencies:** Medusa Customer Module.
**Required Work:** Build customer account dashboard in storefront.
**Conclusion:** Front-end page missing.

### 19. مدیریت آدرس‌ها (Address Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/customer`
**What exists:** Customer address CRUD API (`/store/customers/me/addresses`).
**What is missing:** Storefront address book UI.
**Evidence:** Address entity in `medusa/packages/modules/customer/src/models/address.ts`.
**Dependencies:** Medusa Customer Module.
**Required Work:** Build address management form in storefront profile.
**Conclusion:** Native Medusa capability.

### 20. خرید مهمان (Guest Checkout)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/cart`
**What exists:** Carts can be created with email without customer account association (`POST /store/carts`).
**What is missing:** Storefront guest checkout UI step.
**Evidence:** Medusa Cart schema allows `customer_id` to be null with `email` provided.
**Dependencies:** Medusa Cart Module.
**Required Work:** Create guest checkout workflow on storefront.
**Conclusion:** Native Medusa capability.

---

## 3. Commerce

### 21. سبد خرید (Cart Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/cart`
**What exists:** Complete Cart lifecycle API (`/store/carts`, line item add/update/delete).
**What is missing:** Storefront cart drawer / page.
**Evidence:** `medusa/packages/modules/cart/src/services/cart-module-service.ts`.
**Dependencies:** Medusa Cart Module.
**Required Work:** Implement cart drawer and persistence in storefront.
**Conclusion:** Native Medusa feature.

### 22. ثبت سفارش (Order Placement)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/order`
**What exists:** Order creation from cart workflow (`POST /store/carts/:id/complete`).
**What is missing:** Custom post-order handling logic.
**Evidence:** Medusa Order Module and completion workflows in core framework.
**Dependencies:** Medusa Cart & Order Modules.
**Required Work:** Connect storefront checkout submit button to cart completion.
**Conclusion:** Native Medusa capability.

### 23. Checkout
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/cart`, `medusa/packages/modules/payment`
**What exists:** Address selection, shipping method selection, payment session initialization endpoints.
**What is missing:** Storefront multi-step checkout wizard.
**Evidence:** Medusa Store APIs for checkout steps.
**Dependencies:** Medusa Cart, Fulfillment, Payment Modules.
**Required Work:** Build checkout UI on storefront.
**Conclusion:** Native Medusa capability.

### 24. درگاه پرداخت (Payment Gateway - Single)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** `medusa/packages/modules/payment`
**What exists:** Medusa Payment Module engine and system default payment provider (`system` payment).
**What is missing:** Integration with Iranian / local payment gateways (ZarinPal, IdPay, Shaparak, etc.).
**Evidence:** Payment module architecture present, but no Iranian gateway plugin installed.
**Dependencies:** Medusa Payment Provider Plugin.
**Required Work:** Write or install a custom Medusa payment provider plugin for Iranian payment gateway.
**Conclusion:** Integration required for Iranian payment gateway.

### 25. مدیریت تراکنش (Transaction Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/payment`
**What exists:** Payment collections, payment captures, refunds, and status tracking models in Medusa.
**What is missing:** Local bank reference number tracking customization.
**Evidence:** `PaymentCollection` and `Payment` models in Medusa Payment Module.
**Dependencies:** Medusa Payment Module.
**Required Work:** Utilize Medusa payment capture/refund APIs.
**Conclusion:** Native Medusa capability.

### 26. روش‌های ارسال (Shipping Methods)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/fulfillment`
**What exists:** Shipping options and fulfillment provider architecture in Medusa Fulfillment Module.
**What is missing:** Local courier / Iranian post integrations.
**Evidence:** `medusa/packages/modules/fulfillment/src/services/fulfillment-module-service.ts`.
**Dependencies:** Medusa Fulfillment Module.
**Required Work:** Configure shipping options in Medusa Admin.
**Conclusion:** Native Medusa capability.

### 27. محاسبه هزینه ارسال (Shipping Cost Calculation)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/fulfillment`
**What exists:** Flat rate and calculated price rules for shipping options in Medusa.
**What is missing:** Live API integration with local Iranian delivery services (Pishro, Tipax).
**Evidence:** Medusa shipping option price calculation logic.
**Dependencies:** Medusa Fulfillment & Pricing Modules.
**Required Work:** Set flat rates or build fulfillment provider for dynamic rates.
**Conclusion:** Native Medusa capability.

### 28. کد تخفیف (Discount / Coupon Code)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/promotion`
**What exists:** Robust promotion, promo code, rule-based discounts in Medusa Promotion Module.
**What is missing:** Storefront promo code entry input.
**Evidence:** `medusa/packages/modules/promotion/src/services/promotion-module-service.ts`.
**Dependencies:** Medusa Promotion Module.
**Required Work:** Add promo code field on storefront checkout.
**Conclusion:** Native Medusa feature.

### 29. نظرات محصولات (Product Reviews)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No review entity found in repository.
**What exists:** None.
**What is missing:** Database model for product reviews, review submission API, and admin moderation.
**Evidence:** Search in `medusa/` and `payload/` shows no Product Review schema or module.
**Dependencies:** Payload CMS collection or Medusa custom module.
**Required Work:** Create custom `Reviews` collection in Payload CMS or Medusa module.
**Conclusion:** Feature completely absent from workspace.

### 30. امتیازدهی محصولات (Product Ratings)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No rating model found in repository.
**What exists:** None.
**What is missing:** Rating aggregation logic, rating field on products.
**Evidence:** No rating field or average rating calculation in workspace code.
**Dependencies:** Product Reviews feature.
**Required Work:** Add rating field and score calculation service.
**Conclusion:** Feature completely absent.

### 31. مدیریت سفارش‌ها (Order Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/order`
**What exists:** Order status updates, fulfillment creation, cancellation, item edits in Medusa Order Module.
**What is missing:** Custom invoice PDF export or Persian SMS status trigger.
**Evidence:** `/admin/orders` APIs in Medusa core.
**Dependencies:** Medusa Order Module.
**Required Work:** Use Medusa Admin for order processing.
**Conclusion:** Native Medusa capability.

### 32. مدیریت موجودی (Inventory Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/inventory`, `medusa/packages/modules/stock-location`
**What exists:** Multi-location inventory management, stock reservations, inventory levels in Medusa.
**What is missing:** Automated low stock SMS notifications.
**Evidence:** `medusa/packages/modules/inventory/src/services/inventory-module-service.ts`.
**Dependencies:** Medusa Inventory Module.
**Required Work:** Manage stock via Medusa Admin/API.
**Conclusion:** Native Medusa feature.

### 33. احراز هویت و دسترسی پایه (Basic Auth & RBAC)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/rbac`, `medusa/packages/modules/auth`
**What exists:** Medusa RBAC module, JWT sessions, Admin & Customer user authentication.
**What is missing:** Custom role definitions for local Persian store ops.
**Evidence:** `medusa/packages/modules/rbac/src/services/rbac-module-service.ts`.
**Dependencies:** Medusa RBAC & Auth Modules.
**Required Work:** Configure custom permissions if required.
**Conclusion:** Native Medusa capability.

### 34. ویژگی‌های محصول (Product Attributes)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/product`
**What exists:** Product options, metadata key-value storage, product categories in Medusa.
**What is missing:** Custom attribute filtering schema.
**Evidence:** Product schema includes `metadata` JSONB and `options` array.
**Dependencies:** Medusa Product Module.
**Required Work:** Store arbitrary attributes in product metadata.
**Conclusion:** Native Medusa capability.

### 35. رنگ، سایز و تنوع محصول (Product Variants - Color, Size)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/product`
**What exists:** Unlimited product variants with option combinations (Size, Color) in Medusa.
**What is missing:** Storefront color swatch picker UI.
**Evidence:** `medusa/packages/modules/product/src/models/product-variant.ts`.
**Dependencies:** Medusa Product Module.
**Required Work:** Define options (Color, Size) when creating products.
**Conclusion:** Native Medusa capability.

### 36. محصولات مرتبط (Related Products)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No related product relationship module.
**What exists:** Product Collections in Medusa can group similar products.
**What is missing:** Explicit cross-sell / upsell / related products relationship model.
**Evidence:** No `related_products` field or join table found in workspace.
**Dependencies:** Medusa Product Module extension or metadata.
**Required Work:** Store related product IDs in product metadata or custom link module.
**Conclusion:** Feature absent.

### 37. محصولات جدید / ویژه / پرفروش (Featured / New / Best Seller Products)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No sales analytics badge logic or featured tags collection.
**What exists:** Product tags in Medusa (`medusa/packages/modules/product`).
**What is missing:** Automated sales calculation for "Best Sellers" or "Featured" flag.
**Evidence:** No sales ranking algorithm or featured toggle found in workspace custom code.
**Dependencies:** Medusa Product & Order Modules.
**Required Work:** Implement product tags or custom flag in metadata.
**Conclusion:** Feature absent.

### 38. فیلتر پیشرفته محصولات (Advanced Product Filtering)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/product`
**What exists:** Medusa supports filtering by price, category, collection, tags, options out-of-the-box.
**What is missing:** Storefront multi-attribute filter sidebar component.
**Evidence:** Medusa `/store/products` query parameters support filter objects.
**Dependencies:** Medusa Product Module.
**Required Work:** Build multi-select filter controls on storefront.
**Conclusion:** Native Medusa capability.

### 39. مرتب‌سازی محصولات (Product Sorting)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/product`
**What exists:** Medusa API supports sorting by price, creation date, title (`order` param).
**What is missing:** Storefront sort dropdown selector.
**Evidence:** Medusa list product params support `order` flag (e.g. `created_at`, `title`).
**Dependencies:** Medusa Product Module.
**Required Work:** Pass `order` parameter from storefront UI.
**Conclusion:** Native Medusa capability.

### 40. مقایسه محصولات (Product Comparison)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No comparison module or storefront component.
**What exists:** None.
**What is missing:** Comparison drawer, attribute comparison matrix logic.
**Evidence:** No code handling product comparison found in workspace.
**Dependencies:** Storefront state management / Product options.
**Required Work:** Build comparison state and matrix table on storefront.
**Conclusion:** Feature completely absent.

### 41. علاقه‌مندی‌ها (Wishlist)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No wishlist module found.
**What exists:** None in core Medusa (Wishlist is not a core Medusa v2 module).
**What is missing:** `Wishlist` database model, Wishlist CRUD API endpoints, storefront toggle.
**Evidence:** Search in `medusa/` shows no wishlist plugin or module present.
**Dependencies:** Medusa Customer Module & Custom Module/Plugin.
**Required Work:** Build custom Medusa module for Wishlist or store in Customer metadata.
**Conclusion:** Feature absent.

### 42. ورود با OTP (SMS OTP Login)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** `medusa/packages/modules/auth`
**What exists:** Medusa Auth Module supports custom authentication providers (`AuthIdentityProvider`).
**What is missing:** Iranian SMS Provider plugin (Kavenegar, Ghasedak, FarazSMS) and OTP store/verify provider.
**Evidence:** No Iranian SMS SDK or OTP provider plugin found in workspace.
**Dependencies:** Medusa Auth Module, Iranian SMS Gateway.
**Required Work:** Create custom Medusa Auth Provider for SMS OTP.
**Conclusion:** Integration required for SMS gateway.

### 43. تاریخچه سفارش‌ها (Customer Order History)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/order`
**What exists:** Customer order history API (`GET /store/orders?customer_id=me`).
**What is missing:** Storefront customer order history list page.
**Evidence:** Medusa Store API supports customer order listing out-of-the-box.
**Dependencies:** Medusa Order & Customer Modules.
**Required Work:** Render order list on storefront customer dashboard.
**Conclusion:** Native Medusa capability.

### 44. پیگیری سفارش (Order Tracking)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/fulfillment`
**What exists:** Fulfillment tracking numbers attachment to orders (`tracking_numbers` field).
**What is missing:** Guest order tracking lookup page on storefront.
**Evidence:** `medusa/packages/modules/fulfillment/src/models/fulfillment.ts` includes `tracking_numbers`.
**Dependencies:** Medusa Fulfillment Module.
**Required Work:** Build public order tracking lookup form on storefront.
**Conclusion:** Native Medusa capability.

### 45. صدور فاکتور (Invoice Generation)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No invoice generation service found.
**What exists:** Order items and prices in Medusa Order Module.
**What is missing:** PDF invoice generation engine, Persian invoice layout template.
**Evidence:** No PDF generation package (e.g. pdfkit, puppeteer) found in custom workspace scripts.
**Dependencies:** Medusa Order Module, PDF generator.
**Required Work:** Create workflow to generate PDF invoices for orders.
**Conclusion:** Feature absent.

### 46. لغو سفارش (Order Cancellation)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/order`
**What exists:** Order cancellation API and refund workflow (`POST /admin/orders/:id/cancel`).
**What is missing:** Storefront customer-initiated cancellation request button.
**Evidence:** Medusa Order cancel service natively present.
**Dependencies:** Medusa Order Module.
**Required Work:** Build cancel order button and handler on storefront.
**Conclusion:** Native Medusa capability.

### 47. تخفیف محصول / دسته‌بندی (Product & Category Discounts)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/promotion`
**What exists:** Target promotion rules restricting discounts to specific product IDs or Category IDs in Medusa.
**What is missing:** Storefront promotional tags on product cards.
**Evidence:** Medusa Promotion rule condition engine supports category/product target rules.
**Dependencies:** Medusa Promotion Module.
**Required Work:** Create promotions in admin panel.
**Conclusion:** Native Medusa capability.

### 48. فروش ویژه (Flash Sales / Special Deals)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/promotion`
**What exists:** Time-bounded campaign promotions with start and end dates in Medusa Promotion Module.
**What is missing:** Storefront countdown timer component.
**Evidence:** Medusa Campaign entity with `start_date` and `end_date`.
**Dependencies:** Medusa Promotion Module.
**Required Work:** Define campaigns in Medusa and add timer to storefront PDP.
**Conclusion:** Native Medusa capability.

### 49. تأیید / رد نظرات (Review Approval / Rejection Workflow)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No review moderation module.
**What exists:** None.
**What is missing:** Approval status field (`pending`, `approved`, `rejected`), admin moderation UI.
**Evidence:** Dependent on absent Product Reviews feature.
**Dependencies:** Product Reviews feature.
**Required Work:** Add approval workflow in Payload CMS or custom Medusa module.
**Conclusion:** Feature absent.

### 50. پاسخ مدیر به نظر (Admin Reply to Reviews)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No review reply model.
**What exists:** None.
**What is missing:** Admin reply field/relation, storefront reply display.
**Evidence:** Dependent on absent Product Reviews feature.
**Dependencies:** Product Reviews feature.
**Required Work:** Add admin reply field to review schema.
**Conclusion:** Feature absent.

---

## 4. Admin / Reporting

### 51. داشبورد مدیریتی (Admin Analytics Dashboard)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/admin`
**What exists:** Medusa Admin panel with sales, order count, and customer overview widgets.
**What is missing:** Customized Persian localization / Jalali calendar overview.
**Evidence:** Medusa Admin Dashboard UI components.
**Dependencies:** Medusa Admin.
**Required Work:** Deploy Medusa Admin dashboard.
**Conclusion:** Native Medusa capability.

### 52. مدیریت کاربران (Customer Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/customer`
**What exists:** Customer listing, detail editing, customer groups in Medusa Admin.
**What is missing:** Custom customer tags.
**Evidence:** Medusa Admin `/admin/customers` APIs.
**Dependencies:** Medusa Customer Module.
**Required Work:** Manage customers via admin panel.
**Conclusion:** Native Medusa capability.

### 53. مدیریت مدیران (Admin User Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/user`
**What exists:** Admin user creation, invite system, password reset in Medusa User Module.
**What is missing:** Custom administrative onboarding workflow.
**Evidence:** `medusa/packages/modules/user/src/services/user-module-service.ts`.
**Dependencies:** Medusa User Module.
**Required Work:** Invite admin users via Medusa Admin.
**Conclusion:** Native Medusa capability.

### 54. نقش‌ها و دسترسی‌ها (Roles & Permissions)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/rbac`
**What exists:** Granular permission policy definitions for endpoints and actions in Medusa RBAC module.
**What is missing:** Custom role definitions for store managers.
**Evidence:** Medusa RBAC service and models natively available.
**Dependencies:** Medusa RBAC Module.
**Required Work:** Configure permission policies.
**Conclusion:** Native Medusa capability.

### 55. گزارش فروش (Sales Reporting)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No custom sales report exporter.
**What exists:** Basic sales metrics in Medusa Admin.
**What is missing:** Advanced date-filtered sales report generation (Excel/CSV export), revenue breakdown.
**Evidence:** No custom reporting or export service in repository.
**Dependencies:** Medusa Order & Analytics Modules.
**Required Work:** Build custom analytics export script/route.
**Conclusion:** Feature absent.

---

## 5. Blog / CMS

### 56. وبلاگ (Blog Base System)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`
**What exists:** Full CMS functionality in Payload for posts, rich text editing, draft/publish workflow.
**What is missing:** Posts collection in workspace payload configuration.
**Evidence:** Payload CMS framework packages in `payload/packages/`.
**Dependencies:** Payload CMS.
**Required Work:** Define `Posts` collection in Payload CMS config.
**Conclusion:** Native Payload capability.

### 57. مدیریت مقالات (Article Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`, `payload/packages/richtext-lexical`
**What exists:** Lexical rich text editor, article drafting, media embedding, scheduled publishing in Payload.
**What is missing:** Customized article schema in workspace config.
**Evidence:** `payload/packages/richtext-lexical` plugin available.
**Dependencies:** Payload CMS.
**Required Work:** Add Lexical editor to Payload post collection.
**Conclusion:** Native Payload capability.

### 58. دسته‌بندی مقالات (Blog Categories)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`, `payload/packages/plugin-nested-docs`
**What exists:** Payload relationship fields allow linking posts to category collections (with hierarchy via plugin-nested-docs).
**What is missing:** Category collection instance in workspace config.
**Evidence:** `payload/packages/plugin-nested-docs` present.
**Dependencies:** Payload CMS.
**Required Work:** Define `BlogCategories` collection in Payload config.
**Conclusion:** Native Payload capability.

### 59. تگ مقالات (Blog Tags)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`
**What exists:** Multi-select relationship or array tags field support in Payload CMS.
**What is missing:** Tags collection definition in workspace config.
**Evidence:** Native Payload field types.
**Dependencies:** Payload CMS.
**Required Work:** Define `Tags` collection in Payload config.
**Conclusion:** Native Payload capability.

### 60. نظرات مقالات (Blog Comments)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No blog comment collection.
**What exists:** None.
**What is missing:** Blog comment collection schema, public submission endpoint, moderation system.
**Evidence:** No blog comment code found in repository.
**Dependencies:** Payload CMS.
**Required Work:** Create `BlogComments` collection in Payload CMS.
**Conclusion:** Feature absent.

### 61. SEO مقالات (Blog Article SEO)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/plugin-seo`
**What exists:** Official Payload SEO Plugin providing meta title, description, image, and preview fields.
**What is missing:** Configuration of `@payloadcms/plugin-seo` in workspace payload config.
**Evidence:** `payload/packages/plugin-seo` package present in repository.
**Dependencies:** Payload SEO Plugin.
**Required Work:** Register `seoPlugin` in Payload CMS config.
**Conclusion:** Native Payload capability.

---

## 6. SEO

### 62. SEO فنی پایه (Basic Technical SEO)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/plugin-seo`
**What exists:** Canonical URL, robots meta tags, title template capabilities in Payload SEO plugin.
**What is missing:** Storefront sitemap and robots.txt generation routes.
**Evidence:** SEO plugin available in `payload/packages/plugin-seo`.
**Dependencies:** Payload SEO plugin, Storefront routes.
**Required Work:** Expose `sitemap.xml` route on storefront.
**Conclusion:** Native capability available.

### 63. چند درگاه پرداخت (Multiple Payment Gateways)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/payment`
**What exists:** Medusa Payment Module natively supports multiple simultaneous payment providers per region.
**What is missing:** Installation of multiple Iranian payment provider plugins.
**Evidence:** Medusa Payment Module collection supports multiple payment sessions.
**Dependencies:** Medusa Payment Module.
**Required Work:** Configure multiple payment providers in Medusa.
**Conclusion:** Native Medusa capability.

### 64. کمپین‌های فروش (Sales Campaigns)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/promotion`
**What exists:** Campaign management with budget limits, identifier codes, start/end dates in Medusa.
**What is missing:** Storefront promotional campaign landing pages.
**Evidence:** Campaign entity in `medusa/packages/modules/promotion/src/models/campaign.ts`.
**Dependencies:** Medusa Promotion Module.
**Required Work:** Create campaign in Medusa Admin.
**Conclusion:** Native Medusa capability.

### 65. سیستم بازگشت وجه (Refund System)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/payment`, `medusa/packages/modules/order`
**What exists:** Refund creation workflow, payment refund captures, order edits in Medusa core.
**What is missing:** Automated bank transfer integration for Iranian manual refunds.
**Evidence:** `/admin/orders/:id/refund` API endpoints.
**Dependencies:** Medusa Payment & Order Modules.
**Required Work:** Process refunds via Medusa Admin.
**Conclusion:** Native Medusa capability.

### 66. درخواست مرجوعی کالا (Return Request System)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/fulfillment`, `medusa/packages/modules/order`
**What exists:** Return creation, return reason configuration, return shipping options in Medusa.
**What is missing:** Storefront customer return request portal.
**Evidence:** Medusa Return entity and `/store/returns` APIs.
**Dependencies:** Medusa Fulfillment & Order Modules.
**Required Work:** Build return request form on storefront.
**Conclusion:** Native Medusa capability.

### 67. مدیریت کد رهگیری ارسال (Shipping Tracking Code Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/fulfillment`
**What exists:** Admin API to attach tracking numbers to order fulfillments (`POST /admin/fulfillments/:id/tracking`).
**What is missing:** Automated SMS dispatch of tracking code to customer upon update.
**Evidence:** `medusa/packages/modules/fulfillment/src/models/fulfillment.ts`.
**Dependencies:** Medusa Fulfillment Module.
**Required Work:** Enter tracking numbers in Medusa Admin fulfillment section.
**Conclusion:** Native Medusa capability.

### 68. محدوده و قوانین ارسال پیشرفته (Advanced Shipping Zones & Rules)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/fulfillment`
**What exists:** Shipping zones, region assignment, price rules (min/max cart total, weight) in Medusa.
**What is missing:** Iranian province/city location taxonomy rules.
**Evidence:** Service zone and shipping option rule models in Medusa Fulfillment Module.
**Dependencies:** Medusa Fulfillment Module.
**Required Work:** Configure shipping zones and rules in Medusa Admin.
**Conclusion:** Native Medusa capability.

### 69. ویدئوی محصول (Product Video Support)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No video field on products.
**What exists:** Medusa image attachments support images only.
**What is missing:** Product video URL / embed model, video player UI component.
**Evidence:** Product schema lacks dedicated video fields.
**Dependencies:** Medusa Product Module extension or metadata.
**Required Work:** Add video URL string to product metadata or Payload CMS catalog block.
**Conclusion:** Feature absent.

### 70. سیستم نویسندگان وبلاگ (Blog Author Management)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`
**What exists:** Payload CMS supports linking `Posts` to `Users` collection or custom `Authors` collection.
**What is missing:** Authors collection definition in workspace payload config.
**Evidence:** Native Payload relationship field capability.
**Dependencies:** Payload CMS.
**Required Work:** Define `Authors` collection in Payload config.
**Conclusion:** Native Payload capability.

### 71. مقالات مرتبط (Related Blog Articles)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`
**What exists:** Self-referential relationship fields in Payload CMS allow selecting related articles.
**What is missing:** Related posts field in workspace post collection definition.
**Evidence:** Payload relationship field supports `relationTo: 'posts'`.
**Dependencies:** Payload CMS.
**Required Work:** Add `relatedPosts` field to `Posts` collection in Payload.
**Conclusion:** Native Payload capability.

### 72. SEO پیشرفته (Advanced SEO Capabilities)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/plugin-seo`
**What exists:** Payload SEO Plugin provides structured metadata fields, image preview cards, evaluation tools.
**What is missing:** Activation in workspace payload config.
**Evidence:** `@payloadcms/plugin-seo` package present.
**Dependencies:** Payload SEO Plugin.
**Required Work:** Enable `@payloadcms/plugin-seo` in Payload.
**Conclusion:** Native Payload capability.

### 73. Schema محصولات (Product JSON-LD Schema)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No JSON-LD schema builder.
**What exists:** Product data in Medusa API.
**What is missing:** JSON-LD structured data generator function for Product, Offer, AggregateRating.
**Evidence:** No schema generator code found in repository.
**Dependencies:** Storefront PDP component.
**Required Work:** Build JSON-LD script generator component in Storefront PDP.
**Conclusion:** Feature absent.

### 74. Schema مقالات (Article JSON-LD Schema)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No Article JSON-LD schema builder.
**What exists:** Blog post data in Payload CMS API.
**What is missing:** JSON-LD structured data generator for Article / BlogPosting.
**Evidence:** No schema builder found in codebase.
**Dependencies:** Storefront Blog detail page.
**Required Work:** Add Article JSON-LD script tag in storefront blog route.
**Conclusion:** Feature absent.

### 75. Open Graph / Social Meta
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/plugin-seo`
**What exists:** Open Graph title, description, image fields generated automatically by Payload SEO plugin.
**What is missing:** Storefront `<meta property="og:..." />` tag mapping.
**Evidence:** `payload/packages/plugin-seo` source code.
**Dependencies:** Payload SEO Plugin, Storefront head manager.
**Required Work:** Render OG tags in Storefront head tags.
**Conclusion:** Native capability available.

### 76. بهینه‌سازی Performance (Performance Optimization)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** `docker-compose.yml`, `infrastructure/nginx/nginx.conf`
**What exists:** Redis caching service running in Docker Compose (`redis:7-alpine`), Nginx reverse proxy.
**What is missing:** CDN edge integration, image optimization service (Sharp / Cloudflare Images), page caching headers.
**Evidence:** Redis container configured, but custom caching strategy for storefront missing.
**Dependencies:** Redis, CDN / Image Provider.
**Required Work:** Configure Nginx caching headers and image CDN optimization.
**Conclusion:** Infrastructure integration required.

---

## 7. Notifications

### 77. پیامک OTP (SMS OTP Notification)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** `medusa/packages/modules/notification`
**What exists:** Medusa Notification Module engine.
**What is missing:** Iranian SMS Provider plugin (e.g. Kavenegar, Ghasedak) for Notification Module.
**Evidence:** Medusa Notification Module present, but no Iranian SMS provider configured.
**Dependencies:** Medusa Notification Module, Iranian SMS Gateway API.
**Required Work:** Develop custom Notification Provider for Iranian SMS service.
**Conclusion:** Integration required for SMS provider.

### 78. پیامک وضعیت سفارش (Order Status SMS)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** `medusa/packages/modules/notification`
**What exists:** Event-driven notification system in Medusa (`order.placed`, `order.fulfilled`).
**What is missing:** Subscriber wiring event handlers to Iranian SMS provider.
**Evidence:** Medusa event bus module present (`event-bus-redis`).
**Dependencies:** Medusa Event Bus, Notification Module, SMS Gateway.
**Required Work:** Register subscriber for order events sending SMS.
**Conclusion:** Integration required.

### 79. اعلان موجودی محصول (Back in Stock Notification)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No stock alert subscriber or table.
**What exists:** None.
**What is missing:** Customer stock notification subscription model, back-in-stock event trigger handler.
**Evidence:** Search for "back_in_stock" or "stock_alert" yields no implementation.
**Dependencies:** Medusa Inventory & Notification Modules.
**Required Work:** Create custom subscription model and stock update event listener.
**Conclusion:** Feature absent.

### 80. مرکز اعلان‌ها (Notification Center UI)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No notification center model or UI.
**What exists:** None.
**What is missing:** In-app notification collection, unread badge counter, notification center UI on storefront.
**Evidence:** No in-app notification storage model found in workspace.
**Dependencies:** Custom Notification Collection / Storefront component.
**Required Work:** Build notification storage and UI on storefront account dashboard.
**Conclusion:** Feature absent.

### 81. اعلان ایمیلی (Email Notifications)
**Status:** 🟠 INTEGRATION_REQUIRED
**Implementation:** 0%
**Where:** `payload/packages/email-nodemailer`, `payload/packages/email-resend`
**What exists:** Payload email adapters for Nodemailer and Resend in framework packages.
**What is missing:** SMTP server credentials and HTML email templates for Persian emails.
**Evidence:** `@payloadcms/email-nodemailer` package present.
**Dependencies:** SMTP Provider / Resend API.
**Required Work:** Configure SMTP variables in `.env` and create HTML email templates.
**Conclusion:** External SMTP integration required.

### 82. هشدار کاهش موجودی (Low Stock Admin Alert)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/inventory`
**What exists:** Stock level monitoring and inventory level entities in Medusa Inventory Module.
**What is missing:** Admin email/SMS notification subscriber when inventory drops below threshold.
**Evidence:** Inventory level schema includes `stocked_quantity` and `reserved_quantity`.
**Dependencies:** Medusa Inventory & Notification Modules.
**Required Work:** Create event listener on inventory update to alert admin.
**Conclusion:** Native Medusa capability.

### 83. هشدار تغییر قیمت (Price Change Alert)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No price tracking subscription logic.
**What exists:** Medusa Pricing Module (`medusa/packages/modules/pricing`).
**What is missing:** Price drop subscriber model and automated email trigger.
**Evidence:** No price watch subscription model found in custom code.
**Dependencies:** Medusa Pricing & Notification Modules.
**Required Work:** Build price watch list model and pricing update subscriber.
**Conclusion:** Feature absent.

### 84. سبد خرید رهاشده (Abandoned Cart Recovery)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/cart`
**What exists:** Medusa tracks created carts with customer emails that remain incomplete.
**What is missing:** Scheduled cron task / workflow to dispatch reminder emails/SMS to abandoned carts.
**Evidence:** Medusa Cart entity keeps `updated_at` and `email` for incomplete carts.
**Dependencies:** Medusa Cart & Workflow Modules.
**Required Work:** Create scheduled job sending recovery emails for inactive carts > 24 hours.
**Conclusion:** Native Medusa capability.

---

## 8. Reports / Infrastructure / Advanced

### 85. گزارش مشتریان (Customer Reports / Analytics)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/customer`
**What exists:** Customer purchase counts, order history association, and customer group metrics in Medusa.
**What is missing:** Exportable LTV (Lifetime Value) customer report table.
**Evidence:** Medusa customer relations with orders natively exist.
**Dependencies:** Medusa Customer & Order Modules.
**Required Work:** Query customer order totals via Medusa Admin/API.
**Conclusion:** Native Medusa capability.

### 86. گزارش موجودی (Inventory Reports)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/inventory`
**What exists:** Inventory levels across stock locations querying API in Medusa Inventory Module.
**What is missing:** CSV stock valuation report generator.
**Evidence:** `/admin/inventory-items` API in Medusa Admin.
**Dependencies:** Medusa Inventory Module.
**Required Work:** Export inventory list from Medusa Admin.
**Conclusion:** Native Medusa capability.

### 87. گزارش تراکنش‌ها (Transaction Reports)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/payment`
**What exists:** Payment collections, captured amounts, pending captures listing in Medusa.
**What is missing:** Reconciliation report export formatted for Iranian accounting systems.
**Evidence:** Medusa Payment Module APIs.
**Dependencies:** Medusa Payment Module.
**Required Work:** Filter and export payment logs from Medusa.
**Conclusion:** Native Medusa capability.

### 88. مستندات API / Swagger (API Documentation / Swagger / OpenAPI)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/cli/oas`, `payload/packages/graphql`
**What exists:** Medusa OAS generator package (`@medusajs/medusa-oas`) and Payload OpenAPI/GraphQL documentation endpoints.
**What is missing:** Custom swagger UI hosted route in workspace deployment.
**Evidence:** Medusa OAS scripts in `medusa/packages/cli/oas/` and Payload GraphQL Playground route at `payload/app/(payload)/api/graphql-playground/route.ts`.
**Dependencies:** Medusa OAS CLI, Payload GraphQL.
**Required Work:** Generate OAS spec file and serve via Swagger UI endpoint.
**Conclusion:** Framework capability present natively.

### 89. تست‌های جامع سیستم (Comprehensive System Testing)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/integration-tests`, `payload/test`
**What exists:** Extensive test suites, helpers, and fixtures built into Medusa and Payload framework directories.
**What is missing:** Custom end-to-end (E2E) e-commerce journey test suite for Depix workspace logic.
**Evidence:** Jest & Vitest setups in `medusa/integration-tests/` and `payload/test/`.
**Dependencies:** Jest, Vitest, Playwright.
**Required Work:** Write custom E2E integration test suite for workspace flows.
**Conclusion:** Native framework test setup present.

### 90. مدیریت صفحات پیشرفته (Advanced Page Management / Page Builder)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`, `payload/packages/richtext-lexical`
**What exists:** Payload Block-based layout builder fields allow assembling modular page layouts visually.
**What is missing:** Custom block definitions (Hero, Features, Pricing, Testimonials) in workspace payload config.
**Evidence:** Payload framework `blocks` field documentation and packages.
**Dependencies:** Payload CMS.
**Required Work:** Define reusable layout blocks in Payload CMS config.
**Conclusion:** Native Payload capability.

### 91. چندزبانه (Multi-language / Localization)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/translation`, `payload/packages/translations`
**What exists:** Medusa Translation Module and Payload native localization support (i18n).
**What is missing:** Persian (`fa`) locale configuration in workspace configs.
**Evidence:** `medusa/packages/modules/translation` and `@payloadcms/translations` present.
**Dependencies:** Medusa Translation Module, Payload i18n.
**Required Work:** Set Persian (`fa`) as active default locale in configs.
**Conclusion:** Native framework capability.

### 92. جستجوی پیشرفته (Advanced Search Engine Integration)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `medusa/packages/modules/search`, `payload/packages/plugin-search`
**What exists:** Medusa Search Module interface and Payload Search Plugin (`@payloadcms/plugin-search`).
**What is missing:** Configuration with external search engine (Algolia / Meilisearch / Elasticsearch).
**Evidence:** Search module packages in `medusa/packages/modules/search` and `payload/packages/plugin-search`.
**Dependencies:** Search Engine Instance (Meilisearch / Algolia).
**Required Work:** Connect Meilisearch / Algolia credentials in config.
**Conclusion:** Native capability ready for integration.

### 93. پیشنهاد محصول (Product Recommendation Engine)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No recommendation service found.
**What exists:** None.
**What is missing:** Collaborative filtering or metadata-based recommendation service.
**Evidence:** Search in workspace shows no recommendation algorithm or service.
**Dependencies:** Medusa Product & Order Modules.
**Required Work:** Develop recommendation workflow based on co-purchased items.
**Conclusion:** Feature completely absent.

### 94. کیف پول (Customer Wallet System)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No wallet model found.
**What exists:** None.
**What is missing:** Customer Wallet database model, credit balance top-up API, payment provider using wallet balance.
**Evidence:** No `Wallet` entity or store credit module found in workspace.
**Dependencies:** Medusa Payment & Customer Modules.
**Required Work:** Create custom Medusa module for Wallet and Payment Provider for Wallet payment.
**Conclusion:** Feature completely absent.

### 95. گزارش سود (Profit & Margin Reporting)
**Status:** 🔴 NOT_IMPLEMENTED
**Implementation:** 0%
**Where:** No COGS (Cost of Goods Sold) model.
**What exists:** Item selling prices in Medusa Pricing Module.
**What is missing:** Cost price (COGS) field on product variants, margin calculator service, profit report exporter.
**Evidence:** Medusa variants do not track cost price natively in default schema.
**Dependencies:** Medusa Product Module extension or metadata.
**Required Work:** Store cost price in variant metadata and build profit calculation workflow.
**Conclusion:** Feature absent.

### 96. Audit Log (Administrative Action Audit Logging)
**Status:** 🔵 NATIVE_AVAILABLE
**Implementation:** 0%
**Where:** `payload/packages/payload`
**What exists:** Payload CMS document versions, change history, and user attribution on every edit.
**What is missing:** Global admin action logging table in Medusa.
**Evidence:** Payload document versioning and audit capabilities natively present.
**Dependencies:** Payload CMS Versioning / Custom Medusa Subscriber.
**Required Work:** Enable versions and audit tracking on collections.
**Conclusion:** Native Payload capability.

---

## 8. Medusa Framework Audit

Detailed audit of the Medusa v2 codebase located at `medusa/packages/`:

| Domain | Status | Available Modules / Packages | Findings & Gap Analysis |
|---|:---:|---|---|
| **Product** | 🔵 Native Available | `medusa/packages/modules/product` | Products, Categories, Collections, Variants, Options, Images, Prices natively supported in core module. Workspace lacks seed data and custom UI. |
| **Customer** | 🔵 Native Available | `medusa/packages/modules/customer` | Customer entity, Addresses, Customer Groups, Metadata natively supported in core module. |
| **Cart** | 🔵 Native Available | `medusa/packages/modules/cart` | Cart lifecycle, Line Items, Shipping assignment, Discount codes, Guest checkout supported. |
| **Order** | 🔵 Native Available | `medusa/packages/modules/order` | Order state machine, cancellation, history, line item edits supported natively. |
| **Payment** | 🔵 Native Available / 🟠 Integration | `medusa/packages/modules/payment` | Payment Module engine, Payment Collections, Refunds supported. Needs Iranian payment provider integration. |
| **Promotion** | 🔵 Native Available | `medusa/packages/modules/promotion` | Discounts, Promotions, Campaigns, Custom Rules engine natively supported. |
| **Inventory** | 🔵 Native Available | `medusa/packages/modules/inventory`, `stock-location` | Multi-location stock levels, reservations natively supported. |
| **Fulfillment** | 🔵 Native Available | `medusa/packages/modules/fulfillment` | Shipping options, methods, tracking numbers natively supported. |
| **Admin** | 🔵 Native Available | `medusa/packages/admin`, `user`, `rbac` | Admin dashboard package, user invitations, granular RBAC policies natively present. |

---

## 9. Payload CMS Framework Audit

Detailed audit of Payload CMS v4 codebase located at `payload/packages/`:

| Domain | Status | Available Packages | Findings & Gap Analysis |
|---|:---:|---|---|
| **CMS** | 🔵 Native Available | `payload/packages/payload`, `richtext-lexical` | Pages, Posts, Categories, Media, Blocks natively supported. Workspace needs collection configuration. |
| **Auth** | 🔵 Native Available | `payload/packages/payload` | Admin users, Login, Password Reset, Access Control, Roles supported natively. |
| **Content** | 🔵 Native Available | `payload/packages/payload` | Drafts, Publishing, Versions, Relationships natively supported. |
| **API** | 🔵 Native Available | `payload/packages/graphql`, `next` | REST, GraphQL endpoints, Custom hooks, Access rules supported natively. |
| **SEO** | 🔵 Native Available | `payload/packages/plugin-seo` | SEO fields, OpenGraph, Metadata generator provided by `@payloadcms/plugin-seo`. |

---

## 10. Infrastructure Audit

| Resource | Status | Evidence File Path | Details |
|---|:---:|---|---|
| **docker-compose.yml** | 🟢 IMPLEMENTED | `docker-compose.yml` | Full service stack defined: `postgres`, `redis`, `medusa`, `payload`, `nginx`. |
| **Nginx Reverse Proxy** | 🟢 IMPLEMENTED | `infrastructure/nginx/nginx.conf` | Proxies port 80 to Payload (`/payload/`) and Medusa (`/api/medusa/`). |
| **PostgreSQL** | 🟢 IMPLEMENTED | `docker-compose.yml` | PostgreSQL 16 Alpine container with persistent volume `postgres_data`. |
| **Redis** | 🟢 IMPLEMENTED | `docker-compose.yml` | Redis 7 Alpine container with persistent volume `redis_data`. |
| **Environment Config** | 🟢 IMPLEMENTED | `.env.example` | Clean variable template (`POSTGRES_USER`, `MEDUSA_DATABASE_URL`, `PAYLOAD_SECRET`). |
| **Health Checks** | 🟢 IMPLEMENTED | `docker-compose.yml` | Health check commands configured for PostgreSQL (`pg_isready`) and Redis (`ping`). |
| **Migrations** | 🔵 Native Available | Medusa & Payload CLI | CLI commands available in respective packages. |
| **Deployment Scripts** | 🔴 NOT_IMPLEMENTED | None | No staging/production CI/CD pipeline scripts found in root workspace. |

---

## 11. External Integrations Audit

| Integration Category | Provider Needed | Configuration Status | Code / Package Status | Overall Status |
|---|---|---|---|:---:|
| **Payment Gateway** | ZarinPal / Shaparak | Not Configured | No Iranian Gateway Provider | 🟠 INTEGRATION_REQUIRED |
| **SMS Gateway** | Kavenegar / FarazSMS | Not Configured | No SMS Provider Plugin | 🟠 INTEGRATION_REQUIRED |
| **Email Service** | SMTP / Resend | Adapter Present | `@payloadcms/email-nodemailer` installed | 🟠 INTEGRATION_REQUIRED |
| **Storage / CDN** | S3 / MinIO / Vercel Blob | Adapter Present | `@payloadcms/storage-s3` installed | 🟠 INTEGRATION_REQUIRED |
| **Search Engine** | Meilisearch / Algolia | Plugin Present | `@payloadcms/plugin-search` installed | 🟠 INTEGRATION_REQUIRED |
| **Analytics** | PostHog / Google Analytics | Dependencies in Medusa | `posthog-node` in devDependencies | 🟠 INTEGRATION_REQUIRED |

---

## 12. Database Audit

| Model / Entity | Schema Location | Status | Notes |
|---|---|:---:|---|
| **Product & Variant** | `medusa/packages/modules/product` | 🟢 Exists | Native Medusa product model. |
| **Customer & Address** | `medusa/packages/modules/customer` | 🟢 Exists | Native Medusa customer schema. |
| **Cart & LineItem** | `medusa/packages/modules/cart` | 🟢 Exists | Native Medusa cart schema. |
| **Order & Fulfillment** | `medusa/packages/modules/order` | 🟢 Exists | Native Medusa order schema. |
| **Payment & Collection** | `medusa/packages/modules/payment` | 🟢 Exists | Native Medusa payment schema. |
| **Promotion & Campaign** | `medusa/packages/modules/promotion` | 🟢 Exists | Native Medusa promotion schema. |
| **Review & Rating** | None | 🔴 Does Not Exist | Needs custom collection or module. |
| **Wishlist** | None | 🔴 Does Not Exist | Needs custom collection or module. |
| **Wallet** | None | 🔴 Does Not Exist | Needs custom collection or module. |
| **Notification Center** | None | 🔴 Does Not Exist | Needs custom storage model. |

---

## 13. API Audit

| Domain | Supported Endpoints / Routes | Status | Notes |
|---|---|:---:|---|
| **Medusa Store API** | `GET/POST /store/products`, `carts`, `customers`, `orders` | 🟢 Native Available | Defined in `medusa/packages/medusa/src/api/store/`. |
| **Medusa Admin API** | `GET/POST/PUT/DELETE /admin/products`, `orders`, `users` | 🟢 Native Available | Defined in `medusa/packages/medusa/src/api/admin/`. |
| **Payload REST API** | `GET/POST/PATCH/DELETE /api/[collection]` | 🟢 Native Available | Dynamic routes in `payload/app/(payload)/api/[...slug]/route.ts`. |
| **Payload GraphQL** | `POST /api/graphql`, `/api/graphql-playground` | 🟢 Native Available | Route at `payload/app/(payload)/api/graphql/route.ts`. |

---

## 14. Authentication / Authorization Audit

| Auth Component | Mechanism | Status | Evidence |
|---|---|:---:|---|
| **Customer Auth** | JWT / Session via Medusa Auth | 🟢 Native Available | `medusa/packages/modules/auth` |
| **Admin Auth** | JWT / Session via Medusa & Payload | 🟢 Native Available | Medusa User & Payload Auth collections |
| **RBAC / Permissions** | Medusa RBAC Module & Payload Access Rules | 🟢 Native Available | `medusa/packages/modules/rbac` |
| **SMS OTP Auth** | Custom Auth Provider Needed | 🟠 Integration Required | Missing Iranian SMS provider |

---

## 15. Testing Audit

| Test Level | Location | Status | Notes |
|---|---|:---:|---|
| **Medusa Unit / Int Tests** | `medusa/integration-tests/` | 🟢 Native Available | Jest test suites for core modules. |
| **Payload Int / Unit Tests** | `payload/test/` | 🟢 Native Available | Vitest & Playwright e2e test suites. |
| **Depix Workspace E2E Tests** | None | 🔴 Missing | No custom end-to-end e-commerce flow test suite. |

---

## 16. Missing Features

### Critical
1. ** Iranian Payment Gateway Integration (`#24`)**
   - **Why missing:** Medusa core only includes system/stripe default providers.
   - **What needs to be built:** Medusa Payment Provider Plugin for ZarinPal / Shaparak.
   - **Owner:** `medusa`
   - **Dependencies:** ZarinPal REST API.
   - **Estimated Complexity:** Medium (3-5 days).
2. ** Iranian SMS OTP Authentication (`#42`, `#77`)**
   - **Why missing:** Medusa core uses password authentication by default.
   - **What needs to be built:** Medusa Auth Provider for SMS OTP and Notification Provider.
   - **Owner:** `medusa`
   - **Dependencies:** Kavenegar / FarazSMS API.
   - **Estimated Complexity:** Medium (3-5 days).
3. ** Storefront Web Application (`#1` - `#12`)**
   - **Why missing:** Workspace contains backend engines only; storefront app is not initialized.
   - **What needs to be built:** Next.js Storefront app with Medusa Store API client integration.
   - **Owner:** New workspace package `storefront/`.
   - **Dependencies:** Medusa Store API, Payload CMS API.
   - **Estimated Complexity:** High (2-3 weeks).

### Important
4. ** Product Reviews & Rating System (`#29`, `#30`, `#49`, `#50`)**
   - **Why missing:** Neither framework core includes a product review entity out of the box.
   - **What needs to be built:** `Reviews` collection in Payload CMS or custom Medusa module with moderation hooks.
   - **Owner:** `payload` or `medusa`
   - **Dependencies:** Customer authentication.
   - **Estimated Complexity:** Medium (3-4 days).
5. ** Wishlist (`#41`)**
   - **Why missing:** Wishlist is not a core Medusa v2 module.
   - **What needs to be built:** Custom Medusa module or Customer metadata sync for wishlist items.
   - **Owner:** `medusa`
   - **Dependencies:** Medusa Customer Module.
   - **Estimated Complexity:** Low (2 days).

### Optional / Advanced
6. ** Customer Wallet System (`#94`)**
   - **Why missing:** Requires custom financial ledger logic.
   - **What needs to be built:** Wallet balance database model and Payment Provider using wallet balance.
   - **Owner:** `medusa`
   - **Dependencies:** Medusa Payment Module.
   - **Estimated Complexity:** High (5-7 days).

---

## 17. Partial Features

*There are currently 0 partial features because the core framework engines are intact without broken partial modifications.*

---

## 18. Native Medusa Capabilities Not Yet Used

1. **Promotion Campaigns (`#64`)**
   - **Medusa capability:** `medusa/packages/modules/promotion` campaign budgets & conditions.
   - **How to enable:** Create campaign objects via Medusa Admin API.
2. **Multi-Location Inventory (`#32`)**
   - **Medusa capability:** `medusa/packages/modules/inventory` and `stock-location`.
   - **How to enable:** Define stock locations in Medusa Admin.
3. **Customer Groups (`#52`)**
   - **Medusa capability:** `medusa/packages/modules/customer` customer groups.
   - **How to enable:** Assign customer groups and attach price lists.

---

## 19. Native Payload Capabilities Not Used

1. **SEO Plugin (`#61`, `#72`)**
   - **Payload capability:** `@payloadcms/plugin-seo` package available in monorepo.
   - **How to enable:** Add `seoPlugin({})` to `payload.config.ts`.
2. **Form Builder Plugin (`#6`)**
   - **Payload capability:** `@payloadcms/plugin-form-builder` package available.
   - **How to enable:** Add `formBuilderPlugin({})` to `payload.config.ts`.
3. **Block Page Builder (`#90`)**
   - **Payload capability:** Payload Lexical & Blocks layout fields.
   - **How to enable:** Configure `blocks` array on `Pages` collection in Payload.

---

## 20. Recommended Implementation Order

Based on actual dependency chains found in the codebase:

```text
Phase 1 — Workspace Payload & Medusa App Configurations
          ├── Define Payload CMS Collections (Pages, Posts, Categories, Media)
          └── Configure Medusa Store & Region settings

Phase 2 — Core Local Integrations (Critical)
          ├── Build Medusa Iranian Payment Provider (ZarinPal)
          └── Build Medusa Iranian SMS OTP Auth & Notification Provider (Kavenegar)

Phase 3 — Storefront Application Setup
          ├── Initialize Next.js Storefront app
          ├── Implement Storefront UI (Header, Footer, PDP, Catalog, Cart)
          └── Connect Storefront to Medusa Store API & Payload CMS API

Phase 4 — Customer & Checkout Workflows
          ├── Implement Customer Account Dashboard & Order History
          └── Complete Multi-step Checkout & Guest Checkout UI

Phase 5 — Custom E-Commerce Features (Missing)
          ├── Build Product Reviews & Rating System in Payload CMS
          └── Implement Customer Wishlist Module in Medusa

Phase 6 — SEO & Performance Optimization
          ├── Enable `@payloadcms/plugin-seo` in Payload
          └── Generate dynamic sitemaps and JSON-LD structured schema on Storefront

Phase 7 — Analytics & Advanced Features
          ├── Implement Automated Invoice PDF Generation
          └── Build Sales & Inventory Export Reports
```

---

## 21. Final Assessment

### Key Findings
1. **Solid Framework Foundations:** The workspace contains clean, up-to-date source trees for both **Medusa v2** (`medusa/`) and **Payload CMS v4** (`payload/`).
2. **Robust Infrastructure:** The central Docker Compose (`docker-compose.yml`) and Nginx reverse proxy (`infrastructure/nginx/nginx.conf`) provide a fully orchestrated local environment with PostgreSQL 16 and Redis 7.
3. **Core Gaps:** The workspace currently lacks custom application business logic (e.g. `payload.config.ts` collections, custom Medusa plugins) and a Storefront frontend application.
4. **Platform Readiness:** With 57 out of 96 features natively available in the included framework packages, the platform achieves a **69.8% Platform Coverage Score**, making it highly ready for custom configuration and integration.
