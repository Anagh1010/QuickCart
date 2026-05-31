'use client'
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import Footer from "@/components/seller/Footer";
import axios from "axios";
import toast from "react-hot-toast";

const CATEGORIES = ["Earphone", "Headphone", "Watch", "Mobile", "Laptop", "Camera", "Console"];

const EditProduct = () => {
    const { id } = useParams();
    const { getToken, router, products, user } = useAppContext();

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fields state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Earphone");
    const [price, setPrice] = useState("");
    const [offerPrice, setOfferPrice] = useState("");
    const [stock, setStock] = useState("0");

    // Images state
    const [existingImages, setExistingImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);

    const fetchProductData = async () => {
        try {
            // Retrieve product list to get dynamic stock count
            const res = await fetch(`/api/product/list`);
            const data = await res.json();
            
            let product = null;
            if (data.success) {
                product = data.products.find(p => p._id === id);
            }

            // Fallback to Context products if direct fetch fails
            if (!product) {
                product = products.find(p => p._id === id);
            }

            if (product) {
                setName(product.name);
                setDescription(product.description);
                setCategory(product.category || "Earphone");
                setPrice(product.price);
                setOfferPrice(product.offerPrice);
                setStock(product.stock !== undefined ? product.stock.toString() : "0");
                setExistingImages(product.image || []);
            } else {
                toast.error("Product not found");
                router.push("/seller/product-list");
            }
        } catch (error) {
            toast.error("Failed to retrieve product details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && user) {
            fetchProductData();
        }
    }, [id, user, products.length]);

    const handleRemoveExistingImage = (imgUrl) => {
        setExistingImages(prev => prev.filter(url => url !== imgUrl));
    };

    const handleNewFileChange = (index, file) => {
        const updated = [...newFiles];
        updated[index] = file;
        setNewFiles(updated);
    };

    const handleRemoveNewFile = (index) => {
        const updated = [...newFiles];
        updated[index] = null;
        setNewFiles(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (existingImages.length === 0 && newFiles.filter(Boolean).length === 0) {
            toast.error("At least one product image is required.");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();

        formData.append("productId", id);
        formData.append("name", name);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("price", price);
        formData.append("offerPrice", offerPrice);
        formData.append("stock", stock);

        // Append remaining existing images
        existingImages.forEach(img => {
            formData.append("existingImages", img);
        });

        // Append new uploaded file objects
        newFiles.forEach(file => {
            if (file) {
                formData.append("images", file);
            }
        });

        try {
            const token = await getToken();
            const { data } = await axios.post("/api/product/edit", formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });

            if (data.success) {
                toast.success("Listing updated successfully!");
                router.push("/seller/product-list");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update product details");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between bg-gray-50 text-gray-800">
            <div className="w-full md:p-10 p-4 max-w-lg mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-950">Edit Listing</h2>
                    <p className="text-xs text-gray-500 font-medium">Update details, restock count, or add/remove product images.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs text-sm">
                    {/* 📷 Existing Images Section */}
                    <div>
                        <p className="text-sm font-semibold text-gray-800 mb-2">Current Images</p>
                        {existingImages.length === 0 ? (
                            <p className="text-xs text-gray-400 italic mb-3">No images saved</p>
                        ) : (
                            <div className="flex flex-wrap gap-3 mb-4">
                                {existingImages.map((img, idx) => (
                                    <div key={idx} className="relative rounded-xl border p-1 bg-gray-50 w-20 h-20 group">
                                        <Image
                                            src={img}
                                            alt="product"
                                            className="w-full h-full object-contain rounded-lg"
                                            width={60}
                                            height={60}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExistingImage(img)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold shadow-md cursor-pointer transition"
                                            title="Delete Image"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 📷 Upload New Images Section */}
                    <div>
                        <p className="text-sm font-semibold text-gray-800 mb-2">Upload More Images</p>
                        <div className="flex flex-wrap items-center gap-3">
                            {[...Array(4)].map((_, index) => {
                                const fileObj = newFiles[index];
                                return (
                                    <label key={index} htmlFor={`image${index}`} className="relative cursor-pointer">
                                        <input 
                                            onChange={(e) => handleNewFileChange(index, e.target.files[0])} 
                                            type="file" 
                                            id={`image${index}`} 
                                            hidden 
                                            accept="image/*"
                                        />
                                        <Image
                                            className="max-w-16 rounded-xl border p-1 object-contain hover:border-gray-300 transition w-16 h-16 bg-gray-50"
                                            src={fileObj ? URL.createObjectURL(fileObj) : assets.upload_area}
                                            alt="upload"
                                            width={64}
                                            height={64}
                                        />
                                        {fileObj && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRemoveNewFile(index);
                                                }}
                                                className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold shadow-md cursor-pointer hover:bg-gray-900 transition"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* 🏷️ Product Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="product-name">
                            Product Name
                        </label>
                        <input
                            id="product-name"
                            type="text"
                            placeholder="Product Title"
                            className="outline-hidden py-2.5 px-3.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:border-gray-400 text-xs"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />
                    </div>

                    {/* 📝 Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="product-description">
                            Description
                        </label>
                        <textarea
                            id="product-description"
                            rows={3}
                            className="outline-hidden py-2.5 px-3.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:border-gray-400 resize-none leading-relaxed text-xs"
                            placeholder="Tell buyers about your product..."
                            onChange={(e) => setDescription(e.target.value)}
                            value={description}
                            required
                        />
                    </div>

                    {/* Category Select & Pricing Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="category">
                                Category
                            </label>
                            <select
                                id="category"
                                className="outline-hidden py-2.5 px-3.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:border-gray-400 text-xs cursor-pointer"
                                onChange={(e) => setCategory(e.target.value)}
                                value={category}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="product-stock">
                                Live Stock
                            </label>
                            <input
                                id="product-stock"
                                type="number"
                                placeholder="0"
                                className="outline-hidden py-2.5 px-3.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:border-gray-400 text-xs"
                                onChange={(e) => setStock(e.target.value)}
                                value={stock}
                                min="0"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="product-price">
                                Base Price ($)
                            </label>
                            <input
                                id="product-price"
                                type="number"
                                placeholder="0"
                                className="outline-hidden py-2.5 px-3.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:border-gray-400 text-xs"
                                onChange={(e) => setPrice(e.target.value)}
                                value={price}
                                min="1"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="offer-price">
                                Offer Price ($)
                            </label>
                            <input
                                id="offer-price"
                                type="number"
                                placeholder="0"
                                className="outline-hidden py-2.5 px-3.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:border-gray-400 text-xs"
                                onChange={(e) => setOfferPrice(e.target.value)}
                                value={offerPrice}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Options */}
                    <div className="flex items-center gap-3 pt-2">
                        <button 
                            type="button"
                            onClick={() => router.push("/seller/product-list")}
                            className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer text-xs"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition shadow-md cursor-pointer disabled:opacity-50 text-xs"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default EditProduct;
