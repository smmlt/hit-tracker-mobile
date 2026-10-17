// EN: Keeps the historical useWorkout import stable while the actual prepared and active workout state lives in the Zustand store.
// UK: Зберігає сумісність історичного імпорту useWorkout, тоді як стан підготовленого й активного тренування міститься у Zustand store.
import { useWorkoutStore } from '../stores/workoutStore';

export const useWorkout = useWorkoutStore;
