import React, { useContext, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useLibrary } from "../context/LibraryContext";
import { WorkoutContext } from "../context/WorkoutContext";
import { LanguageContext } from "../localization/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { ExerciseVideoPlayer } from "../components/media";
import {
  Button,
  DetailHeader,
  Feedback,
  useWorkshopStyles,
  useWords,
} from "../components/workshop/ui";
import { ShareButton } from "../components/workshop/ShareButton";
import { exerciseShareUrl } from "../utils/shareLinks";

import { createStyles } from './ExerciseDetailsScreen.styles';
export function ExerciseDetailsContent({ exercise, allowAdd = true }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const s = useWorkshopStyles();
  const w = useWords();
  const { t } = useContext(LanguageContext);
  const { addWorkoutExercises, preparedWorkout, activeWorkout } =
    useContext(WorkoutContext);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const added = preparedWorkout?.exercises?.some(
    (item) => item.id === exercise.id,
  );
  const add = async () => {
    setBusy(true);
    setError("");
    try {
      await addWorkoutExercises([
        {
          id: exercise.id,
          name: exercise.name,
          exercise,
          sets: 3,
          reps: 10,
          weight: 0,
        },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.contentBlock}>
      {exercise.videoUrl ? (
        <ExerciseVideoPlayer
          source={exercise.videoUrl}
          style={s.media}
          onError={() => setError(t('videoLoadFailed'))}
        />
      ) : (
        <View style={s.media}>
          <Text style={styles.noMedia}>{w.noMedia}</Text>
        </View>
      )}
      <View style={styles.summary}>
        <Text style={s.title}>{exercise.displayName || exercise.name}</Text>
        <Text style={s.muted}>
          {exercise.muscles?.map((m) => m.displayName || m.commonName || m.name).join(" · ") ||
            w.noMuscles}
        </Text>
      </View>
      <Text style={s.heading}>{w.muscles}</Text>
      <View style={styles.musclePanel}>
        <View style={styles.muscleImage} />
        <View style={styles.muscleList}>
          {exercise.muscles?.length ? (
            exercise.muscles.map((muscle) => (
              <View key={muscle.id}>
                <Text style={s.text}>{muscle.displayName || muscle.commonName || muscle.name}</Text>
                {!!muscle.scientificName && (
                  <Text style={[s.muted, { fontSize: 11 }]}>
                    {muscle.scientificName}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={s.muted}>{w.noMuscles}</Text>
          )}
        </View>
      </View>
      {!!exercise.description && (
        <>
          <Text style={s.heading}>{w.description}</Text>
          <Text style={s.muted}>{exercise.description}</Text>
        </>
      )}
      <Text style={s.heading}>{w.safety}</Text>
      <Text style={s.muted}>
        {[
          "safetyTipSpine",
          "safetyTipWeight",
          "safetyTipBreathing",
          "safetyTipMovement",
        ]
          .map(t)
          .join("\n")}
      </Text>
      <Feedback error={error} />
      {allowAdd && (
        <Button
          disabled={busy || added || activeWorkout?.status === "paused"}
          onPress={add}
        >
          {added ? w.added : w.addWorkout}
        </Button>
      )}
    </View>
  );
}

export default function ExerciseDetailsScreen({ navigation, route }) {
  const s = useWorkshopStyles();
  const tabBarHeight = useBottomTabBarHeight();
  const w = useWords();
  const library = useLibrary();
  const exercise = library.exercises.find(
    (item) => item.id === Number(route.params?.exerciseId),
  );
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <DetailHeader onBack={() => navigation.goBack()}>
        {exercise && (
          <ShareButton
            title={exercise.displayName || exercise.name}
            description={exercise.description}
            url={exerciseShareUrl(exercise.id)}
          />
        )}
      </DetailHeader>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: tabBarHeight + 28 }]}>
        <Feedback
          loading={library.loading && !exercise}
          error={library.errors.exercises || (!library.loading && !exercise ? w.empty : '')}
          onRetry={library.refresh}
        />
        {exercise && <ExerciseDetailsContent exercise={exercise} />}
      </ScrollView>
    </SafeAreaView>
  );
}
