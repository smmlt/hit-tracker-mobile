import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartIcon, HistoryIcon, HomeIcon, PlayIcon, ProfileIcon } from '../../assets/icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './AppTabBar.styles';

const icons = { History: HistoryIcon, ActiveWorkout: PlayIcon, Home: HomeIcon, Analytics: ChartIcon, Profile: ProfileIcon };

export default function AppTabBar({ state, descriptors, navigation }) {
  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { backgroundColor: theme.tabBarBackground, borderTopColor: theme.border, paddingBottom: Math.max(bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? theme.tabBarActive : theme.tabBarInactive;
        const Icon = icons[route.name] || HomeIcon;
        const handlePress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} accessibilityLabel={options.tabBarAccessibilityLabel || route.name} accessibilityRole="button" accessibilityState={{ selected: focused }} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} onPress={handlePress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <View style={[styles.bubble, styles.activeBubble, !focused && { transform: [{ scale: 48 / 62 }] }, { backgroundColor: theme.background, borderColor: focused ? theme.tabBarActive : theme.border, borderWidth: 1 }]}>
              {options.tabBarIcon ? options.tabBarIcon({ focused, color, size: 24 }) : <Icon color={color} height={24} width={24} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
