# گزارش جامع APIهای پروژه (API Specification Report)

این گزارش شامل بررسی کامل، تفکیک‌شده و دقیق تمامی APIهای موجود در معماری **Depix E-commerce** (`depix-ecommerce`) می‌باشد. در این زیرساخت دو سیستم بک‌اند اصلی متصل به یک دیتابیس مشترک PostgreSQL و Redis وجود دارد که مجموعه‌ای از APIهای e-commerce و CMS/مدیریت محتوا را ارائه می‌دهند.

---

# ۱. نمای کلی و خلاصه‌ی سرویس‌های API

در این پروژه، سرویس‌ها و APIها به ۲ بخش کلی تقسیم می‌شوند:

1. **سرویس Medusa v2 (موتور فروشگاهی / E-Commerce Backend):**
   - **Store API (فروشگاهی):** مخصوص خریداران و storefront (سبد خرید، محصولات، سفارشات، آدرس‌ها، پرداخت).
   - **Admin API (مدیریت):** مخصوص مدیران سیستم (مدیریت محصولات، موجودی، سفارشات، تخفیف‌ها، کاربران، تنظیمات).
   - **Auth API (احراز هویت):** مدیریت نشست‌ها، ثبت‌نام و ورود کاربران و مدیران.
   - **OpenAPI / Swagger Spec API:** مستندات استاندارد OpenAPI برای کل APIهای Medusa.

2. **سرویس Payload CMS v4 (مدیریت محتوا و پنل ادمین Central):**
   - **REST API:** دسترسی CRUD به تمام مجموعه داده‌ها (Collections) و تنظیمات کلی (Globals).
   - **GraphQL API & GraphQL Playground:** دسترسی کوئری و میوتیشن پیشرفته به داده‌های محتوایی و بلاگ.
   - **CMS Admin UI & Internal Endpoints:** پنل مدیریت محتوا و مدیریت فایل‌ها/رسانه‌ها.

---

# ۲. جدول خلاصه گروه‌های API و تعداد آن‌ها

| سرویس / چارچوب | گروه API | تعداد تقریبی اندپوئینت‌ها | کاربرد اصلی | مسیر دسترسی (از طریق Nginx) |
|---|---|:---:|---|---|
| **Medusa v2** | **Store API** | ~۴۵ | تعامل خریداران (محصولات، کاتالوگ، سبد خرید، تسویه، سفارشات) | `/api/medusa/store/*` |
| **Medusa v2** | **Admin API** | ~۸۵ | مدیریت e-commerce (محصولات، سفارشات، موجودی، مشتریان، تخفیف‌ها) | `/api/medusa/admin/*` |
| **Medusa v2** | **Auth API** | ~۱۰ | ورود، ثبت‌نام، احراز هویت خریداران و مدیران | `/api/medusa/auth/*` یا `/api/medusa/store/auth/*` |
| **Medusa v2** | **OpenAPI Spec** | ~۲ | مستندات و مشخصات فنی JSON/YAML APIها | `/api/medusa/openapi.json` |
| **Payload CMS v4** | **REST API** | ~۳۵ | مدیریت و دریافت داده‌های محتوایی، صفحات، مقالات، بنرها و کاربران | `/payload/api/*` |
| **Payload CMS v4** | **GraphQL API** | ۱ اصلی + Playground | کوئری گراف‌کیوال برای دریافت بهینه محتوا و بلاگ | `/payload/api/graphql` & `/payload/api/graphql-playground` |
| **Payload CMS v4** | **Admin & Upload API** | ~۱۵ | مدیریت فایل‌ها/رسانه‌ها، نسخه سندها (Versions) و لاگ‌های سیستم | `/payload/admin/*` & `/payload/api/media/*` |
| **Nginx Proxy** | **Infrastructure Health** | ۱ | بررسی سلامت سرویس‌ها (Health Check) | `/health` |

---

# ۳. تشریح تک به تک گروه‌ها و اندپوئینت‌های API

## ۱. APIهای فروشگاهی Medusa (Medusa Store API)

این APIها برای تعامل مستمر خریداران و فرانت‌اند فروشگاه (Storefront) طراحی شده‌اند. نیازی به دسترسی ادمین ندارند و با کلید Pubic Storefront یا احراز هویت خریدار کار می‌کنند.

