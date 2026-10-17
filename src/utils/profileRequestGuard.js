// EN: Versions profile mutations so a read started earlier cannot overwrite state after a later successful write.
// UK: Версіонує зміни профілю, щоб раніше розпочатий read не перезаписав стан після пізнішого успішного write.
export function createProfileRequestGuard() {
  let mutationVersion = 0;

  return {
    beginRead() {
      return mutationVersion;
    },
    shouldApplyRead(version) {
      return version === mutationVersion;
    },
    beginMutation() {
      mutationVersion += 1;
      return mutationVersion;
    },
    completeMutation(version) {
      if (version !== mutationVersion) return false;
      mutationVersion += 1;
      return true;
    },
  };
}
