import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { MediaImage } from '../components/media/MediaImage';
import { apiRequest } from '../services/api';

const isHttpsUrl = (value) => /^https:\/\/[^\s]+$/i.test(value || '');

export default function MediaSourcesScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setItems(null);
    setError('');
    apiRequest(`/exercises/media-sources?locale=${locale}`, {}, userToken)
      .then((result) => active && setItems(result))
      .catch(() => active && setError(t('mediaSourcesLoadFailed')));
    return () => {
      active = false;
    };
  }, [locale, t, userToken]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons color={theme.textPrimary} name="arrow-back" size={24} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('mediaSources')}</Text>
      </View>
      {!items && !error ? <ActivityIndicator color={theme.primary} /> : null}
      {!!error ? <Text accessibilityRole="alert" style={[styles.state, { color: theme.primary }]}>{error}</Text> : null}
      {items?.length === 0 ? <Text style={[styles.state, { color: theme.textSecondary }]}>{t('mediaSourcesEmpty')}</Text> : null}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items?.map((item) => (
          <View key={item.id} style={[styles.card, { borderColor: theme.border }]}>
            <MediaImage accessibilityLabel={item.name} source={item.imageUrl} style={styles.preview} />
            <View style={styles.details}>
              <Text style={[styles.name, { color: theme.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{t('mediaAuthor')}: {item.author || t('mediaAuthorUnknown')}</Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>{t('mediaLicense')}: {item.license}</Text>
              {isHttpsUrl(item.sourceUrl) ? (
                <Pressable accessibilityRole="link" onPress={() => Linking.openURL(item.sourceUrl)}>
                  <Text style={[styles.link, { color: theme.primary }]}>{t('openMediaSource')}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 60, paddingHorizontal: 20 },
  back: { marginRight: 16, padding: 8 },
  title: { fontFamily: 'Inter-Bold', fontSize: 22 },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  card: { borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 12 },
  preview: { borderRadius: 8, height: 104, width: 104 },
  details: { flex: 1, justifyContent: 'center' },
  name: { fontFamily: 'Inter-SemiBold', fontSize: 16, marginBottom: 6 },
  meta: { fontFamily: 'Inter-Regular', fontSize: 13, marginBottom: 3 },
  link: { fontFamily: 'Inter-SemiBold', fontSize: 14, marginTop: 7 },
  state: { fontFamily: 'Inter-Regular', padding: 24, textAlign: 'center' },
});
