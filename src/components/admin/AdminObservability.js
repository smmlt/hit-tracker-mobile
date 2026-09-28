import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { palette } from '../../constants/colors';
import { LanguageContext } from '../../localization/LanguageContext';
import { adminService } from '../../services/adminService';
import { useTheme } from '../../context/ThemeContext';
import { Button, Feedback, useWorkshopStyles } from '../workshop/ui';
import { createStyles } from './AdminObservability.styles';

const statusColors = {
  up: palette.greenBright,
  down: palette.red,
  unknown: palette.amber,
};

const metricGroups = [
  {
    title: 'systemTraffic',
    icon: 'pulse-outline',
    metrics: [
      ['apiRequestsPerSecond', 'metricRequestsPerSecond', 'decimal'],
      ['apiP95LatencyMs', 'metricP95Latency', 'milliseconds'],
      ['apiErrorRatePercent', 'metricErrorRate', 'percent'],
    ],
  },
  {
    title: 'systemEvents',
    icon: 'git-network-outline',
    metrics: [
      ['outboxBacklog', 'metricOutboxBacklog', 'integer'],
      ['outboxListenerConnected', 'metricOutboxListener', 'connection'],
      ['outboxPublishFailuresPerMinute', 'metricPublishFailures', 'decimal'],
      ['analyticsConsumerLag', 'metricConsumerLag', 'integer'],
      ['analyticsRetries5m', 'metricRetries', 'integer'],
      ['analyticsDlq5m', 'metricDeadLetters', 'integer'],
    ],
  },
  {
    title: 'systemResources',
    icon: 'server-outline',
    metrics: [
      ['activeWorkouts', 'metricActiveWorkouts', 'integer'],
      ['postgresConnections', 'metricDbConnections', 'integer'],
      ['postgresDatabaseBytes', 'metricDbSize', 'bytes'],
      ['postgresReplicationLagSeconds', 'metricReplicationLag', 'seconds'],
    ],
  },
];

const formatMetric = (value, format, t) => {
  if (format === 'connection' && typeof value === 'boolean') {
    return value ? t('connected') : t('disconnected');
  }
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return t('notAvailableShort');
  }
  const number = Number(value);
  if (format === 'bytes') {
    if (number >= 1024 ** 3) return `${(number / 1024 ** 3).toFixed(1)} GB`;
    if (number >= 1024 ** 2) return `${(number / 1024 ** 2).toFixed(1)} MB`;
    return `${Math.round(number / 1024)} KB`;
  }
  if (format === 'percent') return `${number.toFixed(2)}%`;
  if (format === 'milliseconds') return `${Math.round(number)} ms`;
  if (format === 'seconds') return `${number.toFixed(2)} s`;
  if (format === 'decimal') return number.toFixed(2);
  return Math.round(number).toLocaleString();
};

export function AdminObservability({ userToken }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const s = useWorkshopStyles();
  const { t } = useContext(LanguageContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const nextData = await adminService.getObservability(userToken);
      if (currentRequest === requestId.current) setData(nextData);
    } catch (nextError) {
      if (currentRequest === requestId.current) {
        setError(nextError instanceof Error ? nextError.message : t('systemLoadFailed'));
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [t, userToken]);

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const healthy = data?.components.filter(({ status }) => status === 'up').length || 0;
  const total = data?.components.length || 0;
  const updatedAt = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : t('notAvailableShort');

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.eyebrow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={palette.greenBright} />
            <Text style={styles.eyebrowText}>{t('adminOnlyTelemetry')}</Text>
          </View>
          <Text style={styles.heroTitle}>{t('systemOverview')}</Text>
          <Text style={styles.heroText}>{t('systemOverviewHint')}</Text>
          <Text style={styles.updated}>{t('systemUpdatedAt', { time: updatedAt })}</Text>
        </View>
        <View
          accessibilityLabel={t('systemHealthyCount', { healthy, total })}
          accessibilityRole="summary"
          style={styles.score}
        >
          <Text style={styles.scoreValue}>{healthy}</Text>
          <Text style={styles.scoreTotal}>/ {total || '—'}</Text>
          <Text style={styles.scoreLabel}>{t('healthy')}</Text>
        </View>
        <Button secondary onPress={load} disabled={loading} style={styles.refreshButton}>
          {t('refresh')}
        </Button>
      </View>

      <Feedback loading={loading && !data} error={error} onRetry={load} />

      {data ? (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="layers-outline" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={s.heading}>{t('systemComponents')}</Text>
              <Text style={s.muted}>{t('systemComponentsHint')}</Text>
            </View>
          </View>
          <View style={styles.healthGrid}>
            {data.components.map((component) => (
              <View
                accessibilityLabel={`${t(`component_${component.id}`)}: ${t(`status_${component.status}`)}`}
                key={component.id}
                style={styles.healthCard}
              >
                <View
                  style={[
                    styles.statusGlow,
                    { backgroundColor: `${statusColors[component.status]}22` },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusColors[component.status] },
                    ]}
                  />
                </View>
                <View style={styles.healthCopy}>
                  <Text style={styles.healthName}>{t(`component_${component.id}`)}</Text>
                  <Text style={[styles.healthStatus, { color: statusColors[component.status] }]}>
                    {t(`status_${component.status}`)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {metricGroups.map((group) => (
            <View key={group.title} style={styles.metricSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name={group.icon} size={20} color={theme.primary} />
                </View>
                <Text style={s.heading}>{t(group.title)}</Text>
              </View>
              <View style={styles.metricGrid}>
                {group.metrics.map(([key, label, format]) => (
                  <View key={key} style={styles.metricCard}>
                    <View style={styles.metricLine} />
                    <Text style={styles.metricValue}>
                      {formatMetric(data.metrics[key], format, t)}
                    </Text>
                    <Text style={styles.metricLabel}>{t(label)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.twoColumn}>
            <View style={styles.panel}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={s.heading}>{t('logsLast5m')}</Text>
                  <Text style={s.muted}>{t('safeLogCounts')}</Text>
                </View>
              </View>
              {data.logs.length ? data.logs.map((entry) => (
                <View key={entry.service} style={styles.logRow}>
                  <Text style={styles.logService}>{t(`component_${entry.service}`)}</Text>
                  <View style={styles.logCounts}>
                    <Text style={styles.warningCount}>{entry.warnings5m} {t('warningsShort')}</Text>
                    <Text style={styles.errorCount}>{entry.errors5m} {t('errorsShort')}</Text>
                  </View>
                </View>
              )) : <Text style={s.muted}>{t('noTelemetry')}</Text>}
            </View>

            <View style={styles.panel}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="git-branch-outline" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={s.heading}>{t('tracing')}</Text>
                  <Text style={s.muted}>{t('tracingHint')}</Text>
                </View>
              </View>
              <View style={styles.traceList}>
                {data.tracingServices.length ? data.tracingServices.map((service) => (
                  <View key={service} style={styles.traceChip}>
                    <View style={[styles.statusDot, { backgroundColor: palette.sky }]} />
                    <Text style={styles.traceText}>{service}</Text>
                  </View>
                )) : <Text style={s.muted}>{t('noTelemetry')}</Text>}
              </View>
            </View>
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed-outline" size={22} color={palette.greenBright} />
            <Text style={styles.securityText}>{t('safeTelemetryHint')}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
