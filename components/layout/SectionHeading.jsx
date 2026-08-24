import LayoutContainer from "./LayoutContainer";

const SectionHeading = ({ eyebrow, title, description, action, align = "between" }) => {
  const centered = align === "center";

  return (
    <LayoutContainer size="wide">
      <div className={`flex gap-6 ${centered ? "flex-col items-center text-center" : "flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"}`}>
        <div className={centered ? "max-w-2xl" : "max-w-xl"}>
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">{eyebrow}</p>}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
          {description && <p className="mt-3 text-base leading-6 text-gray-500">{description}</p>}
        </div>
        {!centered && action}
      </div>
    </LayoutContainer>
  );
};

export default SectionHeading;
