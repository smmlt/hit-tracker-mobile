import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

import { 
  HistoryIcon, 
  PlayIcon, 
  HomeIcon, 
  ChartIcon, 
  ProfileIcon 
} from '../assets/icons';

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.bottom);

  const getIcon = (routeName, color) => {
    const iconProps = { width: 24, height: 24, color: color };

    switch (routeName) {
      case 'History': 
        return <HistoryIcon {...iconProps} />;
      case 'ActiveWorkout': 
        return <PlayIcon {...iconProps} />;
      case 'Home': 
        return <HomeIcon {...iconProps} />;
      case 'Analytics': 
        return <ChartIcon {...iconProps} />;
      case 'Profile': 
        return <ProfileIcon {...iconProps} />;
      default:
        return <HomeIcon {...iconProps} />;
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        
        const label = 
          options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
              ? options.title 
              : route.name;
        
        const isFocused = state.index === index;
        
        const activeColor = theme.tabBarActive;
        const inactiveColor = theme.tabBarInactive;
        const currentColor = isFocused ? activeColor : inactiveColor;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {getIcon(route.name, currentColor)}
            
            <Text style={[
              styles.tabLabel, 
              { color: currentColor }, 
              isFocused && styles.tabLabelActive
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme, bottomInset) => StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 64 + (bottomInset > 0 ? bottomInset : 15), 
    backgroundColor: theme.tabBarBackground, 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: bottomInset > 0 ? bottomInset : 10, 
    borderTopWidth: 1,
    borderTopColor: theme.border,
    elevation: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '400',
    textAlign: 'center',
  },
  tabLabelActive: {
    fontWeight: '600',
  },
});