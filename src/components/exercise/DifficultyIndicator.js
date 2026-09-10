import React from 'react';
import { View } from 'react-native';
import DifficultyBar from '../../assets/workshop/DifficultyBar.svg';
import { difficultyBarColors } from '../../utils/library';
import { useWords } from '../workshop/ui';
import { styles } from './DifficultyIndicator.styles';

export function DifficultyIndicator({ difficulty = 1 }) {
  const w = useWords();
  return (
    <View
      accessible
      accessibilityLabel={`${w.difficulty}: ${difficulty}/5`}
      style={styles.container}
    >
      {difficultyBarColors(difficulty).map((color, index) => (
        <DifficultyBar key={index} width={12} height={8} preserveAspectRatio="none" color={color} />
      ))}
    </View>
  );
}
