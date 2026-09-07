"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import {
  SHIPPING,
  cartTotals,
  store,
  useStore,
  type Customer,
  type ShippingMethod,
} from "@/lib/store";

type Field = keyof Customer;

const FIELDS: { name: Field; label: string; component: string; type?: string }[] = [
  { name: "fullName", label: "Full name", component: "FullNameInput" },
  { name: "email", label: "Email", component: "EmailInput", type: "email" },
  { name: "address", label: "Street address", component: "AddressInput" },
  { name: "city", label: "City", component: "CityInput" },
  { name: "postalCode", label: "Postal code", component: "PostalCodeInput" },
];

export function validate(c: Customer): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!c.fullName.trim()) errors.fullName = "Enter your full name";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim()))
    errors.email = "Enter a valid email address";
  if (!c.address.trim()) errors.address = "Enter a street address";
  if (!c.city.trim()) errors.city = "Enter a city";
  if (c.postalCode.trim().length < 3) errors.postalCode = "Enter a postal code";
  return errors;
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, coupon } = useStore();
  const [customer, setCustomer] = useState<Customer>({
    fullName: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [method, setMethod] = useState<ShippingMethod>("Standard");
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(customer) : {};
  const errorCount = Object.keys(errors).length;
  const totals = cartTotals(lines, coupon);
  const shipping = SHIPPING[method].price;

  if (lines.length === 0) {
    return (
      <section data-component="CheckoutEmpty">
        <h1>Checkout</h1>
        <p>
          Your cart is empty.{" "}
          <Link data-component="ContinueShoppingLink" href="/">
            Continue shopping
          </Link>
        </p>
      </section>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(customer)).length > 0) return;
    const order = store.placeOrder(customer, method);
    router.push(`/orders/${order.id}`);
  }

  return (
    <section data-component="Checkout" aria-label="Checkout">
      <h1>Checkout</h1>
      <form
        data-component="CheckoutForm"
        data-submitted={String(submitted)}
        data-errors={errorCount}
        noValidate
        onSubmit={onSubmit}
      >
        <fieldset data-component="ShippingDetails">
          <legend>Shipping details</legend>
          {FIELDS.map((f) => (
            <label key={f.name}>
              {f.label}
              <input
                data-component={f.component}
                name={f.name}
                type={f.type ?? "text"}
                value={customer[f.name]}
                aria-invalid={errors[f.name] ? true : undefined}
                onChange={(e) =>
                  setCustomer({ ...customer, [f.name]: e.target.value })
                }
              />
              {errors[f.name] && (
                <p data-component="FieldError" data-field={f.name}>
                  {errors[f.name]}
                </p>
              )}
            </label>
          ))}
        </fieldset>

        <fieldset data-component="ShippingMethod">
          <legend>Shipping method</legend>
          {(Object.keys(SHIPPING) as ShippingMethod[]).map((m) => (
            <label
              key={m}
              data-component="ShippingOption"
              data-method={m}
              data-selected={String(m === method)}
            >
              <input
                type="radio"
                data-component="ShippingRadio"
                name="shipping"
                value={m}
                checked={m === method}
                onChange={() => setMethod(m)}
              />
              <span data-component="ShippingLabel">{m}</span> —{" "}
              {formatMoney(SHIPPING[m].price)} · {SHIPPING[m].eta}
            </label>
          ))}
        </fieldset>

        <aside data-component="OrderSummary" aria-label="Order summary">
          <ul>
            {lines.map((l) => (
              <li key={l.key} data-component="SummaryLine" data-slug={l.slug}>
                <span data-component="SummaryName">
                  {l.name}
                  {l.option ? ` (${l.option})` : ""}
                </span>
                × <span data-component="SummaryQuantity">{l.quantity}</span>
                <span data-component="SummaryLineTotal">
                  {formatMoney(l.unitPrice * l.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl>
            <dt>Subtotal</dt>
            <dd data-component="SummarySubtotal">{formatMoney(totals.subtotal)}</dd>
            <dt>Discount</dt>
            <dd data-component="SummaryDiscount">{formatMoney(-totals.discount)}</dd>
            <dt>Shipping</dt>
            <dd data-component="SummaryShipping">{formatMoney(shipping)}</dd>
            <dt>Total</dt>
            <dd data-component="SummaryTotal">
              {formatMoney(totals.total + shipping)}
            </dd>
          </dl>
        </aside>

        {errorCount > 0 && (
          <p data-component="FormErrors" role="alert">
            Please fix {errorCount} {errorCount === 1 ? "field" : "fields"} above.
          </p>
        )}
        <div className="actions">
          <button data-component="PlaceOrderButton" type="submit">
            Place order
          </button>
          <Link data-component="BackToCartLink" href="/cart">
            Back to cart
          </Link>
        </div>
      </form>
    </section>
  );
}
