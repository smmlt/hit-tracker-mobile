import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { isValidEmail, getPasswordCriteria, isValidPassword } from '../utils/validation';

export default function RegisterScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading } = useContext(AuthContext);

  // Якщо користувач прийшов з логіну за таймером, можемо автоматично підставити його email
  useEffect(() => {
    if (route?.params?.prefilledEmail) {
      setEmail(route.params.prefilledEmail);
    }
  }, [route?.params?.prefilledEmail]);

  const criteria = getPasswordCriteria(password);

  const handleRegister = async () => {
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Password does not meet all requirements');
      return;
    }

    try {
      await register(email, password);
    } catch (err) {
      const errMessage = err.message || '';
      const lowerMsg = errMessage.toLowerCase();

      // Точна перевірка помилок бекенда для зайнятої пошти
      if (
        lowerMsg.includes('already') || 
        lowerMsg.includes('exists') || 
        lowerMsg.includes('зайнят') || 
        lowerMsg.includes('існує') ||
        lowerMsg.includes('taken')
      ) {
        setError('This email is already registered. Please sign in instead.');
      } else if (lowerMsg.includes('not found')) {
        // Якщо бекенд при реєстрації чомусь відповідає "not found", це означає проблеми на бекенді, 
        // але для користувача виводимо зрозумілу інформацію
        setError('Registration error. Please check your details or try another email.');
      } else {
        setError(errMessage || 'Registration failed');
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
            <Text style={styles.title}>Create Account 🚀</Text>
            <Text style={styles.subtitle}>Start tracking your workouts effectively</Text>
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
              onChangeText={(text) => { setEmail(text); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a password"
                placeholderTextColor="#64748B"
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
                  size={20} 
                  color="#94A3B8" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.hintsContainer}>
              <Text style={styles.hintTitle}>Password requirements:</Text>
              <Text style={[styles.hintItem, criteria.minLength ? styles.hintSuccess : styles.hintPending]}>
                {criteria.minLength ? '✓' : '•'} Minimum 8 characters
              </Text>
              <Text style={[styles.hintItem, criteria.hasNumber ? styles.hintSuccess : styles.hintPending]}>
                {criteria.hasNumber ? '✓' : '•'} At least one number
              </Text>
              <Text style={[styles.hintItem, criteria.hasUpper ? styles.hintSuccess : styles.hintPending]}>
                {criteria.hasUpper ? '✓' : '•'} At least one uppercase letter
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkContainer}>
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
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
  headerContainer: { marginBottom: 24, alignItems: 'center' },
  badge: { color: '#FF5722', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  errorBanner: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  formContainer: { backgroundColor: '#1E293B', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 14, fontSize: 15 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  passwordInput: { flex: 1, color: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  eyeIcon: { paddingHorizontal: 14 },
  hintsContainer: { backgroundColor: '#0F172A', padding: 12, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  hintTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 6, color: '#94A3B8', textTransform: 'uppercase' },
  hintItem: { fontSize: 12, marginBottom: 3 },
  hintPending: { color: '#64748B' },
  hintSuccess: { color: '#10B981', fontWeight: 'bold' },
  button: { backgroundColor: '#FF5722', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#94A3B8', fontSize: 13 },
  linkTextBold: { color: '#FF5722', fontWeight: 'bold' },
});