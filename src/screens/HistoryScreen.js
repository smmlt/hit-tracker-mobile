import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
  Animated,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { workoutsService } from '../services/workoutsService';
import { ConfirmDialog, CustomToast } from '../components/feedback';
import { HistoryCard } from '../components/workout';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HistoryScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { userToken } = useContext(AuthContext);
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      Keyboard.dismiss();
      if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [isFocused]);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      });
    }, 4000);
  };

  const fetchHistory = async () => {
    try {
      const data = await workoutsService.getHistory(userToken);
      setHistory(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load workout history', 'error');
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

  const confirmDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    const workoutId = workoutToDelete;
    setWorkoutToDelete(null);

    try {
      await workoutsService.deleteWorkout(userToken, workoutId);
      setHistory((prev) => prev.filter((item) => item.id !== workoutId));
      showToast('Workout deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete workout', 'error');
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
        contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 20 }]}
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
            const uniqueKey = workout.id ? String(workout.id) : `workout-${index}`;
            return (
              <HistoryCard
                key={uniqueKey}
                workout={workout}
                index={index}
                isExpanded={expandedId === uniqueKey}
                onToggleExpand={toggleExpand}
                onDelete={(id) => setWorkoutToDelete(id)}
              />
            );
          })
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!workoutToDelete}
        title="Delete Workout?"
        message="This action cannot be undone. Are you sure you want to delete this workout record?"
        onCancel={() => setWorkoutToDelete(null)}
        onConfirm={confirmDeleteWorkout}
      />

      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        fadeAnim={fadeAnim}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%', paddingBottom: 60 },
  centerContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 20 },
  emptyCard: { backgroundColor: '#1E293B', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14 },
});
