import { updateCartWorkflowId } from "@medusajs/core-flows"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"

import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { attachAuthenticatedCustomerToCart, refetchCart } from "../helpers"

export const GET = async (
  req: MedusaRequest<HttpTypes.StoreGetCartsCart>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ cart })
}

export const POST = async (
  req: MedusaRequest<
    HttpTypes.StoreUpdateCart & AdditionalData & { phone?: string | null },
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<{
    cart: HttpTypes.StoreCart
  }>
) => {
  const actorId = (req as AuthenticatedMedusaRequest).auth_context?.actor_id
  if (actorId) {
    await attachAuthenticatedCustomerToCart(req.scope, req.params.id, actorId)
  }

  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  const { phone, ...rest } = req.validatedBody
  const inputBody: Record<string, any> = { ...rest }

  if (phone !== undefined) {
    inputBody.metadata = {
      ...(inputBody.metadata ?? {}),
      phone,
    }
    if (inputBody.shipping_address && !inputBody.shipping_address.phone) {
      inputBody.shipping_address = {
        ...inputBody.shipping_address,
        phone,
      }
    }
  }

  await we.run(updateCartWorkflowId, {
    input: {
      ...inputBody,
      id: req.params.id,
      additional_data: req.validatedBody.additional_data,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}

export const PATCH = POST
