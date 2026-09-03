import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { s, useWords } from "./ui";
import { useLibrary } from "../../context/LibraryContext";
import HeartFilled from "../../assets/workshop/HeartFilled.svg";
import HeartOutline from "../../assets/workshop/HeartOutline.svg";
import Plus from "../../assets/workshop/Plus.svg";

export function ProgramBadges({ program }) {
  const w = useWords();
  const count = new Set(
    (program.schedule || []).map((row) => row.exercise?.id).filter(Boolean),
  ).size;
  return (
    <View style={[s.row, { gap: 4 }]}>
      <View style={[styles.badge, { backgroundColor: "#F00D22" }]}>
        <Text style={styles.white}>
          {count} {w.exercises.toLowerCase()}
        </Text>
      </View>
    </View>
  );
}
export function ProgramCard({ program, onPress, onAdd, showOwner, children }) {
  const w = useWords();
  const library = useLibrary();
  const Heart = program.isLiked ? HeartFilled : HeartOutline;
  const rows = (program.schedule || []).filter(
    (row, index, all) =>
      row.exercise &&
      all.findIndex((item) => item.exercise?.id === row.exercise.id) === index,
  );
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={program.name}
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.7 }]}
      >
        {showOwner && (
          <Text style={styles.label}>
            {program.isPersonal
              ? `${w.owner} · @${program.ownerUsername || "user"}`
              : w.official}
          </Text>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {program.name.toUpperCase()}
        </Text>
        <ProgramBadges program={program} />
        <View style={styles.preview}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            {rows.slice(0, 5).map((row) => (
              <Text
                key={row.exercise.id}
                numberOfLines={1}
                style={styles.exercise}
              >
                ·　{row.exercise.name}　({row.setsCount} ×{" "}
                {row.targetReps || "—"})
              </Text>
            ))}
            {rows.length > 5 && (
              <Text style={styles.muted}>
                + {rows.length - 5} {w.exercises.toLowerCase()}
              </Text>
            )}
            {!rows.length && (
              <Text style={styles.muted}>{program.description || w.empty}</Text>
            )}
          </View>
          {onAdd && (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${w.schedule}: ${program.name}`}
                accessibilityState={{ selected: !!program.isScheduled }}
                onPress={(event) => {
                  event.stopPropagation();
                  onAdd();
                }}
                style={s.iconButton}
              >
                <Plus width={39} height={39} color={program.isScheduled ? "#F98300" : "#838384"} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Like ${program.name}`}
                accessibilityState={{ selected: !!program.isLiked }}
                onPress={(event) => {
                  event.stopPropagation();
                  library.react("programs", program.id);
                }}
                style={styles.like}
              >
                <Heart width={15} height={15} />
                <Text style={styles.white}>{program.likesCount || 0}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#292929",
    borderLeftWidth: 5,
    borderLeftColor: "#F00D22",
    borderRadius: 8,
    overflow: "hidden",
  },
  body: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  title: { color: "#FFFEFE", fontFamily: "Inter", fontSize: 16, lineHeight: 23 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#101113",
  },
  muted: { color: "#838384", fontFamily: "Inter", fontSize: 13 },
  white: { color: "#EFEFEF", fontFamily: "Inter", fontSize: 13 },
  label: { color: "#F98300", fontSize: 11, fontWeight: "600" },
  preview: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
  },
  exercise: { color: "#C8C8C8", fontFamily: "Inter", fontSize: 13, lineHeight: 19 },
  actions: { alignItems: "center", width: 58 },
  like: { flexDirection: "row", alignItems: "center", minHeight: 34, gap: 2 },
});
