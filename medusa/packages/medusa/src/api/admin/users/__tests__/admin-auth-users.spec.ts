import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { POST as adminLogin } from "../../auth/login/route"
import { POST as adminLogout } from "../../auth/logout/route"
import { GET as listUsers, POST as createUser } from "../route"
import { GET as getMe } from "../me/route"
import { DELETE as deleteUser } from "../[id]/route"
import { enforceAdminRbac, formatAdminUser } from "../rbac"
import {
  AdminCreateUser,
  AdminGetUsersParams,
  AdminUpdateUser,
} from "../validators"

describe("Admin Auth, RBAC & User Management (HAD-19)", () => {
  const makeRes = () => {
    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })
    const clearCookie = jest.fn()
    return { res: { json, status, clearCookie } as any, json, status, clearCookie }
  }

  describe("Validators & formatting", () => {
    it("validates user list filters and create/update payloads", () => {
      const listParams = AdminGetUsersParams.parse({
        q: "ali",
        role: "orders",
        is_active: "true",
        limit: "20",
        offset: "0",
      })
      expect(listParams).toMatchObject({
        q: "ali",
        role: "orders",
        is_active: true,
      })

      const created = AdminCreateUser.parse({
        email: "operator@depix.ir",
        name: "Ali Rezaei",
        username: "ali_ops",
        phone: "09120000000",
        password: "Password123!",
        role: "orders",
        is_active: true,
      })
      expect(created.role).toBe("orders")

      const updated = AdminUpdateUser.parse({
        role: "inventory",
        is_active: false,
      })
      expect(updated.role).toBe("inventory")
      expect(updated.is_active).toBe(false)
    })

    it("formats admin user with role and permissions", () => {
      const formatted = formatAdminUser({
        id: "usr_1",
        email: "support@depix.ir",
        first_name: "Sara",
        last_name: "Ahmadi",
        metadata: {
          role: "support",
          phone: "09121111111",
          is_active: true,
        },
      })

      expect(formatted).toMatchObject({
        id: "usr_1",
        name: "Sara Ahmadi",
        username: "support@depix.ir",
        phone: "09121111111",
        role: "support",
        is_active: true,
      })
      expect(formatted.permissions).toContain("tickets:*")
    })
  })

  describe("RBAC enforcement middleware", () => {
    it("returns 403 when user lacks permission for the admin resource", async () => {
      const next = jest.fn()
      const { res, status, json } = makeRes()
      const userService = {
        retrieveUser: jest.fn().mockResolvedValue({
          id: "usr_support",
          email: "support@depix.ir",
          metadata: { role: "support", is_active: true },
        }),
      }

      await enforceAdminRbac(
        {
          path: "/admin/users",
          method: "POST",
          auth_context: { actor_id: "usr_support", actor_type: "user" },
          scope: { resolve: jest.fn(() => userService) },
        } as any,
        res,
        next
      )

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ type: "forbidden" })
      )
      expect(next).not.toHaveBeenCalled()
    })

    it("returns 403 when admin user is deactivated", async () => {
      const next = jest.fn()
      const { res, status } = makeRes()
      const userService = {
        retrieveUser: jest.fn().mockResolvedValue({
          id: "usr_inactive",
          email: "inactive@depix.ir",
          metadata: { role: "super_admin", is_active: false },
        }),
      }

      await enforceAdminRbac(
        {
          path: "/admin/orders",
          method: "GET",
          auth_context: { actor_id: "usr_inactive", actor_type: "user" },
          scope: { resolve: jest.fn(() => userService) },
        } as any,
        res,
        next
      )

      expect(status).toHaveBeenCalledWith(403)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe("Auth & User handlers", () => {
    it("logs out and returns success: true", async () => {
      const { res, status, json } = makeRes()
      await adminLogout(
        {
          scope: {
            resolve: jest.fn(() => ({ projectConfig: {} })),
          },
        } as any,
        res
      )
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({ success: true })
    })

    it("rejects login for deactivated admin user with 403", async () => {
      const { res, status, json } = makeRes()
      const userService = {
        listUsers: jest.fn().mockResolvedValue([
          {
            id: "usr_1",
            email: "admin@depix.ir",
            metadata: { role: "admin", is_active: false },
          },
        ]),
      }
      const authService = {
        authenticate: jest.fn().mockResolvedValue({
          success: true,
          authIdentity: { id: "auth_1", app_metadata: { user_id: "usr_1" } },
        }),
      }

      await adminLogin(
        {
          validatedBody: { email: "admin@depix.ir", password: "secret" },
          scope: {
            resolve: jest.fn((key: string) => {
              if (key === Modules.USER) return userService
              if (key === Modules.AUTH) return authService
              throw new Error(`Unexpected ${key}`)
            }),
          },
        } as any,
        res
      )

      expect(status).toHaveBeenCalledWith(403)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ type: "forbidden" })
      )
    })

    it("filters users by role and is_active in GET /admin/users", async () => {
      const users = [
        { id: "u1", email: "a@depix.ir", metadata: { role: "orders", is_active: true } },
        { id: "u2", email: "b@depix.ir", metadata: { role: "support", is_active: false } },
      ]
      const remoteQuery = jest.fn().mockResolvedValue({ rows: users })
      const { res, status, json } = makeRes()

      await listUsers(
        {
          filterableFields: { role: "orders", is_active: true },
          queryConfig: { fields: ["id", "email", "metadata"], pagination: { skip: 0, take: 10 } },
          scope: {
            resolve: jest.fn((key: string) => {
              if (key === ContainerRegistrationKeys.REMOTE_QUERY) return remoteQuery
              throw new Error(`Unexpected ${key}`)
            }),
          },
        } as any,
        res
      )

      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          users: [expect.objectContaining({ id: "u1", role: "orders" })],
        })
      )
    })

    it("returns 401 on GET /admin/users/me when unauthenticated", async () => {
      const { res, status } = makeRes()
      await getMe(
        {
          auth_context: {},
          queryConfig: { fields: ["id"] },
          scope: { resolve: jest.fn() },
        } as any,
        res
      )
      expect(status).toHaveBeenCalledWith(401)
    })

    it("creates admin user with credentials in POST /admin/users", async () => {
      const createdUser = {
        id: "usr_new",
        email: "new@depix.ir",
        first_name: "New",
        last_name: "Admin",
        metadata: { name: "New Admin", role: "orders", is_active: true },
      }
      const userService = {
        listUsers: jest.fn().mockResolvedValue([]),
        createUsers: jest.fn().mockResolvedValue(createdUser),
      }
      const authService = {
        register: jest.fn().mockResolvedValue({
          success: true,
          authIdentity: { id: "auth_new", app_metadata: {} },
        }),
        updateAuthIdentities: jest.fn().mockResolvedValue({}),
      }
      const { res, status, json } = makeRes()

      await createUser(
        {
          validatedBody: {
            email: "new@depix.ir",
            name: "New Admin",
            password: "Password123!",
            role: "orders",
            is_active: true,
          },
          scope: {
            resolve: jest.fn((key: string) => {
              if (key === Modules.USER) return userService
              if (key === Modules.AUTH) return authService
              throw new Error(`Unexpected ${key}`)
            }),
          },
        } as any,
        res
      )

      expect(status).toHaveBeenCalledWith(201)
      expect(json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: "usr_new",
          role: "orders",
          is_active: true,
        }),
      })
    })
  })
})
