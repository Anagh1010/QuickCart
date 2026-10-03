import mongoose from "mongoose";
import { unstable_cache } from "next/cache";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function getProductDetail(id) {
  if (!mongoose.isObjectIdOrHexString(id)) return null;
  const load = unstable_cache(async () => {
    await connectDB();
    const product = await Product.findById(id).lean();
    return product ? { ...product, _id: product._id.toString() } : null;
  }, ["product-detail", id], { revalidate: 60 });
  return load();
}
