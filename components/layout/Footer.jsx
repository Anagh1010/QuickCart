import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";
import LayoutContainer from "./LayoutContainer";

const companyLinks = [
  { label: "Shop all", href: "/all-products" },
  { label: "About us", href: "/#about" },
  { label: "Contact us", href: "/#contact" },
];

const supportLinks = [
  { label: "My orders", href: "/my-orders" },
  { label: "Cart", href: "/cart" },
];

const FooterLinkGroup = ({ title, links }) => (
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{title}</h3>
    <ul className="mt-5 space-y-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link className="text-sm text-gray-500 transition hover:text-blue-600" href={link.href}>{link.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => (
  <footer id="about" className="mt-24 bg-gray-950 pb-8 pt-16 text-gray-400">
    <LayoutContainer size="wide">
      <div id="contact" className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.25fr_1fr_1fr_1.2fr]">
        <div className="max-w-sm">
          <Image alt="QuickCart" className="w-auto brightness-0 invert" height={34} src={assets.logo} />
          <p className="mt-5 text-sm leading-6">
            A modern commerce experience with fast browsing, clear pricing, and dependable delivery.
          </p>
        </div>
        <FooterLinkGroup title="Company" links={companyLinks} />
        <FooterLinkGroup title="Support" links={supportLinks} />
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">Get in touch</h3>
          <a className="mt-5 block text-sm transition hover:text-white" href="tel:+1234567890">+1-234-567-890</a>
          <a className="mt-3 block text-sm transition hover:text-white" href="mailto:support@quickcart.com">support@quickcart.com</a>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-3 pt-6 text-xs sm:flex-row">
        <p>© {new Date().getFullYear()} QuickCart. All rights reserved.</p>
        <p>Built for effortless shopping.</p>
      </div>
    </LayoutContainer>
  </footer>
);

export default Footer;
