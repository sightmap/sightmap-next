// Prices are integer cents everywhere; formatting happens once, at the edge.
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}
