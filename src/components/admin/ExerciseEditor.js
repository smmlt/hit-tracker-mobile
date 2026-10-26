// EN: Edits exercise metadata, primary/secondary muscles, media, and moderation fields before saving through admin services.
// UK: Редагує metadata вправи, primary/secondary мʼязи, media й moderation-поля перед збереженням через admin services.
import React, { useContext, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { useLibrary } from "../../context/LibraryContext";
import { apiRequest } from "../../services/api";
import { Button, Feedback, Field, Sheet, useWorkshopStyles, useWords } from "../workshop/ui";
import { DifficultyIndicator } from "../exercise/DifficultyIndicator";
import { ImagePickerField } from "../media/ImagePickerField";
import { contentMediaService } from "../../services/contentMediaService";
import { LanguageContext } from "../../localization/LanguageContext";
import { splitMusclesByRole, toggleMuscleRole } from "../../utils/muscleRoles";

export function ExerciseEditor({ exercise, onClose }) {
  const s = useWorkshopStyles();
  const { userToken } = useContext(AuthContext);
  const library = useLibrary(['muscles', 'errors', 'refresh']);
  const { t } = useContext(LanguageContext);
  const w = useWords();
  const translation = (locale) => exercise?.translations?.find((item) => item.locale === locale);
  const [catalogKey, setCatalogKey] = useState(exercise?.catalogKey || "");
  const [name, setName] = useState(translation('en')?.name || exercise?.name || "");
  const [ukName, setUkName] = useState(translation('uk')?.name || "");
  const [description, setDescription] = useState(translation('en')?.description || exercise?.description || "");
  const [ukDescription, setUkDescription] = useState(translation('uk')?.description || "");
  const [video, setVideo] = useState(translation('en')?.videoUrl || exercise?.videoUrl || "");
  const [ukVideo, setUkVideo] = useState(translation('uk')?.videoUrl || "");
  const [videoChanged, setVideoChanged] = useState(false);
  const [difficulty, setDifficulty] = useState(exercise?.difficulty || 1);
  const [measurementType, setMeasurementType] = useState(exercise?.measurementType || "reps");
  const [recommendedDurationSeconds, setRecommendedDurationSeconds] = useState(
    exercise?.recommendedDurationSeconds ? String(exercise.recommendedDurationSeconds) : "",
  );
  const [recommendedSets, setRecommendedSets] = useState(exercise?.recommendedSets ? String(exercise.recommendedSets) : "");
  const [recommendedReps, setRecommendedReps] = useState(exercise?.recommendedReps ? String(exercise.recommendedReps) : "");
  const [equipment, setEquipment] = useState((exercise?.equipment || []).join(", "));
  const initialMuscles = splitMusclesByRole(exercise?.muscles);
  const [primaryMuscles, setPrimaryMuscles] = useState(initialMuscles.primary.map((m) => m.id));
  const [secondaryMuscles, setSecondaryMuscles] = useState(initialMuscles.secondary.map((m) => m.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const save = async () => {
    if (!name.trim() || !ukName.trim()) {
      setError(t('exerciseNameRequired'));
      return;
    }
    if (measurementType === "duration" && recommendedDurationSeconds && (!Number.isInteger(Number(recommendedDurationSeconds)) || Number(recommendedDurationSeconds) < 1)) {
      setError(w.invalidNumbers);
      return;
    }
    setSaving(true);
    setError("");
    try {
      let targetId = savedId;
      if (!targetId) {
        const result = await apiRequest(
          exercise ? `/exercises/${exercise.id}` : "/exercises",
          {
            method: exercise ? "PATCH" : "POST",
            body: JSON.stringify({
              name: name.trim(),
              description: description.trim(),
              ...(!exercise ? { catalogKey: catalogKey.trim() || undefined } : {}),
              ...(videoChanged || !exercise ? { videoUrl: video.trim() || undefined } : {}),
              translations: [
                { locale: 'en', name: name.trim(), description: description.trim() || undefined, videoUrl: video.trim() || undefined },
                { locale: 'uk', name: ukName.trim(), description: ukDescription.trim() || undefined, videoUrl: ukVideo.trim() || undefined },
              ],
              difficulty,
              measurementType,
              recommendedSets: recommendedSets ? Number(recommendedSets) : exercise ? null : undefined,
              recommendedReps: measurementType === 'reps' && recommendedReps ? Number(recommendedReps) : exercise ? null : undefined,
              recommendedDurationSeconds: measurementType === "duration" && recommendedDurationSeconds
                ? Number(recommendedDurationSeconds)
                : exercise ? null : undefined,
              equipment: equipment.split(",").map((item) => item.trim()).filter(Boolean),
              primaryMuscleIds: primaryMuscles,
              secondaryMuscleIds: secondaryMuscles,
            }),
          },
          userToken,
        );
        targetId = result.id;
        setSavedId(targetId);
      }
      if (image) await contentMediaService.uploadExerciseDemonstrationImage(targetId, image, userToken);
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
        label={`${w.name} (${t('english')})`}
        value={name}
        onChangeText={setName}
        maxLength={100}
      />
      {!exercise && <Field label="catalogKey" value={catalogKey} onChangeText={setCatalogKey} autoCapitalize="none" maxLength={100} />}
      <Field label={`${w.name} (${t('ukrainian')})`} value={ukName} onChangeText={setUkName} maxLength={100} />
      <ImagePickerField
        aspect={[1, 1]}
        disabled={saving}
        imageUri={image?.uri || exercise?.demonstrationImageUrl || exercise?.imageUrl}
        label={w.chooseImage}
        onChange={setImage}
        onError={(pickerError) => setError(pickerError.message || w.imagePickerError)}
        previewStyle={{ width: 160, height: 160, borderRadius: 8, alignSelf: "center" }}
      />
      <Field
        label={`${w.description} (${t('english')})`}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
      />
      <Field label={`${w.description} (${t('ukrainian')})`} value={ukDescription} onChangeText={setUkDescription} multiline maxLength={2000} />
      <Field
        label={`${w.video} (${t('english')})`}
        value={video}
        onChangeText={(value) => {
          setVideoChanged(true);
          setVideo(value);
        }}
        autoCapitalize="none"
        maxLength={2048}
      />
      <Field label={`${w.video} (${t('ukrainian')})`} value={ukVideo} onChangeText={setUkVideo} autoCapitalize="none" maxLength={2048} />
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
      <Field label={w.sets} value={recommendedSets} onChangeText={(value) => /^\d*$/.test(value) && setRecommendedSets(value)} keyboardType="numeric" />
      {measurementType === 'reps' && <Field label={w.reps} value={recommendedReps} onChangeText={(value) => /^\d*$/.test(value) && setRecommendedReps(value)} keyboardType="numeric" />}
      <DifficultyIndicator difficulty={difficulty} />
      <Text style={s.heading}>{w.measurementType}</Text>
      <View style={s.row}>
        <Button secondary={measurementType !== "reps"} onPress={() => setMeasurementType("reps")}>{w.measurementReps}</Button>
        <Button secondary={measurementType !== "duration"} onPress={() => setMeasurementType("duration")}>{w.measurementDuration}</Button>
      </View>
      {measurementType === "duration" && <Field
        label={w.seconds}
        value={recommendedDurationSeconds}
        onChangeText={(value) => /^\d*$/.test(value) && setRecommendedDurationSeconds(value)}
        keyboardType="numeric"
      />}
      <Field
        label={w.equipment}
        value={equipment}
        onChangeText={setEquipment}
        maxLength={500}
      />
      <Feedback error={library.errors.muscles} onRetry={library.refresh} />
      {[
        ['primary', t('primaryMuscles'), primaryMuscles],
        ['secondary', t('secondaryMuscles'), secondaryMuscles],
      ].map(([role, label, selectedIds]) => (
        <View key={role}>
          <Text style={s.heading}>{label}</Text>
          <View style={s.row}>
            {library.muscles.map((m) => (
              <Pressable
                accessibilityLabel={`${label}: ${m.displayName || m.commonName}`}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedIds.includes(m.id) }}
                key={m.id}
                onPress={() => {
                  const next = toggleMuscleRole(
                    { primaryIds: primaryMuscles, secondaryIds: secondaryMuscles },
                    m.id,
                    role,
                  );
                  setPrimaryMuscles(next.primaryIds);
                  setSecondaryMuscles(next.secondaryIds);
                }}
                style={[s.chip, selectedIds.includes(m.id) && s.selected]}
              >
                <Text style={s.text}>{m.displayName || m.commonName}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Feedback error={error} />
      <Button disabled={saving} onPress={save}>
        {saving ? w.loading : w.save}
      </Button>
    </Sheet>
  );
}
