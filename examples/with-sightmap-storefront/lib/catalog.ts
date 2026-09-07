// The product catalog. Static on purpose: the same data backs the server
// components, the /api/products route handler, and the client-side catalog, so
// every fresh tab sees the same nine products and every replayed plan starts
// from the same state.

export type Category = "Coffee" | "Tea" | "Gear";

export type ProductOption = {
  label: string;
  /** Added to the base price, in cents. */
  priceDelta: number;
};

export type Product = {
  slug: string;
  name: string;
  category: Category;
  /** Base price in cents (the first option's price when the product has options). */
  price: number;
  description: string;
  inStock: boolean;
  /** The option dimension shown on the product page ("Size"), when there is one. */
  optionName?: string;
  options?: ProductOption[];
};

const BAG_SIZES: ProductOption[] = [
  { label: "250 g", priceDelta: 0 },
  { label: "1 kg", priceDelta: 4200 },
];

export const PRODUCTS: Product[] = [
  {
    slug: "ethiopia-yirgacheffe",
    name: "Ethiopia Yirgacheffe",
    category: "Coffee",
    price: 1800,
    description:
      "Washed heirloom varieties from Gedeo. Bergamot, peach, and a tea-like body.",
    inStock: true,
    optionName: "Size",
    options: BAG_SIZES,
  },
  {
    slug: "colombia-huila",
    name: "Colombia Huila",
    category: "Coffee",
    price: 1600,
    description: "A classic Colombian profile: red apple, caramel, cocoa finish.",
    inStock: true,
    optionName: "Size",
    options: BAG_SIZES,
  },
  {
    slug: "sumatra-mandheling",
    name: "Sumatra Mandheling",
    category: "Coffee",
    price: 1700,
    description: "Wet-hulled and earthy, with cedar and dark chocolate. Back next harvest.",
    inStock: false,
    optionName: "Size",
    options: BAG_SIZES,
  },
  {
    slug: "sencha",
    name: "Sencha",
    category: "Tea",
    price: 1200,
    description: "First-flush Japanese green tea. Grassy, sweet, umami.",
    inStock: true,
    optionName: "Size",
    options: [
      { label: "50 g", priceDelta: 0 },
      { label: "200 g", priceDelta: 2600 },
    ],
  },
  {
    slug: "earl-grey",
    name: "Earl Grey",
    category: "Tea",
    price: 900,
    description: "Ceylon black tea scented with cold-pressed bergamot oil.",
    inStock: true,
  },
  {
    slug: "chamomile",
    name: "Chamomile",
    category: "Tea",
    price: 800,
    description: "Whole Egyptian chamomile flowers. Caffeine-free.",
    inStock: true,
  },
  {
    slug: "pour-over-kettle",
    name: "Pour-over kettle",
    category: "Gear",
    price: 6500,
    description: "Gooseneck kettle, 1 L, with a built-in thermometer.",
    inStock: true,
  },
  {
    slug: "ceramic-dripper",
    name: "Ceramic dripper",
    category: "Gear",
    price: 2400,
    description: "Cone dripper for 1–2 cups. Takes standard #2 filters.",
    inStock: true,
  },
  {
    slug: "hand-grinder",
    name: "Hand grinder",
    category: "Gear",
    price: 8900,
    description: "Stainless conical burrs, 40 stepped settings, fits in a jacket pocket.",
    inStock: true,
  },
];

export const CATEGORIES = ["All", "Coffee", "Tea", "Gear"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];

export const SORTS = [
  "Featured",
  "Price: low to high",
  "Price: high to low",
  "Name",
] as const;
export type Sort = (typeof SORTS)[number];

export function findProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function unitPrice(product: Product, optionLabel: string | null): number {
  const opt = product.options?.find((o) => o.label === optionLabel);
  return product.price + (opt?.priceDelta ?? 0);
}

export function defaultOption(product: Product): string | null {
  return product.options?.[0]?.label ?? null;
}

export function queryProducts({
  q = "",
  category = "All",
  sort = "Featured",
}: {
  q?: string;
  category?: string;
  sort?: string;
}): Product[] {
  const needle = q.trim().toLowerCase();
  let out = PRODUCTS.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (!needle ||
        p.name.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle)),
  );
  switch (sort) {
    case "Price: low to high":
      out = [...out].sort((a, b) => a.price - b.price);
      break;
    case "Price: high to low":
      out = [...out].sort((a, b) => b.price - a.price);
      break;
    case "Name":
      out = [...out].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break; // Featured: catalog order
  }
  return out;
}
