import { NextResponse } from "next/server";
import { describeCoupon, lookupCoupon } from "@/lib/coupons";

// POST /api/coupons { code } — validate a coupon. Always 200; the outcome is in
// the body, which is exactly the case a corpus `requests:` property is for.
export async function POST(request: Request) {
  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    // fall through with an empty code
  }
  const coupon = lookupCoupon(code);
  if (!coupon) {
    return NextResponse.json({
      valid: false,
      code: code.trim().toUpperCase(),
      message: `“${code.trim()}” is not a valid code`,
    });
  }
  return NextResponse.json({
    valid: true,
    code: coupon.code,
    coupon,
    message: `${coupon.code} applied: ${describeCoupon(coupon)}`,
  });
}
