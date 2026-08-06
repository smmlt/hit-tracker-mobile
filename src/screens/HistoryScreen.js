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
import { workoutsService } from '../services/workoutsService';
import { CustomToast } from '../components/CustomToast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { HistoryCard } from '../components/HistoryCard';

// Увімкнення експериментальної анімації для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HistoryScreen() {
  const { userToken } = useContext(AuthContext);
  
  // Стани компонента
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null); // ID розгорнутої картки
  const [workoutToDelete, setWorkoutToDelete] = useState(null); // ID тренування для видалення

  // Стани для кастомного сповіщення (Toast)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();

  // Прибираємо фокус/клавіатуру при переході на інший екран
  useEffect(() => {
    if (!isFocused) {
      Keyboard.dismiss();
      if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [isFocused]);

  // Функція для показу сповіщень
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      });
    }, 4000);
  };

  // Завантаження історії тренувань з сервера
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

  // Обробник оновлення сторінки (Pull-to-refresh)
  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Перемикання стану розгортання/згортання картки тренування
  const toggleExpand = (id) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedId(expandedId === id ? null : id);
  };

  // Підтвердження та виконання видалення тренування
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

  // Показуємо спіннер завантаження, поки дані не отримані
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

      {/* Модальне вікно підтвердження видалення */}
      <ConfirmDialog
        visible={!!workoutToDelete}
        title="Delete Workout?"
        message="This action cannot be undone. Are you sure you want to delete this workout record?"
        onCancel={() => setWorkoutToDelete(null)}
        onConfirm={confirmDeleteWorkout}
      />

      {/* Кастомний компонент сповіщень */}
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