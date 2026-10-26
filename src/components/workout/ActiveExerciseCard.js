// EN: Coordinates one active exercise, its planned targets, editable set rows, RPE input, and completion progress.
// UK: Координує одну активну вправу, планові цілі, редаговані set rows, RPE та прогрес виконання.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../constants/colors';
import { translateCatalogName } from '../../localization/catalog';
import { durationSetTimerDisplay, exercisePlanProgress, isDurationSetDraftValid, isSetDraftValid, parseDurationInput, shouldSignalDurationTarget } from '../../utils/activeWorkout';
import { cancelTimerSignal, prepareTimerSignal, scheduleTimerSignal, signalTimerNow } from '../../utils/timerSignal';
import { RpePicker } from './RpePicker';
import { createStyles } from './ActiveExerciseCard.styles';
import TimerPlayIcon from '../../assets/icons/TimerPlayIcon.svg';
import PauseIcon from '../../assets/icons/PauseIcon.svg';
import StopIcon from '../../assets/icons/StopIcon.svg';

const draftFromSet = (set) => ({
  failure: !!set?.isFailure,
  reps: set ? String(set.reps) : '',
  rpe: set?.rpe ? String(set.rpe) : '',
  weight: set ? String(set.weight) : '',
});

const formatDuration = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

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
      <View style={styles.repsColumn}>
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
      </View>
      <View style={styles.weightColumn}>
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
      </View>
      <View style={styles.rpeColumn}>
        <RpePicker
          compact={compact}
          disabled={disabled}
          label={`${t('selectRpe')} · ${t('setNumber', { number })}`}
          onChange={(value) => value === 'open' ? setPickerOpen(true) : change('rpe', value)}
          onClose={() => setPickerOpen(false)}
          open={pickerOpen}
          value={draft.rpe}
        />
      </View>
      <Pressable
        accessibilityLabel={`${t('toFailure')} · ${t('setNumber', { number })}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: draft.failure, disabled }}
        disabled={disabled}
        onPress={() => change('failure', !draft.failure)}
        style={styles.failureTouch}
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
        style={styles.doneTouch}
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

function DurationSetEditorRow({ compact, disabled, expanded, existingSet, item, locked, number, onExpand, onSave, onTimerState, theme, t, timerState }) {
  const styles = createStyles(theme, compact);
  const [elapsed, setElapsed] = useState(Number(existingSet?.durationSeconds) || 0);
  const [failure, setFailure] = useState(!!existingSet?.isFailure);
  const [rpe, setRpe] = useState(existingSet?.rpe ? String(existingSet.rpe) : '');
  const [weight, setWeight] = useState(String(existingSet?.weight ?? item.weight ?? 0));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualInput, setManualInput] = useState(null);
  const [running, setRunning] = useState(false);
  const [stopped, setStopped] = useState(!!existingSet);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const startedAt = useRef(null);
  const baseSeconds = useRef(elapsed);
  const lastTick = useRef(elapsed);
  const signaled = useRef(false);
  const target = Number(item.durationSeconds ?? item.targetDurationSeconds) || 0;
  const display = durationSetTimerDisplay(target, elapsed);
  const manualValid = manualInput === null || parseDurationInput(manualInput) !== null;
  const timerDoneTitle = t('timerDone');

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const seconds = baseSeconds.current + Math.floor((Date.now() - startedAt.current) / 1000);
      if (!signaled.current && shouldSignalDurationTarget(target, lastTick.current, seconds)) {
        signaled.current = true;
        signalTimerNow();
      }
      lastTick.current = seconds;
      setElapsed(seconds);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [running, target]);

  useEffect(() => {
    if (!disabled || !running) return;
    baseSeconds.current = elapsed;
    setRunning(false);
    onTimerState(number, 'paused');
  }, [disabled, elapsed, number, onTimerState, running]);

  useEffect(() => {
    if (!running || target <= baseSeconds.current || signaled.current) return undefined;
    let cancelled = false;
    let identifier = null;
    void scheduleTimerSignal(startedAt.current + (target - baseSeconds.current) * 1000, timerDoneTitle).then((id) => {
      identifier = id;
      if (cancelled) void cancelTimerSignal(id);
    }).catch(() => {});
    return () => {
      cancelled = true;
      void cancelTimerSignal(identifier);
    };
  }, [running, target, timerDoneTitle]);

  useEffect(() => {
    if (!existingSet || running) return;
    const seconds = Number(existingSet.durationSeconds) || 0;
    setElapsed(seconds);
    baseSeconds.current = seconds;
    setFailure(!!existingSet.isFailure);
    setRpe(existingSet.rpe ? String(existingSet.rpe) : '');
    setWeight(String(existingSet.weight ?? item.weight ?? 0));
    setStopped(true);
    setManualInput(null);
  }, [existingSet?.durationSeconds, existingSet?.id, existingSet?.isFailure, existingSet?.rpe, running]);

  const startOrPause = () => {
    if (disabled || locked || stopped) return;
    if (running) {
      baseSeconds.current = elapsed;
      setRunning(false);
      onTimerState(number, 'paused');
      return;
    }
    startedAt.current = Date.now();
    setManualInput(null);
    baseSeconds.current = elapsed;
    lastTick.current = elapsed;
    prepareTimerSignal();
    setRunning(true);
    onTimerState(number, 'running');
  };
  const stop = () => {
    if (disabled || (!running && elapsed === 0)) return;
    baseSeconds.current = elapsed;
    setRunning(false);
    setStopped(true);
    onTimerState(number, 'pending');
  };
  const reset = () => {
    if (disabled || saving) return;
    setRunning(false);
    setStopped(false);
    setElapsed(0);
    baseSeconds.current = 0;
    lastTick.current = 0;
    signaled.current = false;
    setSaveFailed(false);
    setManualInput(null);
    onTimerState(number, 'idle');
  };
  const enterSeconds = (value) => {
    setManualInput(value);
    const seconds = parseDurationInput(value);
    if (seconds === null) return;
    setElapsed(seconds);
    baseSeconds.current = seconds;
    lastTick.current = seconds;
    signaled.current = seconds >= target;
    setStopped(seconds > 0);
    setSaveFailed(false);
    onTimerState(number, seconds > 0 ? 'pending' : 'idle');
  };
  const dirty = !existingSet || Number(existingSet.durationSeconds) !== elapsed || Number(existingSet.weight) !== Number(weight) || !!existingSet.isFailure !== failure || String(existingSet.rpe || '') !== rpe;
  const valid = stopped && manualValid && isDurationSetDraftValid({ durationSeconds: elapsed, rpe, weight });
  const confirm = async () => {
    if (!valid || disabled || saving || !dirty) return;
    setSaving(true);
    const saved = await onSave(item, {
      durationSeconds: elapsed,
      isFailure: failure,
      rpe: Number(rpe),
      weight: Number(weight),
    }, existingSet);
    setSaving(false);
    setSaveFailed(!saved);
    if (saved) onTimerState(number, 'saved');
  };

  if (!expanded) return <Pressable
    accessibilityLabel={`${t('setNumber', { number })}, ${formatDuration(elapsed)}`}
    accessibilityRole="button"
    accessibilityState={{ disabled: locked }}
    disabled={locked}
    onPress={onExpand}
    style={[styles.durationSetCard, existingSet && styles.durationSetSaved]}
  >
    <Text style={styles.durationSetNumber}>{t('setNumber', { number })}</Text>
    <Text style={styles.durationCompactTime}>{formatDuration(elapsed)}</Text>
  </Pressable>;

  return <View style={styles.durationSetCard}>
    <View style={styles.durationSetHeader}>
      <Text style={styles.durationSetNumber}>{t('setNumber', { number })}</Text>
      {(running || timerState === 'paused') && <Text style={styles.durationInProgress}>{t('setInProgress')}</Text>}
    </View>
    <View style={styles.durationValueBlock}>
      <Text style={[styles.durationValue, display.overtime && styles.durationOvertime]}>{display.text}</Text>
      <Text style={styles.durationTarget}>{t('durationTarget', { seconds: item.durationSeconds || item.targetDurationSeconds || '—' })}</Text>
    </View>
    <View style={styles.durationActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={t(running ? 'pause' : 'startTimer')}
        accessibilityState={{ disabled: disabled || locked || stopped }} disabled={disabled || locked || stopped}
        onPress={startOrPause} style={[styles.timerControl, (disabled || locked || stopped) && styles.disabled]}>
        {running ? <PauseIcon color={theme.onPrimary} height={22} width={22} /> : <TimerPlayIcon color={theme.onPrimary} height={22} width={22} />}
        <Text style={styles.timerControlText}>{t(running ? 'pause' : 'startTimer')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('stopTimer')}
        accessibilityState={{ disabled: disabled || stopped || (!running && elapsed === 0) }}
        disabled={disabled || stopped || (!running && elapsed === 0)} onPress={stop}
        style={[styles.timerStop, (disabled || stopped || (!running && elapsed === 0)) && styles.disabled]}>
        <StopIcon color={theme.textPrimary} height={22} width={22} />
        <Text style={styles.timerOutlineText}>{t('stopTimer')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('resetTimer')}
        accessibilityState={{ disabled: disabled || saving || (!running && elapsed === 0) }}
        disabled={disabled || saving || (!running && elapsed === 0)} onPress={reset}
        style={[styles.timerStop, (disabled || saving || (!running && elapsed === 0)) && styles.disabled]}>
        <Ionicons color={theme.textPrimary} name="refresh" size={22} />
        <Text style={styles.timerOutlineText}>{t('resetTimer')}</Text>
      </Pressable>
    </View>
    <View style={styles.durationInputControls}>
      <View style={styles.durationManualColumn}>
        <Text style={styles.durationFieldLabel}>{t('manualDurationTime')}</Text>
        <TextInput accessibilityLabel={t('manualDurationTime')} editable={!disabled && !running}
          keyboardType="numbers-and-punctuation" onBlur={() => { if (manualValid) setManualInput(null); }} onChangeText={enterSeconds}
          style={styles.durationInput} value={manualInput ?? formatDuration(elapsed)} />
      </View>
      <View style={styles.durationRpeColumn}>
        <Text style={styles.durationFieldLabel}>{t('rpeColumn')}</Text>
        <RpePicker
          compact={compact}
          disabled={disabled || running}
          label={`${t('selectRpe')} · ${t('setNumber', { number })}`}
          onChange={(value) => value === 'open' ? setPickerOpen(true) : setRpe(value)}
          onClose={() => setPickerOpen(false)}
          open={pickerOpen}
          value={rpe}
        />
      </View>
      <View style={styles.durationManualColumn}>
        <Text style={styles.durationFieldLabel}>{t('weightColumn')}</Text>
        <TextInput
          accessibilityLabel={t('weightColumn')}
          editable={!disabled && !running}
          keyboardType="decimal-pad"
          onChangeText={(value) => /^\d*(?:[.,]\d*)?$/.test(value) && setWeight(value.replace(',', '.'))}
          style={styles.durationInput}
          value={weight}
        />
      </View>
    </View>
    {locked && <Text style={styles.durationLockedHint}>{t('savePreviousTimedSet')}</Text>}
    <View style={styles.durationFailureRow}>
      <Text style={styles.durationFailureLabel}>{t('toFailure')}</Text>
      <Switch accessibilityLabel={t('toFailure')} accessibilityRole="switch" disabled={disabled}
        onValueChange={setFailure} value={failure} trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={palette.whitePure} />
    </View>
    <Pressable accessibilityLabel={t('done')} accessibilityRole="button"
      accessibilityState={{ disabled: disabled || saving || !valid || !dirty }}
      disabled={disabled || saving || !valid || !dirty} onPress={confirm}
      style={[styles.durationDone, (disabled || saving || !valid || !dirty) && styles.confirmDisabled]}>
      {saving ? <ActivityIndicator color={palette.whitePure} size="small" /> : <Text style={styles.durationDoneText}>{t('done')}</Text>}
    </Pressable>
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
  onDurationDraftChange,
  onToggle,
  recordingDisabled,
  sets,
  theme,
  t,
}) {
  const styles = createStyles(theme, compact);
  const [extraSets, setExtraSets] = useState(0);
  const [durationTimer, setDurationTimer] = useState(null);
  const [selectedDurationRow, setSelectedDurationRow] = useState(null);
  const progress = useMemo(() => exercisePlanProgress(item, sets), [item, sets]);
  const rowCount = Math.max(progress.plannedSets + extraSets, sets.length);
  const completedColor = progress.complete ? palette.greenBright : theme.border;
  const durationExercise = item.measurementType === 'duration';
  const expandedDurationRow = durationTimer?.row ?? selectedDurationRow ?? Math.min(sets.length + 1, rowCount);

  useEffect(() => {
    onDurationDraftChange?.(item.id, !!durationTimer);
    return () => onDurationDraftChange?.(item.id, false);
  }, [durationTimer, item.id, onDurationDraftChange]);

  const handleTimerState = (row, state) => {
    if (state === 'idle' || state === 'saved') {
      setDurationTimer(null);
      if (state === 'saved') setSelectedDurationRow(null);
    }
    else setDurationTimer({ row, state });
  };

  return <View style={[styles.card, { borderColor: completedColor }]}>
    <Pressable accessibilityRole="button" onPress={onToggle} style={styles.cardHeader}>
      <Ionicons color={theme.textSecondary} name="reorder-three-outline" size={26} />
      <View style={styles.cardTitleBlock}>
        <Text numberOfLines={1} style={styles.exerciseName}>{translateCatalogName(t, 'exercise', item.name)}</Text>
        <Text style={[styles.planSummary, progress.complete && styles.completeText]}>
          {progress.plannedSets} {t('setsShort')} × {durationExercise ? `${item.durationSeconds || item.targetDurationSeconds || '—'} ${t('secondsShort')}` : `${item.reps || '—'} ${t('repsShort')}`}
          {!!progress.actualSets && ` · ${durationExercise ? `${progress.actualDuration}/${progress.targetDuration || progress.plannedSets} ${t('secondsShort')}` : `${progress.actualReps}/${progress.targetReps || progress.plannedSets}`}`}
        </Text>
      </View>
      <Ionicons color={theme.textSecondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={20} />
    </Pressable>

    <View style={[styles.cardBody, !expanded && styles.collapsedBody]}>
      <Pressable accessibilityRole="button" onPress={() => onDetails(item.exercise || item)} style={styles.detailsButton}>
        <Text style={styles.detailsText}>{t('viewExerciseDetails')}</Text>
      </Pressable>
      {recordingDisabled && <Text style={styles.startHint}>{t('startToRecordSets')}</Text>}
      {durationExercise ? <View style={styles.durationSetList}>
        {Array.from({ length: rowCount }).map((_, rowIndex) => <DurationSetEditorRow
          compact={compact}
          disabled={recordingDisabled}
          expanded={expandedDurationRow === rowIndex + 1}
          existingSet={sets[rowIndex]}
          item={item}
          key={sets[rowIndex]?.id || `duration-draft-${rowIndex}`}
          locked={!!durationTimer && durationTimer.row !== rowIndex + 1}
          number={rowIndex + 1}
          onExpand={() => setSelectedDurationRow(rowIndex + 1)}
          onSave={onSave}
          onTimerState={handleTimerState}
          timerState={durationTimer?.row === rowIndex + 1 ? durationTimer.state : null}
          theme={theme}
          t={t}
        />)}
      </View> : <ScrollView contentContainerStyle={styles.tableScroll} horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text numberOfLines={1} style={[styles.setHeader, styles.headerText]}>{t('setColumn')}</Text>
            <Text numberOfLines={1} style={[styles.headerText, styles.repsColumn]}>{t('activeRepsColumn')}</Text>
            <Text numberOfLines={1} style={[styles.headerText, styles.weightColumn]}>{t('activeWeightColumn')}</Text>
            <Text numberOfLines={1} style={[styles.headerText, styles.rpeColumn]}>{t('rpeColumn')}</Text>
            <Text numberOfLines={1} style={[styles.headerText, styles.failureHeader]}>{t('activeFailureColumn')}</Text>
            <Text numberOfLines={1} style={[styles.headerText, styles.doneHeader]}>{t('done')}</Text>
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
      </ScrollView>}
      <View style={durationExercise ? styles.durationBottomActions : styles.exerciseActions}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('addExtraSet')}
          disabled={recordingDisabled} onPress={() => setExtraSets((value) => value + 1)}
          style={[styles.addSet, durationExercise && styles.durationBottomButton, recordingDisabled && styles.disabled]}>
          <Text style={styles.addSetText}>+ {t('addExtraSet')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('removeExercise')}
          onPress={() => onRemove(item.id)} style={[styles.removeButton, durationExercise && styles.durationBottomButton]}>
          <Text style={styles.removeText}>{t('removeExercise')}</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}
