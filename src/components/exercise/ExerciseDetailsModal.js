// EN: Presents read-only exercise details and media in a modal while exposing close and library actions to its owner.
// UK: Показує read-only деталі й media вправи в modal та передає власнику дії закриття й бібліотеки.
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
