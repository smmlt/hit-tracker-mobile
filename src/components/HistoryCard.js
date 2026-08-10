import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SetRow } from './SetRow';

// ⏱️ Форматер тривалості для картки
function formatDurationHuman(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function HistoryCard({ workout, index, isExpanded, onToggleExpand, onDelete }) {
  const uniqueKey = workout.id ? String(workout.id) : `workout-${index}`;
  const setsCount = workout.sets ? workout.sets.length : 0;
  
  const formattedDate = new Date(workout.finishedAt || workout.createdAt || workout.startDate).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderContainer}>
        <TouchableOpacity
          style={styles.cardHeaderClickable}
          onPress={() => onToggleExpand(uniqueKey)}
          activeOpacity={0.7}
        >
          <View style={styles.headerInfo}>
            <Text style={styles.workoutType}>{workout.type || 'HIT Session'}</Text>
            <Text style={styles.workoutDate}>{formattedDate}</Text>
          </View>

          <View style={styles.badgeContainer}>
            {/* ⏱️ БЕЙДЖ ТРИВАЛОСТІ */}
            {workout.durationSeconds ? (
              <Text style={styles.durationBadge}>
                ⏱️ {formatDurationHuman(workout.durationSeconds)}
              </Text>
            ) : null}

            <Text style={styles.setsBadge}>{setsCount} sets</Text>
            <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(workout.id)}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.cardDetails}>
          {workout.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          ) : null}

          <Text style={styles.detailsHeader}>Performed Sets:</Text>

          {setsCount === 0 ? (
            <Text style={styles.noSetsText}>No sets recorded for this workout.</Text>
          ) : (
            <View style={styles.setsWrapper}>
              {workout.sets.map((set, setIndex) => (
                <SetRow 
                  key={set.id ? `set-id-${set.id}` : `set-idx-${setIndex}`} 
                  set={set} 
                  index={setIndex} 
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1E293B', borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  cardHeaderContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingRight: 12 },
  cardHeaderClickable: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  headerInfo: { flex: 1 },
  workoutType: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  workoutDate: { color: '#94A3B8', fontSize: 12 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  
  // ⏱️ СТИЛЬ ДЛЯ БЕЙДЖА ЧАСУ
  durationBadge: { backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', fontWeight: 'bold', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  
  setsBadge: { backgroundColor: 'rgba(255, 87, 34, 0.15)', color: '#FF5722', fontWeight: 'bold', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  arrow: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
  deleteButton: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { fontSize: 14 },
  cardDetails: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#334155', backgroundColor: '#0F172A' },
  notesBox: { backgroundColor: '#1E293B', padding: 10, borderRadius: 8, marginTop: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  notesTitle: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  notesText: { color: '#CBD5E1', fontSize: 13, marginTop: 2, fontStyle: 'italic' },
  detailsHeader: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  noSetsText: { color: '#64748B', fontSize: 13, fontStyle: 'italic', marginVertical: 6 },
  setsWrapper: { width: '100%' },
});