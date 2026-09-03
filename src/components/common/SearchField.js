import React, { useContext } from 'react';
import { TextInput, View } from 'react-native';
import SearchIcon from '../../assets/workshop/Search.svg';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';
import { styles } from './SearchField.styles';

export function SearchField({
  value,
  onChangeText,
  placeholder,
  error = false,
  onFocus,
  onBlur,
  style,
  inputStyle,
  ...inputProps
}) {
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const borderColor = error ? theme.primary : 'transparent';

  return (
    <View style={[styles.container, { backgroundColor: theme.inputBackground, borderColor }, style]}>
      <SearchIcon width={20} height={20} color={theme.inputIcon} />
      <TextInput
        accessibilityLabel={placeholder || t('searchPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        onBlur={(event) => {
          onBlur?.(event);
        }}
        onChangeText={onChangeText}
        onFocus={(event) => {
          onFocus?.(event);
        }}
        placeholder={placeholder || t('searchPlaceholder')}
        placeholderTextColor={theme.inputPlaceholder}
        style={[styles.input, { color: theme.inputText }, inputStyle]}
        underlineColorAndroid="transparent"
        value={value}
        {...inputProps}
      />
    </View>
  );
}
