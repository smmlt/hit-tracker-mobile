import React from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';

export function ExerciseVideoPlayer({ source, onError, style }) {
  const openVideo = async () => {
    try {
      await Linking.openURL(source);
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <Pressable accessibilityRole="link" onPress={openVideo} style={[styles.button, style]}>
      <Text style={styles.label}>Open video</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: '#F00D22', borderRadius: 12, justifyContent: 'center', minHeight: 52 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
