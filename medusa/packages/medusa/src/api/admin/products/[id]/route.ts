import {
  deleteProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { remapKeysForProduct, remapProductResponse } from "../helpers"
import { MedusaError } from "@medusajs/framework/utils"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"
import { refetchEntity } from "@medusajs/framework/http"
import {
  prepareInventoryQuantityFields,
  wrapVariantsWithTotalInventoryQuantity,
} from "../../../utils/middlewares"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminGetProductParams>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const { fields, withInventoryQuantity } = prepareInventoryQuantityFields(
    req.queryConfig.fields ?? [],
    { relation: "variants" }
  )
  const selectFields = remapKeysForProduct(fields)
  const product = await refetchEntity({
    entity: "product",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: selectFields,
  })

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  if (withInventoryQuantity) {
    await wrapVariantsWithTotalInventoryQuantity(req, product.variants ?? [])
  }

  res.status(200).json({ product: remapProductResponse(product) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminUpdateProduct & AdditionalData,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const { additional_data, ...update } = req.validatedBody

  const existingProduct = await refetchEntity({
    entity: "product",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: ["id"],
  })
  /**
   * Check if the product exists with the id or not before calling the workflow.
   */
  if (!existingProduct) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id "${req.params.id}" not found`
    )
  }

  const { result } = await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update,
      additional_data,
    },
  })

  const { fields, withInventoryQuantity } = prepareInventoryQuantityFields(
    req.queryConfig.fields ?? [],
    { relation: "variants" }
  )

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: result[0].id,
    scope: req.scope,
    fields: remapKeysForProduct(fields),
  })

  if (withInventoryQuantity && product) {
    await wrapVariantsWithTotalInventoryQuantity(req as any, product.variants ?? [])
  }

  res.status(200).json({ product: remapProductResponse(product) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductDeleteResponse>
) => {
  const id = req.params.id

  await deleteProductsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "product",
    deleted: true,
  })
}
