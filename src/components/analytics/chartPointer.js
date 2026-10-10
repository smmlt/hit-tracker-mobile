import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  tooltip: { borderRadius: 7, borderWidth: 1, gap: 2, minWidth: 92, paddingHorizontal: 8, paddingVertical: 6 },
  date: { fontFamily: 'Inter', fontSize: 9 },
  value: { fontFamily: 'Inter-Bold', fontSize: 11 },
});

export function chartPointerConfig({ theme, formatValue = (value) => String(value) }) {
  return {
    activatePointersInstantlyOnTouch: true,
    activatePointersOnLongPress: false,
    autoAdjustPointerLabelPosition: true,
    persistPointer: true,
    pointerColor: theme.primary,
    pointerLabelHeight: 50,
    pointerLabelWidth: 106,
    pointerStripColor: theme.textSecondary,
    pointerStripWidth: 1,
    resetPointerOnDataChange: true,
    showPointerStrip: true,
    pointerLabelComponent: (items) => {
      const item = Array.isArray(items) ? items[0] : items;
      if (!item) return null;
      return <View style={[styles.tooltip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Text numberOfLines={1} style={[styles.date, { color: theme.textSecondary }]}>{item.pointerLabel || item.date || item.label || ''}</Text>
        <Text numberOfLines={1} style={[styles.value, { color: theme.textPrimary }]}>{formatValue(item.value)}</Text>
      </View>;
    },
  };
}
