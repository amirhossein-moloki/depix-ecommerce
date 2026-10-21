import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const categories = await ticketService.listTicketCategories(
    {},
    {
      order: { sort_order: "ASC", name: "ASC" },
    }
  )

  res.json({ categories })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ticketService = req.scope.resolve(Modules.TICKET) as any
  const body = req.body as any
  const { name, slug, description, is_active = true, sort_order = 0 } = body || {}

  if (!name || !name.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Category name is required"
    )
  }

  const categorySlug = (slug || name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")

  const [category] = await ticketService.createTicketCategories([
    {
      name: name.trim(),
      slug: categorySlug,
      description: description ? description.trim() : null,
      is_active,
      sort_order,
    },
  ])

  res.status(201).json({ category })
}
