import { Modules } from "@medusajs/framework/utils"
import { GET as listStoreBanners } from "../../../store/banners/route"
import { GET as listAdminBanners, POST as createAdminBanner } from "../route"
import {
  DELETE as deleteAdminBanner,
  PATCH as updateAdminBanner,
} from "../[id]/route"
import { POST as reorderAdminBanners } from "../reorder/route"
import {
  AdminCreateBanner,
  AdminUpdateBanner,
  isValidBannerLinkUrl,
} from "../validators"

describe("Banner Module & Storefront / Admin APIs", () => {
  describe("Validators", () => {
    it("validates link_url against XSS / protocol-relative URLs", () => {
      expect(isValidBannerLinkUrl("/products/shoe-1")).toBe(true)
      expect(isValidBannerLinkUrl("https://depix.ir/sale")).toBe(true)
      expect(isValidBannerLinkUrl("http://localhost:3000/test")).toBe(true)
      expect(isValidBannerLinkUrl("")).toBe(true)

      expect(isValidBannerLinkUrl("javascript:alert(1)")).toBe(false)
      expect(isValidBannerLinkUrl("data:text/html,<script>alert(1)</script>")).toBe(false)
      expect(isValidBannerLinkUrl("//evil.com/phish")).toBe(false)
      expect(isValidBannerLinkUrl("ftp://example.com")).toBe(false)
    })

    it("enforces placement enum and required image_url in AdminCreateBanner", () => {
      expect(
        AdminCreateBanner.safeParse({
          placement: "hero_main",
          image_url: "/media/hero1.jpg",
          link_url: "/collections/summer",
        }).success
      ).toBe(true)

      expect(
        AdminCreateBanner.safeParse({
          placement: "invalid_slot",
          image_url: "/media/hero1.jpg",
        }).success
      ).toBe(false)

      expect(
        AdminCreateBanner.safeParse({
          placement: "hero_secondary",
          image_url: "   ",
        }).success
      ).toBe(false)

      expect(
        AdminUpdateBanner.safeParse({
          link_url: "javascript:void(0)",
        }).success
      ).toBe(false)
    })
  })

  describe("Storefront GET /store/banners", () => {
    it("returns all active banners sorted by sort_order ASC, created_at ASC when placement is omitted", async () => {
      const mockBannerService = {
        listBanners: jest.fn().mockResolvedValue([
          { id: "bnr_1", placement: "hero_main", is_active: true, sort_order: 0 },
          { id: "bnr_2", placement: "hero_secondary", is_active: true, sort_order: 1 },
        ]),
      }

      const req: any = {
        query: {},
        scope: {
          resolve: jest.fn((key) =>
            key === Modules.BANNER ? mockBannerService : null
          ),
        },
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await listStoreBanners(req, res)

      expect(mockBannerService.listBanners).toHaveBeenCalledWith(
        { is_active: true },
        { order: { sort_order: "ASC", created_at: "ASC" } }
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        banners: expect.arrayContaining([
          expect.objectContaining({ id: "bnr_1" }),
          expect.objectContaining({ id: "bnr_2" }),
        ]),
      })
    })

    it("filters by placement when ?placement=hero_main is provided", async () => {
      const mockBannerService = {
        listBanners: jest.fn().mockResolvedValue([]),
      }
      const req: any = {
        query: { placement: "hero_main" },
        scope: {
          resolve: jest.fn((key) =>
            key === Modules.BANNER ? mockBannerService : null
          ),
        },
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await listStoreBanners(req, res)

      expect(mockBannerService.listBanners).toHaveBeenCalledWith(
        { is_active: true, placement: "hero_main" },
        { order: { sort_order: "ASC", created_at: "ASC" } }
      )
    })
  })

  describe("Admin Banner CRUD & Reorder", () => {
    it("lists, creates, updates, reorders, and deletes banners", async () => {
      const mockBannerService = {
        listBanners: jest.fn().mockResolvedValue([{ id: "bnr_1" }]),
        createBanners: jest.fn().mockResolvedValue({
          id: "bnr_1",
          title: "اسلاید اول",
          placement: "hero_main",
          image_url: "/uploads/hero.jpg",
          link_url: "/products",
          sort_order: 0,
          is_active: true,
        }),
        retrieveBanner: jest.fn().mockResolvedValue({ id: "bnr_1" }),
        updateBanners: jest.fn().mockImplementation(async (input) =>
          Array.isArray(input) ? input : { id: "bnr_1", ...input }
        ),
        deleteBanners: jest.fn().mockResolvedValue(undefined),
      }

      const scope: any = {
        resolve: jest.fn((key) =>
          key === Modules.BANNER ? mockBannerService : null
        ),
      }

      const makeRes = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      })

      const listRes = makeRes()
      await listAdminBanners({ query: {}, scope } as any, listRes as any)
      expect(listRes.status).toHaveBeenCalledWith(200)

      const createRes = makeRes()
      await createAdminBanner(
        {
          validatedBody: {
            title: "اسلاید اول",
            placement: "hero_main",
            image_url: "/uploads/hero.jpg",
            link_url: "/products",
            sort_order: 0,
            is_active: true,
          },
          scope,
        } as any,
        createRes as any
      )
      expect(createRes.status).toHaveBeenCalledWith(201)

      const patchRes = makeRes()
      await updateAdminBanner(
        {
          params: { id: "bnr_1" },
          validatedBody: { is_active: false },
          scope,
        } as any,
        patchRes as any
      )
      expect(patchRes.status).toHaveBeenCalledWith(200)

      const reorderRes = makeRes()
      await reorderAdminBanners(
        {
          validatedBody: [
            { id: "bnr_1", sort_order: 2 },
            { id: "bnr_2", sort_order: 1 },
          ],
          scope,
        } as any,
        reorderRes as any
      )
      expect(mockBannerService.updateBanners).toHaveBeenLastCalledWith([
        { id: "bnr_1", sort_order: 2 },
        { id: "bnr_2", sort_order: 1 },
      ])
      expect(reorderRes.status).toHaveBeenCalledWith(200)

      const delRes = makeRes()
      await deleteAdminBanner(
        { params: { id: "bnr_1" }, scope } as any,
        delRes as any
      )
      expect(delRes.json).toHaveBeenCalledWith({
        id: "bnr_1",
        object: "banner",
        deleted: true,
      })
    })
  })
})
