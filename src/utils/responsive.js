// Responsive helperi za PWA
export const getScreenDimensions = () => {
  return { width: window.innerWidth, height: window.innerHeight };
};

export const isTablet = () => {
  return window.innerWidth >= 700;
};

export const getResponsiveValue = (phoneValue, tabletValue) => {
  return isTablet() ? tabletValue : phoneValue;
};

export const getResponsiveSize = (baseSize) => {
  const scaleFactor = isTablet() ? 1.2 : 1.0;
  return Math.round(baseSize * scaleFactor);
};

export const getResponsiveFontSize = (baseSize) => {
  const scaleFactor = isTablet() ? 1.1 : 1.0;
  return Math.round(baseSize * scaleFactor);
};
