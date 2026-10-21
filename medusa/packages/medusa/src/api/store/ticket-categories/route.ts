import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const categories = await ticketService.listTicketCategories(
    { is_active: true },
    {
      order: { sort_order: "ASC", name: "ASC" },
    }
  )

  res.json({
    categories: categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sort_order: c.sort_order,
    })),
  })
}
