import {
  CallbackInput,
  CallbackResult,
  CapabilityType,
  CreatePaymentInput,
  CreatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  ReversePaymentInput,
  ReversePaymentOutput,
  VerifyPaymentInput,
  VerifyPaymentOutput,
} from "../types"

export abstract class BasePaymentError extends Error {
  public abstract readonly statusCode: number
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class GatewayNotFoundError extends BasePaymentError {
  public readonly statusCode = 404
  constructor(public readonly gatewayId: string) {
    super(`Payment gateway '${gatewayId}' was not found in GatewayRegistry`)
  }
}

export class GatewayDisabledError extends BasePaymentError {
  public readonly statusCode = 422
  constructor(public readonly gatewayId: string) {
    super(`Payment gateway '${gatewayId}' is currently disabled`)
  }
}

export class UnsupportedCapabilityError extends BasePaymentError {
  public readonly statusCode = 422
  constructor(
    public readonly gatewayId: string,
    public readonly capability: CapabilityType
  ) {
    super(`Gateway '${gatewayId}' does not support capability '${capability}'`)
  }
}

export interface IPaymentGatewayAdapter {
  readonly gatewayId: string
  supports(capability: CapabilityType): boolean
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput>
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentOutput>
  handleCallback(input: CallbackInput): Promise<CallbackResult>
  refundPayment?(input: RefundPaymentInput): Promise<RefundPaymentOutput>
  reversePayment?(input: ReversePaymentInput): Promise<ReversePaymentOutput>
}

export class GatewayRegistry {
  private static instance: GatewayRegistry
  private gateways = new Map<string, IPaymentGatewayAdapter>()

  public static getInstance(): GatewayRegistry {
    if (!GatewayRegistry.instance) {
      GatewayRegistry.instance = new GatewayRegistry()
    }
    return GatewayRegistry.instance
  }

  public register(gateway: IPaymentGatewayAdapter): void {
    this.gateways.set(gateway.gatewayId, gateway)
  }

  public getGateway(gatewayId: string): IPaymentGatewayAdapter {
    const gateway = this.gateways.get(gatewayId)
    if (!gateway) {
      throw new GatewayNotFoundError(gatewayId)
    }
    return gateway
  }

  public getActiveGateway(
    gatewayId: string,
    capability?: CapabilityType
  ): IPaymentGatewayAdapter {
    const gateway = this.getGateway(gatewayId)
    if (capability && !gateway.supports(capability)) {
      throw new UnsupportedCapabilityError(gatewayId, capability)
    }
    return gateway
  }

  public clear(): void {
    this.gateways.clear()
  }
}
