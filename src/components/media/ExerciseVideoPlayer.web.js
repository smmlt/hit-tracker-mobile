import React from 'react';
import { StyleSheet, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const getYouTubeId = (url) => url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/)?.[1];

export function ExerciseVideoPlayer({ source, onError, style }) {
  const videoId = getYouTubeId(source);
  if (!videoId) return null;
  return <View style={[styles.container, style]}><YoutubePlayer height={220} onError={onError} play={false} videoId={videoId} /></View>;
}

const styles = StyleSheet.create({
  container: { aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', width: '100%' },
});
