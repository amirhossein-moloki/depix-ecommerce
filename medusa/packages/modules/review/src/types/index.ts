export type ProductReviewDTO = {
  id: string
  product_id: string
  customer_id: string
  rating: number
  title?: string | null
  content: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  verified_purchase: boolean
  metadata?: Record<string, any> | null
  created_at: string | Date
  updated_at: string | Date
  reply?: ReviewReplyDTO | null
}

export type ReviewReplyDTO = {
  id: string
  review_id: string
  admin_id: string
  content: string
  metadata?: Record<string, any> | null
  created_at: string | Date
  updated_at: string | Date
}

export type CreateProductReviewInput = {
  product_id: string
  customer_id: string
  rating: number
  title?: string | null
  content: string
  verified_purchase?: boolean
  metadata?: Record<string, any> | null
}

export type CreateReviewReplyInput = {
  review_id: string
  admin_id: string
  content: string
  metadata?: Record<string, any> | null
}
