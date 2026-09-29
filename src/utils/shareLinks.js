import { entityRef } from './navigationPaths.js';

export const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://app.hit-tracker.com').replace(/\/+$/, '');

export const exerciseShareUrl = (exerciseId, name = 'exercise') =>
  `${WEB_APP_URL}/share/exercises/${encodeURIComponent(entityRef(name, exerciseId))}`;

export const programShareUrl = (token, name = 'program', programId) =>
  `${WEB_APP_URL}/share/programs/${encodeURIComponent(entityRef(name, programId))}/${encodeURIComponent(token)}`;
