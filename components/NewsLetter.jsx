"use client";

import { useState } from "react";
import toast from "react-hot-toast";

const NewsLetter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("You're subscribed! Check your inbox for 20% off.");
    setEmail("");
  };

  return (
    <section className="py-16">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-center space-y-2 px-5 text-center sm:px-8 xl:px-12">
        <h2 className="text-2xl font-medium md:text-4xl">Subscribe now & get 20% off</h2>
        <p className="pb-6 text-gray-500/80 md:text-base">
          Be the first to hear about new arrivals, exclusive deals, and flash sales.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-2xl items-center"
          suppressHydrationWarning
        >
          <input
            className="h-12 w-full rounded-l-md border border-r-0 border-gray-500/30 px-3 text-gray-500 outline-none md:h-14"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="h-12 rounded-r-md bg-orange-600 px-8 text-white transition hover:bg-orange-700 md:h-14 md:px-12"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};

export default NewsLetter;
