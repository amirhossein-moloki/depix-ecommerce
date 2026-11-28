const mockDeleteWorkflowRun = jest.fn()
const mockRefetchEntity = jest.fn()

jest.mock("@medusajs/core-flows", () => ({
  ...jest.requireActual("@medusajs/core-flows"),
  deleteProductVariantsWorkflow: jest.fn(() => ({ run: mockDeleteWorkflowRun })),
}))

jest.mock("@medusajs/framework/http", () => ({
  ...jest.requireActual("@medusajs/framework/http"),
  refetchEntity: (...args: any[]) => mockRefetchEntity(...args),
}))

import { DELETE as deleteProductVariant } from "../[id]/variants/[variant_id]/route"

describe("DELETE /admin/products/:id/variants/:variant_id", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("deletes a single variant via deleteProductVariantsWorkflow and returns deletion payload with updated parent product", async () => {
    mockDeleteWorkflowRun.mockResolvedValueOnce({ result: undefined })
    mockRefetchEntity.mockResolvedValueOnce({
      id: "prod_1",
      title: "محصول نمونه",
      variants: [],
    })

    const req: any = {
      params: { id: "prod_1", variant_id: "var_1" },
      queryConfig: { fields: ["id", "title", "*variants"] },
      scope: { resolve: jest.fn() },
    }
    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })

    await deleteProductVariant(req, { status, json } as any)

    expect(mockDeleteWorkflowRun).toHaveBeenCalledWith({
      input: { ids: ["var_1"] },
    })
    expect(mockRefetchEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "product",
        idOrFilter: "prod_1",
        scope: req.scope,
      })
    )
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      id: "var_1",
      object: "variant",
      deleted: true,
      parent: {
        id: "prod_1",
        title: "محصول نمونه",
        variants: [],
      },
    })
  })
})
