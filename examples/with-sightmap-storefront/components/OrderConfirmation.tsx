"use client";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";

export function OrderConfirmation({ id }: { id: string }) {
  const order = useStore().orders.find((o) => o.id === id);
  if (!order) {
    return (
      <section data-component="OrderMissing">
        <h1>Order not found</h1>
        <p>
          There is no order {id} in this session.{" "}
          <Link data-component="ViewOrdersLink" href="/orders">
            Order history
          </Link>
        </p>
      </section>
    );
  }
  const first = order.customer.fullName.split(/\s+/)[0];
  return (
    <article data-component="OrderConfirmation" data-id={order.id}>
      <h1>Thanks, {first}!</h1>
      <p>
        Order <strong data-component="OrderNumber">{order.id}</strong> is{" "}
        <span data-component="OrderStatus">Confirmed</span>. A receipt is on
        its way to {order.customer.email}.
      </p>
      <ul data-component="OrderItems">
        {order.lines.map((l) => (
          <li key={l.key} data-component="OrderItem" data-slug={l.slug}>
            <span data-component="ItemName">
              {l.name}
              {l.option ? ` (${l.option})` : ""}
            </span>
            × <span data-component="ItemQuantity">{l.quantity}</span>
            <span data-component="ItemTotal">
              {formatMoney(l.unitPrice * l.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <dl>
        <dt>Shipping</dt>
        <dd data-component="OrderShipping">
          {order.shippingMethod} to {order.customer.address},{" "}
          {order.customer.city} {order.customer.postalCode}
        </dd>
        <dt>Total</dt>
        <dd data-component="OrderTotal">{formatMoney(order.total)}</dd>
      </dl>
      <div className="actions">
        <Link data-component="ViewOrdersLink" href="/orders">
          Order history
        </Link>
        <Link data-component="ContinueShoppingLink" href="/">
          Continue shopping
        </Link>
      </div>
    </article>
  );
}
