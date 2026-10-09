/**
 * Simple template renderer supporting handlebars-style syntax {{variable}}.
 */

const DEFAULT_TEMPLATES: Record<string, string> = {
  "back-in-stock": "محصول {{product_title}} ({{variant_title}}) دوباره موجود شد.",
  stock_available: "محصول {{product_title}} دوباره موجود شد.",
  "order-created-template": "سفارش شما با شناسه {{order_id}} با موفقیت ثبت شد.",
  "order-placed": "سفارش شما با شماره {{order_id}} ثبت گردید.",
  "order-canceled": "سفارش شما با شماره {{order_id}} لغو شد.",
  "payment-captured": "پرداخت سفارش {{order_id}} با موفقیت تایید شد.",
  "payment-failed": "پرداخت سفارش {{order_id}} ناموفق بود.",
  "shipment-created": "مرسوله مربوط به سفارش {{order_id}} ارسال شد.",
  "stock-alert-triggered": "محصول مورد نظر شما دوباره موجود شد.",
  "price-alert-triggered": "قیمت محصول مورد نظر شما به {{new_price}} تغییر یافت.",
  "verification-requested": "کد تایید شما: {{code}}",
  "verification-code": "کد تایید شما: {{code}}",
  default: "اطلاعیه جدید: {{message}}",
}

export function renderNotificationTemplate(
  templateNameOrContent: string,
  data: Record<string, any> = {}
): string {
  let templateStr =
    DEFAULT_TEMPLATES[templateNameOrContent] || templateNameOrContent || ""

  if (!templateStr) {
    return ""
  }

  return templateStr.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const keys = key.split(".")
    let val: any = data
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) {
        val = val[k]
      } else {
        val = undefined
        break
      }
    }
    return val !== undefined && val !== null ? String(val) : ""
  })
}
