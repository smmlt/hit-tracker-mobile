import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { createStyles } from './ExerciseItem.styles.js';
import HeartFilled from "../../assets/workshop/HeartFilled.svg";
import HeartOutline from "../../assets/workshop/HeartOutline.svg";
import StarFilled from "../../assets/workshop/StarFilled.svg";
import StarOutline from "../../assets/workshop/StarOutline.svg";
import { DifficultyIndicator } from "./DifficultyIndicator";
import { useLibrary } from "../../context/LibraryContext";
import { useWords } from "../workshop/ui";
import { ExerciseDetailsModal } from "./ExerciseDetailsModal";
import { useTheme } from '../../context/ThemeContext';
import { MediaImage } from '../media/MediaImage';

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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const current =
    library?.exercises.find((item) => item.id === exercise.id) || exercise;
  const Heart = current.isLiked ? HeartFilled : HeartOutline;
  const Star = current.isBookmarked ? StarFilled : StarOutline;
  const muscles = current.muscles || [];
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={current.displayName || current.name}
        onPress={() => (onPress ? onPress(current) : setOpen(true))}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.7 }]}
      >
        <MediaImage
          accessibilityLabel={current.imageUrl ? current.displayName || current.name : w.noMedia}
          source={current.imageUrl}
          style={styles.image}
        />
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title}>
            {current.displayName || current.name}
          </Text>
          <View style={styles.muscleRow}>
            <Text numberOfLines={1} style={styles.muscles}>
              {muscles
                .slice(0, 3)
                .map((m) => m.displayName || m.commonName || m.name)
                .join(" · ") || w.noMuscles}
            </Text>
            {muscles.length > 3 && (
              <Text style={styles.more}>+{muscles.length - 3}</Text>
            )}
          </View>
          <View style={styles.stats}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${w.like} ${current.displayName || current.name}`}
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
              accessibilityLabel={`${w.save} ${current.displayName || current.name}`}
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
