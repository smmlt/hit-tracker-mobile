// EN: Adapts the Zustand library store to the legacy context-shaped API and localizes catalog entities for consuming screens.
// UK: Адаптує Zustand-сховище бібліотеки до сумісного context API та локалізує сутності каталогу для екранів.
import { useContext, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LanguageContext } from '../localization/LanguageContext';
import { localizeCatalogEntity, translateCatalogName } from '../localization/catalog';
import { useLibraryStore } from '../stores/libraryStore';

export function useLibrary(keys = ['exercises', 'programs', 'muscles', 'errors', 'loading', 'refresh', 'react']) {
  const { t, locale } = useContext(LanguageContext);
  const selected = useLibraryStore(useShallow((state) => Object.fromEntries(keys.map((key) => [key, state[key]]))));
  const { exercises, programs, muscles } = selected;
  const localizedMuscles = useMemo(() => muscles?.map((muscle) => ({
    ...muscle,
    displayName: translateCatalogName(t, 'muscle', muscle.commonName),
  })), [muscles, locale]);
  const localizedExercises = useMemo(() => exercises?.map((source) => {
    const exercise = localizeCatalogEntity(source, locale, t, 'exercise');
    return ({
    ...exercise,
    muscles: (exercise.muscles || []).map((muscle) => ({
      ...muscle,
      displayName: translateCatalogName(t, 'muscle', muscle.commonName || muscle.name),
    })),
  });
  }), [exercises, locale]);
  const localizedPrograms = useMemo(() => programs?.map((source) => {
    const program = localizeCatalogEntity(source, locale, t, 'program', source.isPersonal);
    return ({
    ...program,
    schedule: (program.schedule || []).map((row) => ({
      ...row,
      exercise: row.exercise ? localizeCatalogEntity(row.exercise, locale, t, 'exercise') : row.exercise,
    })),
  });
  }), [programs, locale]);
  const localizedSearch = useMemo(() => selected.search?.items?.map((item) => ({
    ...item,
    ...localizeCatalogEntity(item, locale, t, selected.search.section === 'programs' ? 'program' : 'exercise', item.isPersonal),
    ...(selected.search.section === 'exercises' ? { muscles: (item.muscles || []).map((muscle) => ({
      ...muscle,
      displayName: translateCatalogName(t, 'muscle', muscle.commonName || muscle.name),
    })) } : {}),
    ...(selected.search.section === 'programs' ? { schedule: (item.schedule || []).map((row) => ({
      ...row,
      exercise: row.exercise ? localizeCatalogEntity(row.exercise, locale, t, 'exercise') : row.exercise,
    })) } : {}),
  })) ?? null, [selected.search, locale]);
  return {
    ...selected,
    ...(exercises ? { exercises: localizedExercises } : {}),
    ...(programs ? { programs: localizedPrograms } : {}),
    ...(muscles ? { muscles: localizedMuscles } : {}),
    search: selected.search ? { ...selected.search, items: localizedSearch } : selected.search,
  };
}
