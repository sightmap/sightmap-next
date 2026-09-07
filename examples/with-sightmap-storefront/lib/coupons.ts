// Coupon rules live on the server (see app/api/coupons/route.ts); the cart asks
// the API and shows whatever it says. Two codes are valid on purpose, so a
// scenario can cover both a percentage and a fixed discount plus a rejection.

export type Coupon =
  | { code: string; kind: "percent"; amount: number }
  | { code: string; kind: "fixed"; amount: number };

const COUPONS: Record<string, Coupon> = {
  SAVE10: { code: "SAVE10", kind: "percent", amount: 10 },
  WELCOME5: { code: "WELCOME5", kind: "fixed", amount: 500 },
};

export function lookupCoupon(raw: string): Coupon | null {
  return COUPONS[raw.trim().toUpperCase()] ?? null;
}

export function describeCoupon(c: Coupon): string {
  return c.kind === "percent"
    ? `${c.amount}% off`
    : `$${(c.amount / 100).toFixed(2)} off`;
}

export function discountFor(subtotal: number, coupon: Coupon | null): number {
  if (!coupon) return 0;
  if (coupon.kind === "percent") return Math.round((subtotal * coupon.amount) / 100);
  return Math.min(coupon.amount, subtotal);
}
