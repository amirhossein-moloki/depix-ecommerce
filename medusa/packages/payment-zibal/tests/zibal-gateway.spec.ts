import {
  ConfigurationError,
  GatewayCapability,
  GatewayError,
  Payment,
  PaymentStatus,
  ValidationError,
} from '@amirhossein-moloki/payment-core';
import { describe, expect, it } from 'vitest';
import {
  HttpTransport,
  ZibalGateway,
  toZibalRialAmount,
  validateZibalConfig,
} from '../src/index.js';

class MockHttpTransport implements HttpTransport {
  public postResponses: Map<string, unknown> = new Map();
  public postErrors: Map<string, Error> = new Map();
  public lastPostedUrl = '';
  public lastPostedBody: unknown = null;
  public lastTimeoutMs?: number;

  public async post<T>(
    url: string,
    body: unknown,
    _headers?: Record<string, string>,
    timeoutMs?: number,
  ): Promise<T> {
    this.lastPostedUrl = url;
    this.lastPostedBody = body;
    this.lastTimeoutMs = timeoutMs;

    for (const [key, err] of this.postErrors.entries()) {
      if (url.includes(key)) {
        throw err;
      }
    }

    for (const [key, response] of this.postResponses.entries()) {
      if (url.includes(key)) {
        return response as T;
      }
    }
    throw new Error(`Unhandled mock request for ${url}`);
  }
}

