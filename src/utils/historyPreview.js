export function visibleExercisePreviewCount({
  containerWidth,
  counterLabel,
  previewNames,
  totalExerciseCount,
  gap = 10,
}) {
  if (!containerWidth || !previewNames.length) return Math.min(1, previewNames.length);

  let usedWidth = 0;
  let visibleCount = 0;
  for (const [index, name] of previewNames.entries()) {
    const nextCount = index + 1;
    const remainingCount = totalExerciseCount - nextCount;
    const nameWidth = name.length * 7;
    const nextWidth = usedWidth + (index ? 15 : 0) + nameWidth;
    const counterWidth = remainingCount > 0 ? (`+${remainingCount} ${counterLabel}`).length * 7 : 0;
    const requiredWidth = nextWidth + (remainingCount > 0 ? gap + counterWidth : 0);
    usedWidth = nextWidth;
    if (requiredWidth <= containerWidth) visibleCount = nextCount;
  }
  return visibleCount;
}
