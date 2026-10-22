// EN: Presents read-only exercise details and media in a modal while exposing close and library actions to its owner.
// UK: Показує read-only деталі й media вправи в modal та передає власнику дії закриття й бібліотеки.
import React, { useContext, useEffect, useState } from "react";
import { ExerciseDetailsContent } from "../../screens/ExerciseDetailsScreen";
import { Feedback, Sheet, useWords } from "../workshop/ui";
import { AuthContext } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";

export function ExerciseDetailsModal({ exercise, onClose, visible }) {
  const w = useWords();
  const { userToken } = useContext(AuthContext);
  const [details, setDetails] = useState(exercise);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !exercise?.id) return undefined;
    let current = true;
    setDetails(exercise);
    setError("");
    setLoading(true);
    apiFetch(`/exercises/${exercise.id}`, {}, userToken).then((response) => {
      if (!current) return;
      if (response.ok && response.data) setDetails(response.data);
      else if (!exercise) setError(w.exerciseDetailsLoadFailed);
    }).catch((requestError) => {
      if (current && !exercise) setError(requestError.message || w.exerciseDetailsLoadFailed);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [exercise?.id, userToken, visible, w.exerciseDetailsLoadFailed]);

  if (!visible || !exercise) return null;
  return (
    <Sheet title={w.exerciseDetails} onClose={onClose}>
      <Feedback error={error} loading={loading && !details} />
      <ExerciseDetailsContent allowAdd={false} exercise={details || exercise} />
    </Sheet>
  );
}
