'use client'
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const ManageCoupons = () => {
    const { getToken, user, currency } = useAppContext();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState("percentage");
    const [discountValue, setDiscountValue] = useState("");
    const [minCartAmount, setMinCartAmount] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    const fetchCoupons = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/coupon/manage", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setCoupons(data.coupons);
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
            fetchCoupons();
        }
    }, [user]);

    const handleCreateCouponSubmit = async (e) => {
        e.preventDefault();
        if (!code || !discountValue || !expiryDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getToken();
            const { data } = await axios.post("/api/coupon/manage", {
                code: code.trim(),
                discountType,
                discountValue: Number(discountValue),
                minCartAmount: Number(minCartAmount) || 0,
                expiryDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Coupon code created successfully!");
                // Clear form fields
                setCode("");
                setDiscountValue("");
                setMinCartAmount("");
                setExpiryDate("");
                fetchCoupons(); // Refresh lists
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create coupon");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCoupon = async (couponId) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        try {
            const token = await getToken();
            const { data } = await axios.delete(`/api/coupon/manage?id=${couponId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                toast.success("Coupon deleted successfully!");
                fetchCoupons(); // Refresh lists
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete coupon");
        }
    };

    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between bg-gray-50 text-gray-800">
            {loading ? (
                <Loading />
            ) : (
                <div className="w-full md:p-10 p-4 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Header Banner */}
                    <div className="lg:col-span-3">
                        <h2 className="text-2xl font-semibold text-gray-950">Promotional Coupons</h2>
                        <p className="text-xs text-gray-500 font-medium">Create and manage marketing promo codes for your buyers.</p>
                    </div>

                    {/* Left Frame: Create Coupon Form Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs h-fit">
                        <h3 className="text-lg font-bold text-gray-950 mb-4 pb-2 border-b border-gray-100">Launch Coupon</h3>
                        
                        <form onSubmit={handleCreateCouponSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
                            <div>
                                <label className="block text-gray-400 mb-1.5 uppercase tracking-wider">Coupon Code</label>
                                <input 
                                    type="text" 
                                    placeholder="E.g., SAVE20, FREESHIP"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-white font-medium text-gray-800 uppercase"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1.5 uppercase tracking-wider">Discount Type</label>
                                <select 
                                    value={discountType} 
                                    onChange={(e) => setDiscountType(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-white font-medium text-gray-800 cursor-pointer"
                                >
                                    <option value="percentage">Percentage Discount (%)</option>
                                    <option value="flat">Flat Dollar Discount ($)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1.5 uppercase tracking-wider">Discount Value</label>
                                <input 
                                    type="number" 
                                    placeholder={discountType === "percentage" ? "Value (e.g. 20 for 20%)" : "Value (e.g. 15 for $15)"}
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-white font-medium text-gray-800"
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1.5 uppercase tracking-wider">Min Purchase Threshold ({currency})</label>
                                <input 
                                    type="number" 
                                    placeholder="E.g., 50 (0 for no limit)"
                                    value={minCartAmount}
                                    onChange={(e) => setMinCartAmount(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-white font-medium text-gray-800"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1.5 uppercase tracking-wider">Expiration Date</label>
                                <input 
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-white font-medium text-gray-800 cursor-pointer"
                                    required
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50 mt-2"
                            >
                                {isSubmitting ? "Creating..." : "Create Coupon"}
                            </button>
                        </form>
                    </div>

                    {/* Right Frame: Existing Coupon List Table */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs h-fit">
                        <h3 className="text-lg font-bold text-gray-950 mb-4 pb-2 border-b border-gray-100">Active Coupons</h3>

                        <div className="w-full overflow-hidden rounded-xl border border-gray-100">
                            <table className="table-fixed w-full text-xs text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-24">Code</th>
                                        <th className="px-4 py-3 font-semibold">Value</th>
                                        <th className="px-4 py-3 font-semibold">Min Spend</th>
                                        <th className="px-4 py-3 font-semibold max-sm:hidden">Expires</th>
                                        <th className="px-4 py-3 font-semibold w-20 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 divide-y divide-gray-100">
                                    {coupons.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 italic text-gray-400">No promo coupons available yet.</td>
                                        </tr>
                                    ) : (
                                        coupons.map((coupon) => (
                                            <tr key={coupon._id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-4 py-3 font-bold text-orange-600 uppercase">{coupon.code}</td>
                                                <td className="px-4 py-3 font-medium">
                                                    {coupon.discountType === "percentage" 
                                                        ? `${coupon.discountValue}% Off` 
                                                        : `${currency}${coupon.discountValue} Flat`}
                                                </td>
                                                <td className="px-4 py-3 font-medium">{currency}{coupon.minCartAmount}</td>
                                                <td className="px-4 py-3 font-medium max-sm:hidden">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteCoupon(coupon._id)}
                                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold cursor-pointer transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default ManageCoupons;
