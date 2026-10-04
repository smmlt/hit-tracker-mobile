import { WEB_APP_URL } from './shareLinks.js';

export function safeNotificationUrl(raw) {
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(raw);
    const appHost = new URL(WEB_APP_URL).hostname.toLowerCase();
    const host = url.hostname.toLowerCase();
    const youtube = host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com');
    return url.protocol === 'https:' && (host === appHost || youtube) ? url.toString() : null;
  } catch {
    return null;
  }
}
