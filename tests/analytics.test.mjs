import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { transformSync } from '@babel/core';
import { exerciseName, isUpdatingStatistics, summaryVolumeDelta, volumeDelta } from '../src/utils/analytics.js';
import { translations } from '../src/localization/translations.js';

test('analytics service builds read-model requests and preserves normalized API errors', async () => {
  const calls = [];
  const apiRequest = async (...args) => {
    calls.push(args);
    if (args[0].includes('personal-records')) throw Object.assign(new Error('unavailable'), { status: 503, details: { code: 'ANALYTICS_UNAVAILABLE' } });
    return { ok: true };
  };
  const source = readFileSync(new URL('../src/services/analyticsService.js', import.meta.url), 'utf8');
  const code = transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  const Intl = { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }) }) };
  runInNewContext(code, { module, exports: module.exports, require: () => ({ apiRequest }), encodeURIComponent, Intl });
  const service = module.exports.analyticsService;
  await service.summary('token');
  await service.overview('token', { from: '2026-09-21', to: '2026-09-28' });
  await service.weeklyVolume('token');
  await service.exerciseProgress('token', 12, { from: '2026-09-01', to: '2026-09-28' });
  await service.exerciseSets('token', 12, { from: '2026-09-01', to: '2026-09-28' });
  await service.intensity('token', { from: '2026-09-21', to: '2026-09-28' });
  await service.muscleGroups('token', { from: '2026-09-21', to: '2026-09-28' });
  await service.strength('token', { from: '2026-09-21', to: '2026-09-28' });
  await service.bodyMetrics('token');
  assert.deepEqual(calls.map(([path]) => path), [
    '/analytics/me/summary', '/analytics/me/overview?from=2026-09-21&to=2026-09-28&timeZone=Europe%2FBerlin', '/analytics/me/weekly-volume?weeks=12',
    '/analytics/me/exercises/12/progress?from=2026-09-01&to=2026-09-28',
    '/analytics/me/exercises/12/sets?from=2026-09-01&to=2026-09-28',
    '/analytics/me/intensity?from=2026-09-21&to=2026-09-28&timeZone=Europe%2FBerlin',
    '/analytics/me/muscle-groups?from=2026-09-21&to=2026-09-28&timeZone=Europe%2FBerlin',
    '/analytics/me/strength?from=2026-09-21&to=2026-09-28',
    '/analytics/me/body-metrics',
  ]);
  assert.ok(calls.every(([, , token]) => token === 'token'));
  await assert.rejects(service.personalRecords('token'), (error) => error.status === 503 && error.details.code === 'ANALYTICS_UNAVAILABLE');
});

test('volume delta, update signal, and exercise names cover empty data', () => {
  assert.equal(volumeDelta(150, 100), 50);
  assert.equal(volumeDelta(50, 100), -50);
  assert.equal(volumeDelta(4, 3), 33.33);
  assert.equal(volumeDelta(20, 0), null);
  assert.equal(isUpdatingStatistics(9, { lastWorkout: null }), true);
  assert.equal(isUpdatingStatistics(9, { lastWorkout: { workoutId: 8 } }), true);
  assert.equal(isUpdatingStatistics(9, { lastWorkout: { workoutId: 9 } }), false);
  assert.equal(isUpdatingStatistics(null, { lastWorkout: null }), false);
  const t = (key) => (key === 'catalog_exercise_squat' ? 'Присідання' : key);
  assert.equal(exerciseName(t, [{ id: 3, displayName: 'Squat' }], '3', 'Exercise #3'), 'Присідання');
  assert.equal(exerciseName(t, [{ id: 4, name: 'Bench Press' }], 4, 'Exercise #4'), 'Bench Press');
  assert.equal(exerciseName(t, [], 3, 'Exercise #3'), 'Exercise #3');
});

test('summary volume delta prefers the server-computed value and falls back locally', () => {
  // Newer backend: field present (even when null) wins over the local computation.
  assert.equal(summaryVolumeDelta({ volumeChangePercent: 12.5, thisWeek: { volumeKg: 999 }, lastWeek: { volumeKg: 1 } }), 12.5);
  assert.equal(summaryVolumeDelta({ volumeChangePercent: null, thisWeek: { volumeKg: 999 }, lastWeek: { volumeKg: 1 } }), null);
  // Older backend: field absent, fall back to the local calculation.
  assert.equal(summaryVolumeDelta({ thisWeek: { volumeKg: 150 }, lastWeek: { volumeKg: 100 } }), 50);
  assert.equal(summaryVolumeDelta({ thisWeek: { volumeKg: 20 }, lastWeek: { volumeKg: 0 } }), null);
});

test('analytics strings are localized', () => {
  for (const key of Object.keys(translations.en).filter((key) => key.startsWith('analytics'))) {
    assert.equal(typeof translations.uk[key], 'string', key);
  }
});

test('analytics starts at Overview and keeps approved drilldowns adaptive', () => {
  const navigator = readFileSync(new URL('../src/navigation/AppNavigator.js', import.meta.url), 'utf8');
  const order = [
    'name="AnalyticsHome"',
    'name="AnalyticsIntensity"',
    'name="AnalyticsMuscleBalance"',
    'name="AnalyticsStrength"',
    'name="AnalyticsExercise"',
    'name="BodyMetricsDetails"',
  ].map((needle) => navigator.indexOf(needle));
  assert.ok(order.every((index) => index >= 0));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));

  const styles = [
    'AnalyticsDashboardScreen.styles.js',
    'AnalyticsIntensityScreen.styles.js',
    'AnalyticsMuscleDetailScreen.styles.js',
    'AnalyticsStrengthListScreen.styles.js',
    'AnalyticsExerciseDetailScreen.styles.js',
  ].map((file) => readFileSync(new URL(`../src/screens/${file}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(styles, /(?:max)?width:\s*393/i);
  assert.doesNotMatch(styles, /#[0-9a-f]{3,8}|rgba?\(/i);
  assert.match(styles, /maxWidth:\s*800/);
  assert.match(styles, /flexWrap:\s*'wrap'/);
});
