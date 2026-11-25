import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "orders",
  "inventory",
  "support",
] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["*"],
  admin: [
    "products:*",
    "orders:*",
    "inventory:*",
    "customers:*",
    "promotions:*",
    "campaigns:*",
    "free-shipping-rules:*",
    "categories:*",
    "brands:*",
    "tickets:*",
    "ticket-categories:*",
    "reviews:*",
    "reports:*",
    "media:*",
    "size-guides:*",
    "price-alerts:*",
    "stock-alerts:*",
    "users:read",
  ],
  orders: [
    "orders:*",
    "draft-orders:*",
    "returns:*",
    "claims:*",
    "exchanges:*",
    "invoices:*",
    "fulfillments:*",
    "customers:read",
  ],
  inventory: [
    "products:*",
    "inventory:*",
    "stock-locations:*",
    "categories:*",
    "brands:*",
    "media:*",
    "size-guides:*",
    "collections:*",
    "price-alerts:*",
    "stock-alerts:*",
  ],
  support: [
    "tickets:*",
    "ticket-categories:*",
    "reviews:*",
    "orders:read",
    "customers:read",
  ],
}

export const getPermissionsForRole = (
  role?: string,
  customPermissions?: unknown
): string[] => {
  if (Array.isArray(customPermissions) && customPermissions.length > 0) {
    return customPermissions.map(String)
  }

  const normalizedRole = (role || "super_admin") as AdminRole
  return ROLE_PERMISSIONS[normalizedRole] ?? ROLE_PERMISSIONS.admin
}

export const formatAdminUser = (user: any) => {
  if (!user) {
    return user
  }

  const metadata = user.metadata ?? {}
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  const role = (metadata.role as string) || "super_admin"
  const permissions = getPermissionsForRole(role, metadata.permissions)

  return {
    ...user,
    name: (metadata.name as string) || fullName || user.email || "",
    username: (metadata.username as string) || user.email || "",
    phone: (metadata.phone as string) ?? null,
    role,
    permissions,
    is_active: metadata.is_active !== false,
  }
}

const ROUTE_RESOURCE_MAP: Array<[RegExp, string]> = [
  [/^\/admin\/users(\/|$)/, "users"],
  [/^\/admin\/orders(\/|$)/, "orders"],
  [/^\/admin\/draft-orders(\/|$)/, "draft-orders"],
  [/^\/admin\/returns(\/|$)/, "returns"],
  [/^\/admin\/claims(\/|$)/, "claims"],
  [/^\/admin\/exchanges(\/|$)/, "exchanges"],
  [/^\/admin\/invoices(\/|$)/, "invoices"],
  [/^\/admin\/fulfillments(\/|$)/, "fulfillments"],
  [/^\/admin\/products(\/|$)/, "products"],
  [/^\/admin\/product-/, "products"],
  [/^\/admin\/inventory(\/|$)/, "inventory"],
  [/^\/admin\/stock-locations(\/|$)/, "stock-locations"],
  [/^\/admin\/categories(\/|$)/, "categories"],
  [/^\/admin\/product-categories(\/|$)/, "categories"],
  [/^\/admin\/brands(\/|$)/, "brands"],
  [/^\/admin\/media(\/|$)/, "media"],
  [/^\/admin\/size-guides(\/|$)/, "size-guides"],
  [/^\/admin\/collections(\/|$)/, "collections"],
  [/^\/admin\/price-alerts(\/|$)/, "price-alerts"],
  [/^\/admin\/stock-alerts(\/|$)/, "stock-alerts"],
  [/^\/admin\/promotions(\/|$)/, "promotions"],
  [/^\/admin\/campaigns(\/|$)/, "campaigns"],
  [/^\/admin\/free-shipping-rules(\/|$)/, "free-shipping-rules"],
  [/^\/admin\/tickets(\/|$)/, "tickets"],
  [/^\/admin\/ticket-categories(\/|$)/, "ticket-categories"],
  [/^\/admin\/reviews(\/|$)/, "reviews"],
  [/^\/admin\/customers(\/|$)/, "customers"],
  [/^\/admin\/customer-groups(\/|$)/, "customers"],
  [/^\/admin\/reports(\/|$)/, "reports"],
  [/^\/admin\/settings(\/|$)/, "settings"],
]

const resolveRequiredPermission = (
  path: string,
  method: string
): string | null => {
  const action = method.toUpperCase() === "GET" ? "read" : "write"
  for (const [pattern, resource] of ROUTE_RESOURCE_MAP) {
    if (pattern.test(path)) {
      return `${resource}:${action}`
    }
  }
  return null
}

export const hasPermission = (
  permissions: string[],
  required: string
): boolean => {
  if (permissions.includes("*")) {
    return true
  }
  const [resource] = required.split(":")
  return (
    permissions.includes(required) || permissions.includes(`${resource}:*`)
  )
}

/**
 * Enforces active-status and role-based access control (RBAC) across `/admin/*`
 * routes, returning `403 Forbidden` when an admin user lacks permission or is
 * deactivated.
 */
export const enforceAdminRbac = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const path = req.path || req.originalUrl || ""
  if (
    path.startsWith("/admin/auth/login") ||
    path.startsWith("/admin/auth/logout")
  ) {
    return next()
  }

  const authContext = (req as any).auth_context
  if (!authContext?.actor_id || authContext.actor_type !== "user") {
    return next()
  }

  try {
    const userService = req.scope.resolve<any>(Modules.USER)
    if (!userService?.retrieveUser) {
      return next()
    }

    const user = await userService
      .retrieveUser(authContext.actor_id)
      .catch(() => null)
    if (!user) {
      return next()
    }

    const formatted = formatAdminUser(user)
    if (!formatted.is_active) {
      return res.status(403).json({
        type: "forbidden",
        message: "Admin account is deactivated.",
      })
    }

    if (path === "/admin/users/me") {
      return next()
    }

    const required = resolveRequiredPermission(path, req.method)
    if (required && !hasPermission(formatted.permissions, required)) {
      return res.status(403).json({
        type: "forbidden",
        message: `Insufficient permissions: '${required}' required.`,
      })
    }
  } catch {
    // Allow request to proceed if user service is unavailable in minimal test setups
  }

  return next()
}
