// EN: Compares shared and saved programs by their exercise multiset to detect equivalent library content.
// UK: Порівнює shared і saved programs за multiset вправ, щоб знаходити еквівалентний вміст бібліотеки.
const exerciseIds = (program) => (program?.schedule || [])
  .map((row) => row.exercise?.id ?? row.exerciseId)
  .filter(Number.isInteger)
  .sort((left, right) => left - right);

export const hasSameExerciseMultiset = (left, right) => {
  const leftIds = exerciseIds(left);
  const rightIds = exerciseIds(right);
  return leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index]);
};

export const findMatchingPersonalProgram = (programs, sharedProgram, userId) =>
  programs.find((program) =>
    program.isPersonal
    && program.createdById === userId
    && hasSameExerciseMultiset(program, sharedProgram),
  );
