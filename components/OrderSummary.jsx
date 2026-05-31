import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrderSummary = () => {
  const { currency, router, getCartCount, getCartAmount, getToken, user, cartItems, setCartItems } = useAppContext()
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/user/get-address', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setUserAddresses(data.addresses)
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0])
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  // Promo code validation handler
  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsApplying(true);
    try {
      const token = await getToken();
      const { data } = await axios.post("/api/coupon/validate", {
        code: promoCode.trim(),
        cartAmount: getCartAmount()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setAppliedCoupon(data.coupon);
        toast.success(data.message || "Coupon applied successfully!");
      } else {
        setAppliedCoupon(null);
        toast.error(data.message || "Invalid coupon code");
      }
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || "Failed to validate coupon");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    toast.success("Coupon removed");
  };

  // Dynamic calculations incorporating discounts
  const subtotal = getCartAmount();
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      discount = Math.floor(subtotal * (appliedCoupon.discountValue / 100));
    } else if (appliedCoupon.discountType === "flat") {
      discount = appliedCoupon.discountValue;
    }
    discount = Math.min(discount, subtotal);
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = Math.floor(discountedSubtotal * 0.02);
  const totalAmount = discountedSubtotal + tax;

  const initializeRazorpay = (orderData) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "QuickCart",
      description: "Order Payment",
      order_id: orderData.id,
      handler: async (response) => {
        try {
          const freshToken = await getToken();
          const { data } = await axios.post('/api/order/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          }, {
            headers: { Authorization: `Bearer ${freshToken}` }
          });

          if (data.success) {
            toast.success("Payment successful!");
            setCartItems({});
            router.push('/order-placed');
          } else {
            toast.error(data.message || "Payment verification failed");
          }
        } catch (error) {
          toast.error("Payment verification failed. Please contact support.");
        }
        setIsProcessing(false);
      },
      prefill: {
        name: user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        contact: selectedAddress?.phoneNumber || user?.primaryPhoneNumber?.phoneNumber || "",
      },
      theme: {
        color: "#ea580c",
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          toast("Payment cancelled. Your order has been saved.", { icon: "ℹ️" });
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      setIsProcessing(false);
      toast.error("Payment failed: " + response.error.description);
    });
    rzp.open();
  };

  const createOrder = async () => {
    try {
      if (!user) {
        return toast('Please login to place order', {
          icon: '⚠️',
        })
      }
      
      if (!selectedAddress) {
        return toast.error('Please select an address')
      }

      let cartItemsArray = Object.keys(cartItems).map((key) => ({ product: key, quantity: cartItems[key] }))
      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0)

      if (cartItemsArray.length === 0) {
        return toast.error('Cart is empty')
      }

      setIsProcessing(true);
      const token = await getToken()

      const { data } = await axios.post('/api/order/create', {
        address: selectedAddress._id,
        items: cartItemsArray,
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        if (paymentMethod === 'COD') {
          toast.success(data.message)
          setCartItems({})
          router.push('/order-placed')
          setIsProcessing(false);
        } else {
          initializeRazorpay(data.order);
        }
      } else {
        toast.error(data.message)
        setIsProcessing(false);
      }

    } catch (error) {
      toast.error(error.message)
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user])

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5 rounded-2xl border border-gray-200/40">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        {/* Address Dropdown */}
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Select Address
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-hidden"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Select Address"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5 rounded-b-lg">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center text-orange-600 font-semibold"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Payment Radio Inputs */}
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Payment Method
          </label>
          <div className="flex flex-col gap-2">
            <label
              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                paymentMethod === 'COD'
                  ? 'border-orange-500 bg-orange-50/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-orange-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-gray-700 font-medium">Cash on Delivery (COD)</span>
            </label>
            <label
              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                paymentMethod === 'Online'
                  ? 'border-orange-500 bg-orange-50/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="Online"
                checked={paymentMethod === 'Online'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-orange-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-gray-700 font-medium">Pay Online (Razorpay)</span>
            </label>
          </div>
        </div>

        {/* Promo Code Submission Section */}
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Promo Code
          </label>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
              <div>
                <p className="text-xs font-bold text-green-800">COUPON APPLIED: {appliedCoupon.code}</p>
                <p className="text-[10px] text-green-600 font-medium">
                  {appliedCoupon.discountType === "percentage" 
                    ? `${appliedCoupon.discountValue}% Off your order` 
                    : `${currency}${appliedCoupon.discountValue} Flat Discount`}
                </p>
              </div>
              <button 
                onClick={handleRemoveCoupon} 
                className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="SAVE20, FREESHIP"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full text-xs outline-hidden p-2.5 text-gray-600 border border-gray-200 rounded-xl bg-white focus:border-gray-400"
              />
              <button 
                onClick={handleApplyCoupon}
                disabled={isApplying}
                className="bg-orange-600 text-white text-xs px-6 py-2.5 hover:bg-orange-700 rounded-xl font-bold cursor-pointer transition disabled:opacity-50"
              >
                {isApplying ? "..." : "Apply"}
              </button>
            </div>
          )}
        </div>

        <hr className="border-gray-500/30 my-5" />

        {/* Dynamic Financial Overview */}
        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Items {getCartCount()}</p>
            <p className="text-gray-800">{currency}{subtotal}</p>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-700 bg-green-50/50 p-2 rounded-lg">
              <p>Coupon Discount</p>
              <p>- {currency}{discount}</p>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-semibold text-green-600">FREE</p>
          </div>
          <div className="flex justify-between text-sm">
            <p className="text-gray-600">Tax (2%)</p>
            <p className="font-medium text-gray-800">{currency}{tax}</p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-bold border-t border-gray-200 pt-3 text-gray-900">
            <p>Total</p>
            <p>{currency}{totalAmount}</p>
          </div>
        </div>
      </div>

      <button
        onClick={createOrder}
        disabled={isProcessing}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl mt-6 transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
      >
        {isProcessing
          ? 'Processing...'
          : paymentMethod === 'Online'
            ? 'Pay Now'
            : 'Place Order'}
      </button>
    </div>
  );
};

export default OrderSummary;