import { GET as getProductJsonLd } from "../[id]/json-ld/route"
import {
  generateProductJsonLd,
  serializeJsonLd,
} from "../../../../utils/json-ld/product-json-ld"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

describe("Product JSON-LD / Structured Data", () => {
  describe("generateProductJsonLd Serialization Utility", () => {
    it("should generate valid Schema.org Product schema with basic product identity", () => {
      const mockProduct = {
        id: "prod_123",
        title: "Test Leather Jacket",
        handle: "test-leather-jacket",
        description: "A high quality leather jacket.",
        thumbnail: "https://cdn.example.com/jacket-thumb.jpg",
        images: [
          { url: "https://cdn.example.com/jacket-1.jpg" },
          { url: "https://cdn.example.com/jacket-2.jpg" },
        ],
        variants: [
          {
            id: "var_1",
            sku: "SKU-JACKET-L",
            calculated_price: {
              calculated_amount: 1500000,
              currency_code: "IRR",
            },
            manage_inventory: true,
            inventory_quantity: 10,
          },
        ],
        categories: [
          { name: "Apparel", is_internal: false },
        ],
        metadata: {
          brand: "Depix Atelier",
          gtin: "1234567890123",
          mpn: "MPN-1234",
        },
      }

      const jsonLd = generateProductJsonLd(mockProduct, {
        baseUrl: "https://depix.store",
      })

      expect(jsonLd["@context"]).toBe("https://schema.org")
      expect(jsonLd["@type"]).toBe("Product")
      expect(jsonLd["@id"]).toBe("https://depix.store/products/test-leather-jacket#product")
      expect(jsonLd.name).toBe("Test Leather Jacket")
      expect(jsonLd.description).toBe("A high quality leather jacket.")
      expect(jsonLd.url).toBe("https://depix.store/products/test-leather-jacket")
      expect(jsonLd.sku).toBe("SKU-JACKET-L")
      expect(jsonLd.gtin).toBe("1234567890123")
      expect(jsonLd.mpn).toBe("MPN-1234")
      expect(jsonLd.brand).toEqual({
        "@type": "Brand",
        name: "Depix Atelier",
      })
      expect(jsonLd.category).toBe("Apparel")
      expect(jsonLd.image).toEqual([
        "https://cdn.example.com/jacket-thumb.jpg",
        "https://cdn.example.com/jacket-1.jpg",
        "https://cdn.example.com/jacket-2.jpg",
      ])
      expect(jsonLd.offers).toEqual({
        "@type": "Offer",
        sku: "SKU-JACKET-L",
        price: 1500000,
        priceCurrency: "IRR",
        availability: "https://schema.org/InStock",
        url: "https://depix.store/products/test-leather-jacket?variant=var_1",
        itemCondition: "https://schema.org/NewCondition",
      })
    })

    it("should handle multi-variant offers and out-of-stock availability correctly", () => {
      const mockProduct = {
        id: "prod_456",
        title: "Sneakers",
        handle: "sneakers",
        variants: [
          {
            id: "var_red",
            sku: "SKU-SNK-RED",
            calculated_price: { calculated_amount: 500000, currency_code: "IRR" },
            manage_inventory: true,
            inventory_quantity: 0,
            allow_backorder: false,
          },
          {
            id: "var_blue",
            sku: "SKU-SNK-BLUE",
            calculated_price: { calculated_amount: 550000, currency_code: "IRR" },
            manage_inventory: true,
            inventory_quantity: 5,
          },
        ],
      }

      const jsonLd = generateProductJsonLd(mockProduct, { baseUrl: "https://depix.store" })

      expect(Array.isArray(jsonLd.offers)).toBe(true)
      expect(jsonLd.offers.length).toBe(2)
      expect(jsonLd.offers[0]).toEqual({
        "@type": "Offer",
        sku: "SKU-SNK-RED",
        price: 500000,
        priceCurrency: "IRR",
        availability: "https://schema.org/OutOfStock",
        url: "https://depix.store/products/sneakers?variant=var_red",
        itemCondition: "https://schema.org/NewCondition",
      })
      expect(jsonLd.offers[1]).toEqual({
        "@type": "Offer",
        sku: "SKU-SNK-BLUE",
        price: 550000,
        priceCurrency: "IRR",
        availability: "https://schema.org/InStock",
        url: "https://depix.store/products/sneakers?variant=var_blue",
        itemCondition: "https://schema.org/NewCondition",
      })
    })

    it("should map approved rating summary and reviews without exposing customer emails", () => {
      const mockProduct = {
        id: "prod_789",
        title: "Smart Watch",
        handle: "smart-watch",
      }

      const jsonLd = generateProductJsonLd(mockProduct, {
        baseUrl: "https://depix.store",
        ratingSummary: {
          average_rating: 4.8,
          review_count: 12,
        },
        reviews: [
          {
            id: "rev_1",
            rating: 5,
            title: "Superb battery life",
            content: "Lasts 3 full days on a single charge.",
            created_at: "2025-01-10T10:00:00Z",
            customer_name: "Ali Reza",
          },
          {
            id: "rev_2",
            rating: 4,
            title: "Good value",
            content: "Worth every single rial.",
            created_at: "2025-01-12T12:00:00Z",
            customer: {
              first_name: "Sara",
              last_name: "Ahmadi",
            },
          },
        ],
      })

      expect(jsonLd.aggregateRating).toEqual({
        "@type": "AggregateRating",
        ratingValue: 4.8,
        reviewCount: 12,
        bestRating: 5,
        worstRating: 1,
      })

      expect(jsonLd.review).toHaveLength(2)
      expect(jsonLd.review[0]).toEqual({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: 5,
          bestRating: 5,
          worstRating: 1,
        },
        author: {
          "@type": "Person",
          name: "Ali Reza",
        },
        datePublished: new Date("2025-01-10T10:00:00Z").toISOString(),
        name: "Superb battery life",
        reviewBody: "Lasts 3 full days on a single charge.",
      })
      expect(jsonLd.review[1].author).toEqual({
        "@type": "Person",
        name: "Sara Ahmadi",
      })
    })

    it("should omit optional missing fields cleanly without invalid properties", () => {
      const minimalProduct = {
        id: "prod_min",
        title: "Minimal Product",
        handle: "minimal-product",
      }

      const jsonLd = generateProductJsonLd(minimalProduct, {
        baseUrl: "https://depix.store",
      })

      expect(jsonLd["@context"]).toBe("https://schema.org")
      expect(jsonLd["@type"]).toBe("Product")
      expect(jsonLd.name).toBe("Minimal Product")
      expect(jsonLd.description).toBeUndefined()
      expect(jsonLd.brand).toBeUndefined()
      expect(jsonLd.gtin).toBeUndefined()
      expect(jsonLd.mpn).toBeUndefined()
      expect(jsonLd.category).toBeUndefined()
      expect(jsonLd.aggregateRating).toBeUndefined()
      expect(jsonLd.review).toBeUndefined()
    })
  })

  describe("serializeJsonLd Safety & XSS Prevention", () => {
    it("should safely escape script tags and HTML characters", () => {
      const unsafeObject = {
        name: '</script><script>alert("xss")</script>',
        description: "This contains <&> characters.",
      }

      const serialized = serializeJsonLd(unsafeObject)

      expect(serialized).not.toContain("<script>")
      expect(serialized).not.toContain("</script>")
      expect(serialized).toContain("\\u003c/script\\u003e\\u003cscript\\u003e")
      expect(serialized).toContain("\\u0026")
    })
  })

  describe("Store GET Product JSON-LD Route Handler", () => {
    it("should return product JSON-LD object with 200 status", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({
          data: [
            {
              id: "prod_api_1",
              title: "API Product",
              handle: "api-product",
              variants: [
                {
                  id: "var_api_1",
                  sku: "SKU-API",
                  calculated_price: { calculated_amount: 1000, currency_code: "USD" },
                },
              ],
            },
          ],
        }),
      }

      const mockReviewService = {
        listProductReviews: jest.fn().mockResolvedValue([
          { rating: 5, content: "Top tier", status: "APPROVED", customer_name: "Jane" },
        ]),
      }

      const req: any = {
        params: { id: "prod_api_1" },
        query: {},
        protocol: "https",
        get: jest.fn().mockReturnValue("depix.store"),
        scope: {
          resolve: jest.fn((key) => {
            if (key === ContainerRegistrationKeys.QUERY) return mockQuery
            if (key === Modules.REVIEW) return mockReviewService
            return null
          }),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getProductJsonLd(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        json_ld: expect.objectContaining({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "API Product",
          url: "https://depix.store/products/api-product",
          aggregateRating: expect.objectContaining({
            ratingValue: 5,
            reviewCount: 1,
          }),
        }),
      })
    })

    it("should throw 404 MedusaError if product does not exist", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: [] }),
      }

      const req: any = {
        params: { id: "prod_non_existent" },
        query: {},
        scope: {
          resolve: jest.fn().mockReturnValue(mockQuery),
        },
      }

      const res: any = {}

      await expect(getProductJsonLd(req, res)).rejects.toThrow(
        "Product with id: prod_non_existent was not found"
      )
    })

    it("should handle format=raw with application/ld+json content type", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({
          data: [
            {
              id: "prod_raw",
              title: "Raw Format Product",
              handle: "raw-product",
            },
          ],
        }),
      }

      const req: any = {
        params: { id: "prod_raw" },
        query: { format: "raw" },
        protocol: "https",
        get: jest.fn().mockReturnValue("depix.store"),
        scope: {
          resolve: jest.fn((key) => {
            if (key === ContainerRegistrationKeys.QUERY) return mockQuery
            return null
          }),
        },
      }

      const setHeaderMock = jest.fn()
      const sendMock = jest.fn()
      const res: any = {
        setHeader: setHeaderMock,
        send: sendMock,
      }

      await getProductJsonLd(req, res)

      expect(setHeaderMock).toHaveBeenCalledWith("Content-Type", "application/ld+json")
      expect(sendMock).toHaveBeenCalledWith(expect.stringContaining('"@type": "Product"'))
    })
  })
})
