import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Шапка */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.greeting}>Вітаємо! 💪</Text>
            <Text style={styles.title}>HIT Tracker</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Вийти</Text>
          </TouchableOpacity>
        </View>

        {/* Головна картка */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => navigation.navigate('ActiveWorkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.heroBadge}>ГОТОВІ ДО РОБОТИ?</Text>
          <Text style={styles.heroTitle}>Почати тренування 🏋️‍♂️</Text>
          <Text style={styles.heroSubtitle}>
            Записуйте вагу, повторення та HIT-сети до відмови в реальному часі.
          </Text>
        </TouchableOpacity>

        {/* Швидка навігація */}
        <Text style={styles.sectionTitle}>Розділи</Text>
        <View style={styles.menuGrid}>
          {/* Історія тренувань */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📜</Text>
            <Text style={styles.menuTitle}>Історія тренувань</Text>
            <Text style={styles.menuSubtitle}>Аналіз та перегляд минулих сесій</Text>
          </TouchableOpacity>

          {/* База вправ */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation.navigate('Exercises')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📚</Text>
            <Text style={styles.menuTitle}>База вправ</Text>
            <Text style={styles.menuSubtitle}>Каталог доступних вправ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Виправлено помилку стилю
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  greeting: { fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#F8FAFC' },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },

  heroCard: {
    backgroundColor: '#FF5722',
    padding: 24,
    borderRadius: 16,
    marginBottom: 28,
  },
  heroBadge: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  heroSubtitle: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, lineHeight: 18 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuGrid: { gap: 14 },
  menuCard: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuIcon: { fontSize: 26, marginBottom: 8 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: '#94A3B8' },
});