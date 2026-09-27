import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { transformSync } from '@babel/core';
import { exerciseName, isUpdatingStatistics, volumeDelta } from '../src/utils/analytics.js';
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
  runInNewContext(code, { module, exports: module.exports, require: () => ({ apiRequest }), encodeURIComponent });
  const service = module.exports.analyticsService;
  await service.summary('token');
  await service.weeklyVolume('token');
  await service.exerciseProgress('token', 12, { from: '2026-09-01', to: '2026-09-28' });
  await service.bodyMetrics('token');
  assert.deepEqual(calls.map(([path]) => path), [
    '/analytics/me/summary', '/analytics/me/weekly-volume?weeks=12',
    '/analytics/me/exercises/12/progress?from=2026-09-01&to=2026-09-28', '/analytics/me/body-metrics',
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
  assert.equal(exerciseName([{ id: 3, displayName: 'Squat' }], '3', 'Exercise #3'), 'Squat');
  assert.equal(exerciseName([], 3, 'Exercise #3'), 'Exercise #3');
});

test('analytics strings are localized', () => {
  for (const key of Object.keys(translations.en).filter((key) => key.startsWith('analytics'))) {
    assert.equal(typeof translations.uk[key], 'string', key);
  }
});
