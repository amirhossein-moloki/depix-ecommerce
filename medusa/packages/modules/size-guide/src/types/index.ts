import { SizeGuideColumn, SizeGuideRow } from "../models"

export interface CreateSizeGuideTemplateDTO {
  name: string
  description?: string | null
  columns: SizeGuideColumn[]
  rows: SizeGuideRow[]
  notes?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateSizeGuideTemplateDTO {
  id: string
  name?: string
  description?: string | null
  columns?: SizeGuideColumn[]
  rows?: SizeGuideRow[]
  notes?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface CreateProductSizeGuideDTO {
  product_id: string
  title: string
  description?: string | null
  columns: SizeGuideColumn[]
  rows: SizeGuideRow[]
  notes?: string | null
  source_template_id?: string | null
  image_id?: string | null
  image_url?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateProductSizeGuideDTO {
  id: string
  title?: string
  description?: string | null
  columns?: SizeGuideColumn[]
  rows?: SizeGuideRow[]
  notes?: string | null
  source_template_id?: string | null
  image_id?: string | null
  image_url?: string | null
  metadata?: Record<string, unknown> | null
}
