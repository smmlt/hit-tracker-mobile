import React, { useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../common';
import { createStyles } from './AuthComponents.styles';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';
export function BackButton({ onPress }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
    </TouchableOpacity>
  );
}

export function CustomInput({ label, value, onChangeText, placeholder, secureTextEntry, isPassword, showPassword, onTogglePassword, keyboardType, autoCapitalize, ...inputProps }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.inputPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          {...inputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.inputIcon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function PrimaryButton({ title, onPress, isLoading, disabled }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return <AppButton disabled={disabled} loading={isLoading} onPress={onPress} style={styles.primaryButton} title={title} />;
}

export function SocialButton({ title, onPress, iconName }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <TouchableOpacity style={styles.socialButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={iconName} size={20} color={theme.inputText} style={styles.socialIcon} />
      <Text style={styles.socialButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Divider({ text }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useContext(LanguageContext);
  return (
    <View style={styles.dividerContainer}>
      <Text style={styles.dividerText}>{text || t('orContinueWith')}</Text>
    </View>
  );
}
