import React, { useContext } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguageContext } from "../../localization/LanguageContext";
import Back from "../../assets/workshop/Back.svg";

const words = {
  en: {
    workshop: "WORKSHOP",
    exercises: "Exercises",
    programs: "Programs",
    all: "All",
    official: "Official",
    personal: "Personal",
    saved: "Saved",
    search: "Search",
    popular: "Popular",
    newest: "Newest",
    alphabetical: "A–Z",
    create: "Create",
    createProgram: "Create program",
    createExercise: "Create exercise",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    back: "Back",
    name: "Name",
    description: "Description",
    video: "Video URL",
    difficulty: "Difficulty",
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
    saved: "Обрані",
    search: "Пошук",
    popular: "Популярні",
    newest: "Нові",
    alphabetical: "А–Я",
    create: "Створити",
    createProgram: "Створити програму",
    createExercise: "Створити вправу",
    edit: "Редагувати",
    save: "Зберегти",
    cancel: "Скасувати",
    close: "Закрити",
    back: "Назад",
    name: "Назва",
    description: "Опис",
    video: "Посилання на відео",
    difficulty: "Складність",
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
export function Button({
  children,
  onPress,
  secondary,
  disabled,
  style,
  ...props
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        style,
        (disabled || pressed) && { opacity: 0.5 },
      ]}
      {...props}
    >
      <Text style={s.buttonText}>{children}</Text>
    </Pressable>
  );
}
export function Field({ label, style, ...props }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={s.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#838384"
        style={[
          s.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
        ]}
        {...props}
      />
    </View>
  );
}
export function Sheet({ title, children, onClose }) {
  const w = useWords();
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={s.overlay}>
        <SafeAreaView style={s.sheet}>
          <View style={s.header}>
            <Text style={[s.heading, { flex: 1 }]}>{title}</Text>
            <Button secondary onPress={onClose}>
              {w.close}
            </Button>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.sheetBody}
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
  return (
    <View style={s.detailHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={w.back}
        onPress={onBack}
        style={s.iconButton}
      >
        <Back width={24} height={24} />
      </Pressable>
      <Text style={[s.heading, { flex: 1, textAlign: "center" }]}>{title}</Text>
      {children || <View style={s.iconButton} />}
    </View>
  );
}
export function Feedback({ error, loading, onRetry }) {
  const w = useWords();
  return loading ? (
    <ActivityIndicator color="#F00D22" style={{ margin: 24 }} />
  ) : error ? (
    <View style={s.feedback}>
      <Text accessibilityRole="alert" style={s.error}>
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
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#101113" },
  content: {
    padding: 20,
    paddingBottom: 28,
    gap: 16,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  title: { color: "#EFEFEF", fontSize: 24, fontFamily: "Inter-SemiBold", lineHeight: 34 },
  heading: {
    color: "#EFEFEF",
    fontSize: 16,
    fontFamily: "Inter-Bold",
    lineHeight: 23,
  },
  text: { color: "#EFEFEF", fontFamily: "Inter", fontSize: 14, lineHeight: 20 },
  muted: { color: "#C8C8C8", fontFamily: "Inter", fontSize: 13, lineHeight: 19 },
  error: { color: "#FF7F8A", fontSize: 13 },
  link: { color: "#F00D22", fontSize: 13, fontFamily: "Inter-SemiBold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#F00D22",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: "Inter-SemiBold",
    color: "#EFEFEF",
    fontSize: 13,
    textAlign: "center",
  },
  secondary: {
    backgroundColor: "#292929",
    borderWidth: 1,
    borderColor: "#454545",
  },
  input: {
    fontFamily: "Inter",
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#505050",
    backgroundColor: "#17181A",
    borderRadius: 10,
    padding: 12,
    color: "#EFEFEF",
    fontSize: 14,
  },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#292929",
    borderRadius: 14,
    minHeight: 30,
    justifyContent: "center",
  },
  selected: { backgroundColor: "#F00D22" },
  overlay: {
    flex: 1,
    backgroundColor: "#000A",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  sheet: {
    backgroundColor: "#101113",
    borderColor: "#454545",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    width: "100%",
    maxWidth: 700,
    maxHeight: "95%",
  },
  sheetBody: { gap: 16, paddingTop: 16, paddingBottom: 16 },
  feedback: { gap: 12, paddingVertical: 12 },
  media: {
    height: 226,
    borderRadius: 8,
    backgroundColor: "#7F7A7A",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginHorizontal: 10,
  },
});
