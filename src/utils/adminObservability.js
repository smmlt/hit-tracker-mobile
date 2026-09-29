const componentIds = [
  'api', 'relay', 'analytics', 'search', 'postgres', 'prometheus',
  'loki', 'jaeger', 'grafana', 'minio', 'event-pipeline',
];
const statuses = new Set(['up', 'down', 'unknown']);
const metricKeys = [
  'apiRequestsPerSecond', 'apiErrorRatePercent', 'apiP95LatencyMs',
  'activeWorkouts', 'outboxBacklog', 'outboxPublishFailuresPerMinute',
  'analyticsConsumerLag', 'analyticsRetries5m', 'analyticsDlq5m',
  'postgresConnections', 'postgresDatabaseBytes', 'postgresReplicationLagSeconds',
];
const logServices = ['api', 'relay', 'analytics', 'search-indexer'];
const traceServices = new Set(['hit-api', 'hit-relay', 'hit-analytics', 'hit-search-indexer', 'jaeger-all-in-one']);

const safeNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeObservability = (payload) => {
  const source = payload && typeof payload === 'object' ? payload : {};
  const receivedComponents = new Map(
    (Array.isArray(source.components) ? source.components : [])
      .filter((item) => item && typeof item === 'object' && componentIds.includes(item.id))
      .map((item) => [item.id, statuses.has(item.status) ? item.status : 'unknown']),
  );
  const sourceMetrics = source.metrics && typeof source.metrics === 'object' ? source.metrics : {};
  const metrics = Object.fromEntries(metricKeys.map((key) => [key, safeNumber(sourceMetrics[key])]));
  metrics.outboxListenerConnected = typeof sourceMetrics.outboxListenerConnected === 'boolean'
    ? sourceMetrics.outboxListenerConnected
    : null;

  return {
    generatedAt: typeof source.generatedAt === 'string' && Number.isFinite(Date.parse(source.generatedAt))
      ? source.generatedAt
      : null,
    components: componentIds.map((id) => ({ id, status: receivedComponents.get(id) || 'unknown' })),
    metrics,
    logs: logServices.map((service) => {
      const item = (Array.isArray(source.logs) ? source.logs : []).find((entry) => entry?.service === service);
      return {
        service,
        warnings5m: Math.max(0, safeNumber(item?.warnings5m) || 0),
        errors5m: Math.max(0, safeNumber(item?.errors5m) || 0),
      };
    }),
    tracingServices: (Array.isArray(source.tracingServices) ? source.tracingServices : [])
      .filter((service) => typeof service === 'string' && traceServices.has(service)),
  };
};
