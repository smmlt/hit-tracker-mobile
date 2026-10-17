// EN: Validates public release origins and injects the Android Firebase configuration without exposing build secrets in app.json.
// UK: Перевіряє публічні адреси релізу та підключає Android-конфігурацію Firebase, не розкриваючи секрети збірки в app.json.

module.exports = /** EN: Builds the final Expo configuration, rejecting unsafe release URLs and attaching the Android Firebase file when available. UK: Формує остаточну конфігурацію Expo, відхиляє небезпечні адреси релізу та за наявності підключає Android-файл Firebase. */ ({ config }) => {
  const releaseBuild = ['preview', 'production'].includes(process.env.EAS_BUILD_PROFILE)
    || process.env.RELEASE_BUILD === '1';

  if (releaseBuild) {
    for (const name of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_WEB_URL']) {
      const value = process.env[name];
      let url;
      try {
        url = new URL(value);
      } catch {
        throw new Error(`${name} must be a public HTTPS origin for release builds.`);
      }
      const isPlaceholder = url.hostname === 'example.com' || url.hostname.endsWith('.example.com');
      if (url.protocol !== 'https:' || url.origin !== value.replace(/\/$/, '') || url.hostname === 'localhost' || isPlaceholder) {
        throw new Error(`${name} must be a public HTTPS origin for release builds.`);
      }
    }
  }

  if (!config.android && !process.env.GOOGLE_SERVICES_JSON) return config;

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || config.android?.googleServicesFile,
    },
  };
};
