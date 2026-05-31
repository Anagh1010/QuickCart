"use client"
import React, { useEffect, useState, useTransition } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";

const Product = () => {
    const { id } = useParams();
    const { products, router, addToCart, user, currency } = useAppContext();

    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    
    // Reviews & Stats states
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0, starBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    const [reviewsLoading, setReviewsLoading] = useState(true);
    
    // React 19 Submission Transitions
    const [isPending, startTransition] = useTransition();

    const fetchProductData = async () => {
        try {
            const res = await fetch(`/api/product/list?search=${encodeURIComponent(id)}`);
            const product = products.find(p => p._id === id);
            
            if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
                const data = await res.json();
            }

            if (product) {
                const stockRes = await fetch(`/api/product/list`);
                if (stockRes.ok && stockRes.headers.get("content-type")?.includes("application/json")) {
                    const stockData = await stockRes.json();
                    if (stockData.success) {
                        const freshProduct = stockData.products.find(p => p._id === id);
                        setProductData(freshProduct || product);
                        return;
                    }
                }
                setProductData(product);
            }
        } catch (err) {
            const product = products.find(p => p._id === id);
            setProductData(product);
        }
    };

    const fetchReviews = async () => {
        setReviewsLoading(true);
        try {
            const res = await fetch(`/api/review/list?productId=${id}`);
            if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
                const data = await res.json();
                if (data.success) {
                    setReviews(data.reviews);
                    setStats(data.stats);
                }
            } else {
                throw new Error("Invalid server reviews response");
            }
        } catch (error) {
            console.error("Failed to load reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchProductData();
            fetchReviews();
        }
    }, [id, products.length]);

    // React 19 Form Action Handler
    const handleReviewSubmit = async (formData) => {
        const rating = formData.get("rating");
        const comment = formData.get("comment");

        if (!rating || !comment) {
            alert("Please provide both a star rating and a written comment.");
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch("/api/review/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productId: id,
                        rating: Number(rating),
                        comment,
                        userName: user?.fullName || user?.firstName || "Anonymous Customer",
                        userImage: user?.imageUrl || ""
                    })
                });
                const data = await res.json();
                if (data.success) {
                    fetchReviews();
                } else {
                    alert(data.message);
                }
            } catch (err) {
                alert("Failed to submit review. Please try again.");
            }
        });
    };

    if (!productData) return <Loading />;

    const isOutOfStock = productData.stock === 0;
    const isLowStock = productData.stock > 0 && productData.stock < 5;

    return (
        <>
            <Navbar />
            <div className="px-6 md:px-16 lg:px-32 pt-10 pb-16 space-y-12 bg-gray-50/50 min-h-screen text-gray-800">
                {/* 1. Main Info Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-6 md:p-10 rounded-3xl border border-gray-200 shadow-xs">
                    {/* Left Frame: Images Showcase */}
                    <div className="flex flex-col gap-4">
                        <div className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center p-6 border border-gray-200/50 relative">
                            <Image
                                src={mainImage || productData.image[0]}
                                alt={productData.name}
                                className="w-full max-h-96 object-contain"
                                width={1280}
                                height={720}
                                priority
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {productData.image.map((image, index) => (
                                <div
                                    key={index}
                                    onClick={() => setMainImage(image)}
                                    className={`cursor-pointer rounded-xl overflow-hidden bg-gray-100 p-2 border transition ${mainImage === image ? 'border-orange-500 bg-white ring-2 ring-orange-100' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <Image
                                        src={image}
                                        alt="thumbnail"
                                        className="w-full h-auto object-contain max-h-16"
                                        width={1280}
                                        height={720}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Frame: Specifications & Actions */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-gray-900 leading-tight mb-2">
                                {productData.name}
                            </h1>

                            {/* Live Star Ratings Breakdown */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <Image 
                                            key={index} 
                                            className="h-4 w-4" 
                                            src={index < Math.floor(stats.avgRating || 4) ? assets.star_icon : assets.star_dull_icon} 
                                            alt="star" 
                                        />
                                    ))}
                                </div>
                                <p className="text-sm font-semibold text-gray-700">
                                    {stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}` : "No Ratings"}
                                </p>
                                <span className="text-gray-400 text-xs font-medium">• {stats.totalReviews} customer reviews</span>
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                {productData.description}
                            </p>

                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="text-3xl font-bold text-orange-600">{currency}{productData.offerPrice}</span>
                                <span className="text-base text-gray-400 line-through">{currency}{productData.price}</span>
                            </div>

                            <hr className="border-gray-100 mb-6" />

                            {/* Details Table */}
                            <table className="table-auto w-full max-w-sm mb-6 text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-2 text-gray-400 font-medium">Category</td>
                                        <td className="py-2 text-gray-800 font-semibold">{productData.category}</td>
                                    </tr>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-2 text-gray-400 font-medium">Inventory Availability</td>
                                        <td className="py-2">
                                            {isOutOfStock ? (
                                                <span className="text-red-500 font-bold uppercase text-xs">Out of stock</span>
                                            ) : isLowStock ? (
                                                <span className="text-orange-600 font-bold uppercase text-xs animate-pulse">Only {productData.stock} units left!</span>
                                            ) : (
                                                <span className="text-green-600 font-bold uppercase text-xs">In stock ({productData.stock} available)</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Cart / Checkout Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <button 
                                disabled={isOutOfStock}
                                onClick={() => addToCart(productData._id)} 
                                className={`w-full py-4.5 rounded-xl font-semibold transition cursor-pointer text-sm shadow-xs ${
                                    isOutOfStock 
                                        ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                                }`}
                            >
                                Add to Cart
                            </button>
                            <button 
                                disabled={isOutOfStock}
                                onClick={() => { 
                                    addToCart(productData._id); 
                                    router.push(user ? '/cart' : ''); 
                                }} 
                                className={`w-full py-4.5 rounded-xl font-semibold transition cursor-pointer text-sm shadow-xs ${
                                    isOutOfStock 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                }`}
                            >
                                Buy now
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Customer Reviews Loop & Stars Aggregates */}
                <div className="bg-white p-6 md:p-10 rounded-3xl border border-gray-200 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Stars Breakdown Column */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Feedback</h3>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Image key={index} className="h-5 w-5" src={index < Math.floor(stats.avgRating || 4) ? assets.star_icon : assets.star_dull_icon} alt="star" />
                                ))}
                            </div>
                            <span className="text-base font-bold text-gray-800">{stats.avgRating.toFixed(1)} out of 5</span>
                        </div>

                        {/* Breakdown Bars */}
                        <div className="flex flex-col gap-2.5">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = stats.starBreakdown[star] || 0;
                                const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                                return (
                                    <div key={star} className="flex items-center text-xs gap-3">
                                        <span className="w-12 text-gray-500 font-medium whitespace-nowrap">{star} star</span>
                                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50">
                                            <div 
                                                className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-gray-400 font-medium text-right">{pct.toFixed(0)}%</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Review Form - React 19 Action Form */}
                        {user ? (
                            <form action={handleReviewSubmit} className="mt-8 border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-3">Write a Customer Review</h4>
                                
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Star Rating</label>
                                    <select 
                                        name="rating" 
                                        className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-gray-50 font-medium text-gray-700 cursor-pointer"
                                    >
                                        <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                                        <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
                                        <option value="3">⭐⭐⭐ (3 - Average)</option>
                                        <option value="2">⭐⭐ (2 - Disappointed)</option>
                                        <option value="1">⭐ (1 - Unacceptable)</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Review Comment</label>
                                    <textarea 
                                        name="comment"
                                        placeholder="What did you like or dislike about this product?"
                                        rows="3"
                                        className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-gray-50 text-gray-700 resize-none leading-relaxed"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center"
                                >
                                    {isPending ? "Submitting Review..." : "Submit Review"}
                                </button>
                            </form>
                        ) : (
                            <div className="mt-8 border-t border-gray-100 pt-6 bg-gray-50 p-4 rounded-xl border border-gray-200/50 text-center">
                                <p className="text-xs text-gray-500 font-medium">Please sign in to write a product review.</p>
                            </div>
                        )}
                    </div>

                    {/* Customer reviews listing */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-4">Customer Reviews</h3>

                        {reviewsLoading ? (
                            <div className="flex justify-center py-10"><Loading /></div>
                        ) : reviews.length === 0 ? (
                            <p className="text-xs text-gray-400 font-medium italic py-6">No product reviews have been written yet. Be the first to share your experience!</p>
                        ) : (
                            <div className="flex flex-col gap-5 divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-2">
                                {reviews.map((rev) => (
                                    <div key={rev._id} className="pt-5 first:pt-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            {rev.userImage ? (
                                                <Image src={rev.userImage} alt="avatar" className="w-8 h-8 rounded-full border" width={32} height={32} />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold uppercase">{rev.userName.charAt(0)}</div>
                                            )}
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-900">{rev.userName}</h5>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-0.5">
                                                        {Array.from({ length: 5 }).map((_, index) => (
                                                            <Image key={index} className="h-2.5 w-2.5" src={index < rev.rating ? assets.star_icon : assets.star_dull_icon} alt="star" />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium">{new Date(rev.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Purchase Verifications Tag */}
                                        {rev.isVerified && (
                                            <span className="inline-flex items-center text-[10px] text-green-700 bg-green-50 border border-green-200/50 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider mb-2">
                                                ✓ Verified Purchase
                                            </span>
                                        )}

                                        <p className="text-xs text-gray-600 leading-relaxed pl-1">{rev.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Featured Showcase Grid */}
                <div className="flex flex-col items-center">
                    <div className="flex flex-col items-center mb-6">
                        <p className="text-2xl font-bold">Featured <span className="text-orange-600">Products</span></p>
                        <div className="w-20 h-0.5 bg-orange-600 mt-2"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-2 pb-14 w-full">
                        {products.slice(0, 5).map((product, index) => (
                            <ProductCard key={index} product={product} />
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Product;