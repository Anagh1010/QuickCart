"use client";

import Link from "next/link";

const MobileMenu = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const goHome = () => {
    onClose();
    window.history.replaceState(null, "", "/");
    window.scrollTo(0, 0);
  };

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button aria-label="Close menu" className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={onClose} />
      <nav className="absolute right-4 top-20 w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <ul className="space-y-1">
          {[{ action: goHome, href: "/", label: "Home" }, { href: "/all-products", label: "Shop" }, { href: "/#about", label: "About" }, { href: "/#contact", label: "Contact" }].map(({ action, href, label }) => (
            <li key={href}>
              <Link className="block rounded-2xl px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100" href={href} onClick={action ?? onClose}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default MobileMenu;
