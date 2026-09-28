import { useContext, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LanguageContext } from '../localization/LanguageContext';
import { translateCatalogName } from '../localization/catalog';
import { useLibraryStore } from '../stores/libraryStore';

export function useLibrary(keys = ['exercises', 'programs', 'muscles', 'errors', 'loading', 'refresh', 'react']) {
  const { t, locale } = useContext(LanguageContext);
  const selected = useLibraryStore(useShallow((state) => Object.fromEntries(keys.map((key) => [key, state[key]]))));
  const { exercises, programs, muscles } = selected;
  const localizedMuscles = useMemo(() => muscles?.map((muscle) => ({
    ...muscle,
    displayName: translateCatalogName(t, 'muscle', muscle.commonName),
  })), [muscles, locale]);
  const localizedExercises = useMemo(() => exercises?.map((exercise) => ({
    ...exercise,
    displayName: translateCatalogName(t, 'exercise', exercise.name),
    muscles: (exercise.muscles || []).map((muscle) => ({
      ...muscle,
      displayName: translateCatalogName(t, 'muscle', muscle.commonName || muscle.name),
    })),
  })), [exercises, locale]);
  const localizedPrograms = useMemo(() => programs?.map((program) => ({
    ...program,
    displayName: program.isPersonal ? program.name : translateCatalogName(t, 'program', program.name),
    schedule: (program.schedule || []).map((row) => ({
      ...row,
      exercise: row.exercise ? { ...row.exercise, displayName: translateCatalogName(t, 'exercise', row.exercise.name) } : row.exercise,
    })),
  })), [programs, locale]);
  return {
    ...selected,
    ...(exercises ? { exercises: localizedExercises } : {}),
    ...(programs ? { programs: localizedPrograms } : {}),
    ...(muscles ? { muscles: localizedMuscles } : {}),
  };
}
