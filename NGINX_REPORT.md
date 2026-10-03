# گزارش معماری و پیکربندی Nginx (Nginx Infrastructure Report)

این گزارش توضیحی جامع و دقیق درباره پیکربندی فعلی **Nginx** در زیرساخت پروژه **Depix E-commerce** (`depix-ecommerce`) است. این سرویس به عنوان **Reverse Proxy (پروکسی معکوس)** و **Gateway (درگاه ورودی شبکه‌ای)** عمل می‌کند و ترافیک ورود کاربران را بین سرویس‌های بک‌اند Medusa E-commerce و Payload CMS هدایت می‌نماید.

---

# ۱. جایگاه Nginx در معماری کلی پروژه

در زیرساخت کانتینری پروژه (Docker Compose)، سرویس Nginx کانتینر پیش‌فرضی است که پورت عمومی `80` سیستم را شنود می‌کند و درخواست‌های ورودی مشتریان و مدیران را بر اساس الگوی URL به سرویس‌های داخلی هماهنگ می‌سازد:

```text
                        [ مرورگر کاربر / درخواست HTTP ]
                                       │
                                       ▼ (پورت 80)
                         ┌──────────────────────────┐
                         │   depix-nginx (Port 80)  │
                         │ infrastructure/nginx.conf│
                         └─────────────┬────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
    /health                    /api/medusa/                /payload/ & / (Fallback)
┌──────────────┐          ┌──────────────────┐        ┌──────────────────┐
│ Response 200 │          │  depix-medusa    │        │  depix-payload   │
│    'OK'      │          │  (Medusa:9000)   │        │  (Payload:3000)  │
└──────────────┘          └──────────────────┘        └──────────────────┘
                                   │                           │
                                   └─────────────┬─────────────┘
                                                 │
                                                 ▼
                                     ┌───────────────────────┐
                                     │ depix-postgres (5432) │
                                     │ depix-redis (6379)    │
                                     └───────────────────────┘
```

---

# ۲. تحلیل خط به خط و تفکیکی فایل `nginx.conf`

فایل تنظیمات در مسیر `infrastructure/nginx/nginx.conf` قرار دارد. در ادامه، تمام بخش‌های این فایل به صورت فنی تشریح شده‌اند:

### ۲.۱. تنظیمات کارکردی و ایونت‌ها (Events Block)
```nginx
events {
    worker_connections 1024;
}
```
- **توضیح:** این بخش حداکثر تعداد اتصالات همزمانی که هر فرآیند کاربری (Worker Process) Nginx می‌تواند مدیریت کند را برابر با `1024` قرار می‌دهد. در صورت افزایش ترافیک، این مقدار قابلیّت افزایش دارد.

---

### ۲.۲. تنظیمات پروتکل HTTP و لاگ‌گیری (HTTP Block)
```nginx
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    sendfile        on;
    keepalive_timeout  65;
...
```
- **`include /etc/nginx/mime.types;`**: نگاشت پسوندهای فایل به Content-Typeهای استاندارد (مانند CSS, JS, HTML, JSON, PNG).
- **`default_type application/octet-stream;`**: تایپ پیش‌فرض برای فایل‌های ناشناخته.
- **`log_format main`**: الگوی ذخیره لاگ‌های دسترسی شامل IP کاربر (`$remote_addr`)، زمان درخواست، متد HTTP، کد وضعیت پاسخ (`$status`)، حجم داده، HTTP Referer و User-Agent.
- **`sendfile on;`**: فعال‌سازی ارسال مستقیم فایل از حافظه دیسک به کارت شبکه بدون کپی در حافظه برنامه (باعث افزایش چشمگیر سرعت سرو فایل‌های استاتیک می‌شود).
- **`keepalive_timeout 65;`**: حداکثر زمان (۶۵ ثانیه) باز ماندن اتصالات TCP معتبر جهت کاهش Overhead اتصال مجدد.

---

### ۲.۳. تعریف آپ‌استریم‌ها (Upstream Definitions)
```nginx
    # Upstream definition for Medusa Backend
    upstream medusa_backend {
        server medusa:9000;
    }

    # Upstream definition for Payload CMS / Backend
    upstream payload_backend {
        server payload:3000;
    }
```
- **`upstream medusa_backend`**: ارجاع نام مستعار `medusa_backend` به نام کانتینر `medusa` در شبکه داخلی داکر روی پورت `9000` (موتور فروشگاهی Medusa).
- **`upstream payload_backend`**: ارجاع نام مستعار `payload_backend` to نام کانتینر `payload` در شبکه داخلی داکر روی پورت `3000` (موتور مدیریت محتوا Payload CMS).

---

### ۲.۴. تنظیمات Virtual Host و Server Block
```nginx
    server {
        listen 80;
        server_name localhost;
```
- **`listen 80;`**: شنود درخواست‌های ورودی روی پورت استاندارد HTTP (`80`).
- **`server_name localhost;`**: پاسخگویی به نام دامنه/هاست `localhost` (در محیط تولید به دامنه اصلی تغییر می‌کند).

---

### ۲.۵. مسیریابی و مسیرهای Location (Location Routes)

#### الف) مسیر بررسی سلامت (Healthcheck Endpoint)
```nginx
        # Healthcheck endpoint
        location /health {
            return 200 'OK';
            add_header Content-Type text/plain;
        }
```
- **کاربرد:** برای پایش وضعیت (Monitoring) و صحت عملکرد سرویس Nginx توسط Docker یا Load Balancer.
- **عملکرد:** در پاسخ به درخواست `GET /health` بلافاصله وضعیت `200 OK` با متن `OK` بازمی‌گرداند.

---

