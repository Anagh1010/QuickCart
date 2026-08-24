import HomeHeroSlider from "@/components/home/HomeHeroSlider";
import CategoryRail from "@/components/home/CategoryRail";
import HomeProducts from "@/components/HomeProducts";
import ValueHighlights from "@/components/home/ValueHighlights";
import FeaturedProduct from "@/components/FeaturedProduct";
import PromotionBanner from "@/components/home/PromotionBanner";
import NewsLetter from "@/components/NewsLetter";
import connectDB from "@/config/db";
import { getHomeProducts } from "@/lib/homeProducts";

export const dynamic = "force-dynamic";

const Home = async () => {
  await connectDB();
  const products = await getHomeProducts();

  return (
    <>
      <HomeHeroSlider />
      <CategoryRail />
      <HomeProducts products={products} />
      <ValueHighlights />
      <FeaturedProduct />
      <PromotionBanner />
      <NewsLetter />
    </>
  );
};

export default Home;
