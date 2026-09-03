import React, { useContext, useState } from "react";
import { Text, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { useLibrary } from "../../context/LibraryContext";
import { apiRequest } from "../../services/api";
import { Button, Feedback, Field, Sheet, s, useWords } from "./ui";

const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function ScheduleProgramSheet({ program, onClose, onSaved }) {
  const { userToken } = useContext(AuthContext);
  const library = useLibrary();
  const w = useWords();
  const [date, setDate] = useState(localDate(new Date()));
  const [weekly, setWeekly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    const parsed = new Date(`${date}T12:00:00`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(parsed.getTime()) ||
      localDate(parsed) !== date
    ) {
      setError(w.invalidDate);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest(
        "/workout-programs/schedule",
        {
          method: "POST",
          body: JSON.stringify({
            programId: program.id,
            scheduledFor: date,
            repeat: weekly ? "weekly" : "once",
          }),
        },
        userToken,
      );
      await library.refresh();
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet title={w.schedule} onClose={() => !saving && onClose()}>
      <Text style={s.heading}>{program.name}</Text>
      <Text style={s.muted}>{w.singleWorkoutHint}</Text>
      <Field
        label={w.startDate}
        value={date}
        onChangeText={setDate}
        maxLength={10}
      />
      <View style={s.row}>
        {w.days.map((day, i) => (
          <Button
            key={day}
            secondary
            onPress={() => {
              const next = new Date();
              next.setDate(
                next.getDate() + ((i - ((next.getDay() + 6) % 7) + 7) % 7),
              );
              setDate(localDate(next));
            }}
          >
            {day}
          </Button>
        ))}
      </View>
      <View style={s.row}>
        <Button secondary={!weekly} onPress={() => setWeekly(true)}>
          {w.weekly}
        </Button>
        <Button secondary={weekly} onPress={() => setWeekly(false)}>
          {w.once}
        </Button>
      </View>
      <Feedback error={error} />
      <Button disabled={saving} onPress={save}>
        {saving ? w.loading : w.schedule}
      </Button>
    </Sheet>
  );
}
