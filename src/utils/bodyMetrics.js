// EN: Defines supported body metrics and converts API records into localized, precision-aware display values.
// UK: Визначає підтримувані показники тіла й перетворює записи API на локалізовані значення з потрібною точністю.
// EN: unitKey is a translation key, so measurement units are never hardcoded per language.
// UK: unitKey є ключем перекладу, тому одиниці вимірювання ніколи не задаються окремо для кожної мови.
export const BODY_METRICS = {
  weight: { unitKey: 'kgShort', precision: 1 },
  bodyFatPercentage: { unitKey: 'percentageShort', precision: 1 },
  muscleMass: { unitKey: 'kgShort', precision: 1 },
  waistCircumference: { unitKey: 'cmShort', precision: 0 },
};

export const BODY_METRIC_KEYS = Object.keys(BODY_METRICS);

const PERIOD_DAYS = { today: 0, '7': -6, '14': -13 };

/**
 * EN: Serializes a local calendar date as YYYY-MM-DD without applying a time-zone conversion.
 * UK: Перетворює місцеву календарну дату на YYYY-MM-DD без зміни часового поясу.
 */
function localDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

/**
 * EN: Normalizes a Date, timestamp, or YYYY-MM-DD value to local midnight for calendar comparisons.
 * UK: Нормалізує Date, часову позначку або значення YYYY-MM-DD до місцевої опівночі для календарних порівнянь.
 */
function parseDateKey(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === 'string' && value.includes('T')) {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * EN: Returns a cloned date shifted by whole local calendar days.
 * UK: Повертає копію дати, зміщену на цілу кількість місцевих календарних днів.
 */
function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

/**
 * EN: Returns the first millisecond of the supplied local calendar day.
 * UK: Повертає першу мілісекунду переданого місцевого календарного дня.
 */
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * EN: Returns the final millisecond of the supplied local calendar day.
 * UK: Повертає останню мілісекунду переданого місцевого календарного дня.
 */
function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * EN: Moves backward by whole months and clamps month-end dates to the last valid target day.
 * UK: Переміщує дату назад на цілі місяці та обмежує кінець місяця останнім чинним днем цільового місяця.
 */
function subtractMonthsClamped(date, months) {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() - months;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDay));
}

/**
 * EN: Converts an input to a local date key and prevents it from extending beyond today.
 * UK: Перетворює вхідне значення на ключ місцевої дати та не дозволяє йому виходити за межі сьогоднішнього дня.
 */
function clampDateKey(value, todayKey) {
  const key = localDateKey(parseDateKey(value));
  return key > todayKey ? todayKey : key;
}

/**
 * EN: Resolves a preset or custom period into inclusive local date keys and ISO API boundaries, clamped to today.
 * UK: Перетворює готовий або власний період на включні ключі місцевих дат і межі ISO для API, обмежені сьогоднішнім днем.
 */
export function periodToDateRange(period = '7', now = new Date()) {
  const today = startOfDay(now);
  const todayKey = localDateKey(today);
  let start;
  let end;

  if (period && typeof period === 'object') {
    start = clampDateKey(period.start || period.from || todayKey, todayKey);
    end = clampDateKey(period.end || period.to || start, todayKey);
    if (end < start) [start, end] = [end, start];
  } else {
    const value = String(period || '7');
    end = todayKey;
    if (value === '1m' || value === '3m') {
      const months = value === '1m' ? 1 : 3;
      const date = subtractMonthsClamped(today, months);
      start = localDateKey(date);
    } else {
      start = localDateKey(addDays(today, PERIOD_DAYS[value] ?? PERIOD_DAYS['7']));
    }
  }

  const fromDate = startOfDay(parseDateKey(start));
  const toDate = endOfDay(parseDateKey(end));
  return { start, end, from: fromDate.toISOString(), to: toDate.toISOString() };
}

/**
 * EN: Exposes the canonical local YYYY-MM-DD key for Date-compatible input.
 * UK: Повертає канонічний місцевий ключ YYYY-MM-DD для значення, сумісного з Date.
 */
export function dateKey(date) {
  return localDateKey(date instanceof Date ? date : new Date(date));
}

// EN: Today uses the current time because local noon would be future-dated in the morning; past days use stable local noon.
// UK: Для сьогодні використовується поточний час, бо місцевий полудень уранці був би майбутнім; минулі дні використовують сталий місцевий полудень.
/**
 * EN: Converts a form date to an API timestamp without accidentally making today's measurement future-dated.
 * UK: Перетворює дату форми на часову позначку API, не роблячи сьогоднішнє вимірювання випадково майбутнім.
 */
export function dateInputToIso(value, now = new Date()) {
  if (value === localDateKey(now)) return now.toISOString();
  return new Date(`${value}T12:00:00`).toISOString();
}

