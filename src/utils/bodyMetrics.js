export const BODY_METRICS = {
  weight: { unit: 'kg', precision: 1 },
  bodyFatPercentage: { unit: '%', precision: 1 },
  muscleMass: { unit: 'kg', precision: 1 },
  waistCircumference: { unit: 'cm', precision: 0 },
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

export function dateInputToIso(value) {
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

export function formatMetric(value, metricKey, locale = 'en') {
  return `${formatMetricValue(value, metricKey, locale)} ${metricUnit(metricKey, locale)}`.trim();
}

export function formatMetricDelta(delta, metricKey, locale = 'en') {
  if (delta === null || delta === undefined || !Number.isFinite(Number(delta))) return '—';
  const numeric = Number(delta);
  const sign = numeric > 0 ? '+' : '';
  return `${sign}${formatMetricValue(numeric, metricKey, locale)} ${metricUnit(metricKey, locale)}`.trim();
}

export function metricUnit(metricKey, locale = 'en') {
  const unit = BODY_METRICS[metricKey]?.unit || '';
  return locale === 'uk' && unit === 'kg' ? 'кг' : locale === 'uk' && unit === 'cm' ? 'см' : unit;
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

export function validateBodyMeasurement(fields, now = new Date()) {
  const errors = {};
  const ranges = {
    weight: [20, 400],
    bodyFatPercentage: [2, 75],
    muscleMass: [5, 200],
    waistCircumference: [30, 250],
  };
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
