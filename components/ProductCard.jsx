import React from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';

const ProductCard = ({ product }) => {
    const { currency, router } = useAppContext()

    // Retrieve dynamically calculated rating from database aggregation
    const avgRating = product.avgRating !== undefined ? Number(product.avgRating) : 0;
    const totalReviews = product.totalReviews !== undefined ? Number(product.totalReviews) : 0;
    const isOutOfStock = product.stock === 0;
    const isLowStock = product.stock > 0 && product.stock < 5;

    return (
        <div
            onClick={() => { 
                router.push('/product/' + product._id); 
                scrollTo(0, 0); 
            }}
            className="flex flex-col items-start gap-0.5 max-w-[200px] w-full cursor-pointer relative"
        >
            <div className="cursor-pointer group relative bg-gray-500/10 rounded-lg w-full h-52 flex items-center justify-center overflow-hidden">
                {/* 🏷️ Urgency Badges */}
                {isOutOfStock ? (
                    <div className="absolute top-2 left-2 z-10 bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md uppercase tracking-wider">
                        Sold Out
                    </div>
                ) : isLowStock ? (
                    <div className="absolute top-2 left-2 z-10 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md uppercase tracking-wider animate-pulse">
                        Only {product.stock} Left!
                    </div>
                ) : null}

                <Image
                    src={product.image[0]}
                    alt={product.name}
                    className={`group-hover:scale-105 transition object-cover w-4/5 h-4/5 md:w-full md:h-full ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
                    width={800}
                    height={800}
                />
                
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md z-10 hover:bg-gray-100 transition"
                >
                    <Image
                        className="h-3 w-3"
                        src={assets.heart_icon}
                        alt="heart_icon"
                    />
                </button>
            </div>

            <p className="md:text-base font-medium pt-2 w-full truncate text-gray-800">{product.name}</p>
            <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate">{product.description}</p>
            
            {/* Dynamic Star Ratings */}
            <div className="flex items-center gap-1.5 py-0.5">
                <p className="text-xs font-semibold text-gray-700">{avgRating > 0 ? avgRating.toFixed(1) : "No ratings"}</p>
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Image
                            key={index}
                            className="h-2.5 w-2.5"
                            src={
                                index < Math.floor(avgRating || 4) // Default fallback to 4 stars visual if no rating
                                    ? assets.star_icon
                                    : assets.star_dull_icon
                            }
                            alt="star_icon"
                        />
                    ))}
                </div>
                {totalReviews > 0 && (
                    <span className="text-[10px] text-gray-400 font-medium">({totalReviews})</span>
                )}
            </div>

            <div className="flex items-end justify-between w-full mt-1">
                <p className="text-base font-semibold text-orange-600">{currency}{product.offerPrice}</p>
                <button 
                    disabled={isOutOfStock}
                    className={`max-sm:hidden px-4 py-1.5 border rounded-full text-xs transition font-medium ${
                        isOutOfStock 
                            ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50' 
                            : 'text-gray-700 border-gray-300 hover:bg-orange-600 hover:border-orange-600 hover:text-white'
                    }`}
                >
                    {isOutOfStock ? "Out of stock" : "Buy now"}
                </button>
            </div>
        </div>
    )
}

export default ProductCard