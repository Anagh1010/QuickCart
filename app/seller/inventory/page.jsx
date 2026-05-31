'use client'
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";

const ManageStock = () => {
    const { getToken, user } = useAppContext();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    // Track input stock values per product
    const [stockInputs, setStockInputs] = useState({});

    const fetchSellerProducts = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/product/seller-list', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setProducts(data.products);
                
                // Initialize input states
                const inputs = {};
                data.products.forEach(p => {
                    inputs[p._id] = p.stock || 0;
                });
                setStockInputs(inputs);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSellerProducts();
        }
    }, [user]);

    const handleInputChange = (productId, val) => {
        setStockInputs(prev => ({
            ...prev,
            [productId]: val
        }));
    };

    const handleStockUpdateSubmit = async (productId) => {
        const stockVal = stockInputs[productId];
        if (stockVal === undefined || isNaN(Number(stockVal)) || Number(stockVal) < 0) {
            toast.error("Please enter a valid stock count");
            return;
        }

        setUpdatingId(productId);
        try {
            const token = await getToken();
            const { data } = await axios.post("/api/product/update-stock", {
                productId,
                stock: Number(stockVal)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Stock level updated successfully!");
                // Update local products state
                setProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: Number(stockVal) } : p));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update stock");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleQuickIncrement = (productId, amount) => {
        const currentInputVal = Number(stockInputs[productId]) || 0;
        const nextVal = Math.max(0, currentInputVal + amount);
        handleInputChange(productId, nextVal);
    };

    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between bg-gray-50 text-gray-800">
            {loading ? (
                <Loading />
            ) : (
                <div className="w-full md:p-10 p-4 max-w-5xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-950">Inventory Control</h2>
                            <p className="text-xs text-gray-500 font-medium">Auto-tracked customer decrements and direct merchant replenishment.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center w-full overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-xs">
                        <table className="table-fixed w-full overflow-hidden text-sm">
                            <thead className="text-gray-900 text-left bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="w-2/5 px-6 py-4 font-semibold">Product</th>
                                    <th className="px-6 py-4 font-semibold max-sm:hidden">Category</th>
                                    <th className="px-6 py-4 font-semibold">Auto-Track Status</th>
                                    <th className="px-6 py-4 font-semibold w-72">Restock / Adjust</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-500 divide-y divide-gray-100">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-gray-400 italic">No products listed yet. Please add a product to track inventory.</td>
                                    </tr>
                                ) : (
                                    products.map((product) => {
                                        const currentStock = product.stock || 0;
                                        return (
                                            <tr key={product._id} className="hover:bg-gray-50/50 transition">
                                                {/* Product Info */}
                                                <td className="px-6 py-4 flex items-center space-x-3 truncate">
                                                    <div className="bg-gray-100 rounded-lg p-1.5 shrink-0 border border-gray-200/50">
                                                        <Image
                                                            src={product.image[0]}
                                                            alt={product.name}
                                                            className="w-12 h-12 object-contain"
                                                            width={64}
                                                            height={64}
                                                        />
                                                    </div>
                                                    <span className="font-semibold text-gray-950 truncate">{product.name}</span>
                                                </td>

                                                {/* Category */}
                                                <td className="px-6 py-4 max-sm:hidden font-medium text-gray-600">{product.category}</td>

                                                {/* Auto-Track Status Indicator */}
                                                <td className="px-6 py-4">
                                                    {currentStock === 0 ? (
                                                        <span className="inline-flex items-center text-[10px] text-red-700 bg-red-50 border border-red-200 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                            Out Of Stock
                                                        </span>
                                                    ) : currentStock < 5 ? (
                                                        <span className="inline-flex items-center text-[10px] text-orange-700 bg-orange-50 border border-orange-200 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                                                            Low Stock ({currentStock})
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-[10px] text-green-700 bg-green-50 border border-green-200 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                            In Stock ({currentStock})
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Replenishment Adjustment Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {/* Increment controls */}
                                                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                                            <button 
                                                                onClick={() => handleQuickIncrement(product._id, -5)}
                                                                className="px-2 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                                                                title="Reduce by 5"
                                                            >
                                                                -5
                                                            </button>
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                value={stockInputs[product._id] !== undefined ? stockInputs[product._id] : 0}
                                                                onChange={(e) => handleInputChange(product._id, e.target.value)}
                                                                className="w-12 text-center text-xs font-bold text-gray-800 outline-none border-none bg-transparent"
                                                            />
                                                            <button 
                                                                onClick={() => handleQuickIncrement(product._id, 10)}
                                                                className="px-2 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                                                                title="Add 10"
                                                            >
                                                                +10
                                                            </button>
                                                        </div>
                                                        
                                                        {/* Save button */}
                                                        <button 
                                                            disabled={updatingId === product._id}
                                                            onClick={() => handleStockUpdateSubmit(product._id)}
                                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                                                        >
                                                            {updatingId === product._id ? "Saving..." : "Save"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default ManageStock;
