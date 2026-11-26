import {
  cancelOrderWorkflow,
  completeOrderWorkflow,
  getOrderDetailWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminOrder, HttpTypes } from "@medusajs/framework/types"
import { MedusaError, Modules, OrderStatus } from "@medusajs/framework/utils"
import {
  applyOrderStatusMetadata,
  defaultFulfillmentStatusForOrderStatus,
  mapStatusToCoreOrderStatus,
  normalizeOrderStatus,
} from "../../../../utils/order-status"
import { AdminUpdateOrderStatusType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminUpdateOrderStatusType,
    HttpTypes.AdminGetOrderDetailsParams
  >,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const { id } = req.params
  const { status, fulfillment_status, tracking_number, note, metadata } =
    req.validatedBody
  const orderService = req.scope.resolve<any>(Modules.ORDER)

  const existing = await orderService.retrieveOrder(id).catch(() => null)
  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id '${id}' was not found`
    )
  }

  const normalizedStatus = normalizeOrderStatus(status)
  const coreStatus = mapStatusToCoreOrderStatus(normalizedStatus)
  const nextFulfillmentStatus =
    fulfillment_status ??
    defaultFulfillmentStatusForOrderStatus(normalizedStatus) ??
    (existing.metadata?.fulfillment_status as string | undefined) ??
    "not_fulfilled"

  const existingMetadata = (existing.metadata ?? {}) as Record<string, any>
  const previousHistory = Array.isArray(existingMetadata.status_history)
    ? existingMetadata.status_history
    : []
  const nowIso = new Date().toISOString()

  const historyEntry: Record<string, unknown> = {
    status: normalizedStatus,
    fulfillment_status: nextFulfillmentStatus,
    updated_at: nowIso,
    updated_by: req.auth_context?.actor_id ?? null,
    ...(tracking_number ? { tracking_number } : {}),
    ...(note ? { note } : {}),
  }

  const nextMetadata: Record<string, unknown> = {
    ...existingMetadata,
    ...(metadata ?? {}),
    order_status: normalizedStatus,
    fulfillment_status: nextFulfillmentStatus,
    status_updated_at: nowIso,
    status_updated_by: req.auth_context?.actor_id ?? null,
    ...(tracking_number !== undefined ? { tracking_number } : {}),
    ...(note !== undefined ? { status_note: note } : {}),
    status_history: [...previousHistory, historyEntry],
  }

  if (
    coreStatus === OrderStatus.CANCELED &&
    existing.status !== OrderStatus.CANCELED
  ) {
    await cancelOrderWorkflow(req.scope).run({
      input: {
        order_id: id,
        canceled_by: req.auth_context?.actor_id,
      },
    })
    await orderService.updateOrders(id, {
      metadata: nextMetadata,
    })
  } else if (
    coreStatus === OrderStatus.COMPLETED &&
    existing.status !== OrderStatus.COMPLETED
  ) {
    await completeOrderWorkflow(req.scope).run({
      input: {
        orderIds: [id],
      },
    })
    await orderService.updateOrders(id, {
      metadata: nextMetadata,
    })
  } else {
    await orderService.updateOrders(id, {
      status: coreStatus,
      metadata: nextMetadata,
    })
  }

  let order: any
  try {
    const workflow = getOrderDetailWorkflow(req.scope)
    const { result } = await workflow.run({
      input: {
        fields: req.queryConfig?.fields ?? [
          "id",
          "status",
          "metadata",
          "summary",
          "total",
          "created_at",
          "updated_at",
        ],
        order_id: id,
      },
    })
    order = result
  } catch {
    order = await orderService.retrieveOrder(id)
  }

  res
    .status(200)
    .json({ order: applyOrderStatusMetadata(order) as AdminOrder })
}
