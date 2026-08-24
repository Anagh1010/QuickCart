"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useClerk, UserButton } from "@clerk/nextjs";
import { assets, BagIcon, CartIcon } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import LayoutContainer from "./LayoutContainer";
import MobileMenu from "./MobileMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/all-products", label: "Shop" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

const Navbar = () => {
  const { isSeller, isAdmin, router, user } = useAppContext();
  const { openSignIn } = useClerk();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const goHome = () => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
      window.scrollTo(0, 0);
    }
    router.push("/", { scroll: true });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/all-products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <LayoutContainer size="wide">
        <nav aria-label="Main navigation" className="flex h-[4.5rem] items-center justify-between gap-6 py-3">
          <Image alt="QuickCart logo" className="h-auto w-28 cursor-pointer md:w-36" height={40} onClick={goHome} src={assets.logo} width={140} />

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map(({ href, label }) => (
              label === "Home" ? (
                <button className="relative text-sm font-medium text-gray-600 transition hover:text-gray-900" key={href} onClick={goHome} type="button">{label}</button>
              ) : (
                <Link className="relative text-sm font-medium text-gray-600 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all hover:text-gray-900 hover:after:w-full" href={href} key={href}>{label}</Link>
              )
            ))}
          </div>

          <form className="hidden flex-1 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 focus-within:border-blue-300 focus-within:bg-white md:flex lg:max-w-xs" onSubmit={submitSearch}>
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search products" type="search" value={searchQuery} />
            <button type="submit"><Image alt="Search" className="size-4 opacity-60" src={assets.search_icon} /></button>
          </form>

          <div className="flex shrink-0 items-center gap-3">
            {isSeller && <button className="hidden rounded-full border border-blue-500 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 xl:block" onClick={() => router.push("/seller")}>Seller dashboard</button>}
            {isAdmin && <button className="hidden rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 xl:block" onClick={() => router.push("/admin")}>Admin panel</button>}
            {user ? (
              <UserButton>
                <UserButton.MenuItems><UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push("/cart")} /></UserButton.MenuItems>
                <UserButton.MenuItems><UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push("/my-orders")} /></UserButton.MenuItems>
              </UserButton>
            ) : (
              <button className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700" onClick={openSignIn}>Sign in</button>
            )}
            <button aria-label="Open menu" className="rounded-full p-2 hover:bg-gray-100 lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Image alt="" className="size-6" src={assets.menu_icon} />
            </button>
          </div>
        </nav>
      </LayoutContainer>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
};

export default Navbar;
