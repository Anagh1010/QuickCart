import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";

const HeaderSlider = () => {
  const { products, router } = useAppContext();

  // 🔍 Find the uploaded products dynamically from database context
  const s23Product = products.find(
    (p) => p.name.toLowerCase().includes("samsung") || p.name.toLowerCase().includes("s23")
  );
  const ps5Product = products.find(
    (p) => p.name.toLowerCase().includes("playstation") || p.name.toLowerCase().includes("ps5")
  );
  const macbookProduct = products.find(
    (p) => p.name.toLowerCase().includes("macbook") || p.name.toLowerCase().includes("pro 16")
  );

  const sliderData = [
    {
      id: 1,
      title: "Power Meets Elegance - Apple MacBook Pro is Here for you!",
      offer: "Exclusive Deal 40% Off",
      buttonText1: "Order Now",
      buttonText2: "Learn More",
      imgSrc: macbookProduct?.image?.[0] || assets.header_macbook_image,
      productObj: macbookProduct,
    },
    {
      id: 2,
      title: "Next-Level Gaming Starts Here - Discover PlayStation 5 Today!",
      offer: "Hurry up only few lefts!",
      buttonText1: "Shop Now",
      buttonText2: "Explore Deals",
      imgSrc: ps5Product?.image?.[0] || assets.header_playstation_image,
      productObj: ps5Product,
    },
    {
      id: 3,
      title: "Experience Next-Gen Innovation - Samsung Galaxy S23!",
      offer: "Limited Time Offer 30% Off",
      buttonText1: "Buy now",
      buttonText2: "Find more",
      imgSrc: s23Product?.image?.[0] || assets.samsung_s23phone_image,
      productObj: s23Product,
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 4000); // 4-second scroll duration for a premium viewing feel
    return () => clearInterval(interval);
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="overflow-hidden relative w-full">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide, index) => {
          const product = slide.productObj;
          
          const handleProductRedirect = () => {
            if (product) {
              router.push('/product/' + product._id);
              scrollTo(0, 0);
            } else {
              router.push('/all-products');
              scrollTo(0, 0);
            }
          };

          return (
            <div
              key={slide.id}
              className="flex flex-col-reverse md:flex-row items-center justify-between bg-[#E6E9F2] py-8 md:px-14 px-5 mt-6 rounded-xl min-w-full"
            >
              <div className="md:pl-8 mt-10 md:mt-0">
                <p className="md:text-base text-orange-600 pb-1">{slide.offer}</p>
                <h1 className="max-w-lg md:text-[40px] md:leading-[48px] text-2xl font-semibold">
                  {slide.title}
                </h1>
                <div className="flex items-center mt-4 md:mt-6 ">
                  <button 
                    onClick={handleProductRedirect}
                    className="md:px-10 px-7 md:py-2.5 py-2 bg-orange-600 rounded-full text-white font-medium cursor-pointer transition hover:bg-orange-700 shadow-xs focus:outline-hidden"
                  >
                    {slide.buttonText1}
                  </button>
                  <button 
                    onClick={handleProductRedirect}
                    className="group flex items-center gap-2 px-6 py-2.5 font-medium cursor-pointer focus:outline-hidden text-gray-700"
                  >
                    {slide.buttonText2}
                    <Image className="group-hover:translate-x-1 transition" src={assets.arrow_icon} alt="arrow_icon" />
                  </button>
                </div>
              </div>
              <div 
                onClick={handleProductRedirect}
                className="flex items-center flex-1 justify-center cursor-pointer group/img"
              >
                <Image
                  className="md:w-72 w-48 h-auto object-contain max-h-60 group-hover/img:scale-105 transition duration-500"
                  src={slide.imgSrc}
                  alt={`Slide ${index + 1}`}
                  priority={index === 0 || index === 1}
                  width={400}
                  height={400}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 mt-8">
        {sliderData.map((_, index) => (
          <div
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`h-2 w-2 rounded-full cursor-pointer transition-colors duration-300 ${
              currentSlide === index ? "bg-orange-600" : "bg-gray-500/30"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
