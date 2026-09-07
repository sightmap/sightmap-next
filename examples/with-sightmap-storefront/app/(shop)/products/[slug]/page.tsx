import { ProductDetail, ProductMissing } from "@/components/ProductDetail";
import { PRODUCTS, findProduct } from "@/lib/catalog";

// A server component: the product is looked up on the server and handed to the
// client component, which owns option/quantity state and the cart.
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return <ProductMissing slug={slug} />;
  return <ProductDetail product={product} />;
}
