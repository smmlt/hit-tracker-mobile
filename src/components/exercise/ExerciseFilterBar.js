import React, { useContext, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';
// Замініть на ваш імпорт нової іконки
import { GridIcon } from '../../assets/icons'; 
import { createStyles } from './ExerciseFilterBar.styles';

export function ExerciseFilterBar({
  musclesList = [],
  selectedMuscleFilter,
  onSelectMuscleFilter,
}) {
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const styles = createStyles(theme);
  
  const [isModalVisible, setModalVisible] = useState(false);

  const getMuscleDisplayName = (m) => {
    if (!m) return t('allMuscles') || 'Всі';
    const translationKey = `muscle_${m.commonName.toLowerCase().replace(/\s+/g, '_')}`;
    const translatedName = t(translationKey);
    return translatedName !== translationKey ? translatedName : m.commonName;
  };

  const renderChip = (id, name, isActive, closeModal = false) => (
    <TouchableOpacity
      key={id ?? 'all'}
      style={[
        styles.filterChip,
        isActive ? styles.chipActive : styles.chipInactive,
      ]}
      onPress={() => {
        onSelectMuscleFilter(isActive ? null : id);
        if (closeModal) setModalVisible(false);
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
      <View style={styles.rowContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsCarousel}
          contentContainerStyle={styles.chipsContent}
        >
          {renderChip(
            null, 
            t('allMuscles') || 'Всі', 
            selectedMuscleFilter === null
          )}

          {musclesList.map((m) =>
            renderChip(
              m.id, 
              getMuscleDisplayName(m), 
              selectedMuscleFilter === m.id
            )
          )}
        </ScrollView>

        <TouchableOpacity
          accessibilityLabel={t('selectMuscle') || 'Оберіть м\'яз'}
          accessibilityRole="button"
          style={styles.menuButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <GridIcon 
            width={20} 
            height={20} 
            color={theme.textPrimary || '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('selectMuscle') || 'Оберіть м\'яз'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.gridWrapper}>
                {renderChip(null, t('allMuscles') || 'Всі', selectedMuscleFilter === null, true)}
                {musclesList.map((m) => renderChip(m.id, getMuscleDisplayName(m), selectedMuscleFilter === m.id, true))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
