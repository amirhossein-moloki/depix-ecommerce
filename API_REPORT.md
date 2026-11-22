# گزارش جامع APIهای پروژه (API Specification Report)

این گزارش شامل بررسی کامل، تفکیک‌شده و دقیق تمامی APIهای موجود در معماری **Depix E-commerce** (`depix-ecommerce`) می‌باشد. در این زیرساخت سرویس بک‌اند Medusa v2 متصل به دیتابیس PostgreSQL و Redis قرار دارد و مجموعه‌ای کامل از APIهای e-commerce را ارائه می‌دهد.

---

# ۱. نمای کلی و خلاصه‌ی سرویس‌های API

سرویس‌ها و APIهای بک‌اند Medusa v2 شامل گروه‌های زیر هستند:

1. **سرویس Medusa v2 (موتور فروشگاهی / E-Commerce Backend):**
   - **Store API (فروشگاهی):** مخصوص خریداران و storefront (سبد خرید، محصولات، سفارشات، آدرس‌ها، پرداخت).
   - **Admin API (مدیریت):** مخصوص مدیران سیستم (مدیریت محصولات، موجودی، سفارشات، تخفیف‌ها، کاربران، تنظیمات).
   - **Auth API (احراز هویت):** مدیریت نشست‌ها، ثبت‌نام و ورود کاربران و مدیران.
   - **OpenAPI / Swagger UI / ReDoc API:** مستندات استاندارد OpenAPI و رابط‌های کاربری تعاملی Swagger UI و ReDoc برای کلیه APIهای Medusa.

---

# ۲. جدول خلاصه گروه‌های API و تعداد آن‌ها

| سرویس / چارچوب | گروه API | تعداد تقریبی اندپوئینت‌ها | کاربرد اصلی | مسیر دسترسی (از طریق Nginx) |
|---|---|:---:|---|---|
| **Medusa v2** | **Store API** | ~۴۵ | تعامل خریداران (محصولات، کاتالوگ، سبد خرید، تسویه، سفارشات) | `/api/medusa/store/*` |
| **Medusa v2** | **Admin API** | ~۸۵ | مدیریت e-commerce (محصولات، سفارشات، موجودی، مشتریان، تخفیف‌ها) | `/api/medusa/admin/*` |
| **Medusa v2** | **Auth API** | ~۱۰ | ورود، ثبت‌نام، احراز هویت خریداران و مدیران | `/api/medusa/auth/*` یا `/api/medusa/store/auth/*` |
| **Medusa v2** | **OpenAPI / Swagger / ReDoc** | ~۴ | مشخصات OpenAPI v3 و رابط‌های کاربری تعاملی Swagger UI و ReDoc UI | `/api/medusa/openapi.json`, Swagger & ReDoc UIs |
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

## ۴. API و رابط‌های مستندات سیستم (OpenAPI Spec / Swagger UI / ReDoc)

سیستم مستندسازی API بر پایه استاندارد OpenAPI v3 پیاده‌سازی شده و ۲ رابط کاربری تعاملی مکمل (Swagger UI و ReDoc UI) را برای تسهیل تست، بررسی و یکپارچه‌سازی ارائه می‌دهد:

- **`GET /api/medusa/openapi.json`**
  - **روش:** `GET`
  - **کاربرد:** دریافت مشخصات استاندارد JSON OpenAPI v3 کلیه اندپوئینت‌های Medusa جهت ایمپورت در Postman، Swagger UI، ReDoc یا تولید اتوماتیک SDK.
- **Swagger UI (رابط تست و فراخوانی تعاملی API):**
  - **کاربرد:** ارائه کنسول تعاملی جهت تست درخواست‌ها (Try it out)، ارسال هدرها و توکن‌های احراز هویت، و مشاهده پاسخ زنده APIها.
- **ReDoc UI (رابط تعاملی و پیشرفته مستندات API):**
  - **کاربرد:** نمایش ساختاریافته، زیبا و سه‌ستونه مستندات API بر پایه OpenAPI v3 با قابلیت جستجوی سریع، رندرینگ اسکیماها (Schemas)، نمونه کدها (Code Samples) و ناوبری روان میان اندپوئینت‌های e-commerce.

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

---

# ۵. نتیجه‌گیری

مجموعه APIهای موجود در این پروژه یک زیرساخت کامل e-commerce بدون محدودیت (Headless) را فراهم می‌آورد:
- تمامی امور مربوط به **خرید، سفارش، کاتالوگ و تسویه حساب** از طریق **Medusa API** پوشش داده می‌شود.
- سرویس Nginx تمامی این اندپوئینت‌ها را تحت یک دامنه واحد بدون مشکلات CORS مدیریت می‌نماید.
