import Product from "@/models/Product";
import connectDB from "@/config/db";
import { unstable_cache } from "next/cache";

function parseFilters(input = {}) {
  const filters = {
    search: input.search || "",
    category: input.category || "",
    inStock: input.inStock === "true",
    sort: input.sort || "newest",
  };
  const minPrice = Number(input.minPrice);
  const maxPrice = Number(input.maxPrice);
  if (Number.isFinite(minPrice) && minPrice >= 0) filters.minPrice = minPrice;
  if (Number.isFinite(maxPrice) && maxPrice >= 0) filters.maxPrice = maxPrice;
  return filters;
}

function buildPipeline(filters) {
  const match = {};
  if (filters.search) {
    const escaped = filters.search.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    match.name = { $regex: escaped, $options: "i" };
  }
  if (filters.category) match.category = { $in: filters.category.split(",") };
  if (filters.inStock) match.stock = { $gt: 0 };
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    match.offerPrice = {};
    if (filters.minPrice !== undefined) match.offerPrice.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) match.offerPrice.$lte = filters.maxPrice;
  }
  const sort = filters.sort === "price-asc" ? { offerPrice: 1 }
    : filters.sort === "price-desc" ? { offerPrice: -1 }
      : filters.sort === "rating" ? { avgRating: -1, date: -1 }
        : { date: -1 };
  return [
    { $match: match },
    { $lookup: { from: "reviews", let: { productId: "$_id" }, pipeline: [
      { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    ], as: "reviewStats" } },
    { $addFields: {
      avgRating: { $ifNull: [{ $arrayElemAt: ["$reviewStats.avgRating", 0] }, 0] },
      totalReviews: { $ifNull: [{ $arrayElemAt: ["$reviewStats.totalReviews", 0] }, 0] },
    } },
    { $project: { reviewStats: 0 } },
    { $sort: sort },
  ];
}

export async function getCatalogProducts(input) {
  const filters = parseFilters(input);
  const cacheKey = JSON.stringify(filters);
  const load = unstable_cache(async () => {
    await connectDB();
    const products = await Product.aggregate(buildPipeline(filters));
    return products.map((product) => ({ ...product, _id: product._id.toString() }));
  }, ["catalog-products", cacheKey], { revalidate: 30 });
  return load();
}
