import React from "react";
import { ExerciseDetailsContent } from "../../screens/ExerciseDetailsScreen";
import { Sheet, useWords } from "../workshop/ui";

export function ExerciseDetailsModal({ exercise, onClose, visible }) {
  const w = useWords();
  if (!visible || !exercise) return null;
  return (
    <Sheet title={w.exerciseDetails} onClose={onClose}>
      <ExerciseDetailsContent exercise={exercise} />
    </Sheet>
  );
}
