import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = false

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const config = req.scope.resolve<any>(
      ContainerRegistrationKeys.CONFIG_MODULE
    )
    const { sessionOptions, cookieOptions } = config?.projectConfig ?? {}
    const cookieName = sessionOptions?.name ?? "connect.sid"

    if (req.session) {
      await new Promise<void>((resolve) => {
        req.session.destroy(() => resolve())
      })
    }

    res.clearCookie(cookieName, cookieOptions)
  } catch {
    // Stateless JWT logout succeeds even without session store
  }

  res.status(200).json({ success: true })
}
