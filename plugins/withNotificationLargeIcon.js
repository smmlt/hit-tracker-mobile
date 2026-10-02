const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const { generateImageAsync } = require('@expo/image-utils');
const fs = require('node:fs/promises');
const path = require('node:path');

const resourceName = 'notification_large_icon';

module.exports = function withNotificationLargeIcon(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      application,
      'expo.modules.notifications.large_notification_icon',
      `@drawable/${resourceName}`,
      'resource'
    );
    return mod;
  });

  return withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.projectRoot;
    const destination = path.join(root, 'android/app/src/main/res/drawable-nodpi');
    const icon = await generateImageAsync({ projectRoot: root, cacheType: 'android-notification-large' }, {
      src: path.join(root, 'assets/icon.png'),
      width: 192,
      height: 192,
      resizeMode: 'cover',
    });
    await fs.mkdir(destination, { recursive: true });
    await fs.writeFile(path.join(destination, `${resourceName}.png`), icon.source);
    return mod;
  }]);
};
