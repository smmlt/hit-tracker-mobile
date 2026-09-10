import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { LanguageContext } from '../localization/LanguageContext';
import { translateCatalogName } from '../localization/catalog';
import { apiRequest } from '../services/api';
import { Button, DetailHeader, Feedback, useWorkshopStyles } from '../components/workshop/ui';
import { ProgramDetailsContent } from './LibraryProgramScreen';
import { styles } from './SharedContentScreen.styles';

export default function SharedProgramScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const library = useLibrary();
  const workshopStyles = useWorkshopStyles();
  const token = route.params?.token;
  const [program, setProgram] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setProgram(null);
    apiRequest(`/shared/programs/${encodeURIComponent(token)}`, { signal: controller.signal })
      .then(setProgram)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(t('sharedContentLoadFailed'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [t, token]);

  useEffect(() => load(), [load]);
  const localizedProgram = useMemo(() => program ? {
    ...program,
    displayName: program.isPersonal ? program.name : translateCatalogName(t, 'program', program.name),
    schedule: (program.schedule || []).map((row) => ({
      ...row,
      exercise: row.exercise ? {
        ...row.exercise,
        displayName: translateCatalogName(t, 'exercise', row.exercise.name),
      } : row.exercise,
    })),
  } : null, [program, t]);
  const openProgram = (programId) => navigation.replace('MainApp', {
    screen: 'Home',
    params: { screen: 'LibraryProgram', params: { programId } },
  });
  const handlePrimaryAction = async () => {
    if (!userToken) {
      navigation.navigate('Login');
      return;
    }
    if (!program.isPersonal) {
      openProgram(program.id);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest(
        `/shared/programs/${encodeURIComponent(token)}/import`,
        { method: 'POST' },
        userToken,
      );
      await library.refresh();
      openProgram(result.programId);
    } catch (_) {
      setError(t('sharedProgramImportFailed'));
    } finally {
      setBusy(false);
    }
  };
  const goBack = () => navigation.canGoBack()
    ? navigation.goBack()
    : navigation.navigate(userToken ? 'MainApp' : 'Login');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={workshopStyles.screen}>
      <DetailHeader title={t('programDetails')} onBack={goBack} />
      <ScrollView contentContainerStyle={[workshopStyles.content, styles.content]} showsVerticalScrollIndicator={false}>
        <Feedback error={error} loading={loading} onRetry={load} />
        {localizedProgram && (
          <>
            {!!localizedProgram.ownerUsername && (
              <Text style={[workshopStyles.muted, styles.owner]}>
                {t('sharedBy', { username: `@${localizedProgram.ownerUsername}` })}
              </Text>
            )}
            <ProgramDetailsContent program={localizedProgram} />
            <Button disabled={busy} onPress={handlePrimaryAction}>
              {!userToken
                ? t('signInToAddShared')
                : localizedProgram.isPersonal
                  ? t('addToMyLibrary')
                  : t('openInLibrary')}
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
