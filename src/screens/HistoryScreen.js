import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';

const API_URL = 'http://localhost:3000';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HistoryScreen() {
  const { userToken } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      Keyboard.dismiss();
      if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [isFocused]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/workouts/history`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const toggleExpand = (id) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedId(expandedId === id ? null : id);
  };

  // Функція видалення тренування
  const handleDeleteWorkout = (workoutId) => {
    const performDelete = async () => {
      try {
        const response = await fetch(`${API_URL}/workouts/${workoutId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userToken}` },
        });

        if (response.ok) {
          // Видаляємо елемент зі стану без додаткового релоаду
          setHistory((prevHistory) => prevHistory.filter((item) => item.id !== workoutId));
        } else {
          console.error('Failed to delete workout');
        }
      } catch (err) {
        console.error('Error deleting workout:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Ви впевнені, що хочете видалити це тренування?')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Видалення тренування',
        'Ви впевнені, що хочете видалити це тренування?',
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Видалити', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
        }
      >
        <Text style={styles.title}>Workout History 📜</Text>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>You don't have any saved workouts yet.</Text>
          </View>
        ) : (
          history.map((workout, index) => {
            const uniqueKey = workout.id ? `${workout.id}` : `workout-${index}`;
            const isExpanded = expandedId === uniqueKey;
            const setsCount = workout.sets?.length || 0;
            const formattedDate = new Date(
              workout.createdAt || workout.startDate
            ).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View key={uniqueKey} style={styles.card}>
                {/* Header Card */}
                <View style={styles.cardHeaderContainer}>
                  <TouchableOpacity
                    style={styles.cardHeaderClickable}
                    onPress={() => toggleExpand(uniqueKey)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.headerInfo}>
                      <Text style={styles.workoutType}>{workout.type || 'HIT Session'}</Text>
                      <Text style={styles.workoutDate}>{formattedDate}</Text>
                    </View>

                    <View style={styles.badgeContainer}>
                      <Text style={styles.setsBadge}>{setsCount} sets</Text>
                      <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Кнопка видалення */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteWorkout(workout.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Expanded Information */}
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
                      workout.sets.map((set, setIndex) => {
                        const setKey = set.id ? `${set.id}` : `set-${setIndex}`;
                        return (
                          <View key={setKey} style={styles.setRow}>
                            <View style={styles.setMainInfo}>
                              <Text style={styles.setNumber}>#{setIndex + 1}</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.exerciseName}>
                                  {set.exercise?.name || `Exercise #${set.exerciseId}`}
                                </Text>
                                <Text style={styles.setMetrics}>
                                  {set.weight} kg × {set.reps} reps (RPE: {set.rpe || 10})
                                </Text>
                              </View>
                            </View>
                            {set.isFailure && (
                              <View style={styles.failureBadge}>
                                <Text style={styles.failureBadgeText}>FAILURE 🔥</Text>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%' },
  centerContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },

  title: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 20 },

  emptyCard: { backgroundColor: '#1E293B', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14 },

  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  cardHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingRight: 12,
  },
  cardHeaderClickable: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: { flex: 1 },
  workoutType: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  workoutDate: { color: '#94A3B8', fontSize: 12 },

  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  setsBadge: {
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    color: '#FF5722',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  arrow: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },

  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: { fontSize: 14 },

  cardDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0F172A',
  },
  notesBox: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notesTitle: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  notesText: { color: '#CBD5E1', fontSize: 13, marginTop: 2, fontStyle: 'italic' },

  detailsHeader: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
  },
  noSetsText: { color: '#64748B', fontSize: 13, fontStyle: 'italic', marginVertical: 6 },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  setMainInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  setNumber: { color: '#FF5722', fontWeight: 'bold', width: 28, fontSize: 13 },
  exerciseName: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  setMetrics: { color: '#94A3B8', fontSize: 12, marginTop: 2 },

  failureBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  failureBadgeText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },
});