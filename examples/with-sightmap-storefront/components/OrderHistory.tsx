"use client";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { cartCount, useStore } from "@/lib/store";

export function OrderHistory() {
  const { orders } = useStore();
  return (
    <section data-component="OrderHistory" data-count={orders.length}>
      <h1>Orders</h1>
      {orders.length === 0 ? (
        <p data-component="NoOrders">
          No orders yet.{" "}
          <Link data-component="ContinueShoppingLink" href="/">
            Start shopping
          </Link>
        </p>
      ) : (
        <ul data-component="OrderList">
          {orders.map((o) => {
            const items = cartCount(o.lines);
            return (
              <li
                key={o.id}
                data-component="OrderRow"
                data-id={o.id}
                data-items={items}
              >
                <Link data-component="OrderLink" href={`/orders/${o.id}`}>
                  {o.id}
                </Link>
                <span data-component="OrderRowItems">
                  {items} {items === 1 ? "item" : "items"}
                </span>
                <span data-component="OrderRowTotal">{formatMoney(o.total)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