### ۱.۱. محصولات و کاتالوگ (Products & Categories)
- **`GET /api/medusa/store/products`**
  - **روش:** `GET`
  - **کاربرد:** دریافت لیست کامل یا فیلترشده محصولات به همراه تنوع‌ها (Variants)، ویژگی‌ها، قیمت‌ها و تصاویر.
  - **پارامترها:** `category_id[]`, `collection_id[]`, `tags[]`, `q` (جستجو), `limit`, `offset`, `order`.
- **`GET /api/medusa/store/products/:id`**
  - **روش:** `GET`
  - **کاربرد:** دریافت اطلاعات تفصیلی یک محصول خاص برای نمایش در صفحه محصول (PDP).
- **`GET /api/medusa/store/product-categories`**
  - **روش:** `GET`
  - **کاربرد:** دریافت درخت دسته‌بندی‌های محصولات جهت نمایش منوها و فیلترها.
- **`GET /api/medusa/store/product-categories/:id`**
  - **روش:** `GET`
  - **کاربرد:** دریافت دسته‌بندی خاص به همراه دسته‌های فرزند و محصولات مرتبط.
- **`GET /api/medusa/store/collections`**
  - **روش:** `GET`
  - **کاربرد:** دریافت لیست کالکشن‌های محصولات (مانند «محصولات تابستانی»).

### ۱.۲. سبد خرید (Cart Management)
- **`POST /api/medusa/store/carts`**
  - **روش:** `POST`
  - **کاربرد:** ایجاد یک سبد خرید جدید برای خریدار (مهمان یا عضو).
- **`GET /api/medusa/store/carts/:id`**
  - **روش:** `GET`
  - **کاربرد:** دریافت وضعیت فعلی سبد خرید شامل آیتم‌ها، مجموع قیمت‌ها (Subtotal, Tax, Shipping, Total).
- **`POST /api/medusa/store/carts/:id`**
  - **روش:** `POST`
  - **کاربرد:** به روزرسانی مشخصات کلی سبد خرید (مانند ایمیل خریدار مهمان، آدرس ارسال و صورتحساب).
- **`POST /api/medusa/store/carts/:id/line-items`**
  - **روش:** `POST`
  - **کاربرد:** افزودن یک محصول/تنوع به سبد خرید با مشخص کردن `variant_id` و `quantity`.
- **`POST /api/medusa/store/carts/:id/line-items/:line_id`**
  - **روش:** `POST`
  - **کاربرد:** تغییر تعداد (Quantity) یک آیتم موجود در سبد خرید.
- **`DELETE /api/medusa/store/carts/:id/line-items/:line_id`**
  - **روش:** `DELETE`
  - **کاربرد:** حذف یک محصول از سبد خرید.
- **`POST /api/medusa/store/carts/:id/promotions`**
  - **روش:** `POST`
  - **کاربرد:** اعمال کد تخفیف (Promo Code) روی سبد خرید.
- **`DELETE /api/medusa/store/carts/:id/promotions`**
  - **روش:** `DELETE`
  - **کاربرد:** حذف کد تخفیف اعمال‌شده از سبد خرید.

### ۱.۳. شیوه ارسال و تسویه حساب (Shipping & Checkout)
- **`GET /api/medusa/store/shipping-options`**
  - **روش:** `GET`
  - **کاربرد:** دریافت شیوه‌ها و هزینه‌های ارسال معتبر برای سبد خرید بر اساس آدرس خریدار (`cart_id`).
- **`POST /api/medusa/store/carts/:id/shipping-methods`**
  - **روش:** `POST`
  - **کاربرد:** انتخاب روش ارسال نهایی توسط خریدار و اضافه شدن هزینه ارسال به Total.
- **`POST /api/medusa/store/payment-collections`**
  - **روش:** `POST`
  - **کاربرد:** ایجاد مجموعه پرداخت (`PaymentCollection`) برای آماده‌سازی فرآیند پرداخت آنلاین.
- **`POST /api/medusa/store/payment-collections/:id/payment-sessions`**
  - **روش:** `POST`
  - **کاربرد:** ایجاد نشست پرداخت آنلاین و دریافت توکن یا کلید انتقال به درگاه پرداخت.
- **`POST /api/medusa/store/carts/:id/complete`**
  - **روش:** `POST`
  - **کاربرد:** نهایی‌سازی خرید، قفل سبد خرید، رزرو موجودی دیتابیس و تبدیل سبد خرید به سفارش ثبت‌شده (`Order`).

