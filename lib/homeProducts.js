import Product from "@/models/Product";

const HOME_PRODUCT_LIMIT = 10;

export async function getHomeProducts() {
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
}
