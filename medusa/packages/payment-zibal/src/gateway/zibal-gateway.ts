import {
  CallbackRequest,
  CanCreatePayment,
  CanHandleCallback,
  CanInquire,
  CanVerify,
  CreatePaymentRequest,
  CreatePaymentResponse,
  GatewayCapability,
  InquiryPaymentRequest,
  InquiryPaymentResponse,
  ParsedCallbackResult,
  PaymentGateway,
  ValidationError,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '@amirhossein-moloki/payment-core';
import { HttpTransport, ZibalClient } from '../client/zibal-client.js';
import { ZibalConfig, validateZibalConfig } from '../config/zibal-config.interface.js';
import { ZibalErrorMapper } from '../errors/zibal-error-mapper.js';
import { ZibalResponseMapper } from '../mapper/zibal-response-mapper.js';
import { ZibalCallbackPayload, ZibalMultiplexingInfo } from '../types/zibal-api.types.js';

const MIN_ZIBAL_AMOUNT_IRR = 1000;

/**
 * Converts a monetary amount into integer Iranian Rials (IRR) for Zibal without double conversion.
 * Zibal's API expects all amounts in IRR (`>= 1000`).
 */
export function toZibalRialAmount(amount: number, currency: string): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || !Number.isSafeInteger(amount)) {
    throw new ValidationError('Zibal amount must be a finite integer', { amount, currency });
  }
  if (amount <= 0) {
    throw new ValidationError('Zibal amount must be greater than zero', { amount, currency });
  }

  const normalizedCurrency = String(currency || '')
    .trim()
    .toUpperCase();

  let amountInRials: number;
  if (normalizedCurrency === 'IRR') {
    amountInRials = amount;
  } else if (normalizedCurrency === 'IRT' || normalizedCurrency === 'TOMAN') {
    amountInRials = amount * 10;
  } else {
    throw new ValidationError(
      `Unsupported currency '${normalizedCurrency}' for Zibal gateway; expected IRR or IRT`,
      { currency: normalizedCurrency },
    );
  }

  if (!Number.isSafeInteger(amountInRials) || amountInRials < MIN_ZIBAL_AMOUNT_IRR) {
    throw new ValidationError(
      `Zibal amount must be at least ${MIN_ZIBAL_AMOUNT_IRR} IRR`,
      { amountInRials, currency: normalizedCurrency },
    );
  }

  return amountInRials;
}

