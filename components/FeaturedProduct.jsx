import React from "react";
import Link from "next/link";
import { assets } from "@/assets/assets";
import Image from "next/image";

const products = [
  {
    id: 1,
    image: assets.girl_with_headphone_image,
    title: "Unparalleled Sound",
    description: "Experience crystal-clear audio with premium headphones.",
  },
  {
    id: 2,
    image: assets.girl_with_earphone_image,
    title: "Stay Connected",
    description: "Compact and stylish earphones for every occasion.",
  },
  {
    id: 3,
    image: assets.boy_with_laptop_image,
    title: "Power in Every Pixel",
    description: "Shop the latest laptops for work, gaming, and more.",
  },
];

const FeaturedProduct = () => {
  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 xl:px-12">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Featured collections</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Designed for how you live</h2>
          <p className="mt-3 text-base leading-6 text-gray-500">Hand-picked experiences across sound, work, and everyday carry.</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:px-12">
        {products.map(({ id, image, title, description }) => (
          <article key={id} className="group relative min-h-80 overflow-hidden rounded-[32px] bg-gray-900">
            <Image
              fill
              src={image}
              alt={title}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-7 pt-20 text-white">
              <h3 className="text-xl font-semibold lg:text-2xl">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">{description}</p>
              <Link className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white hover:text-gray-950" href="/all-products">
                Shop collection
                <Image alt="" className="size-3" height={12} src={assets.redirect_icon} width={12} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturedProduct;
