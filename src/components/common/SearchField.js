import React, { useContext, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SearchIcon } from '../../assets/icons';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';

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
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.primary : focused ? theme.border : 'transparent';

  return (
    <View style={[styles.container, { backgroundColor: theme.inputBackground, borderColor }, style]}>
      <SearchIcon width={32} height={32} color={theme.gray || '#838384'} />
      <TextInput
        accessibilityLabel={placeholder || t('searchPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onChangeText={onChangeText}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholder={placeholder || t('searchPlaceholder')}
        placeholderTextColor={theme.inputPlaceholder}
        style={[styles.input, { color: theme.inputText }, inputStyle]}
        value={value}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', borderRadius: 8, borderWidth: 2, flexDirection: 'row', height: 62, paddingHorizontal: 8 },
  input: { flex: 1, fontSize: 18, fontWeight: '600', height: '100%', marginLeft: 10, padding: 0 },
});
