export type UsdtBrlPriceSnapshot = {
  usdtBrl: number;
  updatedAt: number;
  source: 'KuCoin';
};

type Fetcher = typeof fetch;

type KuCoinTickerResponse = {
  code: string;
  data?: {
    price?: string;
    time?: number;
  };
};

const KUCOIN_BASE_URL = 'https://api.kucoin.com/api/v1/market/orderbook/level1';

export async function fetchKuCoinUsdtBrlPrice(fetcher: Fetcher = fetch): Promise<UsdtBrlPriceSnapshot> {
  const brl = await getUsdtBrl(fetcher);

  return {
    usdtBrl: brl.price,
    updatedAt: brl.time,
    source: 'KuCoin'
  };
}

async function getUsdtBrl(fetcher: Fetcher): Promise<{ price: number; time: number }> {
  try {
    return await getTickerPrice('USDT-BRL', fetcher);
  } catch {
    const inverted = await getTickerPrice('BRL-USDT', fetcher);
    return {
      price: 1 / inverted.price,
      time: inverted.time
    };
  }
}

async function getTickerPrice(symbol: string, fetcher: Fetcher): Promise<{ price: number; time: number }> {
  const response = await fetcher(`${KUCOIN_BASE_URL}?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`KuCoin ${symbol} request failed with ${response.status}`);
  }

  const payload = (await response.json()) as KuCoinTickerResponse;
  const price = Number(payload.data?.price);

  if (payload.code !== '200000' || !Number.isFinite(price) || price <= 0) {
    throw new Error(`KuCoin ${symbol} response did not contain a valid price`);
  }

  return {
    price,
    time: payload.data?.time ?? Date.now()
  };
}