describe('ZibalGateway', () => {
  const sandboxConfig = {
    merchant: 'zibal',
    callbackUrl: 'https://merchant.example.com/callback',
    environment: 'sandbox' as const,
  };

  it('should initialize correctly with config and capabilities', () => {
    const gateway = new ZibalGateway(sandboxConfig);
    expect(gateway.id).toBe('zibal');
    expect(gateway.displayName).toContain('Zibal');
    expect(gateway.isEnabled).toBe(true);
    expect(gateway.supportsCapability(GatewayCapability.CREATE_PAYMENT)).toBe(true);
    expect(gateway.supportsCapability(GatewayCapability.VERIFY)).toBe(true);
    expect(gateway.supportsCapability(GatewayCapability.INQUIRY)).toBe(true);
    expect(gateway.supportsCapability(GatewayCapability.CALLBACK)).toBe(true);
    expect(gateway.supportsCapability(GatewayCapability.REFUND)).toBe(false);
    expect(gateway.supportsCapability(GatewayCapability.WEBHOOK)).toBe(false);
  });

  describe('configuration validation', () => {
    it('should allow sandbox config with merchant zibal', () => {
      expect(() => validateZibalConfig(sandboxConfig)).not.toThrow();
    });

    it('should allow valid production config with real merchant', () => {
      expect(() =>
        validateZibalConfig({
          merchant: 'prod_merchant_secret_123',
          callbackUrl: 'https://api.example.com/payment/callback',
          environment: 'production',
        }),
      ).not.toThrow();
    });

    it('should reject merchant zibal in production with ConfigurationError', () => {
      expect(() =>
        validateZibalConfig({
          merchant: 'zibal',
          callbackUrl: 'https://merchant.example.com/callback',
          environment: 'production',
        }),
      ).toThrow(ConfigurationError);
    });

    it('should reject empty or whitespace merchant without exposing secret', () => {
      expect(() =>
        validateZibalConfig({
          merchant: '   ',
          callbackUrl: 'https://merchant.example.com/callback',
          environment: 'production',
        }),
      ).toThrow(ConfigurationError);
    });

    it('should reject missing or invalid callbackUrl', () => {
      expect(() =>
        validateZibalConfig({
          merchant: 'zibal',
          callbackUrl: 'not-a-url',
          environment: 'sandbox',
        }),
      ).toThrow(ConfigurationError);

      expect(() =>
        validateZibalConfig({
          merchant: 'zibal',
          callbackUrl: 'ftp://merchant.example.com/callback',
          environment: 'sandbox',
        }),
      ).toThrow(ConfigurationError);
    });
  });

  describe('currency and amount handling', () => {
    it('should pass IRR amounts through without double conversion', () => {
      expect(toZibalRialAmount(1000, 'IRR')).toBe(1000);
      expect(toZibalRialAmount(500000, 'irr')).toBe(500000);
    });

    it('should convert IRT / TOMAN to IRR exactly once', () => {
      expect(toZibalRialAmount(100, 'IRT')).toBe(1000);
      expect(toZibalRialAmount(50000, 'TOMAN')).toBe(500000);
    });

    it('should reject amounts below Zibal 1000 IRR minimum, zero, negative, fractional, or unsupported currency', () => {
      expect(() => toZibalRialAmount(999, 'IRR')).toThrow(ValidationError);
      expect(() => toZibalRialAmount(99, 'IRT')).toThrow(ValidationError);
      expect(() => toZibalRialAmount(0, 'IRR')).toThrow(ValidationError);
      expect(() => toZibalRialAmount(-5000, 'IRR')).toThrow(ValidationError);
      expect(() => toZibalRialAmount(1000.5, 'IRR')).toThrow(ValidationError);
      expect(() => toZibalRialAmount(10000, 'USD')).toThrow(ValidationError);
    });
  });

  describe('createPayment', () => {
    it('should create payment successfully and generate redirect URL', async () => {
      const mockTransport = new MockHttpTransport();
      mockTransport.postResponses.set('/v1/request', {
        trackId: 15966442233311,
        result: 100,
        message: 'success',
      });

      const gateway = new ZibalGateway({ ...sandboxConfig, timeoutMs: 8000 }, mockTransport);
      const payment = new Payment({
        id: 'order-123',
        amount: 100000,
        currency: 'IRR',
        gateway: 'zibal',
        description: 'Test payment',
      });

      const res = await gateway.createPayment({ payment });

      expect(res.success).toBe(true);
      expect(res.gatewayTransactionId).toBe('15966442233311');
      expect(res.redirectUrl).toBe('https://gateway.zibal.ir/start/15966442233311');
      expect(res.status).toBe(PaymentStatus.PENDING);
      expect(mockTransport.lastPostedBody).toMatchObject({
        merchant: 'zibal',
        amount: 100000,
        orderId: 'order-123',
      });
      expect(mockTransport.lastTimeoutMs).toBe(8000);
    });

    it('should fail when Zibal returns error result code', async () => {
      const mockTransport = new MockHttpTransport();
      mockTransport.postResponses.set('/v1/request', {
        trackId: 0,
        result: 102,
        message: 'merchant not found',
      });

      const gateway = new ZibalGateway(sandboxConfig, mockTransport);
      const payment = new Payment({
        id: 'order-123',
        amount: 100000,
        currency: 'IRR',
        gateway: 'zibal',
      });

      await expect(gateway.createPayment({ payment })).rejects.toThrow(ValidationError);
    });

    it('should redact merchant secret if network/timeout error message contains it', async () => {
      const mockTransport = new MockHttpTransport();
      const secretMerchant = 'super-secret-merchant-xyz';
      mockTransport.postErrors.set(
        '/v1/request',
        new Error(`Request timed out while sending merchant=${secretMerchant}`),
      );

      const gateway = new ZibalGateway(
        {
          merchant: secretMerchant,
          callbackUrl: 'https://api.example.com/payment/callback',
          environment: 'production',
        },
        mockTransport,
      );
      const payment = new Payment({
        id: 'order-sec-1',
        amount: 250000,
        currency: 'IRR',
        gateway: 'zibal',
      });

      let caught: Error | undefined;
      try {
        await gateway.createPayment({ payment });
      } catch (err) {
        caught = err as Error;
      }

      expect(caught).toBeInstanceOf(GatewayError);
      expect(caught?.message).not.toContain(secretMerchant);
      expect(caught?.message).toContain('[REDACTED]');
    });
  });

  describe('verify', () => {
    it('should verify payment successfully for result 100 and 201 (already verified)', async () => {
      const mockTransport = new MockHttpTransport();
      mockTransport.postResponses.set('/v1/verify', {
        paidAt: '2022-07-06T14:18:21.742000',
        amount: 100000,
        result: 100,
        status: 1,
        refNumber: 12312,
        cardNumber: '62741****44',
        orderId: 'order-123',
        message: 'success',
      });

      const gateway = new ZibalGateway(sandboxConfig, mockTransport);
      const res = await gateway.verify({
        paymentId: 'order-123',
        amount: 100000,
        currency: 'IRR',
        gatewayTransactionId: '15966442233311',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(PaymentStatus.SUCCESS);
      expect(res.reference).toBe('12312');
      expect(res.gatewayTransactionId).toBe('15966442233311');
      expect(res.cardMask).toBe('62741****44');

      mockTransport.postResponses.set('/v1/verify', {
        paidAt: '2022-07-06T14:18:21.742000',
        amount: 100000,
        result: 201,
        status: 1,
        refNumber: 12312,
        orderId: 'order-123',
        message: 'already verified',
      });

      const repeatedRes = await gateway.verify({
        paymentId: 'order-123',
        amount: 100000,
        currency: 'IRR',
        gatewayTransactionId: '15966442233311',
      });
      expect(repeatedRes.success).toBe(true);
      expect(repeatedRes.status).toBe(PaymentStatus.SUCCESS);
    });

    it('should reject verify with amount mismatch', async () => {
      const mockTransport = new MockHttpTransport();
      mockTransport.postResponses.set('/v1/verify', {
        amount: 50000, // mismatched vs 100000
        result: 100,
        status: 1,
        refNumber: 99999,
        orderId: 'order-123',
        message: 'success',
      });

      const gateway = new ZibalGateway(sandboxConfig, mockTransport);
      await expect(
        gateway.verify({
          paymentId: 'order-123',
          amount: 100000,
          currency: 'IRR',
          gatewayTransactionId: '15966442233311',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should fail verify when Zibal returns result 202 (unpaid/failed)', async () => {
      const mockTransport = new MockHttpTransport();
      mockTransport.postResponses.set('/v1/verify', {
        result: 202,
        message: 'payment not paid',
      });

      const gateway = new ZibalGateway(sandboxConfig, mockTransport);
      await expect(
        gateway.verify({
          paymentId: 'order-123',
          amount: 100000,
          currency: 'IRR',
          gatewayTransactionId: '15966442233311',
        }),
      ).rejects.toThrow(GatewayError);
    });

    it('should reject incorrect/non-numeric trackId before calling Zibal', async () => {
      const mockTransport = new MockHttpTransport();
      const gateway = new ZibalGateway(sandboxConfig, mockTransport);

      await expect(
        gateway.verify({
          paymentId: 'order-123',
          amount: 100000,
          currency: 'IRR',
          gatewayTransactionId: 'abc_invalid',
        }),
      ).rejects.toThrow(ValidationError);
      expect(mockTransport.lastPostedUrl).toBe('');
    });
  });

  describe('inquiry & callback', () => {
    it('should inquiry payment successfully', async () => {
      const mockTransport = new MockHttpTransport();
      mockTransport.postResponses.set('/v1/inquiry', {
        createdAt: '2022-07-06T14:17:52.918000',
        paidAt: '2022-07-06T14:18:21.742000',
        verifiedAt: '2022-07-06T14:18:21.742000',
        cardNumber: '62741****44',
        status: 1,
        amount: 100000,
        refNumber: 12312,
        orderId: 'order-123',
        result: 100,
        message: 'success',
      });

      const gateway = new ZibalGateway(sandboxConfig, mockTransport);
      const res = await gateway.inquiry({
        paymentId: 'order-123',
        gatewayTransactionId: '15966442233311',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(PaymentStatus.SUCCESS);
      expect(res.amount).toBe(100000);
      expect(res.reference).toBe('12312');
      expect(res.gatewayTransactionId).toBe('15966442233311');
    });

    it('should parse valid callback parameters and reject malformed trackId', async () => {
      const gateway = new ZibalGateway(sandboxConfig);
      const valid = await gateway.parseCallback({
        query: {
          trackId: '15966442233311',
          success: '1',
          status: '2',
          orderId: 'order-123',
        },
        body: {},
        headers: {},
      });

      expect(valid.isSuccess).toBe(true);
      expect(valid.gatewayTransactionId).toBe('15966442233311');
      expect(valid.paymentId).toBe('order-123');

      const invalid = await gateway.parseCallback({
        query: {
          trackId: 'bad-track-id',
          success: '1',
        },
        body: {},
        headers: {},
      });
      expect(invalid.isSuccess).toBe(false);
      expect(invalid.gatewayTransactionId).toBeUndefined();
    });
  });
});
