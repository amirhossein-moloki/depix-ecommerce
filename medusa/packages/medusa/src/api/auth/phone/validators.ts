import { z } from "@medusajs/framework/zod"

export const SendOtpRequest = z.object({
  phone: z.string().min(1, "Phone number is required"),
})
export type SendOtpRequestType = z.infer<typeof SendOtpRequest>

export const VerifyOtpRequest = z.object({
  phone: z.string().min(1, "Phone number is required"),
  code: z.string().min(1, "OTP code is required"),
})
export type VerifyOtpRequestType = z.infer<typeof VerifyOtpRequest>