### ۱.۴. سفارشات و حساب مشتری (Orders & Customer)
- **`GET /api/medusa/store/orders/:id`**
  - **روش:** `GET`
  - **کاربرد:** پیگیری وضعیت سفارش ثبت‌شده و مشاهده جزییات فاکتور و کد رهگیری ارسال.
- **`GET /api/medusa/store/customers/me`**
  - **روش:** `GET`
  - **کاربرد:** دریافت اطلاعات حساب کاربری مشتری لاگین‌شده.
- **`POST /api/medusa/store/customers/me`**
  - **روش:** `POST`
  - **کاربرد:** ویرایش مشخصات فردی مشتری (نام، شماره تماس).
- **`GET /api/medusa/store/customers/me/addresses`**
  - **روش:** `GET`
  - **کاربرد:** دریافت لیست آدرس‌های ثبت‌شده مشتری.
- **`POST /api/medusa/store/customers/me/addresses`**
  - **روش:** `POST`
  - **کاربرد:** افزودن آدرس جدید (استان، شهر، پلاک، کد پستی).
- **`DELETE /api/medusa/store/customers/me/addresses/:address_id`**
  - **روش:** `DELETE`
  - **کاربرد:** حذف آدرس ذخیره‌شده مشتری.

---

## ۲. APIهای مدیریتی Medusa (Medusa Admin API)

این APIها نیازمند JWT Token ادمین بوده و تمامی عملیات مدیریتی پنل e-commerce را پوشش می‌دهند.

### ۲.۱. مدیریت کاتالوگ و محصولات (Catalog Management)
- **`GET /api/medusa/admin/products`**
  - **روش:** `GET`
  - **کاربرد:** دریافت لیست کلیه محصولات دیتابیس جهت مدیریت.
- **`POST /api/medusa/admin/products`**
  - **روش:** `POST`
  - **کاربرد:** تعریف محصول جدید به همراه عناوین، توضیحات، متاداده و تصاویر.
- **`POST /api/medusa/admin/products/:id`**
  - **روش:** `POST`
  - **کاربرد:** ویرایش مشخصات محصول.
- **`DELETE /api/medusa/admin/products/:id`**
  - **روش:** `DELETE`
  - **کاربرد:** حذف محصول.
- **`POST /api/medusa/admin/products/:id/variants`**
  - **روش:** `POST`
  - **کاربرد:** تعریف تنوع جدید برای محصول (رنگ، سایز، SKU، قیمت واحد).
- **`GET /api/medusa/admin/product-categories`**
  - **روش:** `GET`
  - **کاربرد:** مدیریت دسته‌بندی‌های محصولات.
- **`POST /api/medusa/admin/product-categories`**
  - **روش:** `POST`
  - **کاربرد:** ایجاد دسته‌بندی جدید.

### ۲.۲. مدیریت سفارشات و مرجوعی‌ها (Order Management)
- **`GET /api/medusa/admin/orders`**
  - **روش:** `GET`
  - **کاربرد:** دریافت تمام سفارشات ثبت‌شده خریداران با قابلیت فیلتر بر اساس وضعیت پرداخت و ارسال.
- **`GET /api/medusa/admin/orders/:id`**
  - **روش:** `GET`
  - **کاربرد:** مشاهده جزییات کامل سفارش، آدرس، آیتم‌ها و تراکنش‌های مالی.
- **`POST /api/medusa/admin/orders/:id/cancel`**
  - **روش:** `POST`
  - **کاربرد:** لغو سفارش و آزادکردن موجودی انبار.
- **`POST /api/medusa/admin/fulfillments`**
  - **روش:** `POST`
  - **کاربرد:** صدور مجوز خروج از انبار و بسته‌بندی سفارش.
- **`POST /api/medusa/admin/fulfillments/:id/shipment`**
  - **روش:** `POST`
  - **کاربرد:** ثبت تحویل به پست/پیک و درج کد رهگیری پستی (Tracking Number).
- **`POST /api/medusa/admin/returns`**
  - **روش:** `POST`
  - **کاربرد:** ثبت درخواست مرجوعی کالا توسط ادمین.

### ۲.۳. مدیریت موجودی و انبارها (Inventory & Stock Locations)
- **`GET /api/medusa/admin/inventory-items`**
  - **روش:** `GET`
  - **کاربرد:** لیست رکوردهای موجودی انبار و رصد اقلام کم‌موجود.
- **`POST /api/medusa/admin/inventory-items`**
  - **روش:** `POST`
  - **کاربرد:** تعریف رکورد انبارداری برای یک تنوع محصول.
