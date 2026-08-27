import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, CustomInput, PrimaryButton } from '../components/auth';
import { CustomToast } from '../components/feedback';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function ResetPasswordScreen({ navigation, route }) {
  const token = route?.params?.token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(() => hideToast(), 3500);
  };

  const hideToast = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      .start(() => setToastVisible(false));
  };

  // Розрахунок вимог до пароля
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%...)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const getPasswordStrength = () => {
    let score = requirements.filter(r => r.met).length;
    if (password.length >= 12) score++; // Бонус за довжину
    return score;
  };

  const strength = getPasswordStrength();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) return showToast('Please fill in all fields');
    if (password.length < 8) return showToast('Password must be at least 8 characters');
    if (password !== confirmPassword) return showToast('Passwords do not match');

    const allRequirementsMet = requirements.every(r => r.met);
    if (!allRequirementsMet) return showToast('Password does not meet all requirements');

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      setIsSuccess(true);
    } catch (err) {
      showToast(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.formWrapper}>
            {!isSuccess ? (
              <>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.title}>Create new password</Text>
                <Text style={styles.subtitle}>Your new password must be different from previous used passwords.</Text>

                <CustomInput
                  label="New password"
                  placeholder="********"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  secureTextEntry={!showPassword}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                {/* Індикатор сили пароля */}
                <View style={styles.strengthContainer}>
                  <Text style={styles.strengthText}>
                    {strength >= 5 ? 'Strong' : strength >= 3 ? 'Medium' : 'Weak'}
                  </Text>
                  <View style={styles.barsRow}>
                    {[1, 2, 3, 4, 5, 6].map((index) => (
                      <View
                        key={index}
                        style={[
                          styles.bar,
                          index <= strength ? styles.barActive : styles.barInactive
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Чекліст вимог до пароля */}
                <View style={styles.requirementsContainer}>
                  {requirements.map((req, idx) => (
                    <View key={idx} style={styles.requirementRow}>
                      <Ionicons 
                        name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                        size={16} 
                        color={req.met ? "#10B981" : "#9CA3AF"} 
                      />
                      <Text style={[styles.requirementText, req.met && styles.requirementMetText]}>
                        {req.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <CustomInput
                  label="Confirm password"
                  placeholder="********"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  secureTextEntry={!showConfirmPassword}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <View style={styles.fullWidthButton}>
                  <PrimaryButton title="Reset password" onPress={handleResetPassword} isLoading={isLoading} />
                </View>
              </>
            ) : (
              <View style={styles.centerContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="checkmark" size={48} color="#000" />
                </View>

                <Text style={[styles.title, { textAlign: 'center' }]}>Password reset!</Text>
                <Text style={[styles.title, { textAlign: 'center', marginTop: -4 }]}>You’re all set</Text>
                <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 8, marginBottom: 32 }]}>
                  You can now sign in with your new password.
                </Text>

                <View style={styles.fullWidthButton}>
                  <PrimaryButton title="Go to Sign In" onPress={() => navigation.navigate('Login')} />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type="error"
        variant="light"
        fadeAnim={fadeAnim}
        onClose={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
  formWrapper: { width: '100%' },
  centerContent: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24, lineHeight: 22 },
  strengthContainer: { marginTop: -8, marginBottom: 12 },
  strengthText: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 6 },
  barsRow: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  barActive: { backgroundColor: '#000' },
  barInactive: { backgroundColor: '#E5E7EB' },
  requirementsContainer: { marginBottom: 20, gap: 6 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requirementText: { fontSize: 13, color: '#6B7280' },
  requirementMetText: { color: '#10B981', fontWeight: '500' },
  fullWidthButton: { width: '100%', marginTop: 24 },
});
