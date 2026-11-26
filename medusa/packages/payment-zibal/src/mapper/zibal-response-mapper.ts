import {
  CreatePaymentResponse,
  InquiryPaymentResponse,
  ParsedCallbackResult,
  PaymentStatus,
  VerifyPaymentResponse,
} from '@amirhossein-moloki/payment-core';
import {
  ZibalCallbackPayload,
  ZibalInquiryResponse,
  ZibalRequestResponse,
  ZibalVerifyResponse,
} from '../types/zibal-api.types.js';

export class ZibalResponseMapper {
  public static mapStatusToPaymentStatus(status?: number): PaymentStatus {
    switch (status) {
      case 1:
        return PaymentStatus.SUCCESS;
      case -1:
      case 2:
        return PaymentStatus.PENDING;
      case 3:
        return PaymentStatus.CANCELLED;
      case -2:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 21:
        return PaymentStatus.FAILED;
      case 15:
      case 16:
        return PaymentStatus.REFUNDED;
      case 18:
        return PaymentStatus.REVERSED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  public static mapRequestResponse(
    response: ZibalRequestResponse,
    redirectUrl: string,
  ): CreatePaymentResponse {
    const isSuccess = response.result === 100;
    return {
      success: isSuccess,
      redirectUrl: isSuccess ? redirectUrl : undefined,
      gatewayTransactionId: response.trackId ? String(response.trackId) : undefined,
      status: isSuccess ? PaymentStatus.PENDING : PaymentStatus.FAILED,
      metadata: {
        trackId: response.trackId,
        result: response.result,
        message: response.message,
      },
      rawResponse: response.rawResponse || response,
    };
  }

  public static mapVerifyResponse(
    response: ZibalVerifyResponse,
    gatewayTransactionId?: string,
  ): VerifyPaymentResponse {
    const isSuccess = response.result === 100 || response.result === 201;
    const status = this.mapStatusToPaymentStatus(response.status);

    return {
      success: isSuccess,
      status: isSuccess ? PaymentStatus.SUCCESS : status,
      reference: response.refNumber ? String(response.refNumber) : undefined,
      gatewayTransactionId,
      cardMask: response.cardNumber,
      metadata: {
        paidAt: response.paidAt,
        amount: response.amount,
        orderId: response.orderId,
        result: response.result,
        status: response.status,
        multiplexingInfos: response.multiplexingInfos,
      },
      rawResponse: response.rawResponse || response,
    };
  }

  public static mapInquiryResponse(
    response: ZibalInquiryResponse,
    gatewayTransactionId?: string,
  ): InquiryPaymentResponse {
    const isSuccess = response.result === 100;
    const status = this.mapStatusToPaymentStatus(response.status);

    return {
      success: isSuccess,
      status: status,
      amount: response.amount,
      reference: response.refNumber ? String(response.refNumber) : undefined,
      gatewayTransactionId,
      metadata: {
        createdAt: response.createdAt,
        paidAt: response.paidAt,
        verifiedAt: response.verifiedAt,
        cardNumber: response.cardNumber,
        orderId: response.orderId,
        wage: response.wage,
        result: response.result,
        status: response.status,
      },
      rawResponse: response.rawResponse || response,
    };
  }

  public static mapCallback(payload: ZibalCallbackPayload): ParsedCallbackResult {
    const rawPayload = payload && typeof payload === 'object' ? payload : {};
    const successStr = String(rawPayload.success ?? '').trim();
    const rawTrackId =
      rawPayload.trackId !== undefined && rawPayload.trackId !== null
        ? String(rawPayload.trackId).trim()
        : '';
    const isValidTrackId = /^[1-9]\d*$/.test(rawTrackId);
    const trackId = isValidTrackId ? rawTrackId : undefined;
    const rawOrderId =
      rawPayload.orderId !== undefined && rawPayload.orderId !== null
        ? String(rawPayload.orderId).trim()
        : '';
    const orderId = rawOrderId.length > 0 ? rawOrderId : undefined;
    const isSuccess = Boolean(trackId) && successStr === '1';

    return {
      paymentId: orderId,
      gatewayTransactionId: trackId,
      isSuccess,
      rawData: rawPayload as Record<string, unknown>,
    };
  }
}
