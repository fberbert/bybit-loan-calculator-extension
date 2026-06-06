import { describe, expect, test } from 'vitest';
import { fetchKuCoinUsdtBrlPrice } from '../services/priceClient';

describe('KuCoin BRL price client', () => {
  test('fetches USDT-BRL directly', async () => {
    const price = await fetchKuCoinUsdtBrlPrice(async () => ({
      ok: true,
      json: async () => ({ code: '200000', data: { price: '5.22', time: 123 } })
    }) as Response);

    expect(price).toEqual({
      usdtBrl: 5.22,
      updatedAt: 123,
      source: 'KuCoin'
    });
  });

  test('falls back to inverted BRL-USDT when USDT-BRL fails', async () => {
    const price = await fetchKuCoinUsdtBrlPrice(async (url) => {
      if (String(url).includes('USDT-BRL')) {
        return { ok: false, json: async () => ({}) } as Response;
      }

      return {
        ok: true,
        json: async () => ({ code: '200000', data: { price: '0.2', time: 456 } })
      } as Response;
    });

    expect(price).toEqual({
      usdtBrl: 5,
      updatedAt: 456,
      source: 'KuCoin'
    });
  });
});
