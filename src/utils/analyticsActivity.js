// EN: Builds compact plan-compliance bars without mixing free workouts into scheduled completion counts.
// UK: Формує компактні стовпчики виконання плану, не змішуючи вільні тренування із запланованими.

export function planActivityBuckets(activity = []) {
  const buckets = new Map();

  for (const item of activity) {
    const planned = Math.max(0, Number(item.plannedWorkouts) || 0);
    const completed = Math.max(
      0,
      Number(item.completedPlannedWorkouts ?? Math.max(0, planned - (Number(item.missedWorkouts) || 0))) || 0,
    );
    const missed = Math.max(0, Number(item.missedWorkouts) || 0);
    if (!planned && !completed && !missed) continue;

    const key = item.date;
    const bucket = buckets.get(key) || { date: key, completed: 0, missed: 0, planned: 0 };
    bucket.completed += completed;
    bucket.missed += missed;
    bucket.planned += planned;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function planActivityPages(activity = [], pageSize = 7) {
  const pages = [];
  const firstPageSize = activity.length % pageSize || Math.min(pageSize, activity.length);
  let index = 0;
  if (firstPageSize) {
    pages.push(activity.slice(0, firstPageSize));
    index = firstPageSize;
  }
  for (; index < activity.length; index += pageSize) {
    pages.push(activity.slice(index, index + pageSize));
  }
  return pages;
}
