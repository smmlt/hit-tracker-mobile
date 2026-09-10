import React from 'react';
import { View } from 'react-native';
import { styles } from './ExerciseVideoPlayer.web.styles.js';
import YoutubePlayer from 'react-native-youtube-iframe';

import { palette } from '../../constants/colors';
const getYouTubeId = (url) => url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/)?.[1];

export function ExerciseVideoPlayer({ source, onError, style }) {
  const videoId = getYouTubeId(source);
  if (!videoId) return <View style={[styles.container, style]}><video controls preload="metadata" src={source} onError={onError} style={styles.video} /></View>;
  return <View style={[styles.container, style]}><YoutubePlayer height={220} onError={onError} play={false} videoId={videoId} /></View>;
}
