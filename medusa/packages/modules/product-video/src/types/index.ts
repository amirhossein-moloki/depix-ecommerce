import { ProductVideoProviderType, ProductVideoStatusType } from "../models/product-video"

export interface CreateProductVideoDTO {
  product_id: string
  variant_id?: string | null
  provider?: ProductVideoProviderType
  video_url: string
  video_id?: string | null
  title?: string | null
  description?: string | null
  thumbnail_url?: string | null
  sort_order?: number
  status?: ProductVideoStatusType
  metadata?: Record<string, any> | null
}

export interface UpdateProductVideoDTO {
  id: string
  product_id?: string
  variant_id?: string | null
  provider?: ProductVideoProviderType
  video_url?: string
  video_id?: string | null
  title?: string | null
  description?: string | null
  thumbnail_url?: string | null
  sort_order?: number
  status?: ProductVideoStatusType
  metadata?: Record<string, any> | null
}

export interface ReorderProductVideosDTO {
  product_id: string
  video_ids: string[]
}
