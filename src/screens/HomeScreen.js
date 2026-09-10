import React, { useContext, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { createStyles } from './HomeScreen.styles.js';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { AuthContext } from "../context/AuthContext";
import { useLibrary } from "../context/LibraryContext";
import { SearchField } from "../components/common";
import { ExerciseFilterBar, ExerciseItem } from "../components/exercise";
import { ProgramCard } from "../components/workshop/ProgramCard";
import { ProgramEditor } from "../components/workshop/ProgramEditor";
import { ScheduleProgramSheet } from "../components/workshop/ScheduleProgramSheet";
import FilterIcon from "../assets/icons/FilterIcon.svg";
import {
  Button,
  Feedback,
  Sheet,
  useWords,
} from "../components/workshop/ui";

import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
export default function HomeScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { userData } = useContext(AuthContext);
  const library = useLibrary();
  const w = useWords();
  const { t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [section, setSection] = useState("exercises");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState(null);
  const [sort, setSort] = useState("popular");
  const [sortOpen, setSortOpen] = useState(false);
  const [scope, setScope] = useState("all");
  const [creator, setCreator] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [message, setMessage] = useState("");
  useFocusEffect(
    React.useCallback(() => {
      library.refresh();
    }, [library.refresh]),
  );
  const data = library[section]
    .filter((item) => {
      if (![item.name, item.displayName].some((name) =>
        name?.toLowerCase().includes(query.trim().toLowerCase()),
      ))
        return false;
      if (section === "programs") {
        if (
          scope === "personal" &&
          (!item.isPersonal || item.createdById !== userData?.id)
        )
          return false;
        if (scope === "official" && item.isPersonal) return false;
        return (
          !muscle ||
          item.schedule?.some((row) =>
            library.exercises
              .find((ex) => ex.id === row.exercise?.id)
              ?.muscles?.some((m) => m.id === muscle),
          )
        );
      }
      return (
        (scope !== "saved" || item.isBookmarked) &&
        (!muscle || item.muscles?.some((m) => m.id === muscle))
      );
    })
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.name.localeCompare(b.name)
        : sort === "newest"
          ? b.id - a.id
          : (b.likesCount || 0) - (a.likesCount || 0),
    );
  const header = (
    <View>
      <Text style={styles.heading}>{w.workshop}</Text>
      <View style={styles.segment}>
        {["exercises", "programs"].map((key) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: section === key }}
            key={key}
            onPress={() => {
              setSection(key);
              setScope("all");
            }}
            style={[styles.segmentItem, section === key && styles.selected]}
          >
            <Text
              style={[styles.segmentLabel, section === key && styles.segmentLabelActive]}
            >
              {w[key]}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.searchRow}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={w.search}
          style={styles.search}
          inputStyle={styles.searchInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sortLibrary')}
          onPress={() => setSortOpen(true)}
          style={styles.filterButton}
        >
          <FilterIcon width={24} height={24} color={theme.textSecondary} />
        </Pressable>
      </View>
      {section === "programs" && (
        <View style={styles.scopeRow}>
          {["all", "official", "personal"].map((key) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: scope === key }}
              key={key}
              style={[styles.scopeChip, scope === key && styles.scopeChipSelected]}
              onPress={() => setScope(key)}
            >
              <Text style={[styles.scopeLabel, scope === key && styles.scopeLabelSelected]}>{w[key]}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.filtersLabel}>{w.muscleGroups}</Text>
      <ExerciseFilterBar
        musclesList={library.muscles}
        selectedMuscleFilter={muscle}
        onSelectMuscleFilter={setMuscle}
        savedSelected={section === "exercises" && scope === "saved"}
        savedLabel={w.saved}
        onSelectSaved={section === "exercises" ? () => setScope(scope === "saved" ? "all" : "saved") : undefined}
      />
      {section === "programs" && (
        <Pressable accessibilityRole="button" onPress={() => setCreator(true)} style={styles.createProgram}>
          <Text style={styles.createProgramText}>+ {w.createProgram}</Text>
        </Pressable>
      )}
      {!!message && <Text style={styles.muted}>{message}</Text>}
      <Feedback
        error={library.errors[section] || library.errors.muscles}
        onRetry={library.refresh}
      />
    </View>
  );
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
    <FlatList
      showsVerticalScrollIndicator={false}
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 28 }]}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={library.loading}
            onRefresh={library.refresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.muted}>{library.loading ? w.loading : w.empty}</Text>
          </View>
        }
        renderItem={({ item }) =>
          section === "exercises" ? (
            <ExerciseItem
              exercise={item}
              onPress={(exercise) =>
                navigation.push("ExerciseDetails", { exerciseId: exercise.id })
              }
            />
          ) : (
            <ProgramCard
              program={item}
              showOwner={item.isPersonal}
              onPress={() =>
                navigation.push("LibraryProgram", { programId: item.id })
              }
              onAdd={() => setSchedule(item)}
            />
          )
        }
      />
      {sortOpen && (
        <Sheet title={w.sort} onClose={() => setSortOpen(false)}>
          {["popular", "alphabetical", "newest"].map((key) => (
            <Button
              key={key}
              secondary={sort !== key}
              onPress={() => {
                setSort(key);
                setSortOpen(false);
              }}
            >
              {w[key]}
            </Button>
          ))}
        </Sheet>
      )}
      {creator && (
        <ProgramEditor
          onClose={() => setCreator(false)}
          onSaved={(result) =>
            navigation.push("LibraryProgram", { programId: result.id })
          }
        />
      )}
      {schedule && (
        <ScheduleProgramSheet
          program={schedule}
          onClose={() => setSchedule(null)}
          onSaved={() => setMessage(w.scheduled)}
        />
      )}
    </SafeAreaView>
  );
}
