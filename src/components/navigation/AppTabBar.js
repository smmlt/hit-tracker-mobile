import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartIcon, HistoryIcon, HomeIcon, PlayIcon, ProfileIcon } from '../../assets/icons';
import { useTheme } from '../../context/ThemeContext';

const icons = { History: HistoryIcon, ActiveWorkout: PlayIcon, Home: HomeIcon, Analytics: ChartIcon, Profile: ProfileIcon };

export default function AppTabBar({ state, descriptors, navigation }) {
  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { backgroundColor: theme.tabBarBackground, borderTopColor: theme.border, paddingBottom: Math.max(bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? theme.tabBarActive : theme.tabBarInactive;
        const Icon = icons[route.name] || HomeIcon;
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const handlePress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} accessibilityRole="button" accessibilityState={{ selected: focused }} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} onPress={handlePress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            {options.tabBarIcon ? options.tabBarIcon({ focused, color, size: 30 }) : <Icon color={color} height={30} width={30} />}
            <Text numberOfLines={2} style={[styles.label, { color }, focused && styles.activeLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, flexDirection: 'row', paddingTop: 10 },
  item: { alignItems: 'center', flex: 1, minHeight: 54 },
  pressed: { opacity: 0.7 },
  label: { fontSize: 12, lineHeight: 16, marginTop: 4, textAlign: 'center' },
  activeLabel: { fontWeight: '600' },
});
