// EN: Anchors a theme-aware, scrollable locale menu to its settings trigger across phone, tablet, and web layouts.
// UK: Прив'язує тематичне прокручуване меню мов до кнопки налаштувань на телефонах, планшетах і web.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { LOCALE_OPTIONS } from '../../localization/locale';
import { useTheme } from '../../context/ThemeContext';
import { languageMenuLayout } from '../../utils/languageDropdown';
import { createStyles } from './LanguageDropdown.styles.js';

const OPTION_HEIGHT = 48;
const MENU_VERTICAL_PADDING = 12;
function LocaleFlag({ code, styles }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.flagFrame}>
      <Svg height={16} viewBox="0 0 24 16" width={24}>
        {code === 'ua' ? (
          <>
            <Rect fill="#0057B7" height="8" width="24" x="0" y="0" />
            <Rect fill="#FFD700" height="8" width="24" x="0" y="8" />
          </>
        ) : (
          <>
            <Rect fill="#012169" height="16" width="24" />
            <Line stroke="#FFFFFF" strokeWidth="4" x1="0" x2="24" y1="0" y2="16" />
            <Line stroke="#FFFFFF" strokeWidth="4" x1="24" x2="0" y1="0" y2="16" />
            <Line stroke="#C8102E" strokeWidth="2" x1="0" x2="24" y1="0" y2="16" />
            <Line stroke="#C8102E" strokeWidth="2" x1="24" x2="0" y1="0" y2="16" />
            <Path d="M10 0H14V6H24V10H14V16H10V10H0V6H10V0Z" fill="#FFFFFF" />
            <Path d="M11 0H13V7H24V9H13V16H11V9H0V7H11V0Z" fill="#C8102E" />
          </>
        )}
      </Svg>
    </View>
  );
}

export function LanguageDropdown({ locale, onChange, t }) {
  const { height, width } = useWindowDimensions();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const triggerRef = useRef(null);
  const [anchor, setAnchor] = useState(null);
  const [open, setOpen] = useState(false);
  const selected = LOCALE_OPTIONS.find((option) => option.value === locale) || LOCALE_OPTIONS[0];

  const measureAndOpen = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, triggerWidth, triggerHeight) => {
      setAnchor({ x, y, width: triggerWidth, height: triggerHeight });
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (open) measureAndOpen();
  }, [height, measureAndOpen, open, width]);

  const menuLayout = useMemo(() => languageMenuLayout({
    anchor,
    optionCount: LOCALE_OPTIONS.length,
    viewportHeight: height,
    viewportWidth: width,
  }), [anchor, height, width]);

  const selectLocale = (nextLocale) => {
    setOpen(false);
    if (nextLocale !== locale) void onChange(nextLocale);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityLabel={t('language')}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={measureAndOpen}
        ref={triggerRef}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <View style={styles.value}>
          <LocaleFlag code={selected.flag} styles={styles} />
          <Text numberOfLines={1} style={styles.valueText}>{t(selected.labelKey)}</Text>
        </View>
        <Ionicons color={theme.textPrimary} name={open ? 'chevron-up' : 'chevron-down'} size={22} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
        transparent
        visible={open && !!menuLayout}
      >
        <View style={styles.modal}>
          <Pressable accessibilityLabel={t('close')} onPress={() => setOpen(false)} style={styles.backdrop} />
          <View accessibilityRole="menu" style={[styles.menu, menuLayout]}>
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.menuContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={LOCALE_OPTIONS.length * OPTION_HEIGHT + MENU_VERTICAL_PADDING > menuLayout?.maxHeight}
            >
              {LOCALE_OPTIONS.map((option) => {
                const isSelected = option.value === locale;
                return (
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSelected }}
                    key={option.value}
                    onPress={() => selectLocale(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <LocaleFlag code={option.flag} styles={styles} />
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{t(option.labelKey)}</Text>
                    {isSelected ? <Ionicons color={theme.onPrimary} name="checkmark" size={20} /> : <View style={styles.checkSpacer} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