- **`POST /api/medusa/admin/inventory-items/:id/location-levels`**
  - **روش:** `POST`
  - **کاربرد:** به روزرسانی مقدار موجودی فیزیکی در یک انبار خاص.
- **`GET /api/medusa/admin/stock-locations`**
  - **روش:** `GET`
  - **کاربرد:** لیست انبارها و مراکز توزیع فیزیکی.

### ۲.۴. مدیریت مالی، تخفیف‌ها و پروموشن‌ها (Promotions & Payments)
- **`GET /api/medusa/admin/promotions`**
  - **روش:** `GET`
  - **کاربرد:** مشاهده کلیه کدهای تخفیف و پروموشن‌های فعال.
- **`POST /api/medusa/admin/promotions`**
  - **روش:** `POST`
  - **کاربرد:** تعریف کد تخفیف جدید (درصدی، مقداری، ارسال رایگان) با قوانین محدودکننده.
- **`GET /api/medusa/admin/campaigns`**
  - **روش:** `GET`
  - **کاربرد:** تعریف کمپین‌های فروش با بازه زمانی مشخص (Flash Sales).
- **`GET /api/medusa/admin/payments`**
  - **روش:** `GET`
  - **کاربرد:** مشاهده لیست کلیه پرداخت‌ها و تراکنش‌های مالی دیتابیس.
- **`POST /api/medusa/admin/payments/:id/capture`**
  - **روش:** `POST`
  - **کاربرد:** تسویه و دریافت قطعی وجه از درگاه.
- **`POST /api/medusa/admin/payments/:id/refund`**
  - **روش:** `POST`
  - **کاربرد:** استرداد و بازگشت وجه (Refund) به حساب خریدار.

### ۲.۵. مدیریت کاربران، مشتریان و دسترسی‌ها (Users & RBAC)
- **`GET /api/medusa/admin/customers`**
  - **روش:** `GET`
  - **کاربرد:** مشاهده لیست و سابقه خرید مشتریان فروشگاه.
- **`GET /api/medusa/admin/users`**
  - **روش:** `GET`
  - **کاربرد:** لیست مدیران و اپراتورهای پنل مدیریت.
- **`POST /api/medusa/admin/users/invite`**
  - **روش:** `POST`
  - **کاربرد:** دعوت ادمین جدید به سیستم.
- **`GET /api/medusa/admin/rbac/roles`**
  - **روش:** `GET`
  - **کاربرد:** مدیریت نقش‌های دسترسی (Role-Based Access Control).

---

## ۳. APIهای احراز هویت Medusa (Auth API)

- **`POST /api/medusa/auth/user/emailpass`**
  - **روش:** `POST`
  - **کاربرد:** ورود مدیران به پنل ادمین با ایمیل و رمز عبور و دریافت JWT Token.
- **`POST /api/medusa/auth/customer/emailpass`**
  - **روش:** `POST`
  - **کاربرد:** ورود/ثبت‌نام مشتریان در فروشگاه.
- **`DELETE /api/medusa/auth/session`**
  - **روش:** `DELETE`
  - **کاربرد:** خروج از حساب کاربری (Logout) و ابطال نشست.
- **`GET /api/medusa/auth/session`**
  - **روش:** `GET`
  - **کاربرد:** بررسی معتبر بودن توکن نشست فعلی.

---

## ۴. API مستندات سیستم (OpenAPI Spec)

- **`GET /api/medusa/openapi.json`**
  - **روش:** `GET`
  - **کاربرد:** دریافت استاندارد JSON OpenAPI v3 کلیه اندپوئینت‌های Medusa جهت ایمپورت در Postman یا تولید اتوماتیک SDK.

---

## ۵. APIهای مدیریت محتوا Payload CMS (Payload CMS API)

این APIها ساختار محتوایی، وبلاگ، صفحات، بنرها و فایل‌های رسانه‌ای وب‌سایت را پوشش می‌دهند.

### ۵.۱. REST API مجموعه‌ها (Collections)
- **`GET /payload/api/posts`**
  - **روش:** `GET`
  - **کاربرد:** دریافت لیست مقالات وبلاگ به همراه صفحه‌بندی، فیلترها و مرتب‌سازی.
- **`POST /payload/api/posts`**
  - **روش:** `POST`
  - **کاربرد:** ایجاد مقاله جدید در وبلاگ (نیاز به دسترسی دست‌اندرکاران).
- **`GET /payload/api/posts/:id`**
  - **روش:** `GET`
  - **کاربرد:** دریافت جزییات کامل یک مقاله وبلاگ بر اساس شناسه یا اسلاگ (Slug).
