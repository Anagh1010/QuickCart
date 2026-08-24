"use client";

import Link from "next/link";
import React from "react";
import ProductCard from "./ProductCard";
import SectionHeading from "@/components/layout/SectionHeading";
import LayoutContainer from "@/components/layout/LayoutContainer";

const HomeProducts = ({ products }) => {
  return (
    <section className="py-16">
      <SectionHeading
        action={
          <Link className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-500 hover:text-blue-600" href="/all-products">
            View all products
          </Link>
        }
        description="Fresh arrivals and customer favorites, updated continuously."
        eyebrow="Popular right now"
        title="Trending this week"
      />
      <LayoutContainer size="wide">
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              loadEagerly={index < 5}
            />
          ))}
        </div>
      </LayoutContainer>
    </section>
  );
};

export default HomeProducts;
