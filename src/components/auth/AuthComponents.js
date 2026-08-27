import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../common';
import { styles } from './AuthComponents.styles';

export function BackButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={24} color="#000" />
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
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          {...inputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function PrimaryButton({ title, onPress, isLoading }) {
  return <AppButton loading={isLoading} onPress={onPress} style={styles.primaryButton} title={title} />;
}

export function SocialButton({ title, onPress, iconName }) {
  return (
    <TouchableOpacity style={styles.socialButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={iconName} size={20} color="#000" style={styles.socialIcon} />
      <Text style={styles.socialButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Divider({ text = 'or continue with' }) {
  return (
    <View style={styles.dividerContainer}>
      <Text style={styles.dividerText}>{text}</Text>
    </View>
  );
}
