import AllProducts from "./AllProductsClient";
import { getCatalogProducts } from "@/lib/catalogProducts";

export default async function AllProductsPage({ searchParams }) {
  const filters = await searchParams;
  const products = await getCatalogProducts(filters);
  return <AllProducts key={JSON.stringify(filters)} initialProducts={products} />;
}
