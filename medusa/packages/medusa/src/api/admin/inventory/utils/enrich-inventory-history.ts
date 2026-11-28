import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

function safeResolve<T = any>(scope: MedusaContainer, key: string): T | null {
  try {
    return scope?.resolve<T>(key) ?? null
  } catch {
    return null
  }
}

function extractRows(res: any): any[] {
  if (Array.isArray(res)) {
    return res
  }
  if (Array.isArray(res?.rows)) {
    return res.rows
  }
  return []
}

function formatAdminUserName(user: any): string | null {
  if (!user || typeof user !== "object") {
    return null
  }
  const metaName =
    typeof user.metadata?.name === "string" ? user.metadata.name.trim() : ""
  if (metaName) {
    return metaName
  }
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  if (fullName) {
    return fullName
  }
  if (typeof user.email === "string" && user.email.trim()) {
    return user.email.trim()
  }
  return null
}

function formatCustomerName(customer: any): string | null {
  if (!customer || typeof customer !== "object") {
    return null
  }
  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  if (fullName) {
    return fullName
  }
  const metaName =
    typeof customer.metadata?.name === "string"
      ? customer.metadata.name.trim()
      : ""
  if (metaName) {
    return metaName
  }
  if (typeof customer.phone === "string" && customer.phone.trim()) {
    return customer.phone.trim()
  }
  if (typeof customer.email === "string" && customer.email.trim()) {
    return customer.email.trim()
  }
  return null
}

/**
 * Enriches InventoryTransaction records in batch with `product_title`,
 * `variant_title`, `sku`, and `actor_name` without N+1 queries.
 */
