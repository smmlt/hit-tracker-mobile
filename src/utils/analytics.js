// EN: Transforms analytics API values into chart rows, comparisons, labels, and localized exercise summaries.
// UK: Перетворює analytics API-значення на ряди графіків, порівняння, labels і локалізовані підсумки вправ.
import { translateCatalogName } from '../localization/catalog.js';

/** EN: Calculates a two-decimal percentage change when the comparison period has nonzero volume. UK: Обчислює відсоткову зміну до двох знаків, якщо обсяг порівняльного періоду не дорівнює нулю. */
export const volumeDelta = (thisWeek, lastWeek) =>
  lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 10_000) / 100 : null;

/** EN: Uses the server-computed volume change when present and falls back to local calculation for older API responses. UK: Використовує обчислену сервером зміну обсягу, а для старіших відповідей API виконує локальне обчислення. */
export const summaryVolumeDelta = (summary) =>
  summary.volumeChangePercent !== undefined
    ? summary.volumeChangePercent
    : volumeDelta(summary.thisWeek.volumeKg, summary.lastWeek.volumeKg);

/** EN: Detects when the latest completed workout has not yet appeared in the analytics read model. UK: Визначає, що останнє завершене тренування ще не з’явилося в аналітичній моделі читання. */
export const isUpdatingStatistics = (lastFinishedWorkoutId, summary) =>
  lastFinishedWorkoutId != null && (!summary?.lastWorkout || Number(summary.lastWorkout.workoutId) < Number(lastFinishedWorkoutId));

/** EN: Resolves an exercise identifier to its localized catalog name or the supplied fallback. UK: Перетворює ідентифікатор вправи на локалізовану назву каталогу або задане запасне значення. */
export const exerciseName = (t, exercises, id, fallback) => {
  const exercise = exercises.find(/* EN: Matches catalog and analytics identifiers numerically across string/number representations. UK: Чисельно зіставляє ідентифікатори каталогу й аналітики незалежно від рядкового чи числового типу. */ (item) => Number(item.id) === Number(id));
  const name = exercise?.displayName || exercise?.name;
  return name ? translateCatalogName(t, 'exercise', name) : fallback;
};
