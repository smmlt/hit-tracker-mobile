import React, { useState } from "react";
import { Text, View } from "react-native";
import { useLibrary } from "../../context/LibraryContext";
import { ExerciseItem } from "../exercise/ExerciseItem";
import { ProgramCard } from "../workshop/ProgramCard";
import { ProgramEditor } from "../workshop/ProgramEditor";
import { ProgramDetailsContent } from "../../screens/LibraryProgramScreen";
import { ExerciseDetailsContent } from "../../screens/ExerciseDetailsScreen";
import { Button, Feedback, Field, Sheet, s, useWords } from "../workshop/ui";
import { ExerciseEditor } from "./ExerciseEditor";
import { styles } from './ContentManagement.styles';

export function ContentManagement({ section }) {
  const library = useLibrary();
  const w = useWords();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [exerciseDetails, setExerciseDetails] = useState(null);
  const items = library[section].filter(
    (item) =>
      item.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (section !== "programs" ||
        filter === "all" ||
        (filter === "personal") === item.isPersonal),
  );
  return (
    <View style={styles.content}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{w[section]}</Text>
          <Text style={s.muted}>
            {items.length} / {library[section].length}
          </Text>
        </View>
        <Button onPress={() => setEditor({})}>
          + {section === "programs" ? w.createProgram : w.createExercise}
        </Button>
      </View>
      <Field label={w.search} value={query} onChangeText={setQuery} />
      {section === "programs" && (
        <View style={s.row}>
          {["all", "official", "personal"].map((key) => (
            <Button
              key={key}
              secondary={filter !== key}
              onPress={() => setFilter(key)}
            >
              {w[key]}
            </Button>
          ))}
        </View>
      )}
      <Feedback
        error={library.errors[section]}
        loading={library.loading && !items.length}
        onRetry={library.refresh}
      />
      <View style={styles.grid}>
        {items.map((item) => (
          <View
            key={item.id}
            style={styles.item}
          >
            {section === "programs" ? (
              <ProgramCard
                program={item}
                showOwner
                onPress={() => setPreview(item)}
              >
                <View style={styles.programActions}>
                  {!!item.description && (
                    <Text numberOfLines={2} style={s.muted}>
                      {item.description}
                    </Text>
                  )}
                  {item.isPersonal ? (
                    <Text style={s.muted}>{w.readonly}</Text>
                  ) : (
                    <Button secondary onPress={() => setEditor(item)}>
                      {w.edit}
                    </Button>
                  )}
                </View>
              </ProgramCard>
            ) : (
              <ExerciseItem
                exercise={item}
                onPress={() => setExerciseDetails(item)}
              >
                <View style={styles.exerciseActions}>
                  <Button secondary onPress={() => setEditor(item)}>
                    {w.edit}
                  </Button>
                </View>
              </ExerciseItem>
            )}
          </View>
        ))}
      </View>
      {!library.loading && !items.length && (
        <Text style={s.muted}>{w.empty}</Text>
      )}
      {editor &&
        (section === "programs" ? (
          <ProgramEditor
            official
            program={editor.id ? editor : undefined}
            onClose={() => setEditor(null)}
          />
        ) : (
          <ExerciseEditor
            exercise={editor.id ? editor : undefined}
            onClose={() => setEditor(null)}
          />
        ))}
      {preview && (
        <Sheet title={w.programDetails} onClose={() => setPreview(null)}>
          {preview.isPersonal && (
            <Text style={s.muted}>
              {w.owner} · @{preview.ownerUsername || "user"} — {w.readonly}
            </Text>
          )}
          <ProgramDetailsContent
            program={preview}
            onExercise={setExerciseDetails}
          />
        </Sheet>
      )}
      {exerciseDetails && (
        <Sheet
          title={w.exerciseDetails}
          onClose={() => setExerciseDetails(null)}
        >
          <ExerciseDetailsContent
            exercise={
              library.exercises.find(
                (item) => item.id === exerciseDetails.id,
              ) || exerciseDetails
            }
            allowAdd={false}
          />
        </Sheet>
      )}
    </View>
  );
}
