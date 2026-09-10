import React, { useState, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { createStyles } from './ExerciseSortDropdown.styles.js';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';
import { ChevronDownIcon } from '../../assets/icons';

export function ExerciseSortDropdown({ currentSort, onSelectSort }) {
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  
  const buttonRef = useRef(null);
  const styles = createStyles(theme);

  const sortOptions = [
    { key: 'popular', label: t('sortPopular') },
    { key: 'alphabetical', label: t('sortAlphabetical') },
    { key: 'newest', label: t('sortNewest') },
  ];

  const currentLabel = sortOptions.find((opt) => opt.key === currentSort)?.label || t('sortPopular');

  const handleOpenModal = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        setDropdownTop(py + height + 4);
        setDropdownLeft(px);
        setModalVisible(true);
      });
    }
  };

  const handleSelect = (key) => {
    onSelectSort(key);
    setModalVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      {/* Кнопка-тригер сортування з фоном та зміною стрілочки */}
      <TouchableOpacity 
        ref={buttonRef}
        style={styles.container} 
        onPress={handleOpenModal} 
        activeOpacity={0.7}
      >
        <Text style={styles.text}>
          {t('sortBy') || 'Сортування'} : <Text style={styles.boldText}>{currentLabel}</Text>
        </Text>
        <ChevronDownIcon 
          width={16} 
          height={16} 
          color={theme.inputText} 
          style={[styles.icon, modalVisible && styles.iconRotated]} 
        />
      </TouchableOpacity>

      {/* Модальне вікно випадаючого списку */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownMenu, { top: dropdownTop, left: dropdownLeft }]}>
                {sortOptions.map((option) => {
                  const isSelected = currentSort === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.optionItem, isSelected && styles.optionItemActive]}
                      onPress={() => handleSelect(option.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
