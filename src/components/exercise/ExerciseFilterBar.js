import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';
// Замініть на ваш імпорт нової іконки
import { GridIcon } from '../../assets/icons'; 

export function ExerciseFilterBar({
  musclesList = [],
  selectedMuscleFilter,
  onSelectMuscleFilter,
}) {
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const styles = createStyles(theme);
  
  const [isExpanded, setIsExpanded] = useState(false);

  const quickMuscles = musclesList.slice(0, 4);

  const getMuscleDisplayName = (m) => {
    if (!m) return t('allMuscles') || 'Всі';
    const translationKey = `muscle_${m.commonName.toLowerCase().replace(/\s+/g, '_')}`;
    const translatedName = t(translationKey);
    return translatedName !== translationKey ? translatedName : m.commonName;
  };

  const renderChip = (id, name, isActive, isGridItem = false) => (
    <TouchableOpacity
      key={id ?? 'all'}
      style={[
        styles.filterChip,
        isGridItem && styles.gridChip,
        isActive ? styles.chipActive : styles.chipInactive,
      ]}
      onPress={() => {
        onSelectMuscleFilter(isActive ? null : id);
        // Якщо меню відкрите, закриваємо його при виборі
        if (isExpanded) setIsExpanded(false);
      }}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Компактний рядок строго в одну лінію */}
      <View style={styles.rowContainer}>
        <View style={styles.chipsWrapper}>
          {/* Додано умову && !isExpanded, щоб візуально скидати стан, коли меню відкрите */}
          {renderChip(
            null, 
            t('allMuscles') || 'Всі', 
            selectedMuscleFilter === null && !isExpanded
          )}

          {quickMuscles.map((m) =>
            renderChip(
              m.id, 
              getMuscleDisplayName(m), 
              selectedMuscleFilter === m.id && !isExpanded
            )
          )}
        </View>

        {/* Кнопка меню */}
        <TouchableOpacity
          style={[
            styles.menuButton,
            isExpanded && styles.chipActive // Додає червоний фон, коли відкрито
          ]}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.8}
        >
          <GridIcon 
            width={20} 
            height={20} 
            color={isExpanded ? (theme.filterChipActiveText || '#FFFFFF') : (theme.textPrimary || '#FFFFFF')} 
          />
        </TouchableOpacity>
      </View>

      {/* Випадаюче меню з усіма м'язами сіткою */}
      {isExpanded && (
        <View style={styles.expandedMenu}>
          <Text style={styles.expandedTitle}>
            {t('selectMuscle') || 'Оберіть м\'яз'}:
          </Text>
          <View style={styles.gridWrapper}>
            {/* Тут умова звичайна, тому вибраний елемент в сітці БУДЕ червоним */}
            {renderChip(null, t('allMuscles') || 'Всі', selectedMuscleFilter === null, true)}
            {musclesList.map((m) =>
              renderChip(m.id, getMuscleDisplayName(m), selectedMuscleFilter === m.id, true)
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    overflow: 'hidden', 
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
  },
  gridChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 6,
    height: 28,
  },
  chipActive: {
    backgroundColor: theme.filterChipActiveBackground,
  },
  chipInactive: {
    backgroundColor: theme.filterChipBackground,
  },
  filterChipText: {
    color: theme.filterChipText,
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '400',
  },
  filterChipTextActive: {
    color: theme.filterChipActiveText,
    fontWeight: '500',
  },
  menuButton: {
    width: 28, 
    height: 28,
    justifyContent: 'center',
    alignItems: 'center', 
    marginLeft: 8,
    flexShrink: 0,
    borderRadius: 14,
  },
  expandedMenu: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
  },
  expandedTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    color: theme.textSecondary,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
