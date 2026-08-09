import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

// Загальні поради з безпеки для всіх вправ
const DEFAULT_SAFETY_TIPS = [
  'Keep your spine in a neutral position (avoid excessive arching)',
  'Do not use excessive weight at the expense of proper technique',
  'Control your breathing: exhale on exertion, inhale on release',
  'Perform movements smoothly without sudden jerks',
];

export function ExerciseItem({ exercise, isExpanded, onToggleExpand }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggleExpand}
        style={styles.cardHeader}
      >
        <Text style={styles.cardTitle}>{exercise.name}</Text>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.cardBody}>
          {exercise.description ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.descriptionText}>{exercise.description}</Text>
            </View>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.label}>Target Muscles:</Text>
            {exercise.muscles && exercise.muscles.length > 0 ? (
              <View style={styles.muscleTagsContainer}>
                {exercise.muscles.map((m) => (
                  <View key={m.id} style={styles.muscleTag}>
                    <Text style={styles.muscleTagText}>
                      {m.commonName} {m.scientificName ? `(${m.scientificName})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Muscles not specified</Text>
            )}
          </View>

          <View style={styles.safetyBox}>
            <Text style={styles.safetyTitle}>🛡️ Safety Guidelines:</Text>
            {DEFAULT_SAFETY_TIPS.map((tip, idx) => (
              <Text key={idx} style={styles.safetyTipText}>
                • {tip}
              </Text>
            ))}
          </View>

          {exercise.videoUrl ? (
            <TouchableOpacity
              style={styles.videoButton}
              onPress={() => Linking.openURL(exercise.videoUrl)}
            >
              <Text style={styles.videoButtonText}>
                ▶ Watch Technique (YouTube)
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  expandIcon: { color: '#94A3B8', fontSize: 12 },
  cardBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sectionBlock: { marginBottom: 12 },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 6 },
  descriptionText: { color: '#E2E8F0', fontSize: 14, lineHeight: 20 },
  emptyText: { color: '#64748B', fontSize: 13, fontStyle: 'italic' },
  muscleTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleTag: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  muscleTagText: { color: '#CBD5E1', fontSize: 12 },
  safetyBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EAB308',
  },
  safetyTitle: {
    color: '#EAB308',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  safetyTipText: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  videoButton: {
    marginTop: 4,
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  videoButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});