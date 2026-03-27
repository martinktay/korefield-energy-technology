/**
 * @file exchange-rates.ts
 * Static exchange rate data and currency conversion utilities.
 * Uses USD as the base currency. Rates are hardcoded for development;
 * production will integrate with an external FX provider with 24-hour refresh.
 * Supports region-aware pricing for the Pricing Intelligence Engine.
 */

/**
 * Static exchange rate map (USD base).
 * Real integration with an external FX provider is deferred.
 * Rates are refreshed every 24 hours in production.
 */
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  NGN: 1550.0,
  KES: 153.0,
  GHS: 15.5,
  ZAR: 18.2,
  EGP: 49.0,
  GBP: 0.79,
  EUR: 0.92,
  INR: 83.5,
  BRL: 5.0,
  CAD: 1.37,
  AUD: 1.55,
  AED: 3.67,
  CNY: 7.25,
};

/** Map country codes to their default currency */
export const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD',
  NG: 'NGN',
  KE: 'KES',
  GH: 'GHS',
  ZA: 'ZAR',
  EG: 'EGP',
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  IN: 'INR',
  BR: 'BRL',
  CA: 'CAD',
  AU: 'AUD',
  AE: 'AED',
  CN: 'CNY',
};

let lastUpdated = Date.now();

/** Returns the exchange rate from USD to the target currency. */
export function getRate(currency: string): number {
  return EXCHANGE_RATES[currency] ?? 1.0;
}

/** Returns the currency code for a given country code. */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode.toUpperCase()] ?? 'USD';
}

/** Convert an amount from USD to a target currency. */
export function convertFromUsd(amountUsd: number, currency: string): number {
  const rate = getRate(currency);
  return Math.round(amountUsd * rate * 100) / 100;
}

/** Check if exchange rates are stale (older than 24 hours). */
export function areRatesStale(): boolean {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return Date.now() - lastUpdated > twentyFourHours;
}

/** Mark rates as refreshed (called after external update). */
export function markRatesRefreshed(): void {
  lastUpdated = Date.now();
}
