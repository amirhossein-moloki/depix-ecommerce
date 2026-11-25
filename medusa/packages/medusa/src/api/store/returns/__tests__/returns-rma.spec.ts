import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { GET as storeListReturns, POST as storeCreateReturn } from "../route"
import { GET as storeGetReturn } from "../[id]/route"
import { POST as storeSubmitShipment } from "../[id]/shipment/route"
import { POST as storeCancelReturn } from "../[id]/cancel/route"
import { GET as adminListReturns } from "../../../admin/returns/route"
import { POST as adminApproveReturn } from "../../../admin/returns/[id]/approve/route"
import { POST as adminRejectReturn } from "../../../admin/returns/[id]/reject/route"
import { POST as adminReceiveReturn } from "../../../admin/returns/[id]/receive/route"
import { POST as adminInspectReturn } from "../../../admin/returns/[id]/inspect/route"
import { POST as adminRefundReturn } from "../../../admin/returns/[id]/refund/route"

describe("Store & Admin Returns / RMA (HAD-21)", () => {
  const makeRes = () => {
    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })
    return { res: { json, status } as any, json, status }
  }

  it("creates, lists, submits shipment, and cancels a customer return request", async () => {
    const order = {
      id: "order_1",
      customer_id: "cust_1",
      version: 1,
      created_at: new Date(),
      fulfillments: [{ delivered_at: new Date() }],
    }
    const createdReturn = {
      id: "return_1",
      order_id: "order_1",
      status: "open",
      metadata: {
        rma_status: "requested",
        customer_id: "cust_1",
        reason: "damaged",
        description: "Box torn",
        evidence_urls: ["https://cdn.depix.ir/e1.jpg"],
      },
      items: [{ item_id: "item_1", quantity: 1 }],
    }

    const orderService = {
      retrieveOrder: jest.fn().mockResolvedValue(order),
      createReturns: jest.fn().mockResolvedValue(createdReturn),
      listAndCountReturns: jest.fn().mockResolvedValue([[createdReturn], 1]),
      retrieveReturn: jest.fn().mockResolvedValue(createdReturn),
      updateReturns: jest.fn().mockImplementation((data: any) =>
        Promise.resolve({
          ...createdReturn,
          ...data,
          metadata: { ...createdReturn.metadata, ...data.metadata },
        })
      ),
    }

    const resolve = jest.fn((key: string) => {
      if (key === Modules.ORDER) return orderService
      throw new Error(`Unexpected ${key}`)
    })

    // POST /store/returns
    const { res: createRes, status: createStatus, json: createJson } = makeRes()
    await storeCreateReturn(
      {
        auth_context: { actor_id: "cust_1" },
        validatedBody: {
          order_id: "order_1",
          items: [{ line_item_id: "item_1", quantity: 1 }],
          reason: "damaged",
          description: "Box torn",
          evidence_urls: ["https://cdn.depix.ir/e1.jpg"],
        },
        scope: { resolve },
      } as any,
      createRes
    )
    expect(createStatus).toHaveBeenCalledWith(201)
    expect(createJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({
          id: "return_1",
          status: "requested",
          reason: "damaged",
        }),
      })
    )

    // GET /store/returns
    const { res: listRes, json: listJson } = makeRes()
    await storeListReturns(
      {
        auth_context: { actor_id: "cust_1" },
        validatedQuery: { limit: 20, offset: 0 },
        scope: { resolve },
      } as any,
      listRes
    )
    expect(listJson).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
        returns: [expect.objectContaining({ id: "return_1" })],
      })
    )

    // GET /store/returns/:id
    const { res: getRes, json: getJson } = makeRes()
    await storeGetReturn(
      {
        params: { id: "return_1" },
        auth_context: { actor_id: "cust_1" },
        scope: { resolve },
      } as any,
      getRes
    )
    expect(getJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({ id: "return_1" }),
      })
    )

    // POST /store/returns/:id/shipment
    const { res: shipRes, json: shipJson } = makeRes()
    await storeSubmitShipment(
      {
        params: { id: "return_1" },
        auth_context: { actor_id: "cust_1" },
        validatedBody: { method: "tipax", tracking_code: "TPX-12345" },
        scope: { resolve },
      } as any,
      shipRes
    )
    expect(shipJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({
          status: "shipped",
          shipment: expect.objectContaining({
            method: "tipax",
            tracking_code: "TPX-12345",
          }),
        }),
      })
    )

    // POST /store/returns/:id/cancel
    const { res: cancelRes, json: cancelJson } = makeRes()
    await storeCancelReturn(
      {
        params: { id: "return_1" },
        auth_context: { actor_id: "cust_1" },
        scope: { resolve },
      } as any,
      cancelRes
    )
    expect(cancelJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({ status: "canceled" }),
      })
    )
  })

  it("handles admin approve, reject, receive, inspect (restoring inventory), and refund", async () => {
    const baseReturn = {
      id: "return_2",
      order_id: "order_2",
      location_id: "sloc_1",
      status: "open",
      metadata: {
        rma_status: "requested",
        reason: "wrong_size",
      },
      items: [{ id: "ri_1", quantity: 2, item: { variant_id: "var_1" } }],
    }

    const orderService = {
      retrieveReturn: jest.fn().mockResolvedValue(baseReturn),
      updateReturns: jest.fn().mockImplementation((data: any) =>
        Promise.resolve({
          ...baseReturn,
          ...data,
          metadata: { ...baseReturn.metadata, ...data.metadata },
        })
      ),
    }
    const inventoryService = {
      adjustInventory: jest.fn().mockResolvedValue({}),
    }
    const query = {
      graph: jest.fn().mockResolvedValue({
        data: [{ id: "var_1", inventory_items: [{ inventory_item_id: "inv_1" }] }],
      }),
    }
    const remoteQuery = jest.fn().mockResolvedValue({
      rows: [baseReturn],
    })

    const resolve = jest.fn((key: string) => {
      if (key === Modules.ORDER) return orderService
      if (key === Modules.INVENTORY) return inventoryService
      if (key === "query") return query
      if (key === ContainerRegistrationKeys.REMOTE_QUERY) return remoteQuery
      throw new Error(`Unexpected ${key}`)
    })

    // GET /admin/returns with status & reason filter
    const { res: listRes, json: listJson } = makeRes()
    await adminListReturns(
      {
        filterableFields: { status: "requested", reason: "wrong_size" },
        queryConfig: { fields: ["id"], pagination: { skip: 0, take: 15 } },
        scope: { resolve },
      } as any,
      listRes
    )
    expect(listJson).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 })
    )

    // Approve
    const { res: appRes, json: appJson } = makeRes()
    await adminApproveReturn(
      {
        params: { id: "return_2" },
        auth_context: { actor_id: "admin_1" },
        validatedBody: { admin_note: "Approved" },
        scope: { resolve },
      } as any,
      appRes
    )
    expect(appJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({ status: "approved" }),
      })
    )

    // Reject
    const { res: rejRes, json: rejJson } = makeRes()
    await adminRejectReturn(
      {
        params: { id: "return_2" },
        auth_context: { actor_id: "admin_1" },
        validatedBody: { reject_reason: "Window expired" },
        scope: { resolve },
      } as any,
      rejRes
    )
    expect(rejJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({ status: "rejected" }),
      })
    )

    // Receive
    const { res: recRes, json: recJson } = makeRes()
    await adminReceiveReturn(
      {
        params: { id: "return_2" },
        auth_context: { actor_id: "admin_1" },
        validatedBody: { received_at: "2026-11-25T10:00:00Z" },
        scope: { resolve },
      } as any,
      recRes
    )
    expect(recJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({ status: "received" }),
      })
    )

    // Inspect sellable -> restores inventory
    const { res: insRes, json: insJson } = makeRes()
    await adminInspectReturn(
      {
        params: { id: "return_2" },
        auth_context: { actor_id: "admin_1" },
        validatedBody: { result: "sellable", note: "Sealed box" },
        scope: { resolve },
      } as any,
      insRes
    )
    expect(inventoryService.adjustInventory).toHaveBeenCalledWith(
      "inv_1",
      "sloc_1",
      2
    )
    expect(insJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({
          status: "inspected",
          inspection: expect.objectContaining({
            result: "sellable",
            inventory_restored: true,
          }),
        }),
      })
    )

    // Refund
    const { res: refRes, json: refJson } = makeRes()
    await adminRefundReturn(
      {
        params: { id: "return_2" },
        auth_context: { actor_id: "admin_1" },
        validatedBody: {
          amount_irr: 5000000,
          reference_id: "REF-9988",
          note: "Card-to-card",
        },
        scope: { resolve },
      } as any,
      refRes
    )
    expect(refJson).toHaveBeenCalledWith(
      expect.objectContaining({
        return_request: expect.objectContaining({
          status: "refunded",
          refund: expect.objectContaining({
            amount_irr: 5000000,
            reference_id: "REF-9988",
          }),
        }),
      })
    )
  })
})
