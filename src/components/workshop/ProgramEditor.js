// EN: Owns official or personal program editing, exercise schedule rows, validation, media, and save/cancel callbacks.
// UK: Керує редагуванням official/personal program, schedule rows вправ, валідацією, media та save/cancel callbacks.

import React, { useContext, useState } from "react";
import { Text, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { useLibrary } from "../../context/LibraryContext";
import { apiRequest } from "../../services/api";
import { Button, Feedback, Field, Sheet, useWorkshopStyles, useWords } from "./ui";
import { useTheme } from "../../context/ThemeContext";
import { ImagePickerField } from "../media/ImagePickerField";
import { contentMediaService } from "../../services/contentMediaService";
import { ExerciseItem } from "../exercise/ExerciseItem";
import { LanguageContext } from "../../localization/LanguageContext";

import { createStyles } from './ProgramEditor.styles';
export function ProgramEditor({ initialValues, program, official = false, onClose, onSaved }) {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const s = useWorkshopStyles();
    const { userToken, userData } = useContext(AuthContext);
    const library = useLibrary(['exercises', 'errors', 'refresh']);
    const w = useWords();
    const { t } = useContext(LanguageContext);
    const translation = (locale) => program?.translations?.find((item) => item.locale === locale);

    const [catalogKey, setCatalogKey] = useState(program?.catalogKey || "");
    const [name, setName] = useState(translation('en')?.name || program?.name || initialValues?.name || "");
    const [ukName, setUkName] = useState(translation('uk')?.name || "");
    const [description, setDescription] = useState(translation('en')?.description || program?.description || initialValues?.description || "");
    const [ukDescription, setUkDescription] = useState(translation('uk')?.description || "");
    const [mediaType, setMediaType] = useState(program?.videoUrl ? "video" : "image");
    const [videoUrl, setVideoUrl] = useState(translation('en')?.videoUrl || program?.videoUrl || "");
    const [ukVideoUrl, setUkVideoUrl] = useState(translation('uk')?.videoUrl || "");
    const [image, setImage] = useState(null);
    const [displayedLikesCount, setDisplayedLikesCount] = useState(
        program ? String(program.likesCount ?? 0) : "",
    );
    const [savedProgram, setSavedProgram] = useState(null);

    const [rows, setRows] = useState(
        (program?.schedule || initialValues?.exercises || [])
            .filter((row) => row.exercise?.id || row.exerciseId)
            .map((row) => {
                const measurementType = row.exercise?.measurementType || row.measurementType || "reps";
                return {
                    exerciseId: row.exercise?.id || row.exerciseId,
                    sets: String(row.setsCount ?? row.sets ?? row.exercise?.recommendedSets ?? 1),
                    reps: String(measurementType === "reps" ? row.targetReps ?? row.reps ?? row.exercise?.recommendedReps ?? "" : ""),
                    durationSeconds: String(measurementType === "duration" ? row.targetDurationSeconds ?? row.durationSeconds ?? row.exercise?.recommendedDurationSeconds ?? "" : ""),
                    measurementType,
                    // Preserve legacy metadata on edits; it is not a workout date or prescribed load.
                    weight: String(row.plannedWeight ?? row.weight ?? 0),
                    week: String(row.week || 1),
                    weekDay: 0,
                };
            }),
    );

    const [query, setQuery] = useState("");
    const [picker, setPicker] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const owns = program?.isPersonal && program.createdById === userData?.id;

    const patchRow = (index, key, value) =>
        setRows((items) =>
            items.map((item, i) =>
                i === index ? { ...item, [key]: value } : item,
            ),
        );

    const save = async () => {
        if (!name.trim() || (official && !ukName.trim()) || !rows.length) {
            setError(w.required);
            return;
        }
        if (official && mediaType === "video" && !videoUrl.trim()) {
            setError(w.videoRequired);
            return;
        }
        if (official && mediaType === "image" && program?.videoUrl && !image) {
            setError(w.imageRequired);
            return;
        }
        if (official && displayedLikesCount && (!Number.isInteger(Number(displayedLikesCount)) || Number(displayedLikesCount) < 0)) {
            setError(w.invalidNumbers);
            return;
        }

        const valid = rows.every(
            (row) =>
                // Sets
                (!row.sets || (Number.isInteger(Number(row.sets)) &&
                Number(row.sets) >= 1 &&
                Number(row.sets) <= 50)) &&

                // Only the compatible target may be present.
                (row.measurementType === "reps" && (!row.reps ||
                    (Number.isInteger(Number(row.reps)) &&
                        Number(row.reps) >= 1 &&
                        Number(row.reps) <= 1000))) &&

                (row.measurementType === "duration" && (!row.durationSeconds ||
                    (Number.isInteger(Number(row.durationSeconds)) &&
                        Number(row.durationSeconds) >= 1 &&
                        Number(row.durationSeconds) <= 86400))) &&

                // Weight
                (!row.weight || (Number.isFinite(Number(row.weight)) &&
                Number(row.weight) >= 0 &&
                Number(row.weight) <= 1000)) &&

                // Week
                Number.isInteger(Number(row.week)) &&
                Number(row.week) >= 1,
        );

        if (!valid) {
            setError(w.invalidNumbers);
            return;
        }

        setSaving(true);
        setError("");

        try {
            const updating = !!program && (official || owns);

            const path = updating
                ? `/workout-programs/${program.id}`
                : program
                    ? `/workout-programs/${program.id}/copy`
                    : official
                        ? "/workout-programs/official"
                        : "/workout-programs";

            let result = savedProgram;
            if (!result) {
                const videoValue = official && mediaType === "video"
                    ? videoUrl.trim()
                    : undefined;
                result = await apiRequest(
                    path,
                    {
                        method: updating ? "PATCH" : "POST",
                        body: JSON.stringify({
                            name: name.trim(),
                            description: description.trim(),
                            ...(official && !program ? { catalogKey: catalogKey.trim() || undefined } : {}),
                            ...(official ? { displayedLikesCount: displayedLikesCount === "" ? undefined : Number(displayedLikesCount) } : {}),
                            ...(official ? { translations: [
                                { locale: 'en', name: name.trim(), description: description.trim() || undefined, videoUrl: videoUrl.trim() || undefined },
                                { locale: 'uk', name: ukName.trim(), description: ukDescription.trim() || undefined, videoUrl: ukVideoUrl.trim() || undefined },
                            ] } : {}),
                            ...(videoValue !== undefined ? { videoUrl: videoValue } : {}),
                            exercises: rows.map((row, index) => ({
                                exerciseId: row.exerciseId,
                                position: index + 1,
                                sets: row.sets ? Number(row.sets) : undefined,
                                ...(row.measurementType === "reps" && row.reps ? { reps: Number(row.reps) } : {}),
                                ...(row.measurementType === "duration" && row.durationSeconds ? { durationSeconds: Number(row.durationSeconds) } : {}),
                                weight: row.weight ? Number(row.weight) : undefined,
                                week: Number(row.week),
                                weekDay: 0,
                            })),
                        }),
                    },
                    userToken,
                );
                setSavedProgram(result);
            }
            if (official && mediaType === "image" && image) {
                result = await contentMediaService.uploadProgramImage(result.id, image, userToken);
            }

            await library.refresh();
            onSaved?.(result);
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet
            title={program ? w.edit : w.createProgram}
            onClose={() => !saving && onClose()}
        >
            {program && (
                <Text style={s.muted}>
                    {official ? w.revisionHint : owns ? w.personal : w.copyHint}
                </Text>
            )}

            <Field
                label={official ? `${w.name} (${t('english')})` : w.name}
                value={name}
                onChangeText={setName}
                maxLength={100}
            />
            {official && !program && <Field label="catalogKey" value={catalogKey} onChangeText={setCatalogKey} autoCapitalize="none" maxLength={100} />}
            {official && <Field label={`${w.name} (${t('ukrainian')})`} value={ukName} onChangeText={setUkName} maxLength={100} />}
            {official && (
                <Field
                    label={w.displayedLikes}
                    value={displayedLikesCount}
                    onChangeText={(value) => /^\d*$/.test(value) && setDisplayedLikesCount(value)}
                    keyboardType="numeric"
                />
            )}

            <Field
                label={official ? `${w.description} (${t('english')})` : w.description}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={2000}
            />
            {official && <Field label={`${w.description} (${t('ukrainian')})`} value={ukDescription} onChangeText={setUkDescription} multiline maxLength={2000} />}

            {official && (
                <View style={{ gap: 10 }}>
                    <Text style={s.heading}>{w.media}</Text>
                    <View style={s.row}>
                        <Button secondary={mediaType !== "image"} onPress={() => setMediaType("image")}>{w.image}</Button>
                        <Button secondary={mediaType !== "video"} onPress={() => { setMediaType("video"); setImage(null); }}>{w.video}</Button>
                    </View>
                    {mediaType === "image" ? (
                        <ImagePickerField
                            aspect={[333, 226]}
                            disabled={saving}
                            imageUri={image?.uri || program?.imageUrl}
                            label={w.chooseImage}
                            onChange={setImage}
                            onError={(pickerError) => setError(pickerError.message || w.imagePickerError)}
                            previewStyle={styles.mediaPreview}
                        />
                    ) : (
                        <>
                        <Field
                            label={`${w.youtubeUrl} (${t('english')})`}
                            value={videoUrl}
                            onChangeText={setVideoUrl}
                            autoCapitalize="none"
                            maxLength={2048}
                        />
                        <Field label={`${w.youtubeUrl} (${t('ukrainian')})`} value={ukVideoUrl} onChangeText={setUkVideoUrl} autoCapitalize="none" maxLength={2048} />
                        </>
                    )}
                </View>
            )}

            <View style={s.header}>
                <Text style={s.heading}>
                    {w.exercises} · {rows.length}
                </Text>

                <Button secondary onPress={() => setPicker(!picker)}>
                    + {w.addExercise}
                </Button>
            </View>

            <Text style={s.muted}>{w.singleWorkoutHint}</Text>

            {picker && (
                <View style={styles.picker}>
                    <Field
                        label={w.search}
                        value={query}
                        onChangeText={setQuery}
                    />

                    <Feedback
                        error={library.errors.exercises}
                        onRetry={library.refresh}
                    />

                    {library.exercises
                        .filter((item) =>
                            item.name.toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((exercise) => (
                            <ExerciseItem
                                key={exercise.id}
                                exercise={exercise}
                            >
                                <Button
                                    secondary
                                    onPress={() => {
                                        setRows((items) => [
                                            ...items,
                                            {
                                                exerciseId: exercise.id,
                                                sets: String(exercise.recommendedSets || ""),
                                                reps: exercise.measurementType === "duration" ? "" : String(exercise.recommendedReps || ""),
                                                durationSeconds: exercise.measurementType === "duration"
                                                    ? String(exercise.recommendedDurationSeconds || "")
                                                    : "",
                                                measurementType: exercise.measurementType || "reps",
                                                weight: "",
                                                week: "1",
                                                weekDay: "0",
                                            },
                                        ]);

                                        setPicker(false);
                                    }}
                                >
                                    + {w.addExercise}
                                </Button>
                            </ExerciseItem>
                        ))}
                </View>
            )}

            {rows.map((row, index) => (
                <View
                    key={index}
                    style={styles.rowCard}
                >
                    <View style={s.header}>
                        <Text style={[s.heading, { flex: 1 }]}>
                            {index + 1}.{" "}
                            {library.exercises.find(
                                (item) => item.id === row.exerciseId,
                            )?.displayName || library.exercises.find(
                                (item) => item.id === row.exerciseId,
                            )?.name || `#${row.exerciseId}`}
                        </Text>

                        <Button
                            secondary
                            onPress={() =>
                                setRows((items) =>
                                    items.filter((_, i) => i !== index),
                                )
                            }
                        >
                            {w.remove}
                        </Button>
                    </View>


                    <View style={s.row}>
                        {[
                            ["sets", w.sets],
                            [row.measurementType === "duration" ? "durationSeconds" : "reps", row.measurementType === "duration" ? w.seconds : w.reps],
                        ].map(([key, label]) => {
                            return (
                                <Field
                                    key={key}
                                    style={styles.metric}
                                    label={label}
                                    value={row[key]}
                                    keyboardType="numeric"
                                    onChangeText={(value) =>
                                        patchRow(index, key, value)
                                    }
                                />
                            )
                        })}

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
