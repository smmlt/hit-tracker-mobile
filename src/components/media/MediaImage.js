import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

function BrandMark() {
  const { theme } = useTheme();
  return (
    <View style={styles.logo}>
      <Svg height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 230 218" width="100%">
        <G>
          <Path d="M0 217.421L36.2368 114.75H0L25.4262 54.3552H78.5132L60.3947 84.5526H102.671L0 217.421Z" fill={theme.primary} />
          <Path d="M162.748 84.5526L138.907 114.75H96.6309L120.789 84.5526H162.748Z" fill={theme.primary} />
          <Path d="M229.499 0L196.116 42.2763H30.5137L41.9283 15.1591C45.7935 5.97908 54.7924 0 64.7575 0H229.499Z" fill={theme.primary} />
        </G>
      </Svg>
    </View>
  );
}

export function MediaImage({ accessibilityLabel, source, style }) {
  const { theme } = useTheme();
  const uri = typeof source === 'string' ? source : source?.uri;
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [uri]);

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.container, { backgroundColor: theme.mediaPlaceholder }, style]}>
      {uri && !failed ? (
        <Image
          onError={() => setFailed(true)}
          resizeMode="cover"
          source={{ uri }}
          style={styles.cover}
        />
      ) : <BrandMark />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cover: { height: '100%', width: '100%' },
  logo: { aspectRatio: 230 / 218, maxHeight: 96, maxWidth: 96, width: '36%' },
});
