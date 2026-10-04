export interface CreateInvoiceItemDTO {
  item_id?: string | null
  title: string
  subtitle?: string | null
  product_id?: string | null
  variant_id?: string | null
  quantity: number
  unit_price: number
  subtotal: number
  tax_total?: number
  discount_total?: number
  total: number
  metadata?: Record<string, unknown> | null
}

export interface CreateInvoiceDTO {
  invoice_number?: string
  order_id: string
  customer_id?: string | null
  status?: string
  currency_code: string
  issue_date?: Date | string
  due_date?: Date | string | null
  subtotal: number
  discount_total?: number
  tax_total?: number
  shipping_total?: number
  total: number
  seller_details?: Record<string, unknown> | null
  billing_address?: Record<string, unknown> | null
  shipping_address?: Record<string, unknown> | null
  file_id?: string | null
  file_url?: string | null
  metadata?: Record<string, unknown> | null
  items: CreateInvoiceItemDTO[]
}

export interface InvoiceItemDTO {
  id: string
  invoice_id?: string
  item_id?: string | null
  title: string
  subtitle?: string | null
  product_id?: string | null
  variant_id?: string | null
  quantity: number
  unit_price: number
  subtotal: number
  tax_total: number
  discount_total: number
  total: number
  metadata?: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface InvoiceDTO {
  id: string
  display_id: number
  invoice_number: string
  order_id: string
  customer_id?: string | null
  status: string
  currency_code: string
  issue_date: Date
  due_date?: Date | null
  subtotal: number
  discount_total: number
  tax_total: number
  shipping_total: number
  total: number
  seller_details?: Record<string, unknown> | null
  billing_address?: Record<string, unknown> | null
  shipping_address?: Record<string, unknown> | null
  file_id?: string | null
  file_url?: string | null
  metadata?: Record<string, unknown> | null
  items?: InvoiceItemDTO[]
  created_at: Date
  updated_at: Date
}

export interface FilterableInvoiceProps {
  id?: string | string[]
  order_id?: string | string[]
  customer_id?: string | string[]
  status?: string | string[]
  invoice_number?: string
  q?: string
}
