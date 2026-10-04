export type RelationshipType =
  | "RELATED"
  | "ACCESSORY"
  | "ALTERNATIVE"
  | "UPSELL"
  | "CROSS_SELL"

export type ProductRelationshipDTO = {
  id: string
  source_product_id: string
  related_product_id: string
  relationship_type: RelationshipType | string
  priority: number
  is_active: boolean
  metadata?: Record<string, any> | null
  created_at?: string | Date
  updated_at?: string | Date
}

export type CreateProductRelationshipDTO = {
  source_product_id: string
  related_product_id: string
  relationship_type?: RelationshipType | string
  priority?: number
  is_active?: boolean
  metadata?: Record<string, any>
}

export type UpdateProductRelationshipDTO = {
  id: string
  relationship_type?: RelationshipType | string
  priority?: number
  is_active?: boolean
  metadata?: Record<string, any>
}
