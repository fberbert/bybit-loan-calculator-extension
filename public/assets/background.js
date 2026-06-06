const KUCOIN_BASE_URL = 'https://api.kucoin.com/api/v1/market/orderbook/level1';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'FETCH_USDT_BRL_PRICE') {
    return false;
  }

  fetchKuCoinUsdtBrlPrice()
    .then((price) => sendResponse({ ok: true, price }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch KuCoin USDT-BRL price.'
      })
    );

  return true;
});

async function fetchKuCoinUsdtBrlPrice() {
  const brl = await getUsdtBrl();

  return {
    usdtBrl: brl.price,
    updatedAt: brl.time,
    source: 'KuCoin'
  };
}

async function getUsdtBrl() {
  try {
    return await getTickerPrice('USDT-BRL');
  } catch {
    const inverted = await getTickerPrice('BRL-USDT');
    return {
      price: 1 / inverted.price,
      time: inverted.time
    };
  }
}

async function getTickerPrice(symbol) {
  const response = await fetch(`${KUCOIN_BASE_URL}?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`KuCoin ${symbol} request failed with ${response.status}`);
  }

  const payload = await response.json();
  const price = Number(payload?.data?.price);
  if (payload?.code !== '200000' || !Number.isFinite(price) || price <= 0) {
    throw new Error(`KuCoin ${symbol} response did not contain a valid price`);
  }

  return {
    price,
    time: payload?.data?.time ?? Date.now()
  };
}
