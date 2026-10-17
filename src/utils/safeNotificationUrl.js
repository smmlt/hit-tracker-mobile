// EN: Accepts notification links only for the configured web origin, preventing arbitrary external navigation from push data.
// UK: Приймає notification links лише для налаштованого web origin, не дозволяючи push data відкрити довільну зовнішню адресу.
import { WEB_APP_URL } from './shareLinks.js';

/** EN: Returns a normalized HTTPS app or YouTube URL and rejects malformed or untrusted notification destinations. UK: Повертає нормалізовану HTTPS-адресу застосунку або YouTube та відхиляє пошкоджені чи недовірені адреси зі сповіщень. */
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
