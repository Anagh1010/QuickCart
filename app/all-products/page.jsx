'use client'
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";

const CATEGORIES = ["Earphone", "Headphone", "Watch", "Mobile", "Camera", "Laptop", "Console"];

const AllProductsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read initial filters from search parameters
    const initialSearch = searchParams.get("search") || "";
    const initialCategory = searchParams.get("category") || "";
    const initialMinPrice = searchParams.get("minPrice") || "";
    const initialMaxPrice = searchParams.get("maxPrice") || "";
    const initialInStock = searchParams.get("inStock") === "true";
    const initialSort = searchParams.get("sort") || "newest";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters state
    const [selectedCategories, setSelectedCategories] = useState(
        initialCategory ? initialCategory.split(",") : []
    );
    const [minPrice, setMinPrice] = useState(initialMinPrice);
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
    const [inStock, setInStock] = useState(initialInStock);
    const [sort, setSort] = useState(initialSort);

    // Dynamic product fetch based on URL params
    useEffect(() => {
        const fetchFilteredProducts = async () => {
            setLoading(true);
            setError("");
            try {
                const query = new URLSearchParams(searchParams.toString());
                const res = await fetch(`/api/product/list?${query.toString()}`);
                
                if (!res.ok) {
                    throw new Error(`Server returned status ${res.status}`);
                }

                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Server returned an invalid HTML or non-JSON response.");
                }

                const data = await res.json();
                if (data.success) {
                    setProducts(data.products);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message || "Failed to load products");
            } finally {
                setLoading(false);
            }
        };

        fetchFilteredProducts();
    }, [searchParams]);

    // Handle updating query parameters
    const applyFilters = (updatedCategories, updatedMinPrice, updatedMaxPrice, updatedInStock, updatedSort) => {
        const params = new URLSearchParams();

        // Keep search parameter if it exists
        const currentSearch = searchParams.get("search");
        if (currentSearch) params.set("search", currentSearch);

        if (updatedCategories && updatedCategories.length > 0) {
            params.set("category", updatedCategories.join(","));
        }
        if (updatedMinPrice) params.set("minPrice", updatedMinPrice);
        if (updatedMaxPrice) params.set("maxPrice", updatedMaxPrice);
        if (updatedInStock) params.set("inStock", "true");
        if (updatedSort) params.set("sort", updatedSort);

        router.push(`/all-products?${params.toString()}`, { scroll: false });
    };

    const handleCategoryChange = (cat) => {
        let nextCategories;
        if (selectedCategories.includes(cat)) {
            nextCategories = selectedCategories.filter((c) => c !== cat);
        } else {
            nextCategories = [...selectedCategories, cat];
        }
        setSelectedCategories(nextCategories);
        applyFilters(nextCategories, minPrice, maxPrice, inStock, sort);
    };

    const handlePriceChangeSubmit = (e) => {
        e.preventDefault();
        applyFilters(selectedCategories, minPrice, maxPrice, inStock, sort);
    };

    const handleStockToggle = () => {
        const nextInStock = !inStock;
        setInStock(nextInStock);
        applyFilters(selectedCategories, minPrice, maxPrice, nextInStock, sort);
    };

    const handleSortChange = (e) => {
        const nextSort = e.target.value;
        setSort(nextSort);
        applyFilters(selectedCategories, minPrice, maxPrice, inStock, nextSort);
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setMinPrice("");
        setMaxPrice("");
        setInStock(false);
        setSort("newest");
        router.push("/all-products", { scroll: false });
    };

    return (
        <>
            <Navbar />
            <div className="flex flex-col md:flex-row items-start gap-8 px-6 md:px-16 lg:px-32 py-10 min-h-screen bg-gray-50 text-gray-800">
                {/* 🛠️ Filters Sidebar */}
                <aside className="w-full md:w-64 shrink-0 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                        <button 
                            onClick={clearFilters}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium transition cursor-pointer"
                        >
                            Reset All
                        </button>
                    </div>

                    {/* 📦 Categories */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-3">Categories</h3>
                        <div className="flex flex-col gap-2">
                            {CATEGORIES.map((cat) => (
                                <label key={cat} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => handleCategoryChange(cat)}
                                        className="rounded-sm border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                                    />
                                    {cat}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 💳 Price Range */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-3">Price Range ($)</h3>
                        <form onSubmit={handlePriceChangeSubmit} className="flex items-center gap-2">
                            <input 
                                type="number" 
                                placeholder="Min" 
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-gray-50 text-center"
                            />
                            <span className="text-gray-400 text-xs">to</span>
                            <input 
                                type="number" 
                                placeholder="Max" 
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-gray-50 text-center"
                            />
                            <button 
                                type="submit" 
                                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                            >
                                Go
                            </button>
                        </form>
                    </div>

                    {/* 🟢 Stock Availability */}
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-800 select-none">
                            <input 
                                type="checkbox"
                                checked={inStock}
                                onChange={handleStockToggle}
                                className="rounded-sm border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                            />
                            In-Stock Items Only
                        </label>
                    </div>
                </aside>

                {/* 🛍️ Products Catalog */}
                <main className="w-full">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                        <div>
                            <div className="flex flex-col items-start">
                                <p className="text-xl font-semibold text-gray-900">
                                    {initialSearch ? `Search results for "${initialSearch}"` : "All Products"}
                                </p>
                                <span className="text-xs text-gray-500 font-medium">
                                    {products.length} {products.length === 1 ? "product" : "products"} found
                                </span>
                            </div>
                        </div>

                        {/* Sorting Dropdown */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Sort By:</span>
                            <select 
                                value={sort} 
                                onChange={handleSortChange}
                                className="text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-gray-50 font-medium cursor-pointer text-gray-700"
                            >
                                <option value="newest">Newest Arrivals</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="rating">Top Rated</option>
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Loader & Error Messaging */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loading />
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
                            <p className="text-red-500 font-medium text-sm">{error}</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No matching products found</h3>
                            <p className="text-gray-500 text-xs max-w-sm mx-auto">
                                Try adjusting your filter choices, search criteria, or clear the price range limits to discover other available products.
                            </p>
                            <button 
                                onClick={clearFilters}
                                className="mt-5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-14 w-full">
                            {products.map((product, index) => (
                                <ProductCard key={index} product={product} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    );
};

const AllProducts = () => {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loading />
            </div>
        }>
            <AllProductsContent />
        </Suspense>
    );
};

export default AllProducts;
