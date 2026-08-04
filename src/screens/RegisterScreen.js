import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { isValidEmail, getPasswordCriteria, isValidPassword } from '../utils/validation';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading } = useContext(AuthContext);

  const criteria = getPasswordCriteria(password);

  const handleRegister = () => {
    setError('');

    if (!isValidEmail(email)) {
      setError('Введіть коректну email-адресу');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Пароль не відповідає всім вимогам');
      return;
    }

    register(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Реєстрація</Text>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(text) => { setEmail(text); setError(''); }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Поле пароля */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Пароль"
          value={password}
          onChangeText={(text) => { setPassword(text); setError(''); }}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity 
          style={styles.eyeIcon} 
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
            size={22} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.hintsContainer}>
        <Text style={styles.hintTitle}>Вимоги до пароля:</Text>
        <Text style={[styles.hintItem, criteria.minLength ? styles.hintSuccess : styles.hintPending]}>
          {criteria.minLength ? '✓' : '•'} Мінімум 8 символів
        </Text>
        <Text style={[styles.hintItem, criteria.hasNumber ? styles.hintSuccess : styles.hintPending]}>
          {criteria.hasNumber ? '✓' : '•'} Принаймні одна цифра
        </Text>
        <Text style={[styles.hintItem, criteria.hasUpper ? styles.hintSuccess : styles.hintPending]}>
          {criteria.hasUpper ? '✓' : '•'} Принаймні одна велика літера
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Зареєструватися</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Вже є обліковий запис? Увійти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  errorBanner: { backgroundColor: '#FFD2D2', color: '#D8000C', padding: 10, borderRadius: 6, marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 12, fontSize: 16 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  eyeIcon: { paddingHorizontal: 12 },
  hintsContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  hintTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: '#666' },
  hintItem: { fontSize: 13, marginBottom: 4 },
  hintPending: { color: '#888' },
  hintSuccess: { color: '#28A745', fontWeight: 'bold' },
  button: { backgroundColor: '#34C759', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { marginTop: 20, color: '#007AFF', textAlign: 'center', fontSize: 14 },
});