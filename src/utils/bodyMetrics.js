// unitKey is a translation key; units are never hardcoded per language.
export const BODY_METRICS = {
  weight: { unitKey: 'kgShort', precision: 1 },
  bodyFatPercentage: { unitKey: 'percentageShort', precision: 1 },
  muscleMass: { unitKey: 'kgShort', precision: 1 },
  waistCircumference: { unitKey: 'cmShort', precision: 0 },
};

export const BODY_METRIC_KEYS = Object.keys(BODY_METRICS);

const PERIOD_DAYS = { today: 0, '7': -7, '14': -14 };

function localDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function parseDateKey(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === 'string' && value.includes('T')) {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function subtractMonthsClamped(date, months) {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() - months;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDay));
}

function clampDateKey(value, todayKey) {
  const key = localDateKey(parseDateKey(value));
  return key > todayKey ? todayKey : key;
}

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

export function dateKey(date) {
  return localDateKey(date instanceof Date ? date : new Date(date));
}

// Today uses the current time: noon would be in the future for a morning
// measurement and the API rejects future timestamps. Past days use local noon.
export function dateInputToIso(value, now = new Date()) {
  if (value === localDateKey(now)) return now.toISOString();
  return new Date(`${value}T12:00:00`).toISOString();
}

export function formatRangeLabel(range, locale = 'en') {
  const start = parseDateKey(range.start || range.from);
  const end = parseDateKey(range.end || range.to);
  const uk = locale === 'uk';
  const month = (date) => new Intl.DateTimeFormat(uk ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    .formatToParts(date).find((part) => part.type === 'month').value;
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

export function formatDateLabel(value, locale = 'en') {
  return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'short' }).format(new Date(value));
}

export function formatMetricValue(value, metricKey, locale = 'en') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const config = BODY_METRICS[metricKey] || BODY_METRICS.weight;
  const numeric = Number(value);
  const precision = metricKey === 'waistCircumference' && Number.isInteger(numeric) ? 0 : config.precision;
  const text = numeric.toFixed(precision);
  return locale === 'uk' ? text.replace('.', ',') : text;
}

export function formatMetric(value, metricKey, locale, t) {
  return `${formatMetricValue(value, metricKey, locale)} ${metricUnit(metricKey, t)}`.trim();
}

export function formatMetricDelta(delta, metricKey, locale, t) {
  if (delta === null || delta === undefined || !Number.isFinite(Number(delta))) return '—';
  const numeric = Number(delta);
  const sign = numeric > 0 ? '+' : '';
  return `${sign}${formatMetricValue(numeric, metricKey, locale)} ${metricUnit(metricKey, t)}`.trim();
}

export function metricUnit(metricKey, t) {
  const unitKey = BODY_METRICS[metricKey]?.unitKey;
  return unitKey ? t(unitKey) : '';
}

// gifted-charts starts the Y axis at 0, which flattens a 74.0-74.5 kg line.
// yAxisOffset moves the baseline; maxValue is measured from that offset.
export function chartLayout(points, width, initialSpacing = 28) {
  const values = points.map((point) => point.value);
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

export function measurementList(metric) {
  return [...(metric?.points || [])]
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    .map((point, index, points) => ({
      ...point,
      delta: index === points.length - 1 ? null : Number((point.value - points[index + 1].value).toFixed(1)),
    }));
}

export function chartPoints(metric, locale = 'en') {
  return [...(metric?.points || [])]
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .map((point) => ({ value: Number(point.value), label: formatDateLabel(point.recordedAt, locale), recordedAt: point.recordedAt }));
}

export function metricState(metric) {
  const points = metric?.points || [];
  return {
    count: points.length,
    status: points.length === 0 ? 'empty' : points.length === 1 ? 'single' : 'chart',
    hasLatestOutsidePeriod: points.length === 0 && !!metric?.latest,
  };
}

// Mirrors BODY_METRIC_RANGES on the API.
export const BODY_METRIC_RANGES = {
  weight: [20, 400],
  bodyFatPercentage: [2, 75],
  muscleMass: [5, 200],
  waistCircumference: [30, 250],
};

export function validateBodyMeasurement(fields, now = new Date()) {
  const errors = {};
  const ranges = BODY_METRIC_RANGES;
  const present = BODY_METRIC_KEYS.filter((key) => fields[key] !== '' && fields[key] !== null && fields[key] !== undefined);
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

// gifted-charts offsets its x labels from the points, so the screen renders its
// own row. Returns which points get a label and where, clamped inside the chart.
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
  return indices.map((index) => {
    const x = layout.initialSpacing + layout.spacing * index;
    const left = Math.min(Math.max(x - labelWidth / 2, 0), chartWidth - labelWidth);
    return { index, left, label: points[index].label };
  });
}
