// EN: Builds compact plan-compliance bars without mixing free workouts into scheduled completion counts.
// UK: Формує компактні стовпчики виконання плану, не змішуючи вільні тренування із запланованими.

const weekKey = (date) => {
  const value = new Date(`${date}T12:00:00Z`);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
};

export function planActivityBuckets(activity = [], period = '7') {
  const weekly = period === '1m' || period === '3m' || (typeof period === 'object');
  const buckets = new Map();

  for (const item of activity) {
    const planned = Math.max(0, Number(item.plannedWorkouts) || 0);
    const completed = Math.max(
      0,
      Number(item.completedPlannedWorkouts ?? Math.max(0, planned - (Number(item.missedWorkouts) || 0))) || 0,
    );
    const missed = Math.max(0, Number(item.missedWorkouts) || 0);
    if (!planned && !completed && !missed) continue;

    const key = weekly ? weekKey(item.date) : item.date;
    const bucket = buckets.get(key) || { date: key, completed: 0, missed: 0, planned: 0 };
    bucket.completed += completed;
    bucket.missed += missed;
    bucket.planned += planned;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((left, right) => left.date.localeCompare(right.date));
}
