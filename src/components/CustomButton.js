import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function CustomButton({ title, onPress, isLoading, style, type = 'primary' }) {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        type === 'secondary' ? styles.secondaryButton : styles.primaryButton, 
        style
      ]} 
      onPress={onPress} 
      disabled={isLoading} 
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    width: '100%',
    marginVertical: 6,
  },
  primaryButton: { 
    backgroundColor: '#FF5722', 
  },
  secondaryButton: { 
    backgroundColor: '#1E293B', 
    borderWidth: 1, 
    borderColor: '#334155', 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: 'bold', 
  },
});