// EN: Versions profile mutations so a read started earlier cannot overwrite state after a later successful write.
// UK: Версіонує зміни профілю, щоб раніше розпочатий read не перезаписав стан після пізнішого успішного write.
/** EN: Creates a monotonic version guard that prevents stale profile reads from overwriting newer mutations. UK: Створює монотонний захист версій, який не дає застарілим читанням профілю перезаписувати новіші зміни. */
export function createProfileRequestGuard() {
  let mutationVersion = 0;

  return {
    /** EN: Captures the current mutation version when a profile read starts. UK: Фіксує поточну версію змін на початку читання профілю. */
    beginRead() {
      return mutationVersion;
    },
    /** EN: Allows a read result only when no mutation has advanced since it began. UK: Дозволяє застосувати результат читання лише тоді, коли після його початку не було нової зміни. */
    shouldApplyRead(version) {
      return version === mutationVersion;
    },
    /** EN: Advances and returns the version that owns a newly started profile mutation. UK: Збільшує та повертає версію, що належить новій зміні профілю. */
    beginMutation() {
      mutationVersion += 1;
      return mutationVersion;
    },
    /** EN: Completes only the current mutation and invalidates reads that started before its success. UK: Завершує лише поточну зміну та робить недійсними читання, розпочаті до її успіху. */
    completeMutation(version) {
      if (version !== mutationVersion) return false;
      mutationVersion += 1;
      return true;
    },
  };
}
