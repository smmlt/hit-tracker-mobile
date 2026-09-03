import React from 'react';
import { View } from 'react-native';
import DifficultyBar from '../../assets/workshop/DifficultyBar.svg';
import { difficultyBarColors } from '../../utils/library';
import { useWords } from '../workshop/ui';

export function DifficultyIndicator({ difficulty = 1 }) {
  const w = useWords();
  return (
    <View
      accessible
      accessibilityLabel={`${w.difficulty}: ${difficulty}/5`}
      style={{ flexDirection: 'row', gap: 2 }}
    >
      {difficultyBarColors(difficulty).map((color, index) => (
        <DifficultyBar key={index} width={12} height={8} preserveAspectRatio="none" color={color} />
      ))}
    </View>
  );
}
