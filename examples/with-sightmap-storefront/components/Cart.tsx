"use client";
import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { cartTotals, store, useStore } from "@/lib/store";
import type { Coupon } from "@/lib/coupons";

type CouponStatus = {
  state: "none" | "pending" | "applied" | "invalid";
  /** The code the status line is about, set when the server has answered. */
  checked: string;
  message: string;
};

export function Cart() {
  const { lines, coupon } = useStore();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<CouponStatus>({
    state: coupon ? "applied" : "none",
    checked: coupon?.code ?? "",
    message: coupon ? `${coupon.code} applied` : "",
  });
  const totals = cartTotals(lines, coupon);

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const submitted = code.trim();
    if (!submitted) return;
    setStatus({ state: "pending", checked: "", message: "Checking…" });
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: submitted }),
      });
      const body = (await res.json()) as {
        valid: boolean;
        message: string;
        coupon?: Coupon;
      };
      store.setCoupon(body.valid && body.coupon ? body.coupon : null);
      setStatus({
        state: body.valid ? "applied" : "invalid",
        checked: submitted,
        message: body.message,
      });
    } catch {
      store.setCoupon(null);
      setStatus({
        state: "invalid",
        checked: submitted,
        message: "Could not check that code",
      });
    }
  }

  return (
    <section data-component="Cart" data-count={lines.length} aria-label="Cart">
      <h1>Your cart</h1>
      {lines.length === 0 ? (
        <p data-component="EmptyCart">
          Your cart is empty.{" "}
          <Link data-component="ContinueShoppingLink" href="/">
            Continue shopping
          </Link>
        </p>
      ) : (
        <>
          <ul data-component="CartLines">
            {lines.map((l) => (
              <li
                key={l.key}
                data-component="CartLine"
                data-key={l.key}
                data-slug={l.slug}
                data-quantity={l.quantity}
              >
                <span data-component="LineName">{l.name}</span>
                {l.option && (
                  <span data-component="LineOption">{l.option}</span>
                )}
                <span data-component="LineQuantity">
                  <button
                    type="button"
                    data-component="DecreaseButton"
                    aria-label={`Decrease quantity of ${l.name}`}
                    disabled={l.quantity <= 1}
                    onClick={() => store.decrease(l.key)}
                  >
                    −
                  </button>
                  <span data-component="QuantityValue">{l.quantity}</span>
                  <button
                    type="button"
                    data-component="IncreaseButton"
                    aria-label={`Increase quantity of ${l.name}`}
                    onClick={() => store.increase(l.key)}
                  >
                    +
                  </button>
                </span>
                <span data-component="LineTotal">
                  {formatMoney(l.unitPrice * l.quantity)}
                </span>
                <button
                  type="button"
                  data-component="RemoveButton"
                  aria-label={`Remove ${l.name}`}
                  onClick={() => store.remove(l.key)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <form data-component="CouponForm" onSubmit={applyCoupon}>
            <label>
              Coupon code
              <input
                data-component="CouponInput"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SAVE10"
              />
            </label>
            <button data-component="ApplyCouponButton" type="submit">
              Apply
            </button>
            <p
              data-component="CouponStatus"
              data-state={status.state}
              data-checked={status.checked}
              role="status"
            >
              {status.message}
            </p>
          </form>

          <dl data-component="CartTotals">
            <dt>Subtotal</dt>
            <dd data-component="Subtotal">{formatMoney(totals.subtotal)}</dd>
            <dt>Discount</dt>
            <dd data-component="Discount">{formatMoney(-totals.discount)}</dd>
            <dt>Total</dt>
            <dd data-component="Total">{formatMoney(totals.total)}</dd>
          </dl>

          <div className="actions">
            <Link data-component="CheckoutLink" href="/checkout">
              Proceed to checkout
            </Link>
            <Link data-component="ContinueShoppingLink" href="/">
              Continue shopping
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
