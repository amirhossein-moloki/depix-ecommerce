/**
 * Simple template renderer supporting handlebars-style syntax {{variable}}.
 */

const DEFAULT_TEMPLATES: Record<string, string> = {
  "back-in-stock": "محصول {{product_title}} ({{variant_title}}) دوباره موجود شد.",
  stock_available: "محصول {{product_title}} دوباره موجود شد.",
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
