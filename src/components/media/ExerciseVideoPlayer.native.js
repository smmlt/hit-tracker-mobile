import React, { useEffect } from 'react';
import { useEvent } from 'expo';
import { StyleSheet, View } from 'react-native';
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

  return (
    <View style={[styles.container, style]}>
      {videoId ? (
        <YoutubePlayer height={220} onError={onError} play={false} videoId={videoId} />
      ) : <NativeVideo onError={onError} source={source} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', width: '100%' },
  player: { flex: 1 },
});
