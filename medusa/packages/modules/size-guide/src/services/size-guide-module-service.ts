import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import SizeGuideTemplate from "../models/size-guide-template"
import ProductSizeGuide from "../models/product-size-guide"

export default class SizeGuideModuleService extends MedusaService({
  SizeGuideTemplate,
  ProductSizeGuide,
}) {
  /**
   * Validates columns and rows structure for size guides and templates.
   */
  validateSizeGuideData(columns: any[], rows: any[]) {
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Size guide must contain at least one column."
      )
    }

    const columnIds = new Set<string>()
    for (const col of columns) {
      if (!col.id || typeof col.id !== "string" || !col.id.trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Each column must have a non-empty string 'id'."
        )
      }
      if (!col.label || typeof col.label !== "string" || !col.label.trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Each column must have a non-empty string 'label'."
        )
      }
      if (columnIds.has(col.id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Duplicate column ID '${col.id}' found.`
        )
      }
      columnIds.add(col.id)
    }

    if (!Array.isArray(rows)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Rows must be an array."
      )
    }

    const rowIds = new Set<string>()
    for (const row of rows) {
      if (!row.id || typeof row.id !== "string" || !row.id.trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Each row must have a non-empty string 'id'."
        )
      }
      if (rowIds.has(row.id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Duplicate row ID '${row.id}' found.`
        )
      }
      rowIds.add(row.id)

      if (row.cells && typeof row.cells === "object") {
        for (const cellKey of Object.keys(row.cells)) {
          if (!columnIds.has(cellKey)) {
            // Remove dangling cells for columns that do not exist
            delete row.cells[cellKey]
          }
        }
      } else {
        row.cells = {}
      }
    }

    return { columns, rows }
  }

  /**
   * Helper to create a ProductSizeGuide by cloning an existing SizeGuideTemplate snapshot.
   */
  async cloneTemplateToProductGuide(
    productId: string,
    templateId: string,
    overrides?: {
      title?: string
      description?: string
      notes?: string
      image_id?: string
      image_url?: string
    }
  ) {
    const template = await (this as any).retrieveSizeGuideTemplate(templateId)
    if (!template) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Size guide template with ID '${templateId}' not found.`
      )
    }

    if (!template.is_active) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Size guide template '${template.name}' is inactive and cannot be assigned.`
      )
    }

    // Deep copy columns and rows
    const columns = JSON.parse(JSON.stringify(template.columns || []))
    const rows = JSON.parse(JSON.stringify(template.rows || []))

    // Check if product already has a size guide assigned
    const [existing] = await (this as any).listProductSizeGuides({ product_id: productId })

    const payload = {
      product_id: productId,
      title: overrides?.title || template.name,
      description: overrides?.description !== undefined ? overrides.description : template.description,
      columns,
      rows,
      notes: overrides?.notes !== undefined ? overrides.notes : template.notes,
      source_template_id: template.id,
      image_id: overrides?.image_id || null,
      image_url: overrides?.image_url || null,
    }

    if (existing) {
      return await (this as any).updateProductSizeGuides({
        id: existing.id,
        ...payload,
      })
    } else {
      return await (this as any).createProductSizeGuides(payload)
    }
  }
}
