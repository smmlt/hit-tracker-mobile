// EN: Normalizes muscle roles and splits selected muscles into primary and secondary groups for forms and summaries.
// UK: Нормалізує ролі мʼязів і розділяє вибрані мʼязи на primary/secondary групи для форм і підсумків.
/** EN: Normalizes any persisted or missing role to the supported primary/secondary values. UK: Нормалізує збережену або відсутню роль до підтримуваних значень основного чи допоміжного м’яза. */
export const muscleRole = (role) => role === 'secondary' ? 'secondary' : 'primary';

/** EN: Partitions exercise muscles into primary and secondary lists while preserving their input order. UK: Розподіляє м’язи вправи на списки основних і допоміжних зі збереженням початкового порядку. */
export const splitMusclesByRole = (muscles = []) => muscles.reduce(
  /* EN: Appends each muscle to the group selected by its normalized role. UK: Додає кожен м’яз до групи, визначеної його нормалізованою роллю. */ (groups, muscle) => {
    groups[muscleRole(muscle.role)].push(muscle);
    return groups;
  },
  { primary: [], secondary: [] },
);

/** EN: Toggles one muscle in the requested role and removes it from the opposite role to prevent overlap. UK: Перемикає один м’яз у вибраній ролі та вилучає його з протилежної, щоб групи не перетиналися. */
export const toggleMuscleRole = ({ primaryIds, secondaryIds }, muscleId, role) => {
  const target = role === 'secondary' ? 'secondaryIds' : 'primaryIds';
  const other = target === 'primaryIds' ? 'secondaryIds' : 'primaryIds';
  const selected = target === 'primaryIds' ? primaryIds : secondaryIds;

  return {
    [target]: selected.includes(muscleId)
      ? selected.filter(/* EN: Removes the selected muscle when its active role is toggled off. UK: Вилучає вибраний м’яз, коли його активну роль вимикають. */ (id) => id !== muscleId)
      : [...selected, muscleId],
    [other]: (target === 'primaryIds' ? secondaryIds : primaryIds).filter(
      /* EN: Removes the muscle from the opposite role so one exercise cannot assign both roles. UK: Вилучає м’яз із протилежної ролі, щоб одна вправа не призначала обидві ролі. */ (id) => id !== muscleId,
    ),
  };
};
