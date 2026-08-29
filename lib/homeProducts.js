import Product from "@/models/Product";
import connectDB from "@/config/db";
import { unstable_cache } from "next/cache";

const HOME_PRODUCT_LIMIT = 10;

const loadHomeProducts = unstable_cache(async () => {
  await connectDB();
  const products = await Product.aggregate([
    { $sort: { date: -1 } },
    { $limit: HOME_PRODUCT_LIMIT },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "productId",
        as: "reviewsList",
      },
    },
    {
      $addFields: {
        avgRating: { $ifNull: [{ $avg: "$reviewsList.rating" }, 0] },
        totalReviews: { $size: "$reviewsList" },
      },
    },
    { $project: { reviewsList: 0 } },
  ]);

  return products.map((product) => ({
    ...product,
    _id: product._id.toString(),
  }));
}, ["home-products"], { revalidate: 60 });

export async function getHomeProducts() {
  return loadHomeProducts();
}