- **`PATCH /payload/api/posts/:id`**
  - **روش:** `PATCH`
  - **کاربرد:** بروزرسانی بخش‌هایی از مقاله.
- **`DELETE /payload/api/posts/:id`**
  - **روش:** `DELETE`
  - **کاربرد:** حذف مقاله.
- **`GET /payload/api/pages`**
  - **روش:** `GET`
  - **کاربرد:** دریافت ساختار صفحات پویا و بلک‌های چیدمان (Page Builder).
- **`GET /payload/api/categories`**
  - **روش:** `GET`
  - **کاربرد:** دریافت دسته‌بندی‌های وبلاگ.
- **`GET /payload/api/tags`**
  - **روش:** `GET`
  - **کاربرد:** دریافت برچسب‌های محتوایی.
- **`GET /payload/api/users`**
  - **روش:** `GET`
  - **کاربرد:** مدیریت نویسندگان و مدیران محتوا.

### ۵.۲. REST API تنظیمات عمومی (Globals)
- **`GET /payload/api/globals/banners`**
  - **روش:** `GET`
  - **کاربرد:** دریافت بنرهای تبلیغاتی، اسلایدرها و پیام‌های بالای سایت.
- **`POST /payload/api/globals/banners`**
  - **روش:** `POST`
  - **کاربرد:** به روزرسانی بنرهای اصلی سایت توسط ادمین.
- **`GET /payload/api/globals/header`**
  - **روش:** `GET`
  - **کاربرد:** دریافت ساختار منوی بالای سایت (Header Navigation).
- **`GET /payload/api/globals/footer`**
  - **روش:** `GET`
  - **کاربرد:** دریافت لینک‌ها و اطلاعات فوتر سایت.

### ۵.۳. GraphQL API & Playground
- **`POST /payload/api/graphql`**
  - **روش:** `POST`
  - **کاربرد:** اجرای کوئری‌ها و میوتیشن‌های GraphQL برای دریافت همزمان مقالات، صفحات و بنرها با فیلدهای انتخابی دلخواه.
- **`GET /payload/api/graphql-playground`**
  - **روش:** `GET`
  - **کاربرد:** محیط تعاملی گرافیکی در مرورگر جهت تست و آزمایش کوئری‌های GraphQL.

### ۵.۴. مدیریت رسانه‌ها و نسخه‌ها (Media & Audit Logs)
- **`POST /payload/api/media`**
  - **روش:** `POST`
  - **کاربرد:** آپلود تصویر، ویدئو و فایل‌های رسانه‌ای.
- **`GET /payload/api/media`**
  - **روش:** `GET`
  - **کاربرد:** دریافت لیست فایل‌های آپلود شده.
- **`GET /payload/api/versions`**
  - **روش:** `GET`
  - **کاربرد:** تاریخچه تغییرات و نسخه‌های قبلی سندها (Audit Log).

---

# ۴. نمونه نحوه فراخوانی و تعامل APIها

### مثال ۱: چرخه افزودن به سبد خرید در Medusa Store API
1. ایجاد سبد خرید:
```http
POST /api/medusa/store/carts
Content-Type: application/json

{
  "region_id": "reg_01H..."
}
```
2. افزودن محصول:
```http
POST /api/medusa/store/carts/cart_01H.../line-items
Content-Type: application/json

{
  "variant_id": "variant_01H...",
  "quantity": 1
}
```

### مثال ۲: کوئری دریافت مقالات جدید در Payload GraphQL API
```graphql
POST /payload/api/graphql
Content-Type: application/json

{
  "query": "{ Posts(limit: 5, sort: \"-createdAt\") { docs { id title slug publishedAt meta { description } } } }"
}
```

---

# ۵. نتیجه‌گیری

مجموعه APIهای موجود در این پروژه یک زیرساخت کامل e-commerce بدون محدودیت (Headless) را فراهم می‌آورد:
- تمامی امور مربوط به **خرید، سفارش، کاتالوگ و تسویه حساب** از طریق **Medusa API** پوشش داده می‌شود.
- تمامی امور مربوط به **محتوا، وبلاگ، صفحات پویا، بنرها و سئو** از طریق **Payload CMS API** پردازش می‌گردد.
- سرویس Nginx تمامی این اندپوئینت‌ها را تحت یک دامنه واحد بدون مشکلات CORS مدیریت می‌نماید.
