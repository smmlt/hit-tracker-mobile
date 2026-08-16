import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
    zIndex: 100,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  bubble: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  activeBubble: {
    borderRadius: 31,
    height: 62,
    width: 62,
  },
  pressed: { opacity: 0.7 },
});
