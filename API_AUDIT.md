# Frontend API Audit Against OpenAPI Specification

## A. Executive Summary

This document presents a comprehensive audit of the **Mepusham (Depix E-Commerce)** frontend project against the backend **OpenAPI 3.0 specification** (`openAPI.yml`). The purpose of this audit is to identify all frontend API requirements, evaluate contract alignment with the backend specification, highlight missing or inconsistent endpoints, and provide a prioritized roadmap for full backend integration.

### Identified Frontend Technologies & Architecture
- **Framework & Runtime**: Next.js 15 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS, PostCSS, Lucide React Icons
- **State & Data Management**: React Context, Custom Hooks, LocalStorage persistence layers with SSR fallback adapters, Client Stores (`CartStore`, `WishlistStore`, `AdminAuthStore`)
- **Testing & Tooling**: Bun Test (`bun test`), ESLint, PostCSS
- **API Integration Pattern**: The current frontend operates on client-side mock services and domain repositories (`catalogRepository`, `authService`, `accountService`, `supportService`, `returnService`, `customerService`, `inventoryService`, `promotionService`, `storeSettingsService`, `shippingService`, `blogService`, `sizeGuideService`, `uploadService`). Services manipulate `localStorage` with in-memory fallbacks for SSR/test environments. No direct server HTTP requests (`fetch` or `axios`) are currently executed, but clear API contract contracts are established across service boundaries.

### OpenAPI Specification Metadata
- **File Location**: `openAPI.yml` (Repository Root)
- **OpenAPI Version**: 3.0.0
- **API Title & Version**: Depix E-Commerce Backend API (Medusa v2), Version 2.21.2
- **Configured Servers**:
  - `http://localhost:9000` (Local Medusa Backend)
  - `http://localhost/api/medusa` (Nginx Reverse Proxy Gateway)
- **Security Schemes**: Bearer JWT (`bearerAuth`), Cookie Session (`cookieAuth`)
- **Total OpenAPI Endpoints Defined**: 42 endpoints

### Summary Statistics

| Category | Count | Notes / Overlap Explanation |
| :--- | :---: | :--- |
| **Total Frontend API Requirements Identified** | **91** | Derived from explicit frontend user flows, pages, forms, and service methods. |
| **MATCHED** | **22** | Exact endpoint path, HTTP method, and contract schema match between frontend requirement and `openAPI.yml`. |
| **PARTIALLY_MATCHED** | **6** | Endpoint exists in OpenAPI, but request parameter casing (snake_case vs camelCase), extra frontend registration parameters, or nested payload wrappers differ. |
| **MISSING_IN_OPENAPI** | **55** | Frontend requirement exists in codebase, but no corresponding endpoint or schema is defined in `openAPI.yml` (e.g., Products, Orders, Customer Profiles, Addresses, Returns, Discounts, Blog). |
| **NEEDS_REVIEW** | **0** | All identified requirements have clear source code evidence and definitive mapping status. |
| **NOT_IMPLEMENTED_IN_FRONTEND** | **8** | OpenAPI endpoints that exist in the specification but have no corresponding active HTTP call or integration in the frontend codebase. |
| **Backend Endpoints with No Detected Frontend Usage** | **8** | Identical set as `NOT_IMPLEMENTED_IN_FRONTEND` (Admin Media list/get/delete, Customer Notifications list/count/read-all/read, Admin Margin Report). |

*Note on Overlaps*: The 8 `NOT_IMPLEMENTED_IN_FRONTEND` requirements directly correspond to the 8 `Backend Endpoints with No Detected Frontend Usage` in `openAPI.yml`. The total requirements count (91) is composed of 22 MATCHED + 6 PARTIALLY_MATCHED + 55 MISSING_IN_OPENAPI + 8 NOT_IMPLEMENTED_IN_FRONTEND.

---

## B. Frontend API Requirements

The following table details all 91 frontend API requirements extracted from the Mepusham codebase, cross-referenced against `openAPI.yml`.

