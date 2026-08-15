import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';

import SearchBar from '../components/SearchBar';
import { ExerciseFilterBar } from '../components/ExerciseFilterBar';
import { ExerciseSortDropdown } from '../components/ExerciseSortDropdown';
import { ExerciseItem } from '../components/ExerciseItem'; 

export default function HomeScreen() {
  const navigation = useNavigation();
  const { userToken, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { theme } = useTheme(); // Динамічна тема (dark / light)

  const [exercises, setExercises] = useState([]);
  const [musclesList, setMusclesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState(null);
  const [sortOption, setSortOption] = useState('popular');

  const fetchData = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    setError(null);
    try {
      // Паралельно завантажуємо вправи (з прив'язаними м'язами) та список м'язів
      const [resExercises, resMuscles] = await Promise.all([
        apiFetch('/exercises', {}, userToken),
        apiFetch('/exercises/muscles', {}, userToken),
      ]);

      if (resExercises.status === 401 || resMuscles.status === 401) {
        await logout(); 
        return;
      }

      if (resExercises.ok && Array.isArray(resExercises.data)) {
        setExercises(resExercises.data);
      }
      if (resMuscles.ok && Array.isArray(resMuscles.data)) {
        setMusclesList(resMuscles.data);
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      if (err?.status === 401 || err?.message?.includes('401')) {
        await logout();
        return;
      }
      setError('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, logout]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  // Логіка фільтрації та сортування вправ
  const getFilteredAndSortedExercises = () => {
    let data = [...exercises];

    // 1. Пошук за назвою вправи
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter((ex) => ex.name?.toLowerCase().includes(query));
    }

    // 2. Фільтрація за вибраним м'язом
    if (selectedMuscleFilter) {
      data = data.filter((ex) => {
        const hasDrizzleRelation = Array.isArray(ex.exercisesTrainMuscles) && 
          ex.exercisesTrainMuscles.some((etm) => etm?.muscleId === selectedMuscleFilter || etm?.muscle_id === selectedMuscleFilter);

        const hasSnakeCaseRelation = Array.isArray(ex.exercises_train_muscles) && 
          ex.exercises_train_muscles.some((etm) => etm?.muscleId === selectedMuscleFilter || etm?.muscle_id === selectedMuscleFilter);

        const hasMusclesArray = Array.isArray(ex.muscles) && 
          ex.muscles.some((m) => m?.id === selectedMuscleFilter || m === selectedMuscleFilter);

        return hasDrizzleRelation || hasSnakeCaseRelation || hasMusclesArray;
      });
    }

    // 3. Сортування списку
    switch (sortOption) {
      case 'alphabetical':
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'newest':
        data.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        break;
      case 'popular':
      default:
        data.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
    }

    return data;
  };

  const displayedExercises = getFilteredAndSortedExercises();

  // Шапка екрану (Пошук, фільтри, сортування)
  const headerElement = (
    <View style={styles.headerContainer}>
      <Text style={[styles.mainTitle, { color: theme.textPrimary }]}>
        {t('home') || 'Мастерська'}
      </Text>

      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterWrapper}>
        <ExerciseFilterBar
          musclesList={musclesList}
          selectedMuscleFilter={selectedMuscleFilter}
          onSelectMuscleFilter={setSelectedMuscleFilter}
        />
      </View>

      <View style={styles.sortWrapper}>
        <ExerciseSortDropdown
          currentSort={sortOption}
          onSelectSort={setSortOption}
        />
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={theme.background === '#FFFFFF' || theme.background === '#F1F5F9' ? 'dark-content' : 'light-content'} 
        backgroundColor={theme.background} 
      />

      <FlatList
        data={displayedExercises}
        renderItem={({ item }) => (
          <ExerciseItem exercise={item} />
        )}
        keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
        ListHeaderComponent={headerElement} 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          !loading && (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t('exercisesNotFound') || 'Вправ не знайдено'}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  headerContainer: {
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Roboto',
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 16,
  },
  searchWrapper: {
    marginBottom: 20,
  },
  filterWrapper: {
    marginBottom: 20,
  },
  sortWrapper: {
    marginBottom: 16, 
    zIndex: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontWeight: '500',
  },
});