import React, { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function NotFoundScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.code, { color: theme.primary }]}>404</Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('pageNotFound')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.replace(userToken ? 'MainApp' : 'Login')}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.buttonText, { color: theme.onPrimary }]}>{t('backToApp')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  code: { fontSize: 56, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, marginTop: 8, textAlign: 'center' },
  button: { borderRadius: 12, minHeight: 48, paddingHorizontal: 24, paddingVertical: 13 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
