import React, { useState } from 'react';
import { View } from 'react-native';
import { styles } from './ExerciseVideoPlayer.web.styles.js';
import YoutubePlayer from 'react-native-youtube-iframe';

import { palette } from '../../constants/colors';
const getYouTubeId = (url) => url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/)?.[1];

export function ExerciseVideoPlayer({ source, onError, style }) {
  const videoId = getYouTubeId(source);
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
