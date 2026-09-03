import React, { useContext, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { useLibrary } from "../../context/LibraryContext";
import { apiRequest } from "../../services/api";
import { Button, Feedback, Field, Sheet, s, useWords } from "../workshop/ui";
import { DifficultyIndicator } from "../exercise/DifficultyIndicator";

export function ExerciseEditor({ exercise, onClose }) {
  const { userToken } = useContext(AuthContext);
  const library = useLibrary();
  const w = useWords();
  const [name, setName] = useState(exercise?.name || "");
  const [description, setDescription] = useState(exercise?.description || "");
  const [video, setVideo] = useState(exercise?.videoUrl || "");
  const [difficulty, setDifficulty] = useState(exercise?.difficulty || 1);
  const [muscles, setMuscles] = useState(
    exercise?.muscles?.map((m) => m.id) || [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!name.trim()) {
      setError(`${w.name}: required`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest(
        exercise ? `/exercises/${exercise.id}` : "/exercises",
        {
          method: exercise ? "PATCH" : "POST",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            videoUrl: video.trim() || (exercise ? "" : undefined),
            difficulty,
            muscleIds: muscles,
          }),
        },
        userToken,
      );
      await library.refresh();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet
      title={exercise ? `${w.edit}: ${exercise.name}` : w.createExercise}
      onClose={() => !saving && onClose()}
    >
      <Field
        label={w.name}
        value={name}
        onChangeText={setName}
        maxLength={100}
      />
      <Field
        label={w.description}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
      />
      <Field
        label={w.video}
        value={video}
        onChangeText={setVideo}
        autoCapitalize="none"
        maxLength={2048}
      />
      <Text style={s.heading}>{w.difficulty}</Text>
      <View style={s.row}>
        {[1, 2, 3, 4, 5].map((level) => (
          <Button
            key={level}
            accessibilityLabel={`${w.difficulty}: ${level}/5`}
            accessibilityState={{ selected: level === difficulty }}
            secondary={level !== difficulty}
            onPress={() => setDifficulty(level)}
          >
            {level}/5
          </Button>
        ))}
      </View>
      <DifficultyIndicator difficulty={difficulty} />
      <Text style={s.heading}>{w.muscles}</Text>
      <Feedback error={library.errors.muscles} onRetry={library.refresh} />
      <View style={s.row}>
        {library.muscles.map((m) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: muscles.includes(m.id) }}
            key={m.id}
            onPress={() =>
              setMuscles((current) =>
                current.includes(m.id)
                  ? current.filter((id) => id !== m.id)
                  : [...current, m.id],
              )
            }
            style={[s.chip, muscles.includes(m.id) && s.selected]}
          >
            <Text style={s.text}>{m.commonName}</Text>
          </Pressable>
        ))}
      </View>
      <Feedback error={error} />
      <Button disabled={saving} onPress={save}>
        {saving ? w.loading : w.save}
      </Button>
    </Sheet>
  );
}
