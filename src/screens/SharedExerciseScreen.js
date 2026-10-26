/**
 * Renders a shared exercise link as a read-only exercise detail flow, loading the shared entity and offering the appropriate authenticated action. / Відображає спільне посилання на вправу як режим перегляду деталей, завантажує спільну сутність і надає відповідну дію для автентифікованого користувача.
 */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { localizeCatalogEntity, translateCatalogName } from '../localization/catalog';
import { apiRequest } from '../services/api';
import { Button, DetailHeader, Feedback, useWorkshopStyles } from '../components/workshop/ui';
import { ExerciseDetailsContent } from './ExerciseDetailsScreen';
import { styles } from './SharedContentScreen.styles';
import { entityId, entityRef } from '../utils/navigationPaths';

export default function SharedExerciseScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const { t, locale } = useContext(LanguageContext);
  const workshopStyles = useWorkshopStyles();
  const exerciseId = entityId(route.params?.exerciseRef) || Number(route.params?.exerciseId);
  const [exercise, setExercise] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setExercise(null);
    apiRequest(`/shared/exercises/${exerciseId}`, { signal: controller.signal })
      .then(setExercise)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(t('sharedContentLoadFailed'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [exerciseId, t]);

  useEffect(() => load(), [load]);
  const localizedExercise = useMemo(() => exercise ? {
    ...localizeCatalogEntity(exercise, locale, t, 'exercise'),
    muscles: (exercise.muscles || []).map((muscle) => ({
      ...muscle,
      displayName: translateCatalogName(t, 'muscle', muscle.commonName || muscle.name),
    })),
  } : null, [exercise, locale, t]);
  const goBack = () => navigation.canGoBack()
    ? navigation.goBack()
    : navigation.navigate(userToken ? 'MainApp' : 'Login');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={workshopStyles.screen}>
      <DetailHeader title={t('exerciseDetails')} onBack={goBack} />
      <ScrollView contentContainerStyle={[workshopStyles.content, styles.content]} showsVerticalScrollIndicator={false}>
        <Feedback error={error} loading={loading} onRetry={load} />
        {localizedExercise && <>
          <ExerciseDetailsContent allowAdd={false} exercise={localizedExercise} />
          {!!userToken && <Button onPress={() => navigation.replace('MainApp', {
            screen: 'Home',
            params: { screen: 'ExerciseDetails', params: { exerciseRef: entityRef(exercise?.name, exerciseId) }, initial: false },
          })}>{t('openInLibrary')}</Button>}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
