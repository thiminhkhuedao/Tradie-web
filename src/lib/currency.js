// src/lib/currency.js
// Shared money-formatting helper. Every page that displays an amount
// should use formatCurrency(amount, profile?.currency) instead of a
// hardcoded "£"/"€" — that way the currency picked in
// Settings → Payment actually shows up everywhere.
// This only changes the displayed symbol, never converts the stored
// number — amounts are assumed to already be in the profile's chosen
// currency (no FX conversion happens anywhere in the app).

export const CURRENCY_SYMBOLS = {
  GBP: "£",
  EUR: "€",
  USD: "$",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF ",
};

export function formatCurrency(amount, currencyCode = "EUR") {
  const symbol = CURRENCY_SYMBOLS[currencyCode] ?? CURRENCY_SYMBOLS.EUR;
  const number = Number(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${number}`;
}