import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function BackButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  );
}

export function CustomInput({ label, value, onChangeText, placeholder, secureTextEntry, isPassword, showPassword, onTogglePassword, keyboardType, autoCapitalize }) {
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
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress} disabled={isLoading} activeOpacity={0.8}>
      {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>{title}</Text>}
    </TouchableOpacity>
  );
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

const styles = StyleSheet.create({
  backButton: { marginBottom: 16, marginTop: 8, width: 40, height: 40, justifyContent: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#000', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#FFF', height: 50 },
  input: { flex: 1, paddingHorizontal: 16, fontSize: 15, color: '#000' },
  eyeIcon: { paddingHorizontal: 16 },
  primaryButton: { backgroundColor: '#000', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 12, marginBottom: 20 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  socialButton: { flexDirection: 'row', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', marginBottom: 12 },
  socialIcon: { marginRight: 8 },
  socialButtonText: { fontSize: 15, fontWeight: '500', color: '#000' },
  dividerContainer: { alignItems: 'center', marginVertical: 12 },
  dividerText: { color: '#6B7280', fontSize: 13 },
});