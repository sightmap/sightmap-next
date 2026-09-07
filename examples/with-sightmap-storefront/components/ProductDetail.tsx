"use client";
import Link from "next/link";
import { useState } from "react";
import { defaultOption, unitPrice, type Product } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { cartCount, store, useStore } from "@/lib/store";

export function ProductDetail({ product }: { product: Product }) {
  const count = cartCount(useStore().lines);
  const [option, setOption] = useState<string | null>(defaultOption(product));
  const [qtyText, setQtyText] = useState("1");
  const [added, setAdded] = useState(false);
  const quantity = Math.max(1, Number.parseInt(qtyText, 10) || 1);
  const price = unitPrice(product, option);

  function changeQuantity(next: number) {
    setQtyText(String(Math.max(1, next)));
    setAdded(false);
  }

  return (
    <article
      data-component="ProductDetail"
      data-slug={product.slug}
      data-stock={product.inStock ? "in-stock" : "sold-out"}
    >
      <Link data-component="BackToShopLink" href="/">
        ← Back to the shop
      </Link>
      <h1 data-component="ProductTitle">{product.name}</h1>
      <p>
        <span data-component="ProductCategory">{product.category}</span> ·{" "}
        <span data-component="StockBadge">
          {product.inStock ? "In stock" : "Sold out"}
        </span>
      </p>
      <p data-component="ProductPrice">{formatMoney(price)}</p>
      <p data-component="ProductDescription">{product.description}</p>

      {product.options && (
        <div
          data-component="OptionGroup"
          role="group"
          aria-label={product.optionName}
          data-name={product.optionName}
        >
          {product.options.map((o) => (
            <button
              key={o.label}
              type="button"
              data-component="OptionButton"
              aria-pressed={o.label === option}
              onClick={() => {
                setOption(o.label);
                setAdded(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="actions">
        <div data-component="QuantityControl" data-quantity={quantity}>
          <button
            type="button"
            data-component="DecrementButton"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => changeQuantity(quantity - 1)}
          >
            −
          </button>
          <input
            data-component="QuantityInput"
            type="number"
            min={1}
            aria-label="Quantity"
            value={qtyText}
            onChange={(e) => {
              setQtyText(e.target.value);
              setAdded(false);
            }}
          />
          <button
            type="button"
            data-component="IncrementButton"
            aria-label="Increase quantity"
            onClick={() => changeQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          data-component="AddToCartButton"
          data-added={String(added)}
          disabled={!product.inStock}
          onClick={() => {
            store.add(product, option, quantity);
            setAdded(true);
          }}
        >
          {added ? "Added to cart" : "Add to cart"}
        </button>
      </div>

      <p data-component="CartSummary" data-count={count}>
        {count} {count === 1 ? "item" : "items"} in your cart ·{" "}
        <Link data-component="ViewCartLink" href="/cart">
          View cart
        </Link>
      </p>
    </article>
  );
}

export function ProductMissing({ slug }: { slug: string }) {
  return (
    <article data-component="ProductMissing">
      <p>No product called “{slug}”.</p>
      <Link data-component="BackToShopLink" href="/">
        Back to the shop
      </Link>
    </article>
  );
}
