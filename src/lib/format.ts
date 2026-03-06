/**
 * Centralized formatting for numbers and percentages.
 * No formatting logic in JSX; use these functions only.
 */

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  const pct = value * 100;
  return `${Number(pct.toFixed(decimals))}%`;
}

export function formatShortNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return formatNumber(value);
}
