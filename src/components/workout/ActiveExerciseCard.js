import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../constants/colors';
import { exercisePlanProgress, isSetDraftValid } from '../../utils/activeWorkout';
import { RpePicker } from './RpePicker';
import { createStyles } from './ActiveExerciseCard.styles';

const draftFromSet = (set) => ({
  failure: !!set?.isFailure,
  reps: set ? String(set.reps) : '',
  rpe: set?.rpe ? String(set.rpe) : '',
  weight: set ? String(set.weight) : '',
});

function SetEditorRow({ compact, disabled, existingSet, item, number, onSave, theme, t }) {
  const styles = createStyles(theme, compact);
  const [draft, setDraft] = useState(() => draftFromSet(existingSet));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    if (existingSet) setDraft(draftFromSet(existingSet));
  }, [existingSet?.id, existingSet?.isFailure, existingSet?.reps, existingSet?.rpe, existingSet?.weight]);

  const change = (key, value) => {
    setSaveFailed(false);
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const savedDraft = draftFromSet(existingSet);
  const dirty = !existingSet || Object.keys(savedDraft).some((key) => savedDraft[key] !== draft[key]);
  const valid = isSetDraftValid(draft);

  const confirm = async () => {
    if (!valid || disabled || saving || !dirty) return;
    setSaving(true);
    const saved = await onSave(item, {
      isFailure: draft.failure,
      reps: Number(draft.reps),
      rpe: Number(draft.rpe),
      weight: Number(draft.weight.replace(',', '.')),
    }, existingSet);
    setSaving(false);
    setSaveFailed(!saved);
  };

  return <View>
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>{number}</Text>
      <TextInput
        accessibilityLabel={`${t('repsColumn')} ${number}`}
        editable={!disabled}
        keyboardType="number-pad"
        onChangeText={(value) => /^\d*$/.test(value) && change('reps', value)}
        placeholder={String(item.reps || '—')}
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={draft.reps}
      />
      <TextInput
        accessibilityLabel={`${t('weightColumn')} ${number}`}
        editable={!disabled}
        keyboardType="decimal-pad"
        onChangeText={(value) => /^\d*[.,]?\d*$/.test(value) && change('weight', value)}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={draft.weight}
      />
      <RpePicker
        disabled={disabled}
        label={`${t('selectRpe')} · ${t('setNumber', { number })}`}
        onChange={(value) => value === 'open' ? setPickerOpen(true) : change('rpe', value)}
        onClose={() => setPickerOpen(false)}
        open={pickerOpen}
        value={draft.rpe}
      />
      <Pressable
        accessibilityLabel={`${t('toFailure')} · ${t('setNumber', { number })}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: draft.failure, disabled }}
        disabled={disabled}
        onPress={() => change('failure', !draft.failure)}
        style={styles.iconTouch}
      >
        <View style={[styles.failureCheck, draft.failure && styles.failureChecked]}>
          {draft.failure && <Ionicons color={palette.whitePure} name="checkmark" size={21} />}
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel={`${t('confirmSet')} ${number}`}
        accessibilityRole="button"
        disabled={disabled || saving || !valid || !dirty}
        onPress={confirm}
        style={styles.iconTouch}
      >
        <View style={[
          styles.confirmCheck,
          existingSet && !dirty && styles.confirmed,
          valid && dirty && styles.readyToConfirm,
          (!valid || disabled) && styles.confirmDisabled,
        ]}>
          {saving
            ? <ActivityIndicator color={palette.whitePure} size="small" />
            : <Ionicons color={existingSet && !dirty ? palette.whitePure : theme.textSecondary} name="checkmark-done" size={20} />}
        </View>
      </Pressable>
    </View>
    {saveFailed && <Text style={styles.rowError}>{t('setSaveFailed')}</Text>}
  </View>;
}

export function ActiveExerciseCard({
  compact,
  expanded,
  index,
  item,
  onDetails,
  onRemove,
  onSave,
  onToggle,
  recordingDisabled,
  sets,
  theme,
  t,
}) {
  const styles = createStyles(theme, compact);
  const [extraSets, setExtraSets] = useState(0);
  const progress = useMemo(() => exercisePlanProgress(item, sets), [item, sets]);
  const rowCount = Math.max(progress.plannedSets + extraSets, sets.length);
  const completedColor = progress.complete ? palette.greenBright : theme.border;

  return <View style={[styles.card, { borderColor: completedColor }, progress.complete && styles.completedCard]}>
    <Pressable accessibilityRole="button" onPress={onToggle} style={styles.cardHeader}>
      <Ionicons color={theme.textSecondary} name="reorder-three-outline" size={26} />
      <View style={styles.cardTitleBlock}>
        <Text numberOfLines={1} style={styles.exerciseName}>{item.name}</Text>
        <Text style={[styles.planSummary, progress.complete && styles.completeText]}>
          {progress.plannedSets} {t('setsShort')} × {item.reps || '—'} {t('repsShort')}
          {!!progress.actualSets && ` · ${progress.actualReps}/${progress.targetReps || progress.plannedSets}`}
        </Text>
      </View>
      <Ionicons color={theme.textSecondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={20} />
    </Pressable>

    {expanded && <View style={styles.cardBody}>
      <Pressable accessibilityRole="button" onPress={() => onDetails(item.exercise || item)} style={styles.detailsButton}>
        <Text style={styles.detailsText}>{t('viewExerciseDetails')}</Text>
      </Pressable>
      {recordingDisabled && <Text style={styles.startHint}>{t('startToRecordSets')}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.setNumber]}>{t('setColumn')}</Text>
            <Text style={[styles.headerText, styles.metricHeader]} numberOfLines={1}>{t('repsColumn')}</Text>
            <Text style={[styles.headerText, styles.metricHeader]} numberOfLines={1}>{t('weightColumn')}</Text>
            <Text style={[styles.headerText, styles.rpeHeader]}>RPE</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.headerText, styles.iconHeader]}>{t('failureColumn')}</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.headerText, styles.iconHeader]}>{t('done')}</Text>
          </View>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <SetEditorRow
              compact={compact}
              disabled={recordingDisabled}
              existingSet={sets[rowIndex]}
              item={item}
              key={sets[rowIndex]?.id || `draft-${rowIndex}`}
              number={rowIndex + 1}
              onSave={onSave}
              theme={theme}
              t={t}
            />
          ))}
        </View>
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        disabled={recordingDisabled}
        onPress={() => setExtraSets((value) => value + 1)}
        style={[styles.addSet, recordingDisabled && styles.disabled]}
      >
        <Text style={styles.addSetText}>+ {t('addExtraSet')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onRemove(item.id)} style={styles.removeButton}>
        <Text style={styles.removeText}>{t('removeExercise')}</Text>
      </Pressable>
    </View>}
  </View>;
}
