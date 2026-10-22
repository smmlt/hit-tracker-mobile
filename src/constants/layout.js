// EN: Shared responsive thresholds and container measurements for phone, tablet, and web layouts.
// UK: Спільні адаптивні пороги й розміри контейнерів для телефонів, планшетів і web.
export const layoutBreakpoints = Object.freeze({
  compact: 480,
  desktop: 900,
  resultSingleColumn: 370,
});

export const contentWidths = Object.freeze({
  form: 760,
  screen: 800,
});

/** EN: Derives layout flags from the live application window. UK: Визначає режими компонування з поточного розміру вікна застосунку. */
export const responsiveLayout = (width) => {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : layoutBreakpoints.compact;
  return {
    compact: safeWidth <= layoutBreakpoints.compact,
    desktop: safeWidth >= layoutBreakpoints.desktop,
    horizontalPadding: safeWidth <= 360 ? 12 : safeWidth <= layoutBreakpoints.compact ? 16 : 24,
    resultSingleColumn: safeWidth < layoutBreakpoints.resultSingleColumn,
  };
};
