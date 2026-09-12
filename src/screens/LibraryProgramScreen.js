import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { AuthContext } from "../context/AuthContext";
import { WorkoutContext } from "../context/WorkoutContext";
import { useLibrary } from "../context/LibraryContext";
import { apiRequest } from "../services/api";
import { programExercises } from "../utils/library";
import { ExerciseItem } from "../components/exercise/ExerciseItem";
import { ProgramBadges } from "../components/workshop/ProgramCard";
import { ProgramEditor } from "../components/workshop/ProgramEditor";
import { ScheduleProgramSheet } from "../components/workshop/ScheduleProgramSheet";
import { ShareButton } from "../components/workshop/ShareButton";
import { useTheme } from "../context/ThemeContext";
import { LanguageContext } from "../localization/LanguageContext";
import { translateCatalogName } from "../localization/catalog";
import { programShareUrl } from "../utils/shareLinks";
import { createStyles } from './LibraryProgramScreen.styles';
import {
  Button,
  DetailHeader,
  Feedback,
  useWorkshopStyles,
  useWords,
} from "../components/workshop/ui";

export function ProgramDetailsContent({ program, onExercise, onEdit }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const s = useWorkshopStyles();
  const library = useLibrary();
  const w = useWords();
  return (
    <View style={styles.contentBlock}>
      <View style={s.media}>
        <Text style={styles.noMedia}>{w.noMedia}</Text>
      </View>
      <View style={styles.summary}>
        <Text style={s.heading}>{(program.displayName || program.name).toUpperCase()}</Text>
        <ProgramBadges program={program} />
        {!!program.description && (
          <Text style={s.muted}>{program.description}</Text>
        )}
      </View>
      <View style={s.header}>
        <Text style={[s.heading, { flex: 1 }]}>{w.programExercises}</Text>
        {onEdit && (
          <Pressable accessibilityRole="button" onPress={onEdit} style={styles.addExercise}><Text style={s.link}>+ {w.addExercise}</Text></Pressable>
        )}
      </View>
      {(program.schedule || []).map(
        (row, index) =>
          row.exercise && (
            <ExerciseItem
              key={`${row.exercise.id}-${index}`}
              exercise={
                library.exercises.find((item) => item.id === row.exercise.id) ||
                row.exercise
              }
              onPress={onExercise}
              footer={`${row.setsCount} ${w.sets.toLowerCase()} × ${row.targetReps || "—"} ${w.reps.toLowerCase()}`}
            />
          ),
      )}
      <View style={styles.tip}>
        <Text style={s.link}>{w.tip}</Text>
        <Text style={s.muted}>{w.tipText}</Text>
      </View>
    </View>
  );
}
export default function LibraryProgramScreen({ navigation, route }) {
  const s = useWorkshopStyles();
  const tabBarHeight = useBottomTabBarHeight();
  const { userToken, userData } = useContext(AuthContext);
  const { addWorkoutExercises, activeWorkout } = useContext(WorkoutContext);
  const library = useLibrary();
  const w = useWords();
  const { t } = useContext(LanguageContext);
  const id = Number(route.params?.programId);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setProgram(null);
    setMessage("");
    setError("");
    try {
      setProgram(await apiRequest(`/workout-programs/${id}`, {}, userToken));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, userToken]);
  useEffect(() => {
    load();
  }, [load]);
  const localizedProgram = useMemo(() => {
    if (!program) return null;
    return {
      ...program,
      displayName: program.isPersonal
        ? program.name
        : translateCatalogName(t, "program", program.name),
      schedule: (program.schedule || []).map((row) => ({
        ...row,
        exercise: row.exercise
          ? {
              ...row.exercise,
              displayName: translateCatalogName(t, "exercise", row.exercise.name),
            }
          : row.exercise,
      })),
    };
  }, [program, t]);
  const canCustomize =
    program && (!program.isPersonal || program.createdById === userData?.id);
  const add = async () => {
    setBusy(true);
    setError("");
    try {
      await addWorkoutExercises(
        programExercises(localizedProgram),
        localizedProgram.displayName || localizedProgram.name,
        program.id,
      );
      navigation
        .getParent()
        .navigate("ActiveWorkout", { screen: "WorkoutSession" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <DetailHeader title={w.programDetails} onBack={() => navigation.goBack()}>
        {program && canCustomize && (
          <ShareButton
            title={localizedProgram.displayName || localizedProgram.name}
            description={localizedProgram.description}
            getUrl={async () => {
              const { token } = await apiRequest(
                `/workout-programs/${program.id}/share`,
                { method: "POST" },
                userToken,
              );
              return programShareUrl(token);
            }}
          />
        )}
      </DetailHeader>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: tabBarHeight + 28 }]}>
        <Feedback
          error={error || library.errors.exercises}
          loading={loading}
          onRetry={load}
        />
        {program && (
          <>
            {program.isPersonal && (
              <Text style={s.muted}>
                {canCustomize ? w.personal : w.readonly}
              </Text>
            )}
            <ProgramDetailsContent
              program={localizedProgram}
              onExercise={(exercise) =>
                navigation.push("ExerciseDetails", { exerciseId: exercise.id })
              }
              onEdit={canCustomize ? () => setEditor(true) : undefined}
            />
            {canCustomize && (
              <Button secondary onPress={() => setEditor(true)}>
                {program.isPersonal ? w.edit : w.customize}
              </Button>
            )}
            <Button secondary onPress={() => setSchedule(true)}>
              {w.schedule}
            </Button>
            {!!message && (
              <Text accessibilityRole="alert" style={s.muted}>
                {message}
              </Text>
            )}
            <Button
              disabled={
                busy ||
                !program.schedule?.length ||
                activeWorkout?.status === "paused"
              }
              onPress={add}
            >
              {w.addWorkout}
            </Button>
          </>
        )}
      </ScrollView>
      {editor && (
        <ProgramEditor
          program={program}
          onClose={() => setEditor(false)}
          onSaved={(result) => {
            navigation.setParams({ programId: result.id });
            if (result.id === id) load();
          }}
        />
      )}
      {schedule && (
        <ScheduleProgramSheet
          program={program}
          onClose={() => setSchedule(false)}
          onSaved={() => setMessage(w.scheduled)}
        />
      )}
    </SafeAreaView>
  );
}
