import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";
import { getProductDetail } from "@/lib/productDetails";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProductDetail(id);
  if (!product) notFound();
  return <ProductPageClient initialProduct={product} />;
}
