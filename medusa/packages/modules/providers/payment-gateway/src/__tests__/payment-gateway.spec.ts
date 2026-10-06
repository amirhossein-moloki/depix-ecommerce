import {
  GatewayNotFoundError,
  GatewayRegistry,
  IPaymentGatewayAdapter,
  UnsupportedCapabilityError,
} from "../core/contracts"
import PaymentGatewayProviderService from "../services/payment-gateway-provider"

describe("PaymentGateway Provider & Contracts Adapter", () => {
  beforeEach(() => {
    GatewayRegistry.getInstance().clear()
  })

  test("should register and retrieve gateways in GatewayRegistry", () => {
    const registry = GatewayRegistry.getInstance()
    const mockAdapter: IPaymentGatewayAdapter = {
      gatewayId: "zibal",
      supports: (cap) => cap === "CREATE_PAYMENT" || cap === "VERIFY",
      createPayment: jest.fn().mockResolvedValue({
        payment: { id: "pay_1001", amount: 500000, currency: "IRR", gateway: "zibal", status: "PENDING" },
        status: "PENDING",
        redirectUrl: "https://zibal.ir/start/12345",
      }),
      verifyPayment: jest.fn().mockResolvedValue({
        status: "SUCCESS",
        gatewayTransactionId: "123456",
      }),
      handleCallback: jest.fn().mockResolvedValue({
        isSuccess: true,
        gatewayTransactionId: "123456",
      }),
    }

    registry.register(mockAdapter)
    const activeGateway = registry.getActiveGateway("zibal", "CREATE_PAYMENT")
    expect(activeGateway.gatewayId).toBe("zibal")
  })

  test("should throw GatewayNotFoundError for unregistered gateways", () => {
    const registry = GatewayRegistry.getInstance()
    expect(() => registry.getGateway("unknown_gateway")).toThrow(GatewayNotFoundError)
  })

  test("should throw UnsupportedCapabilityError when capability is not supported", () => {
    const registry = GatewayRegistry.getInstance()
    const mockAdapter: IPaymentGatewayAdapter = {
      gatewayId: "zarinpal",
      supports: (cap) => cap === "CREATE_PAYMENT" || cap === "VERIFY",
      createPayment: jest.fn(),
      verifyPayment: jest.fn(),
      handleCallback: jest.fn(),
    }

    registry.register(mockAdapter)
    expect(() => registry.getActiveGateway("zarinpal", "REFUND")).toThrow(
      UnsupportedCapabilityError
    )
  })

  test("should initiate payment via PaymentGatewayProviderService", async () => {
    const registry = GatewayRegistry.getInstance()
    const mockAdapter: IPaymentGatewayAdapter = {
      gatewayId: "mellat",
      supports: (cap) => cap === "CREATE_PAYMENT",
      createPayment: jest.fn().mockResolvedValue({
        payment: { id: "pay_mellat_1", amount: 1000000, currency: "IRR", gateway: "mellat", status: "PENDING" },
        status: "PENDING",
        actionUrl: "https://bpm.shaparak.ir/pgwchannel/startpay.mellat",
        action: { RefId: "123456789" },
      }),
      verifyPayment: jest.fn(),
      handleCallback: jest.fn(),
    }
    registry.register(mockAdapter)

    const provider = new PaymentGatewayProviderService({}, { gatewayId: "mellat" })
    const result = await provider.initiatePayment({
      amount: 1000000,
      currency_code: "IRR",
      data: { session_id: "sess_1" },
    })

    expect(result.status).toBe("pending")
    expect(result.data?.actionUrl).toBe("https://bpm.shaparak.ir/pgwchannel/startpay.mellat")
    expect(result.data?.action).toEqual({ RefId: "123456789" })
  })
})
