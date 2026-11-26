import { ZibalConfig } from '../config/zibal-config.interface.js';
import {
  ZibalInquiryPayload,
  ZibalInquiryResponse,
  ZibalRequestPayload,
  ZibalRequestResponse,
  ZibalVerifyPayload,
  ZibalVerifyResponse,
} from '../types/zibal-api.types.js';

export interface HttpTransport {
  post<T>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
    timeoutMs?: number,
  ): Promise<T>;
}

export class DefaultHttpTransport implements HttpTransport {
  public async post<T>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
    timeoutMs?: number,
  ): Promise<T> {
    const controller = timeoutMs && timeoutMs > 0 ? new AbortController() : undefined;
    const timer = controller
      ? setTimeout(() => {
          controller.abort();
        }, timeoutMs)
      : undefined;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller?.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Zibal API request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}

export class ZibalClient {
  private readonly config: ZibalConfig;
  private readonly merchant: string;
  private readonly baseUrl: string;
  private readonly transport: HttpTransport;
  private readonly timeoutMs?: number;

  constructor(config: ZibalConfig, transport?: HttpTransport) {
    this.config = config;
    this.merchant = config.merchant.trim();
    this.baseUrl = (config.baseUrl || 'https://gateway.zibal.ir').replace(/\/+$/, '');
    this.transport = transport || new DefaultHttpTransport();
    this.timeoutMs = config.timeoutMs;
  }

  public async requestPayment(
    payload: Omit<ZibalRequestPayload, 'merchant'>,
    isLazy = false,
  ): Promise<ZibalRequestResponse> {
    const endpoint = isLazy ? '/request/lazy' : '/v1/request';
    const body: ZibalRequestPayload = {
      merchant: this.merchant,
      ...payload,
    };

    const response = await this.transport.post<ZibalRequestResponse>(
      `${this.baseUrl}${endpoint}`,
      body,
      undefined,
      this.timeoutMs ?? this.config.timeoutMs,
    );

    return {
      ...response,
      rawResponse: response,
    };
  }

  public async verifyPayment(
    payload: Omit<ZibalVerifyPayload, 'merchant'>,
    isLazy = false,
  ): Promise<ZibalVerifyResponse> {
    const endpoint = isLazy ? '/verify' : '/v1/verify';
    const body: ZibalVerifyPayload = {
      merchant: this.merchant,
      ...payload,
    };

    const response = await this.transport.post<ZibalVerifyResponse>(
      `${this.baseUrl}${endpoint}`,
      body,
      undefined,
      this.timeoutMs ?? this.config.timeoutMs,
    );

    return {
      ...response,
      rawResponse: response,
    };
  }

  public async inquiryPayment(
    payload: Omit<ZibalInquiryPayload, 'merchant'>,
  ): Promise<ZibalInquiryResponse> {
    const body: ZibalInquiryPayload = {
      merchant: this.merchant,
      ...payload,
    };

    const response = await this.transport.post<ZibalInquiryResponse>(
      `${this.baseUrl}/v1/inquiry`,
      body,
      undefined,
      this.timeoutMs ?? this.config.timeoutMs,
    );

    return {
      ...response,
      rawResponse: response,
    };
  }

  public getPaymentUrl(trackId: number | string): string {
    return `${this.baseUrl}/start/${trackId}`;
  }
}
