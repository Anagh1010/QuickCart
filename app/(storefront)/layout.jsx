import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

const StorefrontLayout = ({ children }) => (
  <div className="flex min-h-screen flex-col bg-white">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default StorefrontLayout;
