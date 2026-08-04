import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = () => {
    setError('');

    if (!email || !password) {
      setError('Заповніть усі поля');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Введіть коректний email (наприклад, user@domain.com)');
      return;
    }

    login(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вхід до системи</Text>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <TextInput
        style={[styles.input, error && !isValidEmail(email) && styles.inputError]}
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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Увійти</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Немає облікового запису? Зареєструватися</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  errorBanner: { backgroundColor: '#FFD2D2', color: '#D8000C', padding: 10, borderRadius: 6, marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 12, fontSize: 16 },
  inputError: { borderColor: '#D8000C' },
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
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { marginTop: 20, color: '#007AFF', textAlign: 'center', fontSize: 14 },
});