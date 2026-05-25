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

  const fetchUserAddresses = async () => {
    try {
      
      const token = await getToken()
      const {data} = await axios.get('/api/user/get-address',{headers:{Authorization:`Bearer ${token}`}})
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

  const initializeRazorpay = (orderData) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "QuickCart",
      description: "Order Payment",
      order_id: orderData.id,
      handler: async (response) => {
        // Payment successful — get a fresh token and verify on server
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
        return toast('Please login to place order',{
          icon: '⚠️',
        })
      }
      
      if (!selectedAddress) {
        return toast.error('Please select an address')
      }

      let cartItemsArray = Object.keys(cartItems).map((key) => ({product:key, quantity:cartItems[key]}))
      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0)

      if (cartItemsArray.length === 0) {
        return toast.error('Cart is empty')
      }

      setIsProcessing(true);
      const token = await getToken()

      const { data } = await axios.post('/api/order/create',{
        address: selectedAddress._id,
        items: cartItemsArray,
        paymentMethod: paymentMethod
      },{
        headers: {Authorization:`Bearer ${token}`}
      })

      if (data.success) {
        if (paymentMethod === 'COD') {
          // COD: order is placed, cart cleared on server
          toast.success(data.message)
          setCartItems({})
          router.push('/order-placed')
          setIsProcessing(false);
        } else {
          // Online: open Razorpay checkout modal
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
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
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
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
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
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Payment Method
          </label>
          <div className="flex flex-col gap-2">
            <label
              className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                paymentMethod === 'COD'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-orange-600"
              />
              <span className="text-sm text-gray-700">Cash on Delivery (COD)</span>
            </label>
            <label
              className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                paymentMethod === 'Online'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="Online"
                checked={paymentMethod === 'Online'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-orange-600"
              />
              <span className="text-sm text-gray-700">Pay Online (Razorpay)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Promo Code
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              placeholder="Enter promo code"
              className="grow w-full outline-hidden p-2.5 text-gray-600 border"
            />
            <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
              Apply
            </button>
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Items {getCartCount()}</p>
            <p className="text-gray-800">{currency}{getCartAmount()}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-gray-800">Free</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Tax (2%)</p>
            <p className="font-medium text-gray-800">{currency}{Math.floor(getCartAmount() * 0.02)}</p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>{currency}{getCartAmount() + Math.floor(getCartAmount() * 0.02)}</p>
          </div>
        </div>
      </div>

      <button
        onClick={createOrder}
        disabled={isProcessing}
        className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
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