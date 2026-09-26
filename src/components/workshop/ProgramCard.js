import React from "react";
import { Pressable, Text, View } from "react-native";
import { createStyles } from './ProgramCard.styles.js';
import { useWorkshopStyles, useWords } from "./ui";
import { useLibrary } from "../../context/LibraryContext";
import HeartFilled from "../../assets/workshop/HeartFilled.svg";
import HeartOutline from "../../assets/workshop/HeartOutline.svg";
import Plus from "../../assets/workshop/Plus.svg";

import { palette } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { MediaImage } from '../media/MediaImage';
import { getYouTubeThumbnailUrl } from '../../utils/media';
export function ProgramBadges({ program }) {
  const w = useWords();
  const s = useWorkshopStyles();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const count = new Set(
    (program.schedule || []).map((row) => row.exercise?.id).filter(Boolean),
  ).size;
  return (
    <View style={[s.row, { gap: 4 }]}>
      <View style={[styles.badge, { backgroundColor: palette.accent }]}>
        <Text style={styles.white}>
          {count} {w.exercises.toLowerCase()}
        </Text>
      </View>
    </View>
  );
}
export function ProgramCard({ program, onPress, onAdd, showOwner, children }) {
  const w = useWords();
  const s = useWorkshopStyles();
  const library = useLibrary();
  const { theme } = useTheme();
  const styles = createStyles(theme);
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
        accessibilityLabel={program.displayName || program.name}
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
          {(program.displayName || program.name).toUpperCase()}
        </Text>
        <ProgramBadges program={program} />
        <View style={styles.preview}>
          <MediaImage
            accessibilityLabel={program.imageUrl || program.videoUrl ? program.displayName || program.name : w.noMedia}
            source={program.imageUrl || getYouTubeThumbnailUrl(program.videoUrl)}
            style={styles.image}
          />
          <View style={styles.info}>
            {rows.slice(0, 5).map((row) => (
              <Text
                key={row.exercise.id}
                numberOfLines={1}
                style={styles.exercise}
              >
                ·　{row.exercise.displayName || row.exercise.name}　({row.setsCount} ×{" "}
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
                accessibilityLabel={`${w.schedule}: ${program.displayName || program.name}`}
                accessibilityState={{ selected: !!program.isScheduled }}
                onPress={(event) => {
                  event.stopPropagation();
                  onAdd();
                }}
                style={s.iconButton}
              >
                <Plus width={39} height={39} color={program.isScheduled ? palette.orange : palette.gray} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${w.like} ${program.displayName || program.name}`}
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
