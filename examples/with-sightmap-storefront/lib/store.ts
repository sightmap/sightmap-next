"use client";
// Cart, coupon, and order state for the life of the tab. Deliberately
// in-memory: a full page load starts from an empty cart, so every
// `agent-browser open` — and every replayed plan — begins from the same state.
// Client-side navigation (next/link, router.push) keeps it, which is what the
// cart → checkout → confirmation flow relies on.
import { useSyncExternalStore } from "react";
import { defaultOption, unitPrice, type Product } from "./catalog";
import { discountFor, type Coupon } from "./coupons";

export type CartLine = {
  /** slug plus option, so the same product in two sizes is two lines. */
  key: string;
  slug: string;
  name: string;
  option: string | null;
  unitPrice: number;
  quantity: number;
};

export type ShippingMethod = "Standard" | "Express";
export const SHIPPING: Record<ShippingMethod, { price: number; eta: string }> = {
  Standard: { price: 500, eta: "3–5 business days" },
  Express: { price: 1500, eta: "next business day" },
};

export type Customer = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
};

export type Order = {
  id: string;
  lines: CartLine[];
  coupon: Coupon | null;
  shippingMethod: ShippingMethod;
  customer: Customer;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};

export type State = {
  lines: CartLine[];
  coupon: Coupon | null;
  orders: Order[];
};

const EMPTY: State = { lines: [], coupon: null, orders: [] };
let state: State = EMPTY;
let nextOrderNumber = 1001;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function commit(next: State) {
  state = next;
  for (const fn of listeners) fn();
}

export function useStore(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

export function cartTotals(lines: CartLine[], coupon: Coupon | null) {
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
  const discount = discountFor(subtotal, coupon);
  return { subtotal, discount, total: subtotal - discount };
}

export const store = {
  add(product: Product, option: string | null = defaultOption(product), quantity = 1) {
    if (!product.inStock || quantity < 1) return;
    const key = option ? `${product.slug}:${option}` : product.slug;
    const existing = state.lines.find((l) => l.key === key);
    const lines = existing
      ? state.lines.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + quantity } : l,
        )
      : [
          ...state.lines,
          {
            key,
            slug: product.slug,
            name: product.name,
            option,
            unitPrice: unitPrice(product, option),
            quantity,
          },
        ];
    commit({ ...state, lines });
  },
  increase(key: string) {
    commit({
      ...state,
      lines: state.lines.map((l) =>
        l.key === key ? { ...l, quantity: l.quantity + 1 } : l,
      ),
    });
  },
  decrease(key: string) {
    commit({
      ...state,
      lines: state.lines.map((l) =>
        l.key === key && l.quantity > 1 ? { ...l, quantity: l.quantity - 1 } : l,
      ),
    });
  },
  remove(key: string) {
    commit({ ...state, lines: state.lines.filter((l) => l.key !== key) });
  },
  setCoupon(coupon: Coupon | null) {
    commit({ ...state, coupon });
  },
  placeOrder(customer: Customer, shippingMethod: ShippingMethod): Order {
    const { subtotal, discount } = cartTotals(state.lines, state.coupon);
    const shipping = SHIPPING[shippingMethod].price;
    const order: Order = {
      id: `ORD-${nextOrderNumber++}`,
      lines: state.lines,
      coupon: state.coupon,
      shippingMethod,
      customer,
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
    };
    commit({ lines: [], coupon: null, orders: [...state.orders, order] });
    return order;
  },
};
