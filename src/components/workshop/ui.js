import React, { useContext } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createStyles } from './ui.styles.js';
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguageContext } from "../../localization/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import Back from "../../assets/workshop/Back.svg";

import { palette } from '../../constants/colors';
const words = {
  en: {
    workshop: "WORKSHOP",
    exercises: "Exercises",
    programs: "Programs",
    all: "All",
    official: "Official",
    personal: "Personal",
    saved: "Saved",
    muscleGroups: "MUSCLE GROUPS",
    sort: "Sort",
    search: "Search",
    popular: "Popular",
    newest: "Newest",
    alphabetical: "A–Z",
    create: "Create",
    createProgram: "Create program",
    createExercise: "Create exercise",
    edit: "Edit",
    save: "Save",
    like: "Like",
    cancel: "Cancel",
    close: "Close",
    back: "Back",
    name: "Name",
    description: "Description",
    video: "Video URL",
    difficulty: "Difficulty",
    programDifficulty: "Program difficulty",
    difficultyLevel1: "Easy",
    difficultyLevel2: "Moderate",
    difficultyLevel3: "Medium",
    difficultyLevel4: "High",
    difficultyLevel5: "Advanced",
    containsAdvancedExercise: "Includes an advanced exercise",
    muscles: "Working muscles",
    noMuscles: "Muscles not specified",
    noMedia: "Media not added yet",
    safety: "Safety guidelines",
    exerciseDetails: "Exercise details",
    programDetails: "Program details",
    programExercises: "Program exercises",
    weekDay: "Day in the program (0 to 6)",
    singleWorkoutHint: "All exercises form one workout. Choose its day in your plan and enter your working weight during training.",
    addExercise: "Add exercise",
    addWorkout: "Add to current workout",
    openWorkout: "Open current workout",
    added: "Added to workout",
    customize: "Customize for me",
    copyHint:
      "A personal copy will be created. The original stays in the library.",
    revisionHint:
      "A new revision will be saved. Existing calendar assignments will not change.",
    readonly: "Personal program · read only",
    owner: "Personal program",
    empty: "Nothing found",
    retry: "Try again",
    sets: "Sets",
    reps: "Reps",
    weight: "kg",
    week: "Week",
    day: "Day",
    remove: "Remove",
    schedule: "Add to plan",
    startDate: "Start date (YYYY-MM-DD)",
    weekly: "Every week",
    once: "Only this day",
    scheduled: "Added to your plan",
    share: "Share",
    shared: "Copied to clipboard",
    tip: "Smart tip",
    tipText:
      "Adjust the load to your level. Rest between sets and keep your technique controlled.",
    loading: "Loading…",
    required: "Enter a name and add at least one exercise.",
    invalidNumbers:
      "Check values: sets 1–50, reps 1–1000.",
    invalidDate: "Enter a valid date: YYYY-MM-DD.",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  uk: {
    workshop: "МАСТЕРСЬКА",
    exercises: "Вправи",
    programs: "Програми",
    all: "Всі",
    official: "Готові",
    personal: "Особисті",
    saved: "Збережені",
    muscleGroups: "ГРУПИ М’ЯЗІВ",
    sort: "Сортування",
    search: "Пошук",
    popular: "Популярні",
    newest: "Нові",
    alphabetical: "А–Я",
    create: "Створити",
    createProgram: "Створити програму",
    createExercise: "Створити вправу",
    edit: "Редагувати",
    save: "Зберегти",
    like: "Вподобати",
    cancel: "Скасувати",
    close: "Закрити",
    back: "Назад",
    name: "Назва",
    description: "Опис",
    video: "Посилання на відео",
    difficulty: "Складність",
    programDifficulty: "Складність програми",
    difficultyLevel1: "Легка",
    difficultyLevel2: "Помірна",
    difficultyLevel3: "Середня",
    difficultyLevel4: "Висока",
    difficultyLevel5: "Просунута",
    containsAdvancedExercise: "Є вправа високої складності",
    muscles: "М’язи що працюють",
    noMuscles: "М’язи не вказані",
    noMedia: "Медіа ще не додано",
    safety: "Техніка безпеки",
    exerciseDetails: "Деталі вправи",
    programDetails: "Деталі програми",
    programExercises: "Вправи програми",
    singleWorkoutHint: "Усі вправи складають одне тренування. Оберіть його день у плані, а робочу вагу введіть під час тренування.",
    addExercise: "Додати вправу",
    addWorkout: "Додати у поточне тренування",
    openWorkout: "Відкрити поточне тренування",
    added: "Додано до тренування",
    customize: "Налаштувати для себе",
    copyHint: "Буде створено особисту копію. Оригінал залишиться в бібліотеці.",
    revisionHint:
      "Буде збережено нову версію. Вже призначені тренування не зміняться.",
    readonly: "Особиста програма · лише перегляд",
    owner: "Особиста програма",
    empty: "Нічого не знайдено",
    retry: "Спробувати знову",
    sets: "Підходи",
    reps: "Повтори",
    weight: "кг",
    week: "Тиждень",
    day: "День",
    remove: "Видалити",
    schedule: "Додати до плану",
    startDate: "Початкова дата (РРРР-ММ-ДД)",
    weekly: "Щотижня",
    once: "Лише цього дня",
    scheduled: "Додано до вашого плану",
    share: "Поділитися",
    shared: "Скопійовано",
    tip: "Розумна порада",
    tipText:
      "Підбирайте навантаження під свій рівень. Відпочивайте між підходами та контролюйте техніку.",
    loading: "Завантаження…",
    required: "Введіть назву та додайте принаймні одну вправу.",
    invalidNumbers:
      "Перевірте значення: підходи 1–50, повтори 1–1000.",
    invalidDate: "Введіть коректну дату: РРРР-ММ-ДД.",
    days: ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"],
  },
};
export const useWords = () =>
  words[useContext(LanguageContext).locale] || words.en;
export const useWorkshopStyles = () => createStyles(useTheme().theme);
export function Button({
  children,
  onPress,
  secondary,
  disabled,
  style,
  textStyle,
  ...props
}) {
  const styles = useWorkshopStyles();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        style,
        (disabled || pressed) && { opacity: 0.5 },
      ]}
      {...props}
    >
      <Text style={[styles.buttonText, textStyle]}>{children}</Text>
    </Pressable>
  );
}
export function Field({ label, style, ...props }) {
  const styles = useWorkshopStyles();
  const { theme } = useTheme();
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
        ]}
        {...props}
      />
    </View>
  );
}
export function Sheet({ title, children, onClose }) {
  const w = useWords();
  const styles = useWorkshopStyles();
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.heading, { flex: 1 }]}>{title}</Text>
            <Button secondary onPress={onClose}>
              {w.close}
            </Button>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetBody}
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
export function DetailHeader({ title, onBack, children }) {
  const w = useWords();
  const styles = useWorkshopStyles();
  const { theme } = useTheme();
  return (
    <View style={styles.detailHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={w.back}
        onPress={onBack}
        style={styles.iconButton}
      >
        <Back color={theme.textPrimary} width={24} height={24} />
      </Pressable>
      <Text style={[styles.heading, { flex: 1, textAlign: "center" }]}>{title}</Text>
      {children || <View style={styles.iconButton} />}
    </View>
  );
}
export function Feedback({ error, loading, onRetry }) {
  const w = useWords();
  const styles = useWorkshopStyles();
  return loading ? (
    <ActivityIndicator color={palette.accent} style={styles.spinner} />
  ) : error ? (
    <View style={styles.feedback}>
      <Text accessibilityRole="alert" style={styles.error}>
        {String(error)}
      </Text>
      {onRetry && (
        <Button secondary onPress={onRetry}>
          {w.retry}
        </Button>
      )}
    </View>
  ) : null;
}
