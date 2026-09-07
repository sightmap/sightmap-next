import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/catalog";

// GET /api/products?q=&category=&sort= — the catalog as JSON, for readers that
// would rather not scrape the grid. Same filter and sort as the page.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const products = queryProducts({
    q: url.searchParams.get("q") ?? "",
    category: url.searchParams.get("category") ?? "All",
    sort: url.searchParams.get("sort") ?? "Featured",
  });
  return NextResponse.json({
    count: products.length,
    products: products.map(({ slug, name, category, price, inStock }) => ({
      slug,
      name,
      category,
      price,
      inStock,
    })),
  });
}
