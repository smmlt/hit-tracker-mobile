// EN: Builds canonical public exercise and program URLs from normalized names and stable numeric identifiers.
// UK: Будує canonical public URL вправ і програм із нормалізованих назв та стабільних числових ID.
import { entityRef } from './navigationPaths.js';

export const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://app.hit-tracker.com').replace(/\/+$/, '');

/** EN: Builds the canonical public URL for a shared exercise reference. UK: Формує канонічну публічну адресу для поширеного посилання на вправу. */
export const exerciseShareUrl = (exerciseId, name = 'exercise') =>
  `${WEB_APP_URL}/share/exercises/${encodeURIComponent(entityRef(name, exerciseId))}`;

/** EN: Builds the token-protected public URL for a shared workout program. UK: Формує захищену токеном публічну адресу поширеної програми тренувань. */
export const programShareUrl = (token, name = 'program', programId) =>
  `${WEB_APP_URL}/share/programs/${encodeURIComponent(entityRef(name, programId))}/${encodeURIComponent(token)}`;
