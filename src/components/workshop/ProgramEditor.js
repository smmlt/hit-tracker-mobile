
import React, { useContext, useState } from "react";
import { Text, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { useLibrary } from "../../context/LibraryContext";
import { apiRequest } from "../../services/api";
import { Button, Feedback, Field, Sheet, useWorkshopStyles, useWords } from "./ui";
import { useTheme } from "../../context/ThemeContext";

import { createStyles } from './ProgramEditor.styles';
export function ProgramEditor({ initialValues, program, official = false, onClose, onSaved }) {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const s = useWorkshopStyles();
    const { userToken, userData } = useContext(AuthContext);
    const library = useLibrary();
    const w = useWords();

    const [name, setName] = useState(program?.name || initialValues?.name || "");
    const [description, setDescription] = useState(program?.description || initialValues?.description || "");

    const [rows, setRows] = useState(
        (program?.schedule || initialValues?.exercises || [])
            .filter((row) => row.exercise?.id || row.exerciseId)
            .map((row) => ({
                exerciseId: row.exercise?.id || row.exerciseId,
                sets: String(row.setsCount ?? row.sets ?? 1),
                reps: String(row.targetReps ?? row.reps ?? ""),
                // Preserve legacy metadata on edits; it is not a workout date or prescribed load.
                weight: String(row.plannedWeight ?? row.weight ?? 0),
                week: String(row.week || 1),
                weekDay: String(row.weekDay ?? 0),
            })),
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
        if (!name.trim() || !rows.length) {
            setError(w.required);
            return;
        }

        const valid = rows.every(
            (row) =>
                // Sets
                Number.isInteger(Number(row.sets)) &&
                Number(row.sets) >= 1 &&
                Number(row.sets) <= 50 &&

                // Reps
                (!row.reps ||
                    (Number.isInteger(Number(row.reps)) &&
                        Number(row.reps) >= 1 &&
                        Number(row.reps) <= 1000)) &&

                // Weight
                Number.isFinite(Number(row.weight)) &&
                Number(row.weight) >= 0 &&
                Number(row.weight) <= 1000 &&

                // Week
                Number.isInteger(Number(row.week)) &&
                Number(row.week) >= 1 &&

                // Week day: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                Number.isInteger(Number(row.weekDay)) &&
                Number(row.weekDay) >= 0 &&
                Number(row.weekDay) <= 6,
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

            const result = await apiRequest(
                path,
                {
                    method: updating ? "PATCH" : "POST",
                    body: JSON.stringify({
                        name: name.trim(),
                        description: description.trim(),
                        exercises: rows.map((row) => ({
                            ...row,
                            sets: Number(row.sets),
                            reps: row.reps ? Number(row.reps) : undefined,
                            weight: Number(row.weight),
                            week: Number(row.week),
                            weekDay: Number(row.weekDay),
                        })),
                    }),
                },
                userToken,
            );

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
                            <Button
                                secondary
                                key={exercise.id}
                                onPress={() => {
                                    setRows((items) => [
                                        ...items,
                                        {
                                            exerciseId: exercise.id,
                                            sets: "3",
                                            reps: "10",
                                            weight: "0",
                                            week: "1",
                                            weekDay: "0",
                                        },
                                    ]);

                                    setPicker(false);
                                }}
                            >
                                + {exercise.displayName || exercise.name}
                            </Button>
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
                            ["reps", w.reps],
                            ["weekDay", w.weekDay],
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