/**
 * EN: Formats a single day or date range with language-specific month and year placement.
 * UK: Форматує один день або діапазон дат із розташуванням місяця та року відповідно до мови.
 */
export function formatRangeLabel(range, locale = 'en') {
  const start = parseDateKey(range.start || range.from);
  const end = parseDateKey(range.end || range.to);
  const uk = locale === 'uk';
  /**
   * EN: Extracts the locale-inflected month part used by the custom range grammar.
   * UK: Витягує відмінювану за мовою назву місяця для власної граматики діапазону.
   */
  const month = (date) => new Intl.DateTimeFormat(uk ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    .formatToParts(date).find(/* EN: Selects only the month token from the formatter parts. / UK: Вибирає лише складник місяця з частин форматування. */ (part) => part.type === 'month').value;
  if (localDateKey(start) === localDateKey(end)) {
    return uk
      ? `${start.getDate()} ${month(start)} ${start.getFullYear()}`
      : `${month(start)} ${start.getDate()}, ${start.getFullYear()}`;
  }
  if (uk) {
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${month(end)} ${end.getFullYear()}`;
    }
    return `${start.getDate()} ${month(start)} - ${end.getDate()} ${month(end)} ${end.getFullYear()}`;
  }
  const startText = `${month(start)} ${start.getDate()}`;
  const endText = `${month(end)} ${end.getDate()}`;
  return start.getFullYear() === end.getFullYear()
    ? `${startText} - ${endText}, ${end.getFullYear()}`
    : `${startText}, ${start.getFullYear()} - ${endText}, ${end.getFullYear()}`;
}

/**
 * EN: Produces a compact localized day-and-month label for charts and lists.
 * UK: Створює стислий локалізований підпис дня та місяця для графіків і списків.
 */
export function formatDateLabel(value, locale = 'en') {
  return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'short' }).format(new Date(value));
}

/**
 * EN: Formats a finite metric value with metric-specific precision and Ukrainian decimal punctuation.
 * UK: Форматує скінченне значення показника з його точністю та українським десятковим роздільником.
 */
export function formatMetricValue(value, metricKey, locale = 'en') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const config = BODY_METRICS[metricKey] || BODY_METRICS.weight;
  const numeric = Number(value);
  const precision = metricKey === 'waistCircumference' && Number.isInteger(numeric) ? 0 : config.precision;
  const text = numeric.toFixed(precision);
  return locale === 'uk' ? text.replace('.', ',') : text;
}

/**
 * EN: Combines a formatted measurement value with its translated unit.
 * UK: Поєднує відформатоване значення вимірювання з перекладеною одиницею.
 */
export function formatMetric(value, metricKey, locale, t) {
  return `${formatMetricValue(value, metricKey, locale)} ${metricUnit(metricKey, t)}`.trim();
}

/**
 * EN: Formats a signed finite change with the same precision and unit as its metric.
 * UK: Форматує скінченну зміну зі знаком, використовуючи точність та одиницю відповідного показника.
 */
export function formatMetricDelta(delta, metricKey, locale, t) {
  if (delta === null || delta === undefined || !Number.isFinite(Number(delta))) return '—';
  const numeric = Number(delta);
  const sign = numeric > 0 ? '+' : '';
  return `${sign}${formatMetricValue(numeric, metricKey, locale)} ${metricUnit(metricKey, t)}`.trim();
}

/**
 * EN: Resolves a metric's translation-backed unit or returns no unit for an unknown metric.
 * UK: Визначає одиницю показника через переклад або повертає порожнє значення для невідомого показника.
 */
export function metricUnit(metricKey, t) {
  const unitKey = BODY_METRICS[metricKey]?.unitKey;
  return unitKey ? t(unitKey) : '';
}

// EN: gifted-charts starts at zero, so the offset and padded maximum keep small real-world changes visually readable.
// UK: gifted-charts починає вісь із нуля, тому зміщення та доповнений максимум зберігають видимість невеликих реальних змін.
/**
 * EN: Derives a padded vertical domain and evenly spaced horizontal layout for metric chart points.
 * UK: Обчислює доповнений вертикальний діапазон і рівномірне горизонтальне розташування точок графіка показника.
 */
export function chartLayout(points, width, initialSpacing = 28) {
  const values = points.map(/* EN: Extracts numeric samples used to calculate the chart domain. / UK: Витягує числові значення для обчислення діапазону графіка. */ (point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = max > min ? (max - min) * 0.25 : Math.max(Math.abs(max) * 0.02, 1);
  const yAxisOffset = min - pad;
  return {
    yAxisOffset,
    maxValue: max + pad - yAxisOffset,
    spacing: points.length > 1 ? (width - initialSpacing * 2) / (points.length - 1) : 0,
    initialSpacing,
    endSpacing: initialSpacing,
  };
}

/**
 * EN: Sorts measurements newest-first and computes each change against the immediately preceding record.
 * UK: Сортує вимірювання від найновішого та обчислює зміну кожного відносно безпосередньо попереднього запису.
 */
export function measurementList(metric) {
  return [...(metric?.points || [])]
    .sort(/* EN: Orders records in descending measurement time. / UK: Упорядковує записи за часом вимірювання від нових до старих. */ (a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    .map(/* EN: Adds a one-decimal delta from the next older measurement, leaving the oldest neutral. / UK: Додає зміну з точністю до одного знака від наступного старішого вимірювання, залишаючи найстаріше нейтральним. */ (point, index, points) => ({
      ...point,
      delta: index === points.length - 1 ? null : Number((point.value - points[index + 1].value).toFixed(1)),
    }));
}

/**
 * EN: Sorts measurements chronologically and maps them to numeric, localized chart records.
 * UK: Сортує вимірювання хронологічно та перетворює їх на числові локалізовані записи графіка.
 */
export function chartPoints(metric, locale = 'en') {
  return [...(metric?.points || [])]
    .sort(/* EN: Orders chart samples from oldest to newest. / UK: Упорядковує точки графіка від найстарішої до найновішої. */ (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .map(/* EN: Converts each API record to the chart library's value-and-label shape. / UK: Перетворює кожен запис API на формат значення та підпису бібліотеки графіків. */ (point) => ({ value: Number(point.value), label: formatDateLabel(point.recordedAt, locale), recordedAt: point.recordedAt }));
}

/**
 * EN: Classifies metric data for empty, single-value, or chart rendering and identifies an out-of-period latest value.
 * UK: Класифікує дані показника для порожнього стану, одного значення або графіка та визначає останнє значення поза періодом.
 */
export function metricState(metric) {
  const points = metric?.points || [];
  return {
    count: points.length,
    status: points.length === 0 ? 'empty' : points.length === 1 ? 'single' : 'chart',
    hasLatestOutsidePeriod: points.length === 0 && !!metric?.latest,
  };
}

// EN: These client ranges mirror BODY_METRIC_RANGES on the API for early feedback; the server remains authoritative.
// UK: Ці клієнтські діапазони відповідають BODY_METRIC_RANGES в API для раннього повідомлення; остаточне рішення залишається за сервером.
export const BODY_METRIC_RANGES = {
  weight: [20, 400],
  bodyFatPercentage: [2, 75],
  muscleMass: [5, 200],
  waistCircumference: [30, 250],
};

/**
 * EN: Validates that at least one metric is present, every supplied value is in range, and the selected day is not future-dated.
 * UK: Перевіряє наявність хоча б одного показника, допустимість кожного введеного значення та відсутність майбутньої дати.
 */
export function validateBodyMeasurement(fields, now = new Date()) {
  const errors = {};
  const ranges = BODY_METRIC_RANGES;
  const present = BODY_METRIC_KEYS.filter(/* EN: Treats zero as supplied while excluding only empty or missing inputs. / UK: Вважає нуль введеним значенням і вилучає лише порожні або відсутні поля. */ (key) => fields[key] !== '' && fields[key] !== null && fields[key] !== undefined);
  if (!present.length) errors.required = true;
  for (const key of present) {
    const value = Number(String(fields[key]).replace(',', '.'));
    if (!Number.isFinite(value) || value < ranges[key][0] || value > ranges[key][1]) errors[key] = true;
  }
  if (fields.recordedAt) {
    const selected = parseDateKey(fields.recordedAt);
    if (selected > startOfDay(now)) errors.futureDate = true;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// EN: Because gifted-charts offsets x labels, this helper chooses a sparse custom label row and clamps it inside the chart.
// UK: Оскільки gifted-charts зміщує підписи осі X, цей допоміжний засіб створює розріджений власний ряд і втримує його в межах графіка.
/**
 * EN: Selects evenly distributed label indices, always includes the final point, and calculates safe horizontal positions.
 * UK: Вибирає рівномірно розподілені індекси підписів, завжди додає останню точку й обчислює безпечні горизонтальні позиції.
 */
export function chartLabelPositions(points, layout, chartWidth, labelWidth = 56, maxLabels = 5) {
  const count = points.length;
  if (!count) return [];
  const step = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));
  const indices = [];
  for (let index = 0; index < count; index += step) indices.push(index);
  if (indices.at(-1) !== count - 1) {
    if (count - 1 - indices.at(-1) < step / 2 && indices.length > 1) indices.pop();
    indices.push(count - 1);
  }
  return indices.map(/* EN: Converts each selected point index into a label position clamped to the chart edges. / UK: Перетворює кожен вибраний індекс точки на позицію підпису, обмежену краями графіка. */ (index) => {
    const x = layout.initialSpacing + layout.spacing * index;
    const left = Math.min(Math.max(x - labelWidth / 2, 0), chartWidth - labelWidth);
    return { index, left, label: points[index].label };
  });
}
