"use client";
import Link from "next/link";
import { useState } from "react";
import {
  CATEGORIES,
  SORTS,
  queryProducts,
  type CategoryFilter,
  type Sort,
} from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { store, useStore } from "@/lib/store";

export function Catalog() {
  const { lines } = useStore();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [sort, setSort] = useState<Sort>("Featured");
  const visible = queryProducts({ q, category, sort });
  const inCart = new Set(lines.map((l) => l.slug));

  return (
    <section
      data-component="Catalog"
      data-count={visible.length}
      data-query={q}
      aria-label="Catalog"
    >
      <h1>Shop</h1>
      <div data-component="CatalogControls">
        <input
          data-component="SearchInput"
          type="search"
          aria-label="Search products"
          placeholder="Search coffee, tea, gear…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div data-component="CategoryFilter" role="group" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              data-component="CategoryButton"
              aria-pressed={c === category}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div data-component="SortBar" role="group" aria-label="Sort">
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              data-component="SortButton"
              aria-pressed={s === sort}
              onClick={() => setSort(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p data-component="ResultCount">
        {visible.length} {visible.length === 1 ? "product" : "products"}
      </p>

      <ul data-component="ProductGrid">
        {visible.map((p) => (
          <li
            key={p.slug}
            data-component="ProductCard"
            data-slug={p.slug}
            data-category={p.category}
            data-stock={p.inStock ? "in-stock" : "sold-out"}
            data-in-cart={String(inCart.has(p.slug))}
          >
            <Link data-component="ProductLink" href={`/products/${p.slug}`}>
              {p.name}
            </Link>
            <span data-component="ProductPrice">{formatMoney(p.price)}</span>
            <span data-component="StockBadge">
              {p.inStock ? "In stock" : "Sold out"}
            </span>
            <button
              type="button"
              data-component="QuickAddButton"
              disabled={!p.inStock}
              aria-label={`Add ${p.name} to cart`}
              onClick={() => store.add(p)}
            >
              {inCart.has(p.slug) ? "In cart" : "Add to cart"}
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 && (
        <p data-component="EmptyResults">No products match.</p>
      )}
    </section>
  );
}