export async function enrichInventoryHistory(
  scope: MedusaContainer,
  transactions: any[]
): Promise<any[]> {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return []
  }

  const remoteQuery = safeResolve<any>(
    scope,
    ContainerRegistrationKeys.REMOTE_QUERY
  )
  const userService = safeResolve<any>(scope, Modules.USER)
  const customerService = safeResolve<any>(scope, Modules.CUSTOMER)

  const variantMap = new Map<
    string,
    {
      title: string | null
      sku: string | null
      product_id: string | null
      product_title: string | null
    }
  >()
  const productTitleMap = new Map<string, string>()
  const inventoryItemMap = new Map<
    string,
    {
      sku: string | null
      title: string | null
      variant_title: string | null
      product_title: string | null
    }
  >()
  const actorNameMap = new Map<string, string>()

  const variantIds = Array.from(
    new Set(
      transactions
        .map((tx) => (typeof tx?.variant_id === "string" ? tx.variant_id.trim() : ""))
        .filter(Boolean)
    )
  )

  if (remoteQuery && variantIds.length > 0) {
    try {
      const variantQuery = remoteQueryObjectFromString({
        entryPoint: "product_variant",
        variables: { filters: { id: variantIds } },
        fields: ["id", "title", "sku", "product_id", "product.id", "product.title"],
      })
      const variants = extractRows(await remoteQuery(variantQuery))
      for (const variant of variants) {
        if (!variant?.id) continue
        const resolvedProductId = variant.product_id ?? variant.product?.id ?? null
        const resolvedProductTitle = variant.product?.title ?? null
        variantMap.set(variant.id, {
          title: variant.title ?? null,
          sku: variant.sku ?? null,
          product_id: resolvedProductId,
          product_title: resolvedProductTitle,
        })
        if (resolvedProductId && resolvedProductTitle) {
          productTitleMap.set(resolvedProductId, resolvedProductTitle)
        }
      }
    } catch {
      // Fall back to direct product / inventory item lookups
    }
  }

  const missingProductIds = Array.from(
    new Set(
      transactions
        .map((tx) => {
          const variant = tx?.variant_id ? variantMap.get(tx.variant_id) : undefined
          const productId = tx?.product_id || variant?.product_id || ""
          return typeof productId === "string" ? productId.trim() : ""
        })
        .filter((pid) => pid && !productTitleMap.has(pid))
    )
  )

  if (remoteQuery && missingProductIds.length > 0) {
    try {
      const productQuery = remoteQueryObjectFromString({
        entryPoint: "product",
        variables: { filters: { id: missingProductIds } },
        fields: ["id", "title"],
      })
      const products = extractRows(await remoteQuery(productQuery))
      for (const product of products) {
        if (product?.id && product?.title) {
          productTitleMap.set(product.id, product.title)
        }
      }
    } catch {
      // Ignore product lookup errors
    }
  }

  const missingInvItemIds = Array.from(
    new Set(
      transactions
        .filter((tx) => {
          const variant = tx?.variant_id ? variantMap.get(tx.variant_id) : undefined
          const resolvedProductId = tx?.product_id || variant?.product_id || ""
          const hasProductTitle = Boolean(
            tx?.product_title ||
              variant?.product_title ||
              (resolvedProductId && productTitleMap.get(resolvedProductId))
          )
          const hasVariantTitle = Boolean(tx?.variant_title || variant?.title)
          const hasSku = Boolean(tx?.sku || variant?.sku)
          return !hasProductTitle || !hasVariantTitle || !hasSku
        })
        .map((tx) =>
          typeof tx?.inventory_item_id === "string"
            ? tx.inventory_item_id.trim()
            : ""
        )
        .filter(Boolean)
    )
  )

  if (remoteQuery && missingInvItemIds.length > 0) {
    let invItems: any[] = []
    try {
      const invQuery = remoteQueryObjectFromString({
        entryPoint: "inventory_items",
        variables: { filters: { id: missingInvItemIds } },
        fields: [
          "id",
          "sku",
          "title",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.product.id",
          "variants.product.title",
        ],
      })
      invItems = extractRows(await remoteQuery(invQuery))
    } catch {
      try {
        const basicInvQuery = remoteQueryObjectFromString({
          entryPoint: "inventory_items",
          variables: { filters: { id: missingInvItemIds } },
          fields: ["id", "sku", "title"],
        })
        invItems = extractRows(await remoteQuery(basicInvQuery))
      } catch {
        invItems = []
      }
    }

    for (const item of invItems) {
      if (!item?.id) continue
      const firstVariant = Array.isArray(item.variants)
        ? item.variants[0]
        : undefined
      inventoryItemMap.set(item.id, {
        sku: item.sku ?? firstVariant?.sku ?? null,
        title: item.title ?? null,
        variant_title: firstVariant?.title ?? null,
        product_title: firstVariant?.product?.title ?? null,
      })
    }
  }

  const actorIds = Array.from(
    new Set(
      transactions
        .map((tx) =>
          typeof tx?.created_by === "string" ? tx.created_by.trim() : ""
        )
        .filter((actorId) => {
          if (!actorId) return false
          const lower = actorId.toLowerCase()
          return lower !== "system" && lower !== "admin"
        })
    )
  )

  if (actorIds.length > 0 && typeof userService?.listUsers === "function") {
    try {
      const users = extractRows(await userService.listUsers({ id: actorIds }))
      for (const user of users) {
        if (!user?.id) continue
        const name = formatAdminUserName(user)
        if (name) {
          actorNameMap.set(user.id, name)
        }
      }
    } catch {
      // Ignore user lookup failures
    }
  }

  const remainingActorIds = actorIds.filter((id) => !actorNameMap.has(id))
  if (
    remainingActorIds.length > 0 &&
    typeof customerService?.listCustomers === "function"
  ) {
    try {
      const customers = extractRows(
        await customerService.listCustomers({ id: remainingActorIds })
      )
      for (const customer of customers) {
        if (!customer?.id) continue
        const name = formatCustomerName(customer)
        if (name) {
          actorNameMap.set(customer.id, name)
        }
      }
    } catch {
      // Ignore customer lookup failures
    }
  }

  return transactions.map((tx) => {
    const variant = tx?.variant_id ? variantMap.get(tx.variant_id) : undefined
    const resolvedProductId = tx?.product_id || variant?.product_id || null
    const invItem = tx?.inventory_item_id
      ? inventoryItemMap.get(tx.inventory_item_id)
      : undefined
    const createdBy =
      typeof tx?.created_by === "string" ? tx.created_by.trim() : ""

    let actorName: string | null = null
    if (createdBy.toLowerCase() === "system") {
      actorName = "System"
    } else if (createdBy.toLowerCase() === "admin") {
      actorName = "Admin"
    } else if (!createdBy && tx?.reference_type === "system") {
      actorName = "System"
    } else if (createdBy && actorNameMap.has(createdBy)) {
      actorName = actorNameMap.get(createdBy) ?? null
    } else if (
      typeof tx?.metadata?.actor_name === "string" &&
      tx.metadata.actor_name.trim()
    ) {
      actorName = tx.metadata.actor_name.trim()
    }

    const productTitle =
      tx?.product_title ??
      variant?.product_title ??
      (resolvedProductId ? productTitleMap.get(resolvedProductId) : undefined) ??
      invItem?.product_title ??
      tx?.metadata?.product_title ??
      null

    const variantTitle =
      tx?.variant_title ??
      variant?.title ??
      invItem?.variant_title ??
      invItem?.title ??
      tx?.metadata?.variant_title ??
      null

    const sku =
      tx?.sku ??
      variant?.sku ??
      invItem?.sku ??
      tx?.metadata?.sku ??
      null

    return {
      ...tx,
      product_title: productTitle,
      variant_title: variantTitle,
      sku,
      actor_name: actorName,
    }
  })
}