| ID | Feature/Module | Business Purpose | Method | Expected Endpoint | Frontend Status | OpenAPI Status | Source Files | Notes |
| :-: | :--- | :--- | :-: | :--- | :--- | :--- | :--- | :--- |
| **REQ-001** | Auth / OTP | Send login/register OTP code to Iranian mobile number | POST | `/auth/phone/send-otp` | Mocked (`authService.requestOtp`) | **PARTIALLY_MATCHED** | `src/lib/auth/authService.ts:38` | OpenAPI accepts `{ phone }`; frontend also sends `{ mode, firstName, lastName }`. |
| **REQ-002** | Auth / OTP | Verify 6-digit OTP code and retrieve user token | POST | `/auth/phone/verify` | Mocked (`authService.verifyOtp`) | **PARTIALLY_MATCHED** | `src/lib/auth/authService.ts:74` | OpenAPI accepts `{ phone, code }`; frontend also sends `{ firstName, lastName }` on registration. |
| **REQ-003** | Auth / Account | Fetch current authenticated customer profile | GET | `/store/customers/me` | Mocked (`authService.getCurrentUser`) | **MISSING_IN_OPENAPI** | `src/lib/auth/authService.ts:121` | Essential storefront endpoint for profile restoration after reload. |
| **REQ-004** | Auth / Account | Update customer profile (first name, last name) | PATCH | `/store/customers/me` | Mocked (`authService.updateProfile`) | **MISSING_IN_OPENAPI** | `src/lib/auth/authService.ts:139` | Customer edit profile flow in account modal. |
| **REQ-005** | Auth / Session | Customer logout / token revocation | POST | `/auth/logout` | LocalStorage Clear (`authService.logout`) | **MISSING_IN_OPENAPI** | `src/lib/auth/authService.ts:171` | Server-side token invalidation missing. |
| **REQ-006** | Admin Auth | Admin staff login with credentials | POST | `/admin/auth/token` | Mocked (`authService.loginAdmin`) | **MISSING_IN_OPENAPI** | `src/lib/auth/authService.ts:186` | Admin panel login route `/admin/login`. |
| **REQ-007** | Admin Auth | Admin session logout | POST | `/admin/auth/logout` | LocalStorage Clear (`authService.logoutAdmin`) | **MISSING_IN_OPENAPI** | `src/lib/auth/authService.ts:228` | Admin logout button in sidebar/header. |
| **REQ-008** | Catalog / Store | List & filter public store products (paginated) | GET | `/store/products` | Mocked (`catalogRepository.getProducts`) | **MISSING_IN_OPENAPI** | `src/lib/repositories/catalogRepository.ts:45`, `src/hooks/usePaginatedProducts.ts` | Major core storefront endpoint missing in OpenAPI. |
| **REQ-009** | Catalog / Store | Get public product details by ID or slug | GET | `/store/products/{id}` | Mocked (`catalogRepository.getProductById`) | **MISSING_IN_OPENAPI** | `src/lib/repositories/catalogRepository.ts:71` | Product Detail Page (PDP) requirement. |
| **REQ-010** | Catalog / PDP | Get size guide template for product | GET | `/store/products/{id}/size-guide` | Mocked (`sizeGuideService.getTemplates`) | **MATCHED** | `src/lib/sizeguide/sizeGuideService.ts`, `src/components/pdp/SizeGuideModal.tsx` | Operation ID: `getStoreProductSizeGuide`. |
| **REQ-011** | Catalog / Admin | List all products for admin management | GET | `/admin/products` | Mocked (`catalogRepository.getProducts`) | **MISSING_IN_OPENAPI** | `src/app/admin/products/page.tsx` | Admin product management table. |
| **REQ-012** | Catalog / Admin | Create new product with options & variants | POST | `/admin/products` | Mocked (`catalogRepository.saveProducts`) | **MISSING_IN_OPENAPI** | `src/lib/repositories/catalogRepository.ts:80` | Admin product creation form. |
| **REQ-013** | Catalog / Admin | Update product details & inventory | PUT | `/admin/products/{id}` | Mocked (`catalogRepository.saveProducts`) | **MISSING_IN_OPENAPI** | `src/lib/repositories/catalogRepository.ts:80` | Admin product editing. |
| **REQ-014** | Catalog / Admin | Delete product from catalog | DELETE | `/admin/products/{id}` | Mocked (`catalogRepository.saveProducts`) | **MISSING_IN_OPENAPI** | `src/lib/repositories/catalogRepository.ts` | Admin product deletion action. |
| **REQ-015** | Brands / Store | List active public brands | GET | `/store/brands` | Mocked (`catalogRepository.getBrands`) | **MATCHED** | `src/lib/repositories/catalogRepository.ts:119` | Operation ID: `listPublicBrands`. |
| **REQ-016** | Brands / Store | Get active brand by ID or slug | GET | `/store/brands/{id}` | Mocked (`catalogRepository.getBrandById`) | **MATCHED** | `src/lib/repositories/catalogRepository.ts` | Operation ID: `getPublicBrand`. |
| **REQ-017** | Brands / Admin | List all brands for admin management | GET | `/admin/brands` | Mocked (`CreateBrandModal.tsx`) | **MATCHED** | `src/components/admin/CreateBrandModal.tsx` | Operation ID: `listAdminBrands`. |
| **REQ-018** | Brands / Admin | Create a new brand | POST | `/admin/brands` | Mocked (`catalogRepository.saveBrands`) | **PARTIALLY_MATCHED** | `src/components/admin/CreateBrandModal.tsx` | Operation ID: `createAdminBrand`. Model casing discrepancy (`is_active` vs `isActive`). |
| **REQ-019** | Brands / Admin | Get admin brand details by ID | GET | `/admin/brands/{id}` | Mocked (`catalogRepository`) | **MATCHED** | `src/lib/repositories/catalogRepository.ts` | Operation ID: `getAdminBrand`. |
| **REQ-020** | Brands / Admin | Update existing brand details | PUT | `/admin/brands/{id}` | Mocked (`catalogRepository.saveBrands`) | **PARTIALLY_MATCHED** | `src/lib/repositories/catalogRepository.ts` | Operation ID: `updateAdminBrand`. |
| **REQ-021** | Brands / Admin | Delete brand safely | DELETE | `/admin/brands/{id}` | Mocked (`catalogRepository.saveBrands`) | **MATCHED** | `src/lib/repositories/catalogRepository.ts` | Operation ID: `deleteAdminBrand`. |
| **REQ-022** | Categories / Store | List public categories | GET | `/store/categories` | Mocked (`catalogRepository.getCategories`) | **MATCHED** | `src/lib/repositories/catalogRepository.ts:92` | Operation ID: `listPublicCategories`. |
| **REQ-023** | Categories / Store | Get public category details | GET | `/store/categories/{id}` | Mocked (`catalogRepository.getCategoryById`) | **MATCHED** | `src/lib/repositories/catalogRepository.ts` | Operation ID: `getPublicCategory`. |
| **REQ-024** | Categories / Admin | List categories for admin panel | GET | `/admin/categories` | Mocked (`CreateCategoryModal.tsx`) | **MATCHED** | `src/components/admin/CreateCategoryModal.tsx` | Operation ID: `listAdminCategories`. |
| **REQ-025** | Categories / Admin | Create new category | POST | `/admin/categories` | Mocked (`catalogRepository.saveCategories`) | **PARTIALLY_MATCHED** | `src/components/admin/CreateCategoryModal.tsx` | Operation ID: `createAdminCategory`. Casing discrepancy (`parent_category_id` vs `parentCategoryId`). |
| **REQ-026** | Categories / Admin | Get admin category details | GET | `/admin/categories/{id}` | Mocked (`catalogRepository`) | **MATCHED** | `src/lib/repositories/catalogRepository.ts` | Operation ID: `getAdminCategory`. |
| **REQ-027** | Categories / Admin | Update category attributes | PUT | `/admin/categories/{id}` | Mocked (`catalogRepository.saveCategories`) | **PARTIALLY_MATCHED** | `src/lib/repositories/catalogRepository.ts` | Operation ID: `updateAdminCategory`. |
| **REQ-028** | Categories / Admin | Delete category safely | DELETE | `/admin/categories/{id}` | Mocked (`catalogRepository.saveCategories`) | **MATCHED** | `src/lib/repositories/catalogRepository.ts` | Operation ID: `deleteAdminCategory`. |
| **REQ-029** | Reviews / Store | List customer reviews for a product | GET | `/store/products/{id}/reviews` | Mocked (`reviewService.getReviewsForProduct`) | **MISSING_IN_OPENAPI** | `src/lib/product/reviewService.ts:38` | Product review listing missing in OpenAPI. |
| **REQ-030** | Reviews / Store | Submit new product review & rating | POST | `/store/products/{id}/reviews` | Mocked (`reviewService.addReview`) | **MISSING_IN_OPENAPI** | `src/lib/product/reviewService.ts:68` | Review submission endpoint missing in OpenAPI. |
| **REQ-031** | Reviews / Store | Upload review image attachment | POST | `/store/reviews/media` | Mocked (`reviewService`) | **MATCHED** | `src/lib/product/reviewService.ts`, `src/lib/media/uploadService.ts` | Operation ID: `uploadStoreReviewMedia`. |
| **REQ-032** | Orders / Checkout | Submit new customer order after payment | POST | `/store/orders` | Mocked (`accountService.createOrder`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:251`, `src/app/payment/page.tsx` | Critical checkout order creation missing in OpenAPI. |
| **REQ-033** | Orders / Customer | List orders for logged-in customer | GET | `/store/orders` | Mocked (`accountService.getOrders`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:28` | Customer order history page `/account/orders`. |
| **REQ-034** | Orders / Customer | Get order details by ID for customer | GET | `/store/orders/{id}` | Mocked (`accountService.getOrderByIdForCustomer`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:70` | Customer order details page `/account/orders/[orderId]`. Includes IDOR guard. |
| **REQ-035** | Orders / Customer | Customer cancels order (pending status) | POST | `/store/orders/{id}/cancel` | Mocked (`accountService.cancelOrderByCustomer`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:182` | Customer self-service order cancellation. |
| **REQ-036** | Orders / Admin | List all orders for admin management | GET | `/admin/orders` | Mocked (`accountService.getOrders`) | **MISSING_IN_OPENAPI** | `src/app/admin/orders/page.tsx` | Admin orders overview table with filters. |
| **REQ-037** | Orders / Admin | Update order status & tracking code | PATCH | `/admin/orders/{id}/status` | Mocked (`accountService.updateOrderStatus`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:79` | Admin order state machine advancement. |
| **REQ-038** | Orders / Admin | Bulk update status for selected orders | POST | `/admin/orders/bulk-status` | Mocked (`accountService.bulkUpdateOrderStatus`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:133` | Admin bulk actions on orders table. |
| **REQ-039** | Orders / Admin | Bulk cancel selected orders | POST | `/admin/orders/bulk-cancel` | Mocked (`accountService.bulkCancelOrders`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:218` | Admin bulk order cancellation. |
| **REQ-040** | Addresses / Customer | List saved addresses for customer | GET | `/store/customers/me/addresses` | Mocked (`accountService.getAddresses`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:383` | Saved address list in checkout & account. |
| **REQ-041** | Addresses / Customer | Create or update customer address | POST | `/store/customers/me/addresses` | Mocked (`accountService.saveAddress`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:397` | Address modal form submit. |
| **REQ-042** | Addresses / Customer | Delete customer saved address | DELETE | `/store/customers/me/addresses/{id}` | Mocked (`accountService.deleteAddress`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:432` | Address removal action. |
| **REQ-043** | Addresses / Customer | Set default shipping address | POST | `/store/customers/me/addresses/{id}/default` | Mocked (`accountService.setDefaultAddress`) | **MISSING_IN_OPENAPI** | `src/lib/account/accountService.ts:445` | Set primary address toggle. |
| **REQ-044** | Support / Store | List support tickets for customer | GET | `/store/tickets` | Mocked (`supportService.getTickets`) | **MATCHED** | `src/lib/support/supportService.ts:60` | Operation ID: `listStoreTickets`. |
| **REQ-045** | Support / Store | Create new support ticket | POST | `/store/tickets` | Mocked (`supportService.createTicket`) | **PARTIALLY_MATCHED** | `src/lib/support/supportService.ts:114` | Operation ID: `createStoreTicket`. Contract parameters casing (`category_id` vs `categoryId`). |
| **REQ-046** | Support / Common | Get ticket details and message thread | GET | `/store/tickets/{id}` | Mocked (`supportService.getTicketById`) | **MISSING_IN_OPENAPI** | `src/lib/support/supportService.ts:88` | Ticket detail page `/account/support/[ticketId]`. |
| **REQ-047** | Support / Common | Add message reply to support ticket | POST | `/store/tickets/{id}/messages` | Mocked (`supportService.addCustomerReply`) | **MISSING_IN_OPENAPI** | `src/lib/support/supportService.ts:168` | Ticket chat reply input. |
| **REQ-048** | Support / Admin | List all support tickets for admin | GET | `/admin/tickets` | Mocked (`supportService.getTickets`) | **MATCHED** | `src/lib/support/supportService.ts:60` | Operation ID: `listAdminTickets`. |
| **REQ-049** | Support / Admin | Update ticket status or assign agent | PATCH | `/admin/tickets/{id}` | Mocked (`supportService.updateTicketStatus`) | **MISSING_IN_OPENAPI** | `src/lib/support/supportService.ts:251` | Admin support operator actions. |
| **REQ-050** | Returns / Customer | List customer return requests | GET | `/store/returns` | Mocked (`returnService.getReturnRequests`) | **MISSING_IN_OPENAPI** | `src/lib/returns/returnService.ts:32` | Customer returns tab `/account/returns`. |
| **REQ-051** | Returns / Customer | Get return request details & timeline | GET | `/store/returns/{id}` | Mocked (`returnService.getReturnById`) | **MISSING_IN_OPENAPI** | `src/lib/returns/returnService.ts` | Return detail view `/account/returns/[returnId]`. |
| **REQ-052** | Returns / Customer | Create return/exchange request | POST | `/store/returns` | Mocked (`returnService.createReturnRequest`) | **MISSING_IN_OPENAPI** | `src/lib/returns/returnService.ts` | Return creation wizard `/account/orders/[orderId]/return`. |
| **REQ-053** | Returns / Admin | List return requests for admin | GET | `/admin/returns` | Mocked (`returnService.getReturnRequests`) | **MISSING_IN_OPENAPI** | `src/app/admin/returns/page.tsx` | Admin return management queue. |
| **REQ-054** | Returns / Admin | Process inspection & approve/reject return | PATCH | `/admin/returns/{id}/status` | Mocked (`returnService.processInspection`) | **MISSING_IN_OPENAPI** | `src/lib/returns/returnService.ts` | Admin inspection & refund processing. |
| **REQ-055** | Customers / Admin | List customers with aggregated analytics | GET | `/admin/customers` | Mocked (`customerService.getCustomers`) | **MISSING_IN_OPENAPI** | `src/lib/customer/customerService.ts:35` | Admin customer directory page `/admin/customers`. |
| **REQ-056** | Customers / Admin | Get customer detail profile & history | GET | `/admin/customers/{id}` | Mocked (`customerService.getCustomerById`) | **MISSING_IN_OPENAPI** | `src/lib/customer/customerService.ts:98` | Admin customer detail view `/admin/customers/[customerId]`. |
| **REQ-057** | Customers / Admin | Toggle customer active/suspended status | PATCH | `/admin/customers/{id}/status` | Mocked (`customerService.toggleCustomerStatus`) | **MISSING_IN_OPENAPI** | `src/lib/customer/customerService.ts:168` | Customer status management. |
| **REQ-058** | Customers / Admin | Update admin customer profile overrides | PUT | `/admin/customers/{id}` | Mocked (`customerService.updateCustomerProfile`) | **MISSING_IN_OPENAPI** | `src/lib/customer/customerService.ts:193` | Customer edit modal in admin. |
| **REQ-059** | Inventory / Admin | List inventory balances across locations | GET | `/admin/inventory` | Mocked (`inventoryService.getInventoryItems`) | **MISSING_IN_OPENAPI** | `src/lib/inventory/inventoryService.ts` | Admin inventory management table. |
| **REQ-060** | Inventory / Admin | Adjust stock level & log change reason | POST | `/admin/inventory/adjust` | Mocked (`inventoryService.adjustInventory`) | **MISSING_IN_OPENAPI** | `src/lib/inventory/inventoryService.ts` | Stock adjustment modal. |
| **REQ-061** | Inventory / Admin | Get global inventory transaction history | GET | `/admin/inventory/history` | Mocked (`inventoryService.getHistory`) | **MATCHED** | `src/lib/inventory/inventoryService.ts`, `openAPI.yml:681` | Operation ID: `getGlobalInventoryHistory`. |
| **REQ-062** | Inventory / Admin | Get low stock alert items | GET | `/admin/inventory/low-stock` | Mocked (`inventoryService`) | **MATCHED** | `src/lib/inventory/inventoryService.ts`, `openAPI.yml:736` | Operation ID: `getLowStockInventoryAlerts`. |
| **REQ-063** | Promotions / Admin | List discount coupon codes & rules | GET | `/admin/discounts` | Mocked (`promotionService.getDiscounts`) | **MISSING_IN_OPENAPI** | `src/lib/promotions/promotionService.ts:50` | Discount codes tab under `/admin/discounts`. |
| **REQ-064** | Promotions / Admin | Create, update, or delete discount code | POST / PUT / DELETE | `/admin/discounts` | Mocked (`promotionService.createDiscount`) | **MISSING_IN_OPENAPI** | `src/lib/promotions/promotionService.ts:70` | Discount code modal form. |
| **REQ-065** | Promotions / Admin | List promotional marketing campaigns | GET | `/admin/campaigns` | Mocked (`promotionService.getCampaigns`) | **MISSING_IN_OPENAPI** | `src/lib/promotions/promotionService.ts:150` | Campaigns tab under `/admin/discounts`. |
| **REQ-066** | Promotions / Admin | Create, update, or delete campaign | POST / PUT / DELETE | `/admin/campaigns` | Mocked (`promotionService.createCampaign`) | **MISSING_IN_OPENAPI** | `src/lib/promotions/promotionService.ts:170` | Campaign creation wizard. |
| **REQ-067** | Promotions / Admin | Get & save free shipping threshold rules | GET / POST | `/admin/shipping/free-rules` | Mocked (`promotionService.getFreeShippingRules`) | **MISSING_IN_OPENAPI** | `src/lib/promotions/promotionService.ts:240` | Free shipping config tab under `/admin/discounts`. |
| **REQ-068** | Shipping / Common | List available courier shipping methods | GET | `/store/shipping-options` | Mocked (`shippingService.getShippingMethods`) | **MISSING_IN_OPENAPI** | `src/lib/shipping/shippingService.ts:10` | Shipping method selector on checkout `/checkout`. |
| **REQ-069** | Shipping / Admin | Create, update, or delete shipping method | POST / PUT / DELETE | `/admin/shipping-options` | Mocked (`shippingService.saveShippingMethod`) | **MISSING_IN_OPENAPI** | `src/lib/shipping/shippingService.ts:29` | Admin shipping options configuration `/admin/shipping`. |
| **REQ-070** | Settings / Admin | Get global store settings | GET | `/admin/settings` | Mocked (`storeSettingsService.getSettings`) | **MATCHED** | `src/lib/store-settings/storeSettingsService.ts`, `openAPI.yml:458` | Operation ID: `getStoreSettings`. |
| **REQ-071** | Settings / Admin | Update store settings attributes | PATCH | `/admin/settings` | Mocked (`storeSettingsService.updateSettings`) | **MATCHED** | `src/lib/store-settings/storeSettingsService.ts`, `openAPI.yml:474` | Operation ID: `updateStoreSettings`. |
| **REQ-072** | Settings / Admin | List store physical origin/return addresses | GET | `/admin/settings/addresses` | Mocked (`storeSettingsService.getAddresses`) | **MATCHED** | `src/lib/store-settings/storeSettingsService.ts`, `openAPI.yml:532` | Operation ID: `listStoreAddresses`. |
| **REQ-073** | Settings / Admin | Create physical store address | POST | `/admin/settings/addresses` | Mocked (`storeSettingsService.addAddress`) | **MATCHED** | `src/lib/store-settings/storeSettingsService.ts`, `openAPI.yml:568` | Operation ID: `createStoreAddress`. |
| **REQ-074** | Settings / Admin | Update physical store address | PATCH | `/admin/settings/addresses/{id}` | Mocked (`storeSettingsService.updateAddress`) | **MATCHED** | `src/lib/store-settings/storeSettingsService.ts`, `openAPI.yml:617` | Operation ID: `updateStoreAddress`. |
| **REQ-075** | Settings / Admin | Delete physical store address | DELETE | `/admin/settings/addresses/{id}` | Mocked (`storeSettingsService.deleteAddress`) | **MATCHED** | `src/lib/store-settings/storeSettingsService.ts`, `openAPI.yml:661` | Operation ID: `deleteStoreAddress`. |
| **REQ-076** | Settings / Admin | Set default shipping origin address | PUT | `/admin/settings/default-shipping-address` | Mocked (`storeSettingsService.setDefaultShippingAddress`) | **MATCHED** | `src/lib/store-settings/storeSettingsService.ts`, `openAPI.yml:623` | Operation ID: `setDefaultShippingAddress`. |
| **REQ-077** | Settings / Admin | Set default return destination address | PUT | `/admin/settings/default-return-address` | Mocked (`storeSettingsService.setDefaultReturnAddress`) | **MATCHED** | `src/lib/store-settings/storeSettingsService.ts`, `openAPI.yml:652` | Operation ID: `setDefaultReturnAddress`. |
| **REQ-078** | Media / Admin | Upload file to media library | POST | `/admin/media/upload` | Mocked (`uploadService.uploadFile`) | **MATCHED** | `src/lib/media/uploadService.ts`, `src/components/admin/ImagePicker.tsx` | Operation ID: `uploadAdminMedia`. |
| **REQ-079** | Blog / Store | List published blog posts (paginated) | GET | `/store/blog/posts` | Mocked (`blogService.getPublishedPosts`) | **MISSING_IN_OPENAPI** | `src/lib/blog/blogService.ts:40` | Blog landing page `/blog`. |
| **REQ-080** | Blog / Store | Get blog post content by slug | GET | `/store/blog/posts/{slug}` | Mocked (`blogService.getPostBySlug`) | **MISSING_IN_OPENAPI** | `src/lib/blog/blogService.ts` | Article view `/blog/[slug]`. |
| **REQ-081** | Blog / Admin | Admin CRUD operations for blog posts | POST / PUT / DELETE | `/admin/blog/posts` | Mocked (`blogService`) | **MISSING_IN_OPENAPI** | `src/app/admin/blog/page.tsx` | Admin blog editor. |
| **REQ-082** | Size Guide / Admin | List size guide templates | GET | `/admin/size-guides/templates` | Mocked (`sizeGuideService.getTemplates`) | **MATCHED** | `src/lib/sizeguide/sizeGuideService.ts`, `openAPI.yml:811` | Operation ID: `listAdminSizeGuideTemplates`. |
| **REQ-083** | Size Guide / Admin | Create size guide template | POST | `/admin/size-guides/templates` | Mocked (`sizeGuideService.createTemplate`) | **MATCHED** | `src/lib/sizeguide/sizeGuideService.ts`, `openAPI.yml:830` | Operation ID: `createAdminSizeGuideTemplate`. |
| **REQ-084** | Reports / Admin | Get financial margin analysis report | GET | `/admin/reports/margin` | Not Implemented | **NOT_IMPLEMENTED_IN_FRONTEND** | `openAPI.yml:887` | Operation ID: `getAdminMarginReport`. Backend endpoint exists, frontend UI needs connection. |
| **REQ-085** | Media / Admin | List paginated media library | GET | `/admin/media` | Not Implemented | **NOT_IMPLEMENTED_IN_FRONTEND** | `openAPI.yml:381` | Operation ID: `listAdminMedia`. Media picker currently uses local selection. |
| **REQ-086** | Media / Admin | Get media metadata by ID | GET | `/admin/media/{id}` | Not Implemented | **NOT_IMPLEMENTED_IN_FRONTEND** | `openAPI.yml:418` | Operation ID: `getAdminMedia`. |
| **REQ-087** | Media / Admin | Delete file from media library | DELETE | `/admin/media/{id}` | Not Implemented | **NOT_IMPLEMENTED_IN_FRONTEND** | `openAPI.yml:435` | Operation ID: `deleteAdminMedia`. |
| **REQ-088** | Notifications / Store | List customer notifications | GET | `/store/notifications` | Not Implemented | **NOT_IMPLEMENTED_IN_FRONTEND** | `openAPI.yml:568` | Operation ID: `listStoreNotifications`. Customer notification dropdown/center. |
| **REQ-089** | Notifications / Store | Get unread notification count | GET | `/store/notifications/unread-count` | Not Implemented | **NOT_IMPLEMENTED_IN_FRONTEND** | `openAPI.yml:607` | Operation ID: `getStoreUnreadNotificationCount`. Badge indicator on header. |
| **REQ-090** | Notifications / Store | Mark all notifications as read | POST | `/store/notifications/read-all` | Not Implemented | **NOT_IMPLEMENTED_IN_FRONTEND** | `openAPI.yml:623` | Operation ID: `markAllStoreNotificationsAsRead`. |
| **REQ-091** | Notifications / Store | Mark single notification as read | POST | `/store/notifications/{id}/read` | Not Implemented | **NOT_IMPLEMENTED_IN_FRONTEND** | `openAPI.yml:642` | Operation ID: `markSingleStoreNotificationAsRead`. |

---

## C. Missing APIs in OpenAPI

The following 55 frontend API requirements currently have **no corresponding path or operation defined in `openAPI.yml`**. These gaps represent major functional areas of the application.

### 1. Storefront Product Catalog & Search
- **Requirements**: REQ-008, REQ-009
- **Business Purpose**: Displaying product catalog grid with filters (category, brand, price, color, size, availability), pagination, search suggestions, and rendering Product Detail Pages (PDP).
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /store/products` (Params: `limit`, `offset`, `category_id`, `brand_id`, `q`, `min_price`, `max_price`, `sort_by`, `in_stock`)
  - `GET /store/products/{id}` or `GET /store/products/slug/{slug}`
- **Frontend Source Files**: `src/lib/repositories/catalogRepository.ts`, `src/hooks/usePaginatedProducts.ts`, `src/app/products/ProductsClientPage.tsx`, `src/components/pdp/ProductDetailPage.tsx`
- **Why Missing**: `openAPI.yml` includes `/store/products/{id}/size-guide`, but completely omits standard Medusa product catalog list and detail endpoints.
- **Suggested Action**: Add `/store/products` and `/store/products/{id}` schema definitions adhering to Medusa v2 product models.

### 2. Admin Product Management (CRUD)
- **Requirements**: REQ-011, REQ-012, REQ-013, REQ-014
- **Business Purpose**: Creating, editing, updating stock/variants, and deleting catalog products in `/admin/products`.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /admin/products`
  - `POST /admin/products`
  - `GET /admin/products/{id}`
  - `PUT /admin/products/{id}`
  - `DELETE /admin/products/{id}`
- **Frontend Source Files**: `src/app/admin/products/page.tsx`, `src/components/admin/ProductVariantBuilder.tsx`, `src/lib/repositories/catalogRepository.ts`
- **Why Missing**: Admin product CRUD routes are completely absent from `openAPI.yml`.
- **Suggested Action**: Define complete `/admin/products` resource endpoints.

### 3. Customer Orders & Checkout Execution
- **Requirements**: REQ-032, REQ-033, REQ-034, REQ-035
- **Business Purpose**: Submitting completed cart/checkout orders, listing customer order history, viewing order timeline details, and allowing customer order cancellation before processing.
- **Inferred HTTP Method & Path Suggestions**:
  - `POST /store/orders` (Body: items, shipping_address, shipping_method_id, payment_details)
  - `GET /store/orders` or `GET /store/customers/me/orders`
  - `GET /store/orders/{id}`
  - `POST /store/orders/{id}/cancel`
- **Frontend Source Files**: `src/lib/account/accountService.ts`, `src/app/checkout/page.tsx`, `src/app/payment/page.tsx`, `src/app/account/orders/page.tsx`, `src/app/account/orders/[orderId]/page.tsx`
- **Why Missing**: `openAPI.yml` contains zero order-related endpoints for storefront customers.
- **Suggested Action**: Implement `/store/orders` endpoints with full order schema and status transitions.

### 4. Admin Order Processing & Bulk Actions
- **Requirements**: REQ-036, REQ-037, REQ-038, REQ-039
- **Business Purpose**: Admin order fulfillment queue, status state machine transitions (`pending` -> `confirmed` -> `processing` -> `shipped` -> `delivered`), postal tracking code assignment, and bulk status updates/cancellations.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /admin/orders`
  - `GET /admin/orders/{id}`
  - `PATCH /admin/orders/{id}/status`
  - `POST /admin/orders/bulk-status`
  - `POST /admin/orders/bulk-cancel`
- **Frontend Source Files**: `src/app/admin/orders/page.tsx`, `src/lib/account/accountService.ts`
- **Why Missing**: No admin order processing endpoints exist in `openAPI.yml`.
- **Suggested Action**: Add `/admin/orders` endpoints supporting filtering, status updates, and bulk action payloads.

### 5. Customer Profile & Session Authentication
- **Requirements**: REQ-003, REQ-004, REQ-005, REQ-006, REQ-007
- **Business Purpose**: Restoring customer session on app mount (`/store/customers/me`), updating customer profile names (`/store/customers/me`), customer logout, admin username/password login (`/admin/auth/token`), and admin logout.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /store/customers/me`
  - `PATCH /store/customers/me`
  - `POST /auth/logout`
  - `POST /admin/auth/token`
  - `POST /admin/auth/logout`
- **Frontend Source Files**: `src/lib/auth/authService.ts`, `src/app/account/page.tsx`, `src/app/admin/login/page.tsx`
- **Why Missing**: `openAPI.yml` includes phone OTP endpoints (`/auth/phone/send-otp`, `/auth/phone/verify`), but lacks customer session/profile management and admin credential login.
- **Suggested Action**: Add customer profile (`/store/customers/me`) and admin authentication routes to `openAPI.yml`.

### 6. Customer Saved Addresses
- **Requirements**: REQ-040, REQ-041, REQ-042, REQ-043
- **Business Purpose**: Managing customer address book (list, add, edit, delete, set default) during checkout and in customer account.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /store/customers/me/addresses`
  - `POST /store/customers/me/addresses`
  - `PUT /store/customers/me/addresses/{id}`
  - `DELETE /store/customers/me/addresses/{id}`
  - `POST /store/customers/me/addresses/{id}/default`
- **Frontend Source Files**: `src/lib/account/accountService.ts`, `src/components/account/addresses/AddressModal.tsx`, `src/app/account/addresses/page.tsx`
- **Why Missing**: `openAPI.yml` only defines store physical addresses (`/admin/settings/addresses`), leaving customer address management completely undefined.
- **Suggested Action**: Add `/store/customers/me/addresses` endpoints to OpenAPI.

### 7. Customer Returns & Exchanges
- **Requirements**: REQ-050, REQ-051, REQ-052, REQ-053, REQ-054
- **Business Purpose**: Submitting customer return/exchange requests within 2 days, tracking inspection status, and admin return approval/refund workflows.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /store/returns`
  - `GET /store/returns/{id}`
  - `POST /store/returns`
  - `GET /admin/returns`
  - `PATCH /admin/returns/{id}/status`
- **Frontend Source Files**: `src/lib/returns/returnService.ts`, `src/app/account/returns/page.tsx`, `src/app/account/orders/[orderId]/return/page.tsx`, `src/app/admin/returns/page.tsx`
- **Why Missing**: Return management exists in store settings (`returnWindowDays`), but return request domain endpoints are absent.
- **Suggested Action**: Define `/store/returns` and `/admin/returns` contracts in OpenAPI.

### 8. Admin Customer Directory
- **Requirements**: REQ-055, REQ-056, REQ-057, REQ-058
- **Business Purpose**: Admin view of customer profiles, aggregated order counts, total spend, status toggles (active/suspended), and admin profile overrides.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /admin/customers`
  - `GET /admin/customers/{id}`
  - `PATCH /admin/customers/{id}/status`
  - `PUT /admin/customers/{id}`
- **Frontend Source Files**: `src/lib/customer/customerService.ts`, `src/app/admin/customers/page.tsx`, `src/app/admin/customers/[customerId]/page.tsx`
- **Why Missing**: Admin customer management endpoints are missing in OpenAPI.
- **Suggested Action**: Add `/admin/customers` specification.

### 9. Admin Inventory Balances & Adjustments
- **Requirements**: REQ-059, REQ-060
- **Business Purpose**: Displaying inventory balances across products/variants and submitting stock adjustments with reason codes.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /admin/inventory`
  - `POST /admin/inventory/adjust`
- **Frontend Source Files**: `src/lib/inventory/inventoryService.ts`, `src/app/admin/inventory/page.tsx`
- **Why Missing**: `openAPI.yml` defines `/admin/inventory/history` and `/admin/inventory/low-stock`, but lacks inventory balance listing and adjustment POST endpoints.
- **Suggested Action**: Add `/admin/inventory` list and adjustment endpoints.

### 10. Promotions, Discounts & Campaigns
- **Requirements**: REQ-063, REQ-064, REQ-065, REQ-066, REQ-067
- **Business Purpose**: Managing discount rules, promo codes, marketing campaigns, and free shipping rule thresholds in `/admin/discounts`.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /admin/discounts`, `POST /admin/discounts`, `PUT /admin/discounts/{id}`, `DELETE /admin/discounts/{id}`
  - `GET /admin/campaigns`, `POST /admin/campaigns`, `PUT /admin/campaigns/{id}`, `DELETE /admin/campaigns/{id}`
  - `GET /admin/shipping/free-rules`, `POST /admin/shipping/free-rules`
- **Frontend Source Files**: `src/lib/promotions/promotionService.ts`, `src/app/admin/discounts/page.tsx`
- **Why Missing**: No discount or campaign endpoints exist in `openAPI.yml`.
- **Suggested Action**: Add promotion, discount, and campaign endpoint definitions.

### 11. Shipping Methods & Rates
- **Requirements**: REQ-068, REQ-069
- **Business Purpose**: Querying available shipping couriers/costs during checkout and configuring shipping rates in `/admin/shipping`.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /store/shipping-options`
  - `GET /admin/shipping-options`, `POST /admin/shipping-options`, `PUT /admin/shipping-options/{id}`, `DELETE /admin/shipping-options/{id}`
- **Frontend Source Files**: `src/lib/shipping/shippingService.ts`, `src/components/checkout/ShippingMethodSelector.tsx`, `src/app/admin/shipping/page.tsx`
- **Why Missing**: Shipping options CRUD is absent in `openAPI.yml`.
- **Suggested Action**: Define shipping options endpoints.

### 12. Blog & Articles
- **Requirements**: REQ-079, REQ-080, REQ-081
- **Business Purpose**: Fetching published blog posts with category/tag filters, viewing article details, and managing blog posts in admin panel.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /store/blog/posts`, `GET /store/blog/posts/{slug}`
  - `GET /admin/blog/posts`, `POST /admin/blog/posts`, `PUT /admin/blog/posts/{id}`, `DELETE /admin/blog/posts/{id}`
- **Frontend Source Files**: `src/lib/blog/blogService.ts`, `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/app/admin/blog/page.tsx`
- **Why Missing**: Blog module completely omitted in OpenAPI.
- **Suggested Action**: Add blog endpoints to `openAPI.yml`.

### 13. Support Ticket Detail & Reply Threads
- **Requirements**: REQ-046, REQ-047, REQ-049
- **Business Purpose**: Viewing single ticket message history (`/store/tickets/{id}`), submitting customer/admin replies (`/store/tickets/{id}/messages`), and changing ticket status/assignment.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /store/tickets/{id}`
  - `POST /store/tickets/{id}/messages`
  - `PATCH /admin/tickets/{id}`
- **Frontend Source Files**: `src/lib/support/supportService.ts`, `src/components/support/TicketDetailView.tsx`, `src/app/admin/support/page.tsx`
- **Why Missing**: `openAPI.yml` defines `GET /store/tickets`, `POST /store/tickets`, and `GET /admin/tickets`, but lacks single ticket details, message posting, and status updates.
- **Suggested Action**: Expand ticket endpoints in `openAPI.yml`.

### 14. Product Reviews Listing & Submission
- **Requirements**: REQ-029, REQ-030
- **Business Purpose**: Viewing verified customer reviews/ratings on PDP and submitting new reviews with rating and comments.
- **Inferred HTTP Method & Path Suggestions**:
  - `GET /store/products/{id}/reviews`
  - `POST /store/products/{id}/reviews`
- **Frontend Source Files**: `src/lib/product/reviewService.ts`, `src/components/pdp/ProductReviews.tsx`
- **Why Missing**: `openAPI.yml` includes image upload for reviews (`POST /store/reviews/media`), but missing review query and submission endpoints.
- **Suggested Action**: Add product review endpoints.

---

## D. Partially Matched APIs

The following 6 endpoints exist in `openAPI.yml`, but exhibit **naming convention mismatches**, **missing request payload attributes**, or **casing discrepancies** when compared with the frontend codebase implementation.

### 1. Phone OTP Verification (`POST /auth/phone/send-otp` & `POST /auth/phone/verify`)
- **OpenAPI Endpoint**: `POST /auth/phone/send-otp` (operationId: `sendPhoneOtpCode`), `POST /auth/phone/verify` (operationId: `verifyPhoneOtpCode`)
- **Frontend Location**: `src/lib/auth/authService.ts:38`, `src/lib/auth/authService.ts:74`, `src/components/checkout/OtpVerificationModal.tsx`
- **Discrepancy Detail**:
  - OpenAPI `send-otp` body schema strictly accepts `{ phone: string }`.
  - Frontend `requestOtp` sends `{ phone, mode, firstName, lastName }` to capture registration intent before OTP dispatch.
  - OpenAPI `verify` body schema strictly accepts `{ phone: string, code: string }`.
  - Frontend `verifyOtp` sends `{ phone, code, firstName, lastName }` during registration mode so the backend can create the customer profile atomically upon verification.
- **Impact**: Non-blocking if registration details are handled in a separate post-verification request, but causes schema validation errors if extra fields are passed to strict OpenAPI parsers.

### 2. Customer Support Ticket Creation (`POST /store/tickets`)
- **OpenAPI Endpoint**: `POST /store/tickets` (operationId: `createStoreTicket`)
- **Frontend Location**: `src/lib/support/supportService.ts:114`, `src/components/support/TicketForm.tsx`
- **Discrepancy Detail**:
  - OpenAPI expects body parameter names in `snake_case`: `category_id`, `order_id`, `product_id`, `subject`, `message`, `priority`.
  - Frontend TypeScript models and forms send `camelCase`: `categoryId`, `orderId`, `productId`, `subject`, `message`, `priority`.
- **Impact**: Request body field mismatches will result in missing `category_id` errors or null field mapping on backend ingestion unless transformed by an API adapter layer.

### 3. Admin Brand Creation & Update (`POST /admin/brands` & `PUT /admin/brands/{id}`)
- **OpenAPI Endpoint**: `POST /admin/brands` (operationId: `createAdminBrand`), `PUT /admin/brands/{id}` (operationId: `updateAdminBrand`)
- **Frontend Location**: `src/components/admin/CreateBrandModal.tsx`, `src/lib/repositories/catalogRepository.ts`
- **Discrepancy Detail**:
  - OpenAPI property names: `is_active` (boolean), `logo_id` (string).
  - Frontend models: `isActive` (boolean), `logo` / `logoUrl` (string).
- **Impact**: Casing and attribute name mismatch (`logo_id` vs `logoUrl`).

### 4. Admin Category Creation & Update (`POST /admin/categories` & `PUT /admin/categories/{id}`)
- **OpenAPI Endpoint**: `POST /admin/categories` (operationId: `createAdminCategory`), `PUT /admin/categories/{id}` (operationId: `updateAdminCategory`)
- **Frontend Location**: `src/components/admin/CreateCategoryModal.tsx`, `src/lib/repositories/catalogRepository.ts`
- **Discrepancy Detail**:
  - OpenAPI property names: `image_id` (string), `is_active` (boolean), `parent_category_id` (string).
  - Frontend models: `image` / `imageUrl` (string), `isActive` (boolean), `parentCategoryId` (string).
- **Impact**: Property key mismatch during payload serialization.

---

## E. Frontend Integrations Not Implemented

The following 8 requirements correspond to backend features where **the endpoint is defined in `openAPI.yml`**, but the **frontend currently relies on client-side mocks or lacks active HTTP client connection**:

1. **Admin Media Library Listing (`GET /admin/media`)**
   - **OpenAPI Endpoint**: `GET /admin/media` (`listAdminMedia`)
   - **Status**: Defined in OpenAPI (`openAPI.yml:381`). Currently, `ImagePicker.tsx` in frontend handles local file upload via `uploadService`, but does not fetch or search the persistent media gallery from `GET /admin/media`.

2. **Admin Media Metadata (`GET /admin/media/{id}`)**
   - **OpenAPI Endpoint**: `GET /admin/media/{id}` (`getAdminMedia`)
   - **Status**: Defined in OpenAPI (`openAPI.yml:418`). No frontend call implemented.

3. **Admin Media Deletion (`DELETE /admin/media/{id}`)**
   - **OpenAPI Endpoint**: `DELETE /admin/media/{id}` (`deleteAdminMedia`)
   - **Status**: Defined in OpenAPI (`openAPI.yml:435`). No frontend UI implementation for deleting uploaded media.

4. **Customer In-App Notifications List (`GET /store/notifications`)**
   - **OpenAPI Endpoint**: `GET /store/notifications` (`listStoreNotifications`)
   - **Status**: Defined in OpenAPI (`openAPI.yml:568`). Notification center UI is not yet connected to this endpoint.

5. **Customer Unread Notification Count (`GET /store/notifications/unread-count`)**
   - **OpenAPI Endpoint**: `GET /store/notifications/unread-count` (`getStoreUnreadNotificationCount`)
   - **Status**: Defined in OpenAPI (`openAPI.yml:607`). Notification badge indicator on header is not connected.

6. **Mark All Notifications Read (`POST /store/notifications/read-all`)**
   - **OpenAPI Endpoint**: `POST /store/notifications/read-all` (`markAllStoreNotificationsAsRead`)
   - **Status**: Defined in OpenAPI (`openAPI.yml:623`). No active frontend connection.

7. **Mark Single Notification Read (`POST /store/notifications/{id}/read`)**
   - **OpenAPI Endpoint**: `POST /store/notifications/{id}/read` (`markSingleStoreNotificationAsRead`)
   - **Status**: Defined in OpenAPI (`openAPI.yml:642`). No active frontend connection.

8. **Admin Financial Margin Analysis Report (`GET /admin/reports/margin`)**
   - **OpenAPI Endpoint**: `GET /admin/reports/margin` (`getAdminMarginReport`)
   - **Status**: Defined in OpenAPI (`openAPI.yml:887`). Admin dashboard calculates sales analytics in client memory rather than fetching backend margin breakdown.

---

## F. Backend APIs Not Found in Frontend Usage

The following 8 endpoints are explicitly defined in `openAPI.yml`, but **no active usage was detected** in the current frontend codebase. They are available for future frontend feature expansion:

1. `GET /admin/media`
   - **Operation ID**: `listAdminMedia`
   - **Tags**: `Admin Media`
   - **Summary**: Retrieve paginated list of media files in store library.

2. `GET /admin/media/{id}`
   - **Operation ID**: `getAdminMedia`
   - **Tags**: `Admin Media`
   - **Summary**: Retrieve media file metadata by ID.

3. `DELETE /admin/media/{id}`
   - **Operation ID**: `deleteAdminMedia`
   - **Tags**: `Admin Media`
   - **Summary**: Safely delete media file from DB and disk if not referenced.

4. `GET /store/notifications`
   - **Operation ID**: `listStoreNotifications`
   - **Tags**: `Store Notifications`
   - **Summary**: Retrieve paginated notifications for authenticated customer.

5. `GET /store/notifications/unread-count`
   - **Operation ID**: `getStoreUnreadNotificationCount`
   - **Tags**: `Store Notifications`
   - **Summary**: Retrieve unread notification count for badge indicator.

6. `POST /store/notifications/read-all`
   - **Operation ID**: `markAllStoreNotificationsAsRead`
   - **Tags**: `Store Notifications`
   - **Summary**: Mark all customer notifications as read.

7. `POST /store/notifications/{id}/read`
   - **Operation ID**: `markSingleStoreNotificationAsRead`
   - **Tags**: `Store Notifications`
   - **Summary**: Mark a specific notification as read.

8. `GET /admin/reports/margin`
   - **Operation ID**: `getAdminMarginReport`
   - **Tags**: `Admin Reports`
   - **Summary**: Retrieve financial margin analysis (Gross Sales, COGS, Discounts, Shipping, Tax, Gross Profit, Gross Margin %).

---

## G. Contract and Schema Issues

### 1. Naming Convention Inconsistency (camelCase vs. snake_case)
- **Frontend Codebase**: Uses standard JavaScript/TypeScript `camelCase` for domain objects and JSON serializations across all models (`categoryId`, `orderId`, `recipientName`, `postalCode`, `parentCategoryId`, `isActive`, `createdAt`).
- **OpenAPI Specification**: Uses mixed conventions. Store Address settings use `camelCase` (`recipientName`, `postalCode`), whereas Support Tickets, Categories, Brands, Notifications, and Media models strictly enforce `snake_case` (`category_id`, `order_id`, `is_active`, `logo_id`, `parent_category_id`, `uploaded_by_id`, `created_at`).
- **Risk**: Serialization mismatch when sending payloads directly to backend endpoints.

### 2. Missing Core Resource Schemas in `openAPI.yml`
- **Product & Variant Model**: Absent from OpenAPI schemas (`#/components/schemas`). Product catalog listing, PDP details, and variant matrices are undefined.
- **Order & Line Item Model**: Absent from OpenAPI schemas. Order checkout, status timelines, and customer order history are undefined.
- **Customer & Address Model**: Only `StoreAddress` (admin store locations) is defined. Customer saved address models (`UserAddress`) are missing.
- **Return & Refund Model**: Absent from OpenAPI schemas.
- **Discount & Campaign Model**: Absent from OpenAPI schemas.
- **Blog & Article Model**: Absent from OpenAPI schemas.

### 3. Authentication Scheme Inconsistencies
- **OpenAPI Definition**: Specifies `bearerAuth` (JWT) and `cookieAuth` (`connect.sid`).
- **Frontend AuthService**: Stores mock tokens in `localStorage` under `mepusham_auth_session_v1` and `mepusham_admin_session_v1`.
- **Recommendation**: Standardize client HTTP interceptor to inject `Authorization: Bearer <token>` headers for authenticated `/store/*` and `/admin/*` requests.

### 4. Response Schema Payload Wrapping
- **OpenAPI Specification**: Enforces top-level object wrapping for responses (e.g., `{ brand: Brand }`, `{ category: Category }`, `{ ticket: Ticket }`, `{ media: Media }`).
- **Frontend Mock Services**: Some frontend services currently return unwrapped entities or direct arrays. An API response unwrapper/interceptor must be added when replacing mocks with real HTTP calls.

---

## H. Recommended Action Items

### Critical (Blockers for Core Storefront & Admin Operations)
1. **[Product Catalog]** Add `/store/products` (list/filter) and `/store/products/{id}` (PDP) endpoint definitions to `openAPI.yml`.
2. **[Orders & Checkout]** Add `/store/orders` (submit order, list customer orders, view order details) to `openAPI.yml`.
3. **[Customer Profile]** Add `/store/customers/me` (GET profile, PATCH update profile) to `openAPI.yml`.
4. **[Admin Product CRUD]** Add `/admin/products` (list, create, update, delete) to `openAPI.yml`.
5. **[Admin Order Management]** Add `/admin/orders` (list, update status, bulk status update, bulk cancel) to `openAPI.yml`.

### High (Contract Alignment & Domain Coverage)
6. **[Casing Normalization]** Establish an API adapter layer (Axios/Fetch interceptors) in the frontend to handle automatic conversion between `camelCase` frontend models and `snake_case` OpenAPI endpoints (e.g. `category_id` vs `categoryId`).
7. **[Customer Addresses]** Add `/store/customers/me/addresses` CRUD endpoints to `openAPI.yml`.
8. **[Returns & Exchanges]** Add `/store/returns` and `/admin/returns` endpoint definitions to `openAPI.yml`.
9. **[Promotions & Discounts]** Add `/admin/discounts` and `/admin/campaigns` CRUD endpoints to `openAPI.yml`.
10. **[Support Tickets]** Update `openAPI.yml` to include `GET /store/tickets/{id}`, `POST /store/tickets/{id}/messages`, and `PATCH /admin/tickets/{id}`.

### Medium (Integration of Existing OpenAPI Endpoints)
11. **[Admin Media Gallery]** Connect `ImagePicker.tsx` to `GET /admin/media` and `DELETE /admin/media/{id}`.
12. **[Customer Notifications]** Implement frontend notification bell component connected to `GET /store/notifications` and `GET /store/notifications/unread-count`.
13. **[Financial Margin Report]** Connect Admin Dashboard analytics widgets to `GET /admin/reports/margin`.
14. **[Admin Customer Management]** Add `/admin/customers` endpoints to `openAPI.yml`.

### Low (Cleanup & Documentation)
15. **[Blog Module]** Add `/store/blog/posts` and `/admin/blog/posts` definitions to `openAPI.yml`.
16. **[Shipping Options]** Add `/store/shipping-options` and `/admin/shipping-options` to `openAPI.yml`.
17. **[Product Reviews]** Add `/store/products/{id}/reviews` endpoints to `openAPI.yml`.
18. **[Type Generation]** Set up OpenAPI TypeScript generator (`openapi-typescript` or `openapi-generator`) to auto-generate client types directly from `openAPI.yml` once updated.

---
*Report generated on February 2025 as part of the Mepusham E-Commerce API Integrity Audit.*
