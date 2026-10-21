export interface BrandDTO {
  id: string
  name: string
  slug: string
  description?: string | null
  logo_id?: string | null
  is_active: boolean
  metadata?: Record<string, unknown> | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at?: string | Date | null
}

export interface CreateBrandDTO {
  name: string
  slug: string
  description?: string | null
  logo_id?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateBrandDTO {
  id: string
  name?: string
  slug?: string
  description?: string | null
  logo_id?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}
