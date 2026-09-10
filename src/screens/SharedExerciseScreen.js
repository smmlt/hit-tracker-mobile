import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { translateCatalogName } from '../localization/catalog';
import { apiRequest } from '../services/api';
import { DetailHeader, Feedback, useWorkshopStyles } from '../components/workshop/ui';
import { ExerciseDetailsContent } from './ExerciseDetailsScreen';
import { styles } from './SharedContentScreen.styles';

export default function SharedExerciseScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const workshopStyles = useWorkshopStyles();
  const exerciseId = Number(route.params?.exerciseId);
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
    ...exercise,
    displayName: translateCatalogName(t, 'exercise', exercise.name),
    muscles: (exercise.muscles || []).map((muscle) => ({
      ...muscle,
      displayName: translateCatalogName(t, 'muscle', muscle.commonName || muscle.name),
    })),
  } : null, [exercise, t]);
  const goBack = () => navigation.canGoBack()
    ? navigation.goBack()
    : navigation.navigate(userToken ? 'MainApp' : 'Login');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={workshopStyles.screen}>
      <DetailHeader title={t('exerciseDetails')} onBack={goBack} />
      <ScrollView contentContainerStyle={[workshopStyles.content, styles.content]} showsVerticalScrollIndicator={false}>
        <Feedback error={error} loading={loading} onRetry={load} />
        {localizedExercise && <ExerciseDetailsContent allowAdd={false} exercise={localizedExercise} />}
      </ScrollView>
    </SafeAreaView>
  );
}
