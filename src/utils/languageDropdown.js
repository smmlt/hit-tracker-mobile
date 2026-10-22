// EN: Calculates bounded dropdown geometry independently from rendering so every platform follows the same responsive rules.
// UK: Обчислює обмежену геометрію dropdown незалежно від rendering, щоб усі платформи мали однакові responsive-правила.

const SCREEN_MARGIN = 12;
const MENU_GAP = 6;
const OPTION_HEIGHT = 48;
const MENU_VERTICAL_PADDING = 12;

export const languageMenuLayout = ({ anchor, optionCount, viewportHeight, viewportWidth }) => {
  if (!anchor || viewportHeight <= 0 || viewportWidth <= 0) return null;
  const availableWidth = Math.max(0, viewportWidth - SCREEN_MARGIN * 2);
  const menuWidth = Math.min(Math.max(anchor.width, 220), availableWidth);
  const desiredHeight = optionCount * OPTION_HEIGHT + MENU_VERTICAL_PADDING;
  const usableHeight = Math.max(OPTION_HEIGHT, viewportHeight - SCREEN_MARGIN * 2);
  const maxHeight = Math.min(
    Math.max(OPTION_HEIGHT * 2, Math.min(viewportHeight * 0.45, 320)),
    usableHeight,
  );
  const menuHeight = Math.min(desiredHeight, maxHeight);
  const spaceBelow = viewportHeight - (anchor.y + anchor.height) - SCREEN_MARGIN;
  const spaceAbove = anchor.y - SCREEN_MARGIN;
  const opensUp = spaceBelow < menuHeight + MENU_GAP && spaceAbove > spaceBelow;
  const top = opensUp
    ? Math.max(SCREEN_MARGIN, anchor.y - menuHeight - MENU_GAP)
    : Math.min(
      anchor.y + anchor.height + MENU_GAP,
      viewportHeight - menuHeight - SCREEN_MARGIN,
    );
  const left = Math.max(
    SCREEN_MARGIN,
    Math.min(anchor.x, viewportWidth - menuWidth - SCREEN_MARGIN),
  );
  return { left, maxHeight, top, width: menuWidth };
};
