// EN: Presents read-only exercise details and media in a modal while exposing close and library actions to its owner.
// UK: Показує read-only деталі й media вправи в modal та передає власнику дії закриття й бібліотеки.
import React, { useContext, useEffect, useMemo, useState } from "react";
import { ExerciseDetailsContent } from "../../screens/ExerciseDetailsScreen";
import { Feedback, Sheet, useWords } from "../workshop/ui";
import { AuthContext } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";
import { LanguageContext } from "../../localization/LanguageContext";
import { localizeCatalogEntity } from "../../localization/catalog";

export function ExerciseDetailsModal({ exercise, onClose, visible }) {
  const w = useWords();
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const [details, setDetails] = useState(exercise);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const localizedDetails = useMemo(
    () => localizeCatalogEntity(details || exercise, locale, t, 'exercise'),
    [details, exercise, locale, t],
  );

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
      <ExerciseDetailsContent allowAdd={false} exercise={localizedDetails} />
    </Sheet>
  );
}
