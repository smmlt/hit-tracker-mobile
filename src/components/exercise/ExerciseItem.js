import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import HeartFilled from "../../assets/workshop/HeartFilled.svg";
import HeartOutline from "../../assets/workshop/HeartOutline.svg";
import StarFilled from "../../assets/workshop/StarFilled.svg";
import StarOutline from "../../assets/workshop/StarOutline.svg";
import { DifficultyIndicator } from "./DifficultyIndicator";
import { useLibrary } from "../../context/LibraryContext";
import { useWords } from "../workshop/ui";
import { ExerciseDetailsModal } from "./ExerciseDetailsModal";

export function ExerciseItem({
  exercise,
  onPress,
  onToggleLike,
  footer,
  children,
}) {
  const [open, setOpen] = useState(false);
  const library = useLibrary();
  const w = useWords();
  const current =
    library?.exercises.find((item) => item.id === exercise.id) || exercise;
  const Heart = current.isLiked ? HeartFilled : HeartOutline;
  const Star = current.isBookmarked ? StarFilled : StarOutline;
  const muscles = current.muscles || [];
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={current.name}
        onPress={() => (onPress ? onPress(current) : setOpen(true))}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.7 }]}
      >
        <View accessibilityLabel={w.noMedia} style={styles.image} />
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title}>
            {current.name}
          </Text>
          <View style={styles.muscleRow}>
            <Text numberOfLines={1} style={styles.muscles}>
              {muscles
                .slice(0, 3)
                .map((m) => m.commonName || m.name)
                .join(" · ") || w.noMuscles}
            </Text>
            {muscles.length > 3 && (
              <Text style={styles.more}>+{muscles.length - 3}</Text>
            )}
          </View>
          <View style={styles.stats}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Like ${current.name}`}
              accessibilityState={{ selected: !!current.isLiked }}
              onPress={(event) => {
                event.stopPropagation();
                onToggleLike
                  ? onToggleLike(current.id)
                  : library?.react("exercises", current.id);
              }}
              style={styles.action}
            >
              <Heart width={24} height={24} />
              <Text style={styles.count}>
                {Intl.NumberFormat("en", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(current.likesCount || 0)}
              </Text>
            </Pressable>
            <DifficultyIndicator difficulty={current.difficulty || 1} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Save ${current.name}`}
              accessibilityState={{ selected: !!current.isBookmarked }}
              onPress={(event) => {
                event.stopPropagation();
                library?.react("exercises", current.id, "bookmark");
              }}
              style={styles.star}
            >
              <Star width={24} height={24} />
            </Pressable>
          </View>
        </View>
      </Pressable>
      {!!footer && <Text style={styles.footer}>{footer}</Text>}
      {children}
      {open && (
        <ExerciseDetailsModal
          exercise={current}
          visible
          onClose={() => setOpen(false)}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: "#292929", overflow: "hidden" },
  body: {
    padding: 10,
    minHeight: 123,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  image: { width: 90, height: 90, borderRadius: 8, backgroundColor: "#C4C4C4" },
  info: { flex: 1, minWidth: 0, gap: 8 },
  title: { color: "#EFEFEF", fontFamily: "Inter-Bold", fontSize: 16, lineHeight: 23 },
  muscleRow: { flexDirection: "row", gap: 5 },
  muscles: { flex: 1, color: "#C8C8C8", fontFamily: "Inter", fontSize: 13, lineHeight: 18 },
  more: { color: "#F98300", fontSize: 13 },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 36 },
  count: { color: "#EFEFEF", fontFamily: "Inter", fontSize: 12 },
  star: {
    width: 32,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    fontFamily: "Inter",
    color: "#F00D22",
    borderTopWidth: 1,
    borderTopColor: "#838384",
    padding: 10,
    textAlign: "center",
    fontSize: 13,
  },
});
