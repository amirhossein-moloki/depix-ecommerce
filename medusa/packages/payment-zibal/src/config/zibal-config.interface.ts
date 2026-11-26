import {
  ConfigurationError,
  GatewayConfig,
  PaymentEnvironment,
} from '@amirhossein-moloki/payment-core';

export interface ZibalConfig extends GatewayConfig {
  merchant: string;
  callbackUrl: string;
  environment?: PaymentEnvironment;
  baseUrl?: string;
  gatewayId?: string;
  timeoutMs?: number;
}

export function validateZibalConfig(config: ZibalConfig): void {
  if (!config) {
    throw new ConfigurationError('Zibal config is required');
  }
  if (!config.merchant || typeof config.merchant !== 'string' || config.merchant.trim().length === 0) {
    throw new ConfigurationError('Zibal merchant is required and must be a non-empty string');
  }
  if (
    !config.callbackUrl ||
    typeof config.callbackUrl !== 'string' ||
    config.callbackUrl.trim().length === 0
  ) {
    throw new ConfigurationError('Zibal callbackUrl is required and must be a valid HTTP(S) URL');
  }

  let parsedCallback: URL;
  try {
    parsedCallback = new URL(config.callbackUrl.trim());
  } catch {
    throw new ConfigurationError('Zibal callbackUrl must be a valid URL');
  }

  if (parsedCallback.protocol !== 'http:' && parsedCallback.protocol !== 'https:') {
    throw new ConfigurationError('Zibal callbackUrl must use http or https protocol');
  }

  const env = config.environment;
  if (env !== undefined && env !== 'sandbox' && env !== 'production') {
    throw new ConfigurationError("Zibal environment must be either 'sandbox' or 'production'");
  }

  if (env === 'production' && config.merchant.trim() === 'zibal') {
    throw new ConfigurationError(
      "Safety Error: Production environment cannot use Zibal test merchant 'zibal'",
    );
  }

  if (
    config.timeoutMs !== undefined &&
    (!Number.isFinite(config.timeoutMs) || config.timeoutMs <= 0)
  ) {
    throw new ConfigurationError('Zibal timeoutMs must be a positive number');
  }
}
