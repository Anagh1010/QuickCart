import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";
import LayoutContainer from "@/components/layout/LayoutContainer";

const PromotionBanner = () => (
  <section className="mt-24">
    <LayoutContainer size="wide">
      <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-50 via-amber-50 to-white px-5 py-10 sm:px-10 sm:py-14 xl:px-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">Gaming week</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">Level up your setup without slowing down</h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-gray-600">From immersive sound to precise controls, explore gear built for competitive play.</p>
            <Link className="mt-8 inline-flex rounded-full bg-gray-950 px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800" href="/all-products">Shop gaming</Link>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Image alt="Soundbox" className="hidden w-36 rotate-[-8deg] rounded-3xl bg-white p-3 shadow-xl md:block" height={180} src={assets.jbl_soundbox_image} width={180} />
            <Image alt="Controller" className="w-52 rotate-3 rounded-3xl bg-white p-4 shadow-xl sm:w-64" height={280} src={assets.md_controller_image} width={280} />
          </div>
        </div>
      </div>
    </LayoutContainer>
  </section>
);

export default PromotionBanner;
