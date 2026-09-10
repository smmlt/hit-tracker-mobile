const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://app.hit-tracker.com').replace(/\/+$/, '');

export const exerciseShareUrl = (exerciseId) =>
  `${WEB_APP_URL}/share/exercises/${encodeURIComponent(String(exerciseId))}`;

export const programShareUrl = (token) =>
  `${WEB_APP_URL}/share/programs/${encodeURIComponent(token)}`;