#### ب) مسیر مدیریت محتوا (Payload CMS / Admin & API)
```nginx
        # Payload CMS / Admin & API routes
        location /payload/ {
            proxy_pass http://payload_backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
```
- **مسیر:** تمامی درخواست‌هایی که با `/payload/` شروع می‌شوند.
- **`proxy_pass http://payload_backend/;`**: هدایت درخواست به کانتینر Payload CMS (پورت ۳۰۰۰). وجود اسلش `/` در انتهای پورت باعث حذف پیشوند `/payload/` هنگام ارسال به بک‌اند می‌شود.
- **پشتیبانی از WebSocket (`Upgrade`, `Connection 'upgrade'`):** جهت اتصال زنده و Live Preview پنل ادمین Payload CMS.
- **هدایت هدرهای امنیتی و هویت مشتری:**
  - `Host $host`: حفظ دامنه درخواست‌شده اصلی.
  - `X-Real-IP $remote_addr`: ارسال IP واقعی کاربر به بک‌اند.
  - `X-Forwarded-For`: ثبت زنجیره پروکسی‌ها جهت تشخیص IP واقعی مشتری.
  - `X-Forwarded-Proto $scheme`: اعلام پروتکل اصلی (`http` یا `https`).

---

#### ج) مسیر APIهای فروشگاهی و مدیریتی Medusa (Medusa E-commerce API)
```nginx
        # Medusa E-commerce Backend API & Admin routes
        location /api/medusa/ {
            proxy_pass http://medusa_backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
```
- **مسیر:** تمامی درخواست‌هایی که با `/api/medusa/` شروع می‌شوند.
- **`proxy_pass http://medusa_backend/;`**: هدایت درخواست به کانتینر Medusa Backend (پورت ۹۰۰۰). پیشوند `/api/medusa/` حذف شده و روت اصلی Medusa فراخوانی می‌شود.
- **کاربرد:** دسترسی به کلیه APIهای Storefront (`/api/medusa/store/*`) و APIهای Admin Medusa (`/api/medusa/admin/*`).

---

#### د) مسیر پیش‌فرض / روت اصلی (Default Fallback & Storefront)
```nginx
        # Default fallback route / Storefront route
        location / {
            proxy_pass http://payload_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
```
- **مسیر:** هر درخواستی که با روت‌های قبلی تطابق نداشته باشد (`/`).
- **عملکرد فعلی:** درخواست به `payload_backend` (پورت ۳۰۰۰) هدایت می‌شود تا صفحات عمومی فرانت‌اند و CMS نمایش داده شوند.

---

# ۳. جدول ماتریس هدایت درخواست‌ها (Request Routing Table)

| مسیر درخواست ورودی (URL Pattern) | سرویس مقصد (Upstream Target) | کانتینر و پورت داکر | هدف / کاربرد |
|---|---|---|---|
| `GET http://localhost/health` | پاسخ مستقیم (Direct 200 OK) | Nginx | بررسی سلامت پروکسی معکوس |
| `http://localhost/payload/*` | `http://payload_backend/*` | `depix-payload:3000` | پنل ادمین Payload CMS و REST/GraphQL API محتوا |
| `http://localhost/api/medusa/*` | `http://medusa_backend/*` | `depix-medusa:9000` | APIهای کامل فروشگاه، سبد خرید، پرداخت و ادمین Medusa |
| `http://localhost/*` (روت اصلی) | `http://payload_backend` | `depix-payload:3000` | فرانت‌اند عمومی سایت / Fallback Route |

---

# ۴. نقش هدرهای سفارشی و تنظیمات پیشرفته (Headers & Protocol Specifics)

1. **حل مشکل CORS (Cross-Origin Resource Sharing):**
   با متمرکز ساختن تمام سرویس‌ها روی یک دامنه و پورت واحد (`port 80`)، تمامی درخواست‌های فرانت‌اند به بک‌اندها تحت یک Origin مجاز اجرا شده و نیازی به تنظیمات پیچیده Cross-Origin وجود ندارد.
2. **شفافیت IP خریداران (IP Transparency):**
   با تنظیم هدرهای `X-Real-IP` و `X-Forwarded-For`، سیستم‌های امنیتی و ماژول‌های تحلیلی Medusa و Payload قادر به شناسایی دقیق IP خریداران برای جلوگیری از حملات و ثبت آدرس صحیح هستند.
3. **پشتیبانی کامل از WebSocket:**
   وجود تنظیمات `Upgrade` و `Connection 'upgrade'` به سرویس‌های وب‌سوکت اجازه می‌دهد اتصال‌های دائمی بدون قطعی جهت به‌روزرسانی‌های آنی (Real-time) ایجاد کنند.

---

# ۵. نقاط قوت معماری فعلی و پیشنهادات توسعه برای تولید (Production)

### نقاط قوت فعلی:
- معماری یکپارچه با Docker Compose.
- جداسازی شفاف اندپوئینت‌های e-commerce و CMS.
- عملکرد بالا با استفاده از `sendfile` و `keepalive`.

### پیشنهادات بهبود برای محیط پروداکشن:
1. **افزودن SSL/TLS (HTTPS):**
   افزودن بلوک `listen 443 ssl;` و گواهی Let's Encrypt برای امن‌سازی ارتباطات و توکن‌های پرداخت.
2. **فعال‌سازی فشرده‌سازی Gzip/Brotli:**
   افزودن `gzip on;` برای فشرده‌سازی پاسخ‌های JSON و فایل‌های استاتیک و افزایش سرعت لود.
3. **محدودسازی نرخ درخواست (Rate Limiting):**
   افزودن `limit_req_zone` روی روت‌های `/api/medusa/store/carts` و `/payload/api/` جهت جلوگیری از حملات Brute Force و DoS.
