import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { HomeHeader } from '../components/HomeHeader';
import { StartWorkoutCard } from '../components/StartWorkoutCard';
import { MenuCard } from '../components/MenuCard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Шапка екрана */}
        <HomeHeader onLogout={logout} />

        {/* Головна картка для початку тренування */}
        <StartWorkoutCard onPress={() => navigation.navigate('ActiveWorkout')} />

        {/* Швидка навігація по розділах */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.menuGrid}>
          <MenuCard
            icon="📜"
            title="Workout History"
            subtitle="Review and analyze past training sessions"
            onPress={() => navigation.navigate('History')}
          />
          <MenuCard
            icon="📚"
            title="Exercise Library"
            subtitle="Browse available exercises and details"
            onPress={() => navigation.navigate('Exercises')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuGrid: { gap: 14 },
});