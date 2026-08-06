import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleLogin = async () => {
    setError('');
    clearTimers();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      const status = err.status || err.response?.status;
      const message = (err.message || '').toLowerCase();

      // Перевірка: статус 404 АБО наявність 'not found' у тексті помилки
      const isNotFound = status === 404 || message.includes('not found');

      if (isNotFound) {
        let secondsLeft = 3;
        setError(`User not found. Redirecting in ${secondsLeft}s...`);

        intervalRef.current = setInterval(() => {
          secondsLeft -= 1;
          if (secondsLeft > 0) {
            setError(`User not found. Redirecting in ${secondsLeft}s...`);
          } else {
            clearInterval(intervalRef.current);
          }
        }, 1000);

        timerRef.current = setTimeout(() => {
          navigation.navigate('Register', { prefilledEmail: email });
        }, 3000);
      } else {
        setError(err.message || 'Login failed');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.badge}>HIT TRACKER</Text>
            <Text style={styles.title}>Welcome Back! 👋</Text>
            <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); clearTimers(); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); clearTimers(); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#94A3B8" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkContainer}>
              <Text style={styles.linkText}>
                Don’t have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, maxWidth: 480, alignSelf: 'center', width: '100%' },
  headerContainer: { marginBottom: 28, alignItems: 'center' },
  badge: { color: '#FF5722', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  errorBanner: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 12, borderRadius: 10, marginBottom: 20 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  formContainer: { backgroundColor: '#1E293B', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 16, fontSize: 15 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  passwordInput: { flex: 1, color: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  eyeIcon: { paddingHorizontal: 14 },
  button: { backgroundColor: '#FF5722', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#94A3B8', fontSize: 13 },
  linkTextBold: { color: '#FF5722', fontWeight: 'bold' },
});