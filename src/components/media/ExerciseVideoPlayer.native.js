import React, { useEffect, useState } from 'react';
import { useEvent } from 'expo';
import { StyleSheet, View } from 'react-native';
import { styles } from './ExerciseVideoPlayer.native.styles.js';
import { VideoView, useVideoPlayer } from 'expo-video';
import YoutubePlayer from 'react-native-youtube-iframe';

const getYouTubeId = (url) => {
  const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/);
  return match?.[1];
};

function NativeVideo({ source, onError }) {
  const player = useVideoPlayer(source, (video) => {
    video.pause();
  });
  const { error } = useEvent(player, 'statusChange', { error: undefined });

  useEffect(() => {
    if (error) onError?.(error);
  }, [error, onError]);

  return <VideoView allowsFullscreen nativeControls player={player} style={styles.player} />;
}

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
            width={size.width}
          />
        )
      ) : <NativeVideo onError={onError} source={source} />}
    </View>
  );
}
