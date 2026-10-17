// EN: Lets forms choose, preview, replace, or remove an image and reports the resulting media state upward.
// UK: Дозволяє формам вибирати, переглядати, замінювати або видаляти image та передає новий media-state власнику.
import React from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, useWorkshopStyles } from '../workshop/ui';
import { MediaImage } from './MediaImage';

export function ImagePickerField({ aspect, disabled, imageUri, label, onChange, onError, previewStyle }) {
  const styles = useWorkshopStyles();
  const pick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect,
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled) onChange(result.assets[0]);
    } catch (error) {
      onError(error);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <MediaImage accessibilityLabel={label} source={imageUri} style={previewStyle} />
      <Button secondary disabled={disabled} onPress={pick}>{label}</Button>
    </View>
  );
}
