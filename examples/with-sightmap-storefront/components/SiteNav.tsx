"use client";
import Link from "next/link";
import { cartCount, useStore } from "@/lib/store";

export function SiteNav() {
  const count = cartCount(useStore().lines);
  return (
    <nav data-component="SiteNav" aria-label="Site">
      <Link data-component="NavLink" href="/">
        Shop
      </Link>
      <Link data-component="NavLink" href="/orders">
        Orders
      </Link>
      <Link data-component="CartLink" href="/cart" data-count={count}>
        Cart <span data-component="CartCount">{count}</span>
      </Link>
    </nav>
  );
}
