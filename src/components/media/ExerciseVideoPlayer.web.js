import React, { useState } from 'react';
import { View } from 'react-native';
import { styles } from './ExerciseVideoPlayer.web.styles.js';
import YoutubePlayer from 'react-native-youtube-iframe';
import { getYouTubeVideoId } from '../../utils/media';

import { palette } from '../../constants/colors';
export function ExerciseVideoPlayer({ source, onError, style }) {
  const videoId = getYouTubeVideoId(source);
  const [size, setSize] = useState({ height: 0, width: 0 });
  const onLayout = ({ nativeEvent: { layout } }) => {
    if (layout.width !== size.width || layout.height !== size.height) {
      setSize({ height: layout.height, width: layout.width });
    }
  };

  return (
    <View onLayout={onLayout} style={[styles.container, style]}>
      {videoId ? (
        size.width > 0 && (
          <YoutubePlayer
            height={size.height}
            onError={onError}
            play={false}
            videoId={videoId}
            webViewStyle={styles.video}
            width={size.width}
          />
        )
      ) : (
        <video controls preload="metadata" src={source} onError={onError} style={styles.video} />
      )}
    </View>
  );
}
