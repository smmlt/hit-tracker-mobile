export const muscleRole = (role) => role === 'secondary' ? 'secondary' : 'primary';

export const splitMusclesByRole = (muscles = []) => muscles.reduce(
  (groups, muscle) => {
    groups[muscleRole(muscle.role)].push(muscle);
    return groups;
  },
  { primary: [], secondary: [] },
);

export const toggleMuscleRole = ({ primaryIds, secondaryIds }, muscleId, role) => {
  const target = role === 'secondary' ? 'secondaryIds' : 'primaryIds';
  const other = target === 'primaryIds' ? 'secondaryIds' : 'primaryIds';
  const selected = target === 'primaryIds' ? primaryIds : secondaryIds;

  return {
    [target]: selected.includes(muscleId)
      ? selected.filter((id) => id !== muscleId)
      : [...selected, muscleId],
    [other]: (target === 'primaryIds' ? secondaryIds : primaryIds).filter(
      (id) => id !== muscleId,
    ),
  };
};
