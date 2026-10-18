/**
 * Composes the authenticated home dashboard from profile, workout, and recommendation state, with shortcuts into training and library flows. / Складає головну панель автентифікованого користувача зі станів профілю, тренування та рекомендацій, надаючи переходи до тренувань і бібліотеки.
 */
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
import { entityRef } from '../utils/navigationPaths';
import { useWorkout } from '../context/WorkoutContext';
// EN: Renders the Workshop catalog, synchronizes search filters with navigation, and opens program creation, scheduling, and detail flows.
// UK: Показує каталог Workshop, синхронізує search-фільтри з navigation і відкриває створення, планування та деталі програм.
export default function HomeScreen({ navigation, route }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { userData } = useContext(AuthContext);
  const library = useLibrary(['exercises', 'programs', 'muscles', 'errors', 'loading', 'refresh', 'search', 'searchCatalog']);
  const w = useWords();
  const { t, locale } = useContext(LanguageContext);
  const { theme } = useTheme();
  const completedWorkoutResult = useWorkout(
    /* EN: Selects only the completed-workout draft that can seed a new personal program. */
    /* UK: Вибирає лише draft завершеного тренування, з якого можна створити особисту програму. */
    (state) => state.completedWorkoutResult
  );
  const setCompletedWorkoutResult = useWorkout(
    /* EN: Selects the store action used to consume the completed-workout draft exactly once. */
    /* UK: Вибирає store action, що одноразово споживає draft завершеного тренування. */
    (state) => state.setCompletedWorkoutResult
  );
  const styles = createStyles(theme);
  const [section, setSection] = useState(route.params?.section === 'programs' ? 'programs' : 'exercises');
  const [query, setQuery] = useState(String(route.params?.q || ''));
  const [muscle, setMuscle] = useState(Number(route.params?.muscle) || null);
  const [sort, setSort] = useState(['relevance', 'alphabetical', 'newest'].includes(route.params?.sort) ? route.params.sort : 'popular');
  const [sortOpen, setSortOpen] = useState(false);
  const [scope, setScope] = useState(['official', 'personal', 'saved'].includes(route.params?.scope) ? route.params.scope : 'all');
  const [creator, setCreator] = useState(false);
  const [creatorInitial, setCreatorInitial] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [message, setMessage] = useState("");
  useFocusEffect(
    React.useCallback(
      /* EN: Refreshes Workshop data whenever the tab regains focus after edits in nested screens. */
      /* UK: Оновлює дані Workshop щоразу, коли вкладка знову отримує focus після редагування у вкладених екранах. */
      () => {
      library.refresh();
      },
      [library.refresh]
    ),
  );
  React.useEffect(
    /* EN: Converts a completed workout or route-provided draft into a prefilled personal-program editor and clears the one-time input. */
    /* UK: Перетворює завершене тренування або route draft на заповнений editor особистої програми й очищає одноразовий input. */
    () => {
    const draft = route.params?.createProgram === true
      ? completedWorkoutResult?.programDraft
      : route.params?.createProgram;
    if (!draft) return;
    setSection("programs");
    setScope("personal");
    setCreatorInitial(draft);
    setCreator(true);
    setCompletedWorkoutResult(null);
    navigation.setParams({ createProgram: undefined });
    },
    [completedWorkoutResult?.programDraft, navigation, route.params?.createProgram, setCompletedWorkoutResult]
  );
  React.useEffect(
    /* EN: Mirrors the visible Workshop section and filters into URL-safe route params so browser navigation restores the same view. */
    /* UK: Віддзеркалює видимий розділ і фільтри Workshop у URL-safe route params, щоб browser navigation відновила той самий вигляд. */
    () => {
    navigation.setParams({
      muscle: muscle || undefined,
      q: query.trim() || undefined,
      scope: scope === 'all' ? undefined : scope,
      section: section === 'exercises' ? undefined : section,
      sort: sort === 'popular' ? undefined : sort,
    });
    },
    [muscle, navigation, query, scope, section, sort]
  );
  React.useEffect(
    /* EN: Debounces remote catalog search so rapid typing does not send an API request for every keystroke. */
    /* UK: Застосовує debounce до віддаленого пошуку каталогу, щоб швидке введення не надсилало API-запит на кожну клавішу. */
    () => {
    // EN: Searches the active section with normalized filters and uses popularity when an empty query makes relevance undefined.
    // UK: Шукає в активному розділі з нормалізованими фільтрами та використовує popularity, коли порожній query не має relevance.
    const timer = setTimeout(() => library.searchCatalog({ q: query.trim(), section, scope, muscle, sort: query.trim() ? sort : 'popular', locale }), 275);
    return /* EN: Cancels the obsolete pending search when filters change or the screen unmounts. */ /* UK: Скасовує застарілий відкладений пошук після зміни фільтрів або unmount екрана. */ () => clearTimeout(timer);
    },
    [library.searchCatalog, locale, muscle, query, scope, section, sort]
  );
  const localData = library[section]
    .filter(
      /* EN: Applies the same text, scope, bookmark, and muscle rules to cached data used by the controlled search fallback. */
      /* UK: Застосовує ті самі правила text, scope, bookmark і muscle до cached-даних контрольованого search fallback. */
      (item) => {
      if (![item.name, item.displayName].some(
        /* EN: Matches either canonical or localized display names against the normalized query. */
        /* UK: Порівнює нормалізований query із канонічною або локалізованою назвою. */
        (name) =>
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
          item.schedule?.some(
            /* EN: Keeps programs whose schedule contains an exercise assigned to the selected muscle. */
            /* UK: Залишає програми, у schedule яких є вправа, прив'язана до вибраного м'яза. */
            (row) =>
            library.exercises
              .find(
                /* EN: Resolves the scheduled exercise against the locally hydrated exercise catalog. */
                /* UK: Знаходить заплановану вправу в локально hydrated каталозі вправ. */
                (ex) => ex.id === row.exercise?.id
              )
              ?.muscles?.some(
                /* EN: Tests whether the resolved exercise contains the selected muscle relation. */
                /* UK: Перевіряє, чи знайдена вправа має зв'язок із вибраним м'язом. */
                (m) => m.id === muscle
              ),
          )
        );
      }
      return (
        (scope !== "saved" || item.isBookmarked) &&
        (!muscle || item.muscles?.some(
          /* EN: Keeps an exercise when any of its muscle relations matches the selected filter. */
          /* UK: Залишає вправу, якщо хоча б один її muscle relation відповідає вибраному фільтру. */
          (m) => m.id === muscle
        ))
      );
      }
    )
    .sort(
      /* EN: Orders local fallback results alphabetically, by newest id, or by popularity to mirror supported search modes. */
      /* UK: Сортує локальний fallback за абеткою, новизною id або популярністю відповідно до search modes. */
      (a, b) =>
      sort === "alphabetical"
        ? a.name.localeCompare(b.name)
        : sort === "newest"
          ? b.id - a.id
          : (b.likesCount || 0) - (a.likesCount || 0),
    );
  const data = library.search?.section === section && library.search?.items ? library.search.items : localData;
  const header = (
    <View>
      <Text style={styles.heading}>{w.workshop}</Text>
      <View style={styles.segment}>
        {["exercises", "programs"].map(
          /* EN: Builds one tab control for each Workshop content section. */
          /* UK: Створює один tab control для кожного розділу контенту Workshop. */
          (key) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: section === key }}
            key={key}
            onPress={
              /* EN: Changes section and resets scope so a filter from Programs cannot hide Exercises. */
              /* UK: Змінює розділ і скидає scope, щоб фільтр Programs не приховав Exercises. */
              () => {
              setSection(key);
              setScope("all");
              }
            }
            style={[styles.segmentItem, section === key && styles.selected]}
          >
            <Text
              style={[styles.segmentLabel, section === key && styles.segmentLabelActive]}
            >
              {w[key]}
            </Text>
          </Pressable>
          )
        )}
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
          onPress={
            /* EN: Opens the sort sheet without changing the current order. UK: Відкриває sort sheet без зміни поточного порядку. */ () => setSortOpen(true)
          }
          style={styles.filterButton}
        >
          <FilterIcon width={24} height={24} color={theme.textSecondary} />
        </Pressable>
      </View>
      {section === "programs" && (
        <View style={styles.scopeRow}>
          {["all", "official", "personal", "saved"].map(
            /* EN: Builds each program-scope chip from the stable scope keys understood by the API. */
            /* UK: Створює кожен chip scope програми зі стабільних ключів, які розуміє API. */
            (key) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: scope === key }}
              key={key}
              style={[styles.scopeChip, scope === key && styles.scopeChipSelected]}
              onPress={
                /* EN: Applies the selected ownership/saved-program scope. */
                /* UK: Застосовує вибраний scope власності або збережених програм. */
                () => setScope(key)
              }
            >
              <Text style={[styles.scopeLabel, scope === key && styles.scopeLabelSelected]}>{w[key]}</Text>
            </Pressable>
            )
          )}
        </View>
      )}
      <Text style={styles.filtersLabel}>{w.muscleGroups}</Text>
      <ExerciseFilterBar
        musclesList={library.muscles}
        selectedMuscleFilter={muscle}
        onSelectMuscleFilter={setMuscle}
      />
      {section === "programs" && (
        <Pressable
          accessibilityRole="button"
          onPress={
            /* EN: Opens an empty editor for a new program. UK: Відкриває порожній editor нової програми. */ () => { setCreatorInitial(null); setCreator(true); }
          }
          style={styles.createProgram}
        >
          <Text style={styles.createProgramText}>+ {w.createProgram}</Text>
        </Pressable>
      )}
      {!!message && <Text style={styles.muted}>{message}</Text>}
      {library.search?.section === section && library.search?.fallback && <Text style={styles.muted}>{w.searchOffline}</Text>}
      {library.search?.section === section && !!library.search?.error && !library.search?.fallback && <Text style={styles.muted}>{w.searchFailed}</Text>}
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
        keyExtractor={
          /* EN: Uses the stable database id as the virtualized-list identity. */
          /* UK: Використовує стабільний database id як identity віртуалізованого списку. */
          (item) => String(item.id)
        }
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 28 }]}
        ListHeaderComponent={header}
        ItemSeparatorComponent={
          /* EN: Renders the same lightweight separator between all catalog rows. */
          /* UK: Показує однаковий легкий separator між усіма рядками каталогу. */
          () => <View style={styles.separator} />
        }
        refreshControl={
          <RefreshControl
            refreshing={library.loading}
            onRefresh={library.refresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.muted}>{library.loading || (library.search?.section === section && library.search?.loading) ? w.loading : (query.trim() ? w.searchEmpty : w.empty)}</Text>
          </View>
        }
        renderItem={
          /* EN: Selects the exercise or program card and wires each card to its nested detail flow. */
          /* UK: Обирає card вправи або програми й підключає її до відповідного nested detail flow. */
          ({ item }) =>
          section === "exercises" ? (
            <ExerciseItem
              exercise={item}
              onPress={
                /* EN: Opens an exercise by a readable route reference containing its name and id. */
                /* UK: Відкриває вправу через читабельний route reference з її назвою та id. */
                (exercise) =>
                navigation.push("ExerciseDetails", { exerciseRef: entityRef(exercise.name, exercise.id) })
              }
            />
          ) : (
            <ProgramCard
              program={item}
              showOwner={item.isPersonal}
              onPress={
                /* EN: Opens the selected program through its stable readable route reference. */
                /* UK: Відкриває вибрану програму через її стабільний читабельний route reference. */
                () =>
                navigation.push("LibraryProgram", { programRef: entityRef(item.name, item.id) })
              }
              onAdd={
                /* EN: Opens the scheduling sheet with the selected program as input. */
                /* UK: Відкриває scheduling sheet з вибраною програмою як input. */
                () => setSchedule(item)
              }
            />
          )
        }
      />
      {sortOpen && (
        <Sheet
          title={w.sort}
          onClose={
            /* EN: Dismisses the sort sheet without modifying the selected mode. */
            /* UK: Закриває sort sheet без зміни вибраного режиму. */
            () => setSortOpen(false)
          }
        >
          {["popular", "relevance", "alphabetical", "newest"].map(
            /* EN: Builds one action for each sort mode supported by local and remote catalog results. */
            /* UK: Створює action для кожного sort mode, підтриманого локальними й remote результатами каталогу. */
            (key) => (
            <Button
              key={key}
              secondary={sort !== key}
              onPress={
                /* EN: Applies the chosen order and closes the modal sheet in one user action. */
                /* UK: Застосовує вибраний порядок і закриває modal sheet однією дією користувача. */
                () => {
                setSort(key);
                setSortOpen(false);
                }
              }
            >
              {w[key]}
            </Button>
            )
          )}
        </Sheet>
      )}
      {creator && (
        <ProgramEditor
          initialValues={creatorInitial}
          onClose={
            /* EN: Closes the editor and clears its draft so the next creation starts cleanly. */
            /* UK: Закриває editor і очищає draft, щоб наступне створення почалося з чистого стану. */
            () => { setCreator(false); setCreatorInitial(null); }
          }
          onSaved={
            /* EN: Opens a newly created program, while an edited prefilled draft remains in the current flow. */
            /* UK: Відкриває щойно створену програму, а відредагований prefilled draft залишає в поточному flow. */
            (result) => {
            if (!creatorInitial) navigation.push("LibraryProgram", { programRef: entityRef(result.name, result.id) });
            }
          }
        />
      )}
      {schedule && (
        <ScheduleProgramSheet
          program={schedule}
          onClose={
            /* EN: Clears the selected program to dismiss the scheduling sheet. */
            /* UK: Очищає вибрану програму, щоб закрити scheduling sheet. */
            () => setSchedule(null)
          }
          onSaved={
            /* EN: Confirms successful scheduling with localized inline feedback. */
            /* UK: Підтверджує успішне планування локалізованим inline-повідомленням. */
            () => setMessage(w.scheduled)
          }
        />
      )}
    </SafeAreaView>
  );
}
