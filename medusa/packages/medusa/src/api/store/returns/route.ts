import { createAndCompleteReturnOrderWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StoreSettingsService } from "../../admin/settings/services/store-settings-service"
import { formatReturnRequest } from "./helpers"
import { StorePostReturnsReqSchemaType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({
      type: "unauthorized",
      message: "Customer authentication required.",
    })
  }

  const orderService = req.scope.resolve<any>(Modules.ORDER)
  const skip =
    req.queryConfig?.pagination?.skip ?? req.validatedQuery?.offset ?? 0
  const take =
    req.queryConfig?.pagination?.take ?? req.validatedQuery?.limit ?? 20
  const statusFilter = req.validatedQuery?.status as string | undefined

  const [allReturns] = await orderService.listAndCountReturns(
    {},
    {
      relations: ["items", "order"],
      order: { created_at: "DESC" },
    }
  )

  const customerReturns = (allReturns ?? [])
    .map(formatReturnRequest)
    .filter((ret: any) => {
      if (ret.customer_id !== customerId) {
        return false
      }
      if (statusFilter && ret.status !== statusFilter) {
        return false
      }
      return true
    })

  const paged = customerReturns.slice(skip, skip + take)

  return res.json({
    returns: paged,
    count: customerReturns.length,
    offset: skip,
    limit: take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StorePostReturnsReqSchemaType>,
  res: MedusaResponse
) => {
  const input = req.validatedBody
  const customerId = req.auth_context?.actor_id

  // Backwards-compatible Medusa native flow when return_shipping is passed without customer auth
  if (input.return_shipping && !customerId) {
    const workflow = createAndCompleteReturnOrderWorkflow(req.scope)
    const normalizedItems = input.items.map((item) => ({
      ...item,
      id: item.id || item.line_item_id!,
    }))
    const { result } = await workflow.run({
      input: {
        ...input,
        items: normalizedItems,
      } as any,
    })

    return res.status(200).json({ return: result })
  }

  if (!customerId) {
    return res.status(401).json({
      type: "unauthorized",
      message: "Customer authentication required.",
    })
  }

  const orderService = req.scope.resolve<any>(Modules.ORDER)
  const order = await orderService
    .retrieveOrder(input.order_id, {
      relations: ["items", "fulfillments"],
    })
    .catch(() => null)

  if (!order) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order '${input.order_id}' not found.`
    )
  }

  if (order.customer_id && order.customer_id !== customerId) {
    return res.status(403).json({
      type: "forbidden",
      message: "You do not have permission to request a return for this order.",
    })
  }

  // Validate return window from StoreSettingsService (default 7 days)
  let returnWindowDays = 7
  let autoApproveReturns = false
  try {
    const settingsService = new StoreSettingsService(req.scope)
    const settings = await settingsService.getSettings()
    returnWindowDays = settings.returnWindowDays ?? 7
    autoApproveReturns = Boolean(settings.autoApproveReturns)

    const deliveryTimestamp =
      order.fulfillments?.find((f: any) => f.delivered_at)?.delivered_at ||
      order.updated_at ||
      order.created_at

    if (
      deliveryTimestamp &&
      !settingsService.isReturnEligible(deliveryTimestamp, returnWindowDays)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Return window of ${returnWindowDays} day(s) has expired for this order.`
      )
    }
  } catch (e) {
    if (e instanceof MedusaError) {
      throw e
    }
  }

  const rmaStatus = autoApproveReturns ? "approved" : "requested"
  const createdReturn = await orderService.createReturns({
    order_id: order.id,
    order_version: order.version ?? 1,
    location_id: input.location_id ?? null,
    created_by: customerId,
    requested_at: new Date(),
    items: input.items.map((item) => ({
      item_id: item.line_item_id || item.id!,
      quantity: item.quantity,
      reason_id: item.reason_id ?? null,
      note: item.note ?? input.description ?? null,
    })),
    metadata: {
      rma_status: rmaStatus,
      customer_id: customerId,
      reason: input.reason ?? null,
      description: input.description ?? input.note ?? null,
      evidence_urls: input.evidence_urls ?? [],
      return_window_days: returnWindowDays,
    },
  })

  const formatted = formatReturnRequest(createdReturn)
  return res.status(201).json({
    return_request: formatted,
    return: formatted,
  })
}
