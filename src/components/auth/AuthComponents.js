import React, { useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../common';
import { styles } from './AuthComponents.styles';

import { palette } from '../../constants/colors';
import { LanguageContext } from '../../localization/LanguageContext';
export function BackButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={24} color={palette.blackPure} />
    </TouchableOpacity>
  );
}

export function CustomInput({ label, value, onChangeText, placeholder, secureTextEntry, isPassword, showPassword, onTogglePassword, keyboardType, autoCapitalize, ...inputProps }) {
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.grayLegacy}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          {...inputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={palette.grayDark} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function PrimaryButton({ title, onPress, isLoading, disabled }) {
  return <AppButton disabled={disabled} loading={isLoading} onPress={onPress} style={styles.primaryButton} title={title} />;
}

export function SocialButton({ title, onPress, iconName }) {
  return (
    <TouchableOpacity style={styles.socialButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={iconName} size={20} color={palette.blackPure} style={styles.socialIcon} />
      <Text style={styles.socialButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Divider({ text }) {
  const { t } = useContext(LanguageContext);
  return (
    <View style={styles.dividerContainer}>
      <Text style={styles.dividerText}>{text || t('orContinueWith')}</Text>
    </View>
  );
}
