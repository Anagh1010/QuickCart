'use client'
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const ProductList = () => {
  const { router, getToken, user } = useAppContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSellerProduct = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/product/seller-list', { 
        headers: { Authorization: `Bearer ${token}` } 
      })

      if (data.success) {
        setProducts(data.products)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to permanently delete this listing? This will also remove all its reviews.")) return;

    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/product/delete?id=${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message || "Product deleted successfully!");
        fetchSellerProduct(); // Refresh list
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  useEffect(() => {
    if (user) {
      fetchSellerProduct();
    }
  }, [user])

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between bg-gray-50 text-gray-800">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full md:p-10 p-4 max-w-5xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-950">Listed Products</h2>
            <p className="text-xs text-gray-500 font-medium">View, edit details, or remove your store product listings.</p>
          </div>

          <div className="flex flex-col items-center w-full overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-xs">
            <table className="table-fixed w-full overflow-hidden text-sm">
              <thead className="text-gray-900 text-left bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-2/5 px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold max-sm:hidden">Category</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold w-72 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-500 divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-400 italic">No products listed in your store yet.</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition">
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
                      <td className="px-6 py-4 max-sm:hidden font-medium text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 font-semibold text-orange-600">${product.offerPrice}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Visit Button */}
                          <button 
                            onClick={() => router.push(`/product/${product._id}`)} 
                            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition cursor-pointer flex items-center gap-1"
                            title="Visit Page"
                          >
                            <span>Visit</span>
                            <Image
                              className="h-3 w-3 opacity-60"
                              src={assets.redirect_icon}
                              alt="redirect"
                            />
                          </button>
                          
                          {/* Edit Button */}
                          <button 
                            onClick={() => router.push(`/seller/edit-product/${product._id}`)} 
                            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                            title="Edit Details"
                          >
                            Edit
                          </button>
                          
                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDeleteProduct(product._id)} 
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Remove Product"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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

export default ProductList;