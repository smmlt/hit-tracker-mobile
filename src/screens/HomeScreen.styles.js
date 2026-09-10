import { StyleSheet } from 'react-native';

import { palette } from '../constants/colors';
export const styles = StyleSheet.create({
  segmentLabel: { fontSize: 16 },
  separator: { height: 8 },
  empty: { padding: 24 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  segment: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.white,
    flexDirection: "row",
    marginHorizontal: 12,
    overflow: "hidden",
  },
  segmentItem: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  search: {
    marginTop: 22,
    marginBottom: 28,
    height: 50,
    borderColor: palette.accent,
    borderRadius: 12,
    backgroundColor: palette.white,
  },
  sort: {
    flexDirection: "row",
    alignItems: "center",
    width: 237,
    minHeight: 30,
    backgroundColor: palette.surface,
    borderColor: palette.gray,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
});
