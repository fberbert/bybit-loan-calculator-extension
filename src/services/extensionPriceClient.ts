import type { UsdtBrlPriceSnapshot } from './priceClient';

type KuCoinPriceMessage = {
  type: 'FETCH_USDT_BRL_PRICE';
};

type KuCoinPriceResponse =
  | {
      ok: true;
      price: UsdtBrlPriceSnapshot;
    }
  | {
      ok: false;
      error: string;
    };

type ChromeRuntimeShape = {
  runtime?: {
    lastError?: { message?: string };
    sendMessage?: (
      message: KuCoinPriceMessage,
      callback: (response?: KuCoinPriceResponse) => void
    ) => void;
  };
};

export function fetchExtensionUsdtBrlPrice(): Promise<UsdtBrlPriceSnapshot> {
  const runtime = (globalThis.chrome as ChromeRuntimeShape | undefined)?.runtime;
  const sendMessage = runtime?.sendMessage;
  if (!runtime || !sendMessage) {
    return Promise.reject(new Error('Chrome extension runtime is not available.'));
  }

  return new Promise((resolve, reject) => {
    sendMessage({ type: 'FETCH_USDT_BRL_PRICE' }, (response) => {
      if (runtime.lastError) {
        reject(new Error(runtime.lastError.message ?? 'Extension background worker failed.'));
        return;
      }

      if (!response) {
        reject(new Error('Extension background worker returned an empty response.'));
        return;
      }

      if (!response.ok) {
        reject(new Error(response.error));
        return;
      }

      resolve(response.price);
    });
  });
}
