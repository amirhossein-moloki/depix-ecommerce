export type BannerPlacementType = "hero_main" | "hero_secondary"

export interface BannerDTO {
  id: string
  title: string | null
  placement: BannerPlacementType
  image_url: string
  link_url: string | null
  sort_order: number
  is_active: boolean
  metadata?: Record<string, unknown> | null
  created_at: Date | string
  updated_at: Date | string
}
