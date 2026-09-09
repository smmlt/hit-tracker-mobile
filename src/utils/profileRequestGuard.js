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
