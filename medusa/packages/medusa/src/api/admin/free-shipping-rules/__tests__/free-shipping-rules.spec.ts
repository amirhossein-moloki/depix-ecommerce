import { Modules } from "@medusajs/framework/utils"
import { GET as listRules, POST as createRule } from "../route"
import {
  DELETE as deleteRule,
  GET as getRule,
  PATCH as updateRule,
} from "../[id]/route"
import {
  AdminCreateFreeShippingRule,
  AdminGetFreeShippingRulesParams,
  AdminUpdateFreeShippingRule,
} from "../validators"

describe("Admin Free Shipping Rules API", () => {
  describe("Validators", () => {
    it("validates list query parameters", () => {
      const parsed = AdminGetFreeShippingRulesParams.parse({
        q: "norouz",
        scope: "categories",
        is_active: "true",
        limit: "10",
        offset: "0",
      })
      expect(parsed).toMatchObject({
        q: "norouz",
        scope: "categories",
        is_active: true,
        limit: 10,
        offset: 0,
      })
    })

    it("validates create and update payloads", () => {
      const created = AdminCreateFreeShippingRule.parse({
        title: "Free Shipping Over 2M",
        scope: "store",
        min_purchase_amount: 20000000,
        is_active: true,
      })
      expect(created.scope).toBe("store")
      expect(created.min_purchase_amount).toBe(20000000)

      const updated = AdminUpdateFreeShippingRule.parse({
        scope: "products",
        product_ids: ["prod_1", "prod_2"],
        is_active: false,
      })
      expect(updated.product_ids).toEqual(["prod_1", "prod_2"])

      expect(() =>
        AdminCreateFreeShippingRule.parse({
          title: "Invalid",
          scope: "invalid_scope",
        })
      ).toThrow()
    })
  })

  describe("Route handlers", () => {
    const makeRes = () => {
      const json = jest.fn()
      const status = jest.fn().mockReturnValue({ json })
      return { res: { json, status } as any, json, status }
    }

    it("lists and creates free shipping rules", async () => {
      const mockRule = {
        id: "fsr_1",
        title: "Storewide Free Shipping",
        scope: "store",
        min_purchase_amount: 10000000,
        is_active: true,
      }
      const mockPromotionService = {
        listAndCountFreeShippingRules: jest
          .fn()
          .mockResolvedValue([[mockRule], 1]),
        createFreeShippingRules: jest.fn().mockResolvedValue(mockRule),
      }

      const listReq: any = {
        validatedQuery: { scope: "store", is_active: true, limit: 20, offset: 0 },
        scope: { resolve: jest.fn(() => mockPromotionService) },
      }
      const { res: listRes, json: listJson } = makeRes()
      await listRules(listReq, listRes)

      expect(
        mockPromotionService.listAndCountFreeShippingRules
      ).toHaveBeenCalledWith(
        { scope: "store", is_active: true },
        { skip: 0, take: 20, order: { created_at: "DESC" } }
      )
      expect(listJson).toHaveBeenCalledWith({
        free_shipping_rules: [mockRule],
        count: 1,
        offset: 0,
        limit: 20,
      })

      const createReq: any = {
        validatedBody: {
          title: "Storewide Free Shipping",
          scope: "store",
          min_purchase_amount: 10000000,
          is_active: true,
        },
        scope: { resolve: jest.fn(() => mockPromotionService) },
      }
      const { res: createRes, status: createStatus, json: createJson } =
        makeRes()
      await createRule(createReq, createRes)

      expect(createStatus).toHaveBeenCalledWith(201)
      expect(createJson).toHaveBeenCalledWith({ free_shipping_rule: mockRule })
    })

    it("retrieves, updates, and deletes a free shipping rule", async () => {
      const mockRule = {
        id: "fsr_1",
        title: "Category Free Shipping",
        scope: "categories",
        category_ids: ["pcat_1"],
        is_active: true,
      }
      const mockPromotionService = {
        retrieveFreeShippingRule: jest.fn().mockResolvedValue(mockRule),
        updateFreeShippingRules: jest.fn().mockResolvedValue({
          ...mockRule,
          is_active: false,
        }),
        deleteFreeShippingRules: jest.fn().mockResolvedValue(undefined),
      }

      const resolve = jest.fn((key: string) => {
        if (key === Modules.PROMOTION) return mockPromotionService
        throw new Error(`Unexpected module ${key}`)
      })

      const { res: getRes, json: getJson } = makeRes()
      await getRule({ params: { id: "fsr_1" }, scope: { resolve } } as any, getRes)
      expect(getJson).toHaveBeenCalledWith({ free_shipping_rule: mockRule })

      const { res: patchRes, json: patchJson } = makeRes()
      await updateRule(
        {
          params: { id: "fsr_1" },
          validatedBody: { is_active: false },
          scope: { resolve },
        } as any,
        patchRes
      )
      expect(patchJson).toHaveBeenCalledWith({
        free_shipping_rule: { ...mockRule, is_active: false },
      })

      const { res: delRes, json: delJson } = makeRes()
      await deleteRule(
        { params: { id: "fsr_1" }, scope: { resolve } } as any,
        delRes
      )
      expect(delJson).toHaveBeenCalledWith({
        id: "fsr_1",
        object: "free_shipping_rule",
        deleted: true,
      })
    })
  })
})
