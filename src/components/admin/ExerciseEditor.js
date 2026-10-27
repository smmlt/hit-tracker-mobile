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
  const [displayedLikesCount, setDisplayedLikesCount] = useState(
    exercise ? String(exercise.likesCount ?? 0) : "",
  );
  const [measurementType, setMeasurementType] = useState(exercise?.measurementType || "reps");
  const [recommendedDurationSeconds, setRecommendedDurationSeconds] = useState(
    exercise?.recommendedDurationSeconds ? String(exercise.recommendedDurationSeconds) : "",
  );
  const [recommendedSets, setRecommendedSets] = useState(exercise?.recommendedSets ? String(exercise.recommendedSets) : "");
  const [recommendedReps, setRecommendedReps] = useState(exercise?.recommendedReps ? String(exercise.recommendedReps) : "");
  const [requiredEquipment, setRequiredEquipment] = useState(
    (exercise?.equipmentStructured?.required || exercise?.equipment || []).join(", "),
  );
  const [alternativeEquipment, setAlternativeEquipment] = useState(
    (exercise?.equipmentStructured?.alternatives || [])
      .map((group) => group.join(" / "))
      .join("\n"),
  );
  const initialMuscles = splitMusclesByRole(exercise?.muscles);
  const [primaryMuscles, setPrimaryMuscles] = useState(initialMuscles.primary.map((m) => m.id));
  const [secondaryMuscles, setSecondaryMuscles] = useState(initialMuscles.secondary.map((m) => m.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [imageSourceUrl, setImageSourceUrl] = useState(exercise?.demonstrationImageSourceUrl || "");
  const [imageAuthor, setImageAuthor] = useState(exercise?.demonstrationImageAuthor || "");
  const [imageLicense, setImageLicense] = useState(exercise?.demonstrationImageLicense || "");
  const [imageLicenseUrl, setImageLicenseUrl] = useState(exercise?.demonstrationImageLicenseUrl || "");
  const [savedId, setSavedId] = useState(null);
  const save = async () => {
    if (!name.trim() || !ukName.trim()) {
      setError(t('exerciseNameRequired'));
      return;
    }
    const validRecommendedSets = Number.isInteger(Number(recommendedSets)) && Number(recommendedSets) >= 1 && Number(recommendedSets) <= 100;
    const recommendedTarget = measurementType === "duration" ? recommendedDurationSeconds : recommendedReps;
    const targetMaximum = measurementType === "duration" ? 86400 : 1000;
    const validRecommendedTarget = Number.isInteger(Number(recommendedTarget)) && Number(recommendedTarget) >= 1 && Number(recommendedTarget) <= targetMaximum;
    if (!validRecommendedSets || !validRecommendedTarget) {
      setError(w.invalidNumbers);
      return;
    }
    if (displayedLikesCount && (!Number.isInteger(Number(displayedLikesCount)) || Number(displayedLikesCount) < 0)) {
      setError(w.invalidNumbers);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const required = requiredEquipment.split(",").map((item) => item.trim()).filter(Boolean);
      const alternatives = alternativeEquipment
        .split("\n")
        .map((line) => line.split(/[|/]/).map((item) => item.trim()).filter(Boolean))
        .filter((group) => group.length);
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
              displayedLikesCount: displayedLikesCount === "" ? undefined : Number(displayedLikesCount),
              measurementType,
              recommendedSets: recommendedSets ? Number(recommendedSets) : exercise ? null : undefined,
              recommendedReps: measurementType === 'reps' && recommendedReps ? Number(recommendedReps) : exercise ? null : undefined,
              recommendedDurationSeconds: measurementType === "duration" && recommendedDurationSeconds
                ? Number(recommendedDurationSeconds)
                : exercise ? null : undefined,
              equipment: [...new Set([...required, ...alternatives.flat()])],
              equipmentStructured: { required, alternatives },
              demonstrationImageSourceUrl: imageSourceUrl.trim() || (exercise ? "" : undefined),
              demonstrationImageAuthor: imageAuthor.trim() || (exercise ? "" : undefined),
              demonstrationImageLicense: imageLicense.trim() || (exercise ? "" : undefined),
              demonstrationImageLicenseUrl: imageLicenseUrl.trim() || (exercise ? "" : undefined),
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
      <Field
        label={`${w.description} (${t('english')})`}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
      />
      <Field label={`${w.description} (${t('ukrainian')})`} value={ukDescription} onChangeText={setUkDescription} multiline maxLength={2000} />
      <Text style={s.heading}>{w.measurementType}</Text>
      <View style={s.row}>
        <Button secondary={measurementType !== "reps"} onPress={() => setMeasurementType("reps")}>{w.measurementReps}</Button>
        <Button secondary={measurementType !== "duration"} onPress={() => setMeasurementType("duration")}>{w.measurementDuration}</Button>
      </View>
      <View style={s.row}>
        <Field style={{ flex: 1 }} label={w.sets} value={recommendedSets} onChangeText={(value) => /^\d*$/.test(value) && setRecommendedSets(value)} keyboardType="numeric" />
        {measurementType === 'reps'
          ? <Field style={{ flex: 1 }} label={w.reps} value={recommendedReps} onChangeText={(value) => /^\d*$/.test(value) && setRecommendedReps(value)} keyboardType="numeric" />
          : <Field style={{ flex: 1 }} label={w.seconds} value={recommendedDurationSeconds} onChangeText={(value) => /^\d*$/.test(value) && setRecommendedDurationSeconds(value)} keyboardType="numeric" />}
      </View>
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
      <Field
        label={t('requiredEquipment')}
        value={requiredEquipment}
        onChangeText={setRequiredEquipment}
        maxLength={500}
      />
      <Field
        label={t('alternativeEquipment')}
        value={alternativeEquipment}
        onChangeText={setAlternativeEquipment}
        multiline
        maxLength={1000}
      />
      <Text style={s.muted}>{t('alternativeEquipmentHint')}</Text>
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
      <ImagePickerField
        aspect={[1, 1]}
        disabled={saving}
        imageUri={image?.uri || exercise?.demonstrationImageUrl || exercise?.imageUrl}
        label={w.chooseImage}
        onChange={setImage}
        onError={(pickerError) => setError(pickerError.message || w.imagePickerError)}
        previewStyle={{ width: 160, height: 160, borderRadius: 8, alignSelf: "center" }}
      />
      <Field label={t('mediaSourceUrl')} value={imageSourceUrl} onChangeText={setImageSourceUrl} autoCapitalize="none" maxLength={2048} />
      <Field label={t('mediaAuthor')} value={imageAuthor} onChangeText={setImageAuthor} maxLength={200} />
      <Field label={t('mediaLicense')} value={imageLicense} onChangeText={setImageLicense} maxLength={100} />
      <Field label={t('mediaLicenseUrl')} value={imageLicenseUrl} onChangeText={setImageLicenseUrl} autoCapitalize="none" maxLength={2048} />
      <Field
        label={w.displayedLikes}
        value={displayedLikesCount}
        onChangeText={(value) => /^\d*$/.test(value) && setDisplayedLikesCount(value)}
        keyboardType="numeric"
      />
      <Feedback error={error} />
      <Button disabled={saving} onPress={save}>
        {saving ? w.loading : w.save}
      </Button>
    </Sheet>
  );
}
