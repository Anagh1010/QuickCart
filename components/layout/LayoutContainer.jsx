const LayoutContainer = ({ as: Tag = "div", size = "default", className = "", children }) => {
  const sizes = {
    narrow: "max-w-6xl",
    default: "max-w-7xl",
    wide: "max-w-[1440px]",
  };

  return (
    <Tag className={`mx-auto w-full px-5 sm:px-8 xl:px-12 ${sizes[size]} ${className}`}>
      {children}
    </Tag>
  );
};

export default LayoutContainer;
