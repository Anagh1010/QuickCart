import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import FeaturedProduct from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import connectDB from "@/config/db";
import { getHomeProducts } from "@/lib/homeProducts";

export const dynamic = "force-dynamic";

const Home = async () => {
  await connectDB();
  const products = await getHomeProducts();

  return (
    <>
      <Navbar/>
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider />
        <HomeProducts products={products} />
        <FeaturedProduct />
        <Banner />
      </div>
      <Footer />
    </>
  );
};

export default Home;