export class ZibalGateway
  implements PaymentGateway, CanCreatePayment, CanVerify, CanInquire, CanHandleCallback
{
  public readonly id: string;
  public readonly displayName: string = 'زیبال (Zibal)';
  public readonly isEnabled: boolean = true;
  public readonly capabilities: ReadonlySet<GatewayCapability> = new Set<GatewayCapability>([
    GatewayCapability.CREATE_PAYMENT,
    GatewayCapability.VERIFY,
    GatewayCapability.INQUIRY,
    GatewayCapability.CALLBACK,
  ]);

  private readonly config: ZibalConfig;
  private readonly client: ZibalClient;

  constructor(config: ZibalConfig, transport?: HttpTransport) {
    validateZibalConfig(config);
    this.config = {
      ...config,
      merchant: config.merchant.trim(),
      callbackUrl: config.callbackUrl.trim(),
    };
    this.id = config.gatewayId || 'zibal';
    this.client = new ZibalClient(this.config, transport);
  }

  public supportsCapability(capability: GatewayCapability): boolean {
    return this.capabilities.has(capability);
  }

  public async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const { payment, options } = request;

    const amount = toZibalRialAmount(payment.amount, payment.currency);
    const callbackUrl =
      (options?.callbackUrl as string) || payment.callbackUrl || this.config.callbackUrl;
    const description = (options?.description as string) || payment.description;
    const orderId = payment.id;

    const isLazy = Boolean(options?.isLazy);

    try {
      const response = await this.client.requestPayment(
        {
          amount,
          callbackUrl,
          description,
          orderId,
          mobile: options?.mobile as string | undefined,
          allowedCards: options?.allowedCards as string[] | undefined,
          nationalCode: options?.nationalCode as string | undefined,
          checkMobileWithCard: options?.checkMobileWithCard as boolean | undefined,
          percentMode: options?.percentMode as number | undefined,
          feeMode: options?.feeMode as number | undefined,
          multiplexingInfos: options?.multiplexingInfos as ZibalMultiplexingInfo[] | undefined,
        },
        isLazy,
      );

      if (response.result !== 100 || !response.trackId) {
        throw ZibalErrorMapper.mapResultToError(
          response.result ?? -2,
          this.id,
          'Zibal payment request failed',
        );
      }

      const redirectUrl = this.client.getPaymentUrl(response.trackId);
      return ZibalResponseMapper.mapRequestResponse(response, redirectUrl);
    } catch (err) {
      if ((err as Error).name === 'GatewayError' || (err as Error).name === 'ValidationError') {
        throw err;
      }
      throw ZibalErrorMapper.mapResultToError(
        -2,
        this.id,
        this.sanitizeMessage((err as Error).message),
      );
    }
  }

  public async verify(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const trackId = this.parseTrackId(
      request.gatewayTransactionId ?? request.reference ?? request.options?.trackId,
      'Invalid trackId for verify',
    );

    const isLazy = Boolean(request.options?.isLazy);

    try {
      const response = await this.client.verifyPayment({ trackId }, isLazy);

      if (response.result !== 100 && response.result !== 201) {
        throw ZibalErrorMapper.mapResultToError(
          response.result,
          this.id,
          'Zibal verify payment failed',
        );
      }

      if (request.amount !== undefined && response.amount !== undefined) {
        const expectedAmount = request.currency
          ? toZibalRialAmount(request.amount, request.currency)
          : request.amount;

        if (Number(response.amount) !== Number(expectedAmount)) {
          throw new ValidationError('Zibal verified amount does not match expected payment amount', {
            gatewayId: this.id,
            expectedAmount,
            verifiedAmount: response.amount,
          });
        }
      }

      return ZibalResponseMapper.mapVerifyResponse(response, String(trackId));
    } catch (err) {
      if ((err as Error).name === 'GatewayError' || (err as Error).name === 'ValidationError') {
        throw err;
      }
      throw ZibalErrorMapper.mapResultToError(
        -2,
        this.id,
        this.sanitizeMessage((err as Error).message),
      );
    }
  }

  public async inquiry(request: InquiryPaymentRequest): Promise<InquiryPaymentResponse> {
    const trackId = this.parseTrackId(
      request.gatewayTransactionId ?? request.reference ?? request.options?.trackId,
      'Invalid trackId for inquiry',
    );

    try {
      const response = await this.client.inquiryPayment({ trackId });

      if (response.result !== 100) {
        throw ZibalErrorMapper.mapResultToError(
          response.result,
          this.id,
          'Zibal inquiry payment failed',
        );
      }

      return ZibalResponseMapper.mapInquiryResponse(response, String(trackId));
    } catch (err) {
      if ((err as Error).name === 'GatewayError' || (err as Error).name === 'ValidationError') {
        throw err;
      }
      throw ZibalErrorMapper.mapResultToError(
        -2,
        this.id,
        this.sanitizeMessage((err as Error).message),
      );
    }
  }

  public async parseCallback(request: CallbackRequest): Promise<ParsedCallbackResult> {
    const body = request?.body && typeof request.body === 'object' ? request.body : {};
    const query = request?.query && typeof request.query === 'object' ? request.query : {};
    const payload = (Object.keys(body).length > 0 ? body : query) as ZibalCallbackPayload;

    return ZibalResponseMapper.mapCallback(payload);
  }

  private parseTrackId(rawTrackId: unknown, errorMessage: string): number {
    if (typeof rawTrackId === 'number') {
      if (Number.isSafeInteger(rawTrackId) && rawTrackId > 0) {
        return rawTrackId;
      }
      throw ZibalErrorMapper.mapResultToError(203, this.id, errorMessage);
    }

    if (typeof rawTrackId === 'string') {
      const trimmed = rawTrackId.trim();
      if (/^[1-9]\d*$/.test(trimmed)) {
        const numeric = Number(trimmed);
        if (Number.isSafeInteger(numeric) && numeric > 0) {
          return numeric;
        }
      }
    }

    throw ZibalErrorMapper.mapResultToError(203, this.id, errorMessage);
  }

  private sanitizeMessage(message?: string): string {
    if (!message) {
      return 'Unknown Zibal transport error';
    }
    if (this.config.merchant && this.config.merchant.length > 0 && message.includes(this.config.merchant)) {
      return message.split(this.config.merchant).join('[REDACTED]');
    }
    return message;
  }
}
