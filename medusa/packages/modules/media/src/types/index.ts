export interface MediaDTO {
  id: string
  original_filename: string
  file_key: string
  mime_type: string
  file_size: number
  storage_provider: string
  url: string
  width?: number | null
  height?: number | null
  uploaded_by_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at?: string | Date | null
}

export interface CreateMediaDTO {
  original_filename: string
  file_key: string
  mime_type: string
  file_size: number
  storage_provider?: string
  url: string
  width?: number | null
  height?: number | null
  uploaded_by_id?: string | null
  metadata?: Record<string, unknown> | null
}
