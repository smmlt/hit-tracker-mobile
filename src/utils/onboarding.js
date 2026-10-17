// EN: Defines the persisted onboarding completion marker and the exact check used during application startup.
// UK: Визначає збережений маркер завершення onboarding і точну перевірку під час запуску застосунку.
export const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
export const ONBOARDING_COMPLETED_VALUE = 'true';

/** EN: Interprets the persisted marker strictly so missing or unexpected values restart onboarding. UK: Суворо перевіряє збережений маркер, щоб відсутнє або несподіване значення знову запускало знайомство із застосунком. */
export const isOnboardingCompleted = (value) => value === ONBOARDING_COMPLETED_VALUE;
