import { OrderConfirmation } from "@/components/OrderConfirmation";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderConfirmation id={id} />;
}
