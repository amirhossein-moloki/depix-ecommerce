import { PromotionStatus } from "@medusajs/framework/utils"
import PromotionModuleService, {
  isPromotionActiveForApplication,
} from "../promotion-module"

describe("PromotionModuleService active status and schedule enforcement", () => {
  it("evaluates status, soft-delete, schedule windows, and campaign activity in isPromotionActiveForApplication", () => {
    const now = Date.now()
    expect(
      isPromotionActiveForApplication({ status: PromotionStatus.ACTIVE }, now)
    ).toBe(true)
    expect(
      isPromotionActiveForApplication({ status: PromotionStatus.INACTIVE }, now)
    ).toBe(false)
    expect(
      isPromotionActiveForApplication({ status: PromotionStatus.DRAFT }, now)
    ).toBe(false)
    expect(
      isPromotionActiveForApplication(
        { status: PromotionStatus.ACTIVE, deleted_at: new Date() },
        now
      )
    ).toBe(false)
    expect(
      isPromotionActiveForApplication(
        {
          status: PromotionStatus.ACTIVE,
          metadata: { ends_at: new Date(now - 1000).toISOString() },
        },
        now
      )
    ).toBe(false)
    expect(
      isPromotionActiveForApplication(
        {
          status: PromotionStatus.ACTIVE,
          metadata: { starts_at: new Date(now + 10_000).toISOString() },
        },
        now
      )
    ).toBe(false)
    expect(
      isPromotionActiveForApplication(
        {
          status: PromotionStatus.ACTIVE,
          campaign: { metadata: { is_active: false } },
        },
        now
      )
    ).toBe(false)
  })

  it("filters out inactive, draft, deleted, expired, and inactive-campaign rows in listActivePromotions", async () => {
    const now = Date.now()
    const listMock = jest.fn().mockResolvedValue([
      { id: "p_active", code: "OK", status: PromotionStatus.ACTIVE },
      { id: "p_inactive", code: "OFF", status: PromotionStatus.INACTIVE },
      { id: "p_draft", code: "DR", status: PromotionStatus.DRAFT },
      {
        id: "p_deleted",
        code: "DEL",
        status: PromotionStatus.ACTIVE,
        deleted_at: new Date(),
      },
      {
        id: "p_expired",
        code: "EXP",
        status: PromotionStatus.ACTIVE,
        metadata: { ends_at: new Date(now - 5000).toISOString() },
      },
      {
        id: "p_camp_off",
        code: "COFF",
        status: PromotionStatus.ACTIVE,
        campaign: { metadata: { is_active: false } },
      },
    ])

    const service = new PromotionModuleService(
      {
        baseRepository: {
          serialize: jest.fn(async (data: any) => data),
          getFreshManager: jest.fn(() => ({})),
          transaction: jest.fn(async (cb: any) => cb({})),
        } as any,
        promotionService: { list: listMock } as any,
        applicationMethodService: {} as any,
        promotionRuleService: {} as any,
        promotionRuleValueService: {} as any,
        campaignService: {} as any,
        campaignBudgetService: {} as any,
        campaignBudgetUsageService: {} as any,
      },
      {} as any
    )

    const activePromos = await service.listActivePromotions(
      {},
      {},
      { transactionManager: {} } as any
    )

    expect(listMock).toHaveBeenCalled()
    expect(activePromos.map((p) => p.id)).toEqual(["p_active"])
  })
})
