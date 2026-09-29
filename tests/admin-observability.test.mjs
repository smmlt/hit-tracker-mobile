import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { normalizeObservability } from '../src/utils/adminObservability.js';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin observability normalizes the server response through allowlists', () => {
  const result = normalizeObservability({
    generatedAt: '2026-09-28T08:00:00.000Z',
    components: [
      { id: 'api', status: 'up', detail: 'must not be copied' },
      { id: 'grafana', status: 'invalid' },
      { id: 'attacker-controlled', status: 'up' },
    ],
    metrics: {
      apiRequestsPerSecond: '2.5',
      apiP95LatencyMs: null,
      outboxListenerConnected: true,
    },
    logs: [
      { service: 'api', warnings5m: -4, errors5m: '3' },
      { service: 'unknown', warnings5m: 99, errors5m: 99 },
    ],
    tracingServices: ['hit-api', 'internal-secret', 'http://private-host'],
  });

  assert.equal(result.components.length, 11);
  assert.deepEqual(result.components[0], { id: 'api', status: 'up' });
  assert.equal(result.components.find(({ id }) => id === 'grafana').status, 'unknown');
  assert.equal(result.metrics.apiRequestsPerSecond, 2.5);
  assert.equal(result.metrics.apiP95LatencyMs, null);
  assert.equal(result.metrics.outboxListenerConnected, true);
  assert.deepEqual(result.logs[0], { service: 'api', warnings5m: 0, errors5m: 3 });
  assert.deepEqual(result.tracingServices, ['hit-api']);
  assert.doesNotMatch(JSON.stringify(result), /must not be copied|internal-secret|private-host/);
});

test('system tab is visible only in the existing admin-only section set', () => {
  const admin = source('src/screens/AdminScreen.js');
  assert.match(admin, /canUsers\s*\?\s*\["users", "system", "programs", "exercises"\]/);
  assert.match(admin, /section === "system" \? \(\s*<AdminObservability userToken=\{userToken\}/);
  assert.match(admin, /!canUsers && \["users", "system"\]\.includes\(section\)/);

  const dashboard = source('src/components/admin/AdminObservability.js');
  assert.match(dashboard, /adminService\.getObservability\(userToken\)/);
  assert.doesNotMatch(dashboard, /Linking|openURL|prometheus:|grafana:|jaeger:|loki:/i);
});

test('Android 1.1.1 build 9 is configured and the local builder syncs native versions', () => {
  const config = JSON.parse(source('app.json'));
  assert.equal(config.expo.version, '1.1.1');
  assert.equal(config.expo.android.versionCode, 9);

  const buildScript = source('scripts/build-apk.ps1');
  assert.match(buildScript, /\[regex\]::Replace/);
  assert.match(buildScript, /versionCode/);
  assert.match(buildScript, /versionName/);
  assert.match(buildScript, /assembleRelease/);
  assert.match(buildScript, /universal\.apk/);
});
