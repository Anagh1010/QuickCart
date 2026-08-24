"use client";

import Link from "next/link";
import Image from "next/image";
import { assets } from "@/assets/assets";
import SectionHeading from "@/components/layout/SectionHeading";

const categories = [
  { filter: "Headphone,Earphone", image: assets.apple_earphone_image, name: "Audio", detail: "Headphones & buds" },
  { filter: "Laptop", image: assets.macbook_image, name: "Computing", detail: "Laptops & accessories" },
  { filter: "Console", image: assets.md_controller_image, name: "Gaming", detail: "Consoles & controls" },
  { filter: "Camera", image: assets.cannon_camera_image, name: "Photography", detail: "Cameras & gear" },
  { filter: "Watch", image: assets.venu_watch_image, name: "Wearables", detail: "Smart watches" },
];

const getCategoryHref = (filter) => `/all-products?category=${encodeURIComponent(filter)}&sort=newest`;

const CategoryRail = () => (
  <section className="py-16">
    <SectionHeading description="Browse the categories customers explore most." eyebrow="Shop by category" title="Find it faster" />
    <div className="mx-auto mt-10 grid w-full max-w-[1440px] gap-4 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-5 xl:px-12">
      {categories.map((category) => (
        <Link className="group relative flex h-48 items-end overflow-hidden rounded-3xl bg-gray-100 p-5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/10" href={getCategoryHref(category.filter)} key={category.name}>
          <Image alt="" className="absolute right-0 top-0 h-full w-full object-contain p-4 opacity-80 transition group-hover:scale-105" height={220} src={category.image} width={220} />
          <div className="relative z-10 rounded-2xl bg-white/85 px-4 py-3 backdrop-blur">
            <p className="font-semibold text-gray-900">{category.name}</p>
            <p className="mt-1 text-xs text-gray-500">{category.detail}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default CategoryRail;
