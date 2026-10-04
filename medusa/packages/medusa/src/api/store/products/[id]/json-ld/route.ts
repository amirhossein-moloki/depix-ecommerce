import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { generateProductJsonLd, serializeJsonLd } from "../../../../../utils/json-ld/product-json-ld"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const productId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph(
    {
      entity: "product",
      filters: { id: productId },
      fields: [
        "*",
        "variants.*",
        "variants.prices.*",
        "variants.calculated_price.*",
        "categories.*",
        "images.*",
        "tags.*",
      ],
    },
    {
      locale: req.locale,
    }
  )

  const product = products[0]

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${productId} was not found`
    )
  }

  let reviews: any[] = []
  let ratingSummary: any = null

  try {
    const reviewService = req.scope.resolve<any>(Modules.REVIEW)
    if (reviewService) {
      const approvedReviews = await reviewService.listProductReviews({
        product_id: productId,
        status: "APPROVED",
      })

      const count = approvedReviews.length
      if (count > 0) {
        let total = 0
        for (const r of approvedReviews) {
          total += r.rating
        }
        ratingSummary = {
          review_count: count,
          average_rating: parseFloat((total / count).toFixed(1)),
        }
        reviews = approvedReviews
      }
    }
  } catch (e) {
    // If review module is not resolved or throws, continue without reviews
  }

  const baseUrl = (req.query.base_url as string) || process.env.STORE_URL || process.env.PUBLIC_URL || `${req.protocol || "http"}://${req.get("host")}`
  const currency = (req.query.currency as string) || (req.pricingContext as any)?.currency_code

  const jsonLd = generateProductJsonLd(product, {
    baseUrl,
    currency,
    reviews,
    ratingSummary,
  })

  if (req.query.format === "raw") {
    res.setHeader("Content-Type", "application/ld+json")
    return res.send(serializeJsonLd(jsonLd))
  }

  res.json({ json_ld: jsonLd })
}
