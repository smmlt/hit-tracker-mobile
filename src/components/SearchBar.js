import React, { useContext } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { SearchIcon } from '../assets/icons';

export default function SearchBar({ value, onChangeText }) {
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <SearchIcon width={20} height={20} color={theme.inputIcon} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={t('searchPlaceholder')}
        placeholderTextColor={theme.inputPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    width: '100%',
    height: 44,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.inputText,
    fontSize: 14,
    fontWeight: '400',
    outlineStyle: 'none',
  },
});