import SectionHeading from "@/components/layout/SectionHeading";

const highlights = [
  { title: "Free returns", description: "Try it at home and return eligible items within 30 days." },
  { title: "Secure checkout", description: "Encrypted payments with verified order tracking." },
  { title: "Expert support", description: "Get product help before and after you buy." },
];

const ValueHighlights = () => (
  <section className="bg-gray-50 py-16">
    <SectionHeading align="center" description="Shopping should feel simple from discovery to delivery." eyebrow="Why QuickCart" title="A better way to buy tech" />
    <div className="mx-auto mt-10 grid w-full max-w-[1440px] gap-4 px-5 sm:px-8 md:grid-cols-3 xl:px-12">
      {highlights.map((highlight) => (
        <article className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm" key={highlight.title}>
          <h3 className="text-lg font-semibold text-gray-900">{highlight.title}</h3>
          <p className="mt-3 text-sm leading-6 text-gray-500">{highlight.description}</p>
        </article>
      ))}
    </div>
  </section>
);

export default ValueHighlights;
