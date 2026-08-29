"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { assets } from "@/assets/assets";
import { useRouter } from "next/navigation";
import LayoutContainer from "@/components/layout/LayoutContainer";

const HomeHeroSlider = ({ products }) => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = useMemo(() => {
    const findProduct = (terms) => products.find((product) => terms.some((term) => product.name.toLowerCase().includes(term)));

    return [
      {
        id: "macbook",
        eyebrow: "Exclusive deal · 40% off",
        title: "Power meets elegance with MacBook Pro",
        description: "Built for demanding creative work and all-day productivity.",
        product: findProduct(["macbook", "pro 16"]),
        fallbackImage: assets.header_macbook_image,
        theme: "from-blue-950 via-slate-900 to-gray-900",
      },
      {
        id: "playstation",
        eyebrow: "Limited stock",
        title: "Next-level gaming starts with PlayStation 5",
        description: "Immersive worlds, faster loading, and responsive play.",
        product: findProduct(["playstation", "ps5"]),
        fallbackImage: assets.header_playstation_image,
        theme: "from-indigo-950 via-blue-950 to-slate-900",
      },
      {
        id: "samsung",
        eyebrow: "$100 off for a limited time",
        title: "Galaxy S25 brings next-gen innovation home",
        description: "A refined flagship experience in a compact everyday design.",
        product: findProduct(["samsung", "s23", "s25"]),
        fallbackImage: assets.samsung_s23phone_image,
        theme: "from-cyan-950 via-slate-900 to-gray-900",
      },
    ];
  }, [products]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((previous) => (previous + 1) % slides.length), 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const openProduct = (slide) => {
    router.push(slide.product ? `/product/${slide.product._id}` : "/all-products");
  };

  return (
    <section aria-label="Featured offers" className="pt-6 sm:pt-10">
      <LayoutContainer size="wide">
        <div className="relative overflow-hidden rounded-[32px] bg-gray-950 shadow-2xl shadow-blue-950/15">
          <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {slides.map((slide, index) => (
              <div className={`grid min-w-full items-center gap-8 bg-gradient-to-br ${slide.theme} px-5 py-10 text-white sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14 xl:px-16`} key={slide.id}>
                <div>
                  <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em]">{slide.eyebrow}</span>
                  <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{slide.title}</h1>
                  <p className="mt-5 max-w-md text-base leading-7 text-white/70">{slide.description}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-200" onClick={() => openProduct(slide)}>Shop now</button>
                    <button className="rounded-full border border-white/25 px-7 py-3 text-sm font-medium transition hover:bg-white/10" onClick={() => openProduct(slide)}>Explore deals</button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="flex size-56 items-center justify-center rounded-[36px] bg-white/10 backdrop-blur-sm sm:size-72 lg:size-80">
                    <Image alt={slide.title} className="max-h-44 max-w-44 object-contain sm:max-h-64 sm:max-w-64 lg:max-h-72 lg:max-w-72" height={400} priority={index === 0} src={slide.product?.image?.[0] || slide.fallbackImage} width={400} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button aria-label={`Go to slide ${index + 1}`} className={`h-2 rounded-full transition-all ${currentSlide === index ? "w-8 bg-white" : "size-2 bg-white/40 hover:bg-white/70"}`} key={slide.id} onClick={() => setCurrentSlide(index)} />
            ))}
          </div>
        </div>
      </LayoutContainer>
    </section>
  );
};

export default HomeHeroSlider;
