import {
  cancelOrderWorkflow,
  getOrderDetailWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  applyOrderStatusMetadata,
  CANCELLABLE_CUSTOMER_ORDER_STATUSES,
  normalizeOrderStatus,
} from "../../../../utils/order-status"
import { defaultStoreRetrieveOrderFields } from "../../query-config"
import { StoreCancelOrderType } from "../../validators"
import { restoreInventoryForCanceledOrder } from "../../../payments/inventory-deduction"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    StoreCancelOrderType,
    HttpTypes.StoreGetOrderParams
  >,
  res: MedusaResponse<HttpTypes.StoreOrderResponse>
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "احراز هویت برای لغو سفارش الزامی است."
    )
  }

  const { id } = req.params
  const { reason } = (req.validatedBody ?? {}) as { reason?: string }
  const orderService = req.scope.resolve<any>(Modules.ORDER)

  let existing: any = null
  try {
    const workflow = getOrderDetailWorkflow(req.scope)
    const { result } = await workflow.run({
      input: {
        order_id: id,
        fields: [
          "id",
          "status",
          "customer_id",
          "metadata",
          "fulfillments.*",
        ],
        filters: {
          is_draft_order: false,
        },
      },
    })
    existing = result
  } catch {
    existing = await orderService
      ?.retrieveOrder?.(id)
      .catch(() => null)
  }

  if (!existing || existing.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "سفارش مورد نظر یافت نشد."
    )
  }

  const hydrated = applyOrderStatusMetadata({ ...existing })
  const coreStatus = normalizeOrderStatus(String(existing.status ?? ""))
  const rawMetaStatus = (existing.metadata as Record<string, any> | undefined)
    ?.order_status
  const metaStatus = rawMetaStatus
    ? normalizeOrderStatus(String(rawMetaStatus))
    : ""
  const fulfillmentStatus = String(
    hydrated.fulfillment_status ?? "not_fulfilled"
  ).toLowerCase()
  const hasActiveFulfillments =
    Array.isArray(existing.fulfillments) &&
    existing.fulfillments.some((f: any) => !f?.canceled_at)

  if (coreStatus === "canceled" || metaStatus === "canceled") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "این سفارش قبلاً لغو شده است."
    )
  }

  if (coreStatus === "completed" || coreStatus === "archived") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "سفارش تکمیل‌شده قابل لغو نیست."
    )
  }

  if (
    metaStatus &&
    !(CANCELLABLE_CUSTOMER_ORDER_STATUSES as readonly string[]).includes(
      metaStatus
    )
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "سفارش در وضعیت فعلی قابل لغو توسط مشتری نیست."
    )
  }

  if (
    [
      "shipped",
      "partially_shipped",
      "delivered",
      "partially_delivered",
    ].includes(fulfillmentStatus) ||
    hasActiveFulfillments
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "سفارش ارسال‌شده قابل لغو نیست."
    )
  }

  await cancelOrderWorkflow(req.scope).run({
    input: {
      order_id: id,
      canceled_by: customerId,
    },
  })

  await restoreInventoryForCanceledOrder(req.scope, id, customerId)

  const nextMetadata: Record<string, unknown> = {
    ...((existing.metadata as Record<string, unknown> | undefined) ?? {}),
    order_status: "canceled",
    fulfillment_status: "canceled",
    canceled_by: customerId,
    canceled_by_actor: "customer",
    canceled_at: new Date().toISOString(),
    ...(reason ? { cancel_reason: reason } : {}),
  }

  if (orderService?.updateOrders) {
    await orderService.updateOrders(id, {
      metadata: nextMetadata,
    })
  }

  let order: any
  try {
    const workflow = getOrderDetailWorkflow(req.scope)
    const { result } = await workflow.run({
      input: {
        order_id: id,
        fields: req.queryConfig?.fields ?? defaultStoreRetrieveOrderFields,
        filters: {
          is_draft_order: false,
        },
      },
    })
    order = result
  } catch {
    order = await orderService.retrieveOrder(id)
  }

  res
    .status(200)
    .json({ order: applyOrderStatusMetadata(order) as HttpTypes.StoreOrder })
}
