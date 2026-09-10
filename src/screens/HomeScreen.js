import React, { useContext, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { styles } from './HomeScreen.styles.js';
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
import {
  Button,
  Feedback,
  Sheet,
  s,
  useWords,
} from "../components/workshop/ui";
import Chevron from "../assets/icons/ChevronDownIcon.svg";

import { palette } from '../constants/colors';
import { LanguageContext } from '../localization/LanguageContext';
export default function HomeScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { userData } = useContext(AuthContext);
  const library = useLibrary();
  const w = useWords();
  const { t } = useContext(LanguageContext);
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
      if (!item.name.toLowerCase().includes(query.trim().toLowerCase()))
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
      <Text style={[s.heading, { marginBottom: 20 }]}>{w.workshop}</Text>
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
            style={[styles.segmentItem, section === key && s.selected]}
          >
            <Text
              style={[styles.segmentLabel, { color: section === key ? palette.black : palette.gray }]}
            >
              {w[key]}
            </Text>
          </Pressable>
        ))}
      </View>
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={w.search}
        style={styles.search}
        inputStyle={{ color: palette.surface, fontSize: 16 }}
      />
      <ExerciseFilterBar
        musclesList={library.muscles}
        selectedMuscleFilter={muscle}
        onSelectMuscleFilter={setMuscle}
      />
      <View style={[s.row, { marginVertical: 12 }]}>
        {(section === "programs"
          ? ["all", "official", "personal"]
          : ["all", "saved"]
        ).map((key) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: scope === key }}
            key={key}
            style={[s.chip, scope === key && s.selected]}
            onPress={() => setScope(key)}
          >
            <Text style={s.muted}>{w[key]}</Text>
          </Pressable>
        ))}
        {section === "programs" && (
          <Button secondary onPress={() => setCreator(true)}>
            + {w.create}
          </Button>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('sortLibrary')}
        onPress={() => setSortOpen(true)}
        style={styles.sort}
      >
        <Text style={[s.muted, { fontWeight: "700", flex: 1 }]}>{w[sort]}</Text>
        <Chevron width={20} height={20} color={palette.lightGray} />
      </Pressable>
      {!!message && <Text style={s.muted}>{message}</Text>}
      <Feedback
        error={library.errors[section] || library.errors.muscles}
        onRetry={library.refresh}
      />
    </View>
  );
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
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
            tintColor={palette.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={s.muted}>{library.loading ? w.loading : w.empty}</Text>
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
        <Sheet title={w.popular} onClose={() => setSortOpen(false)}>
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
