import React, { useState, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native';
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

const createStyles = (theme) => StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground, 
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  text: {
    color: theme.inputText,
    fontSize: 14,
    fontWeight: '400',
  },
  boldText: {
    fontWeight: '600',
    color: theme.inputText,
  },
  icon: {
    marginLeft: 8,
    transform: [{ rotate: '0deg' }],
  },
  iconRotated: {
    transform: [{ rotate: '180deg' }], 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    width: 200,
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingVertical: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionItemActive: {
    backgroundColor: theme.primary + '20',
  },
  optionText: {
    fontSize: 14,
    color: theme.inputText,
    fontWeight: '400',
  },
  optionTextActive: {
    fontWeight: 'bold',
    color: theme.primary,
  },
});
