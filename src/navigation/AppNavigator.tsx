import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FriendsScreen } from '../screens/FriendsScreen';
import { NameSetupScreen } from '../screens/NameSetupScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { fonts, getThemeColors, palette } from '../theme/theme';

type AppTabParamList = {
  Friends: undefined;
  Tasks: undefined;
  You: undefined;
};

const AppTabs = createBottomTabNavigator<AppTabParamList>();

function MainTabs({ darkModeEnabled }: { darkModeEnabled: boolean }) {
  const insets = useSafeAreaInsets();
  const c = getThemeColors(darkModeEnabled);

  return (
    <AppTabs.Navigator
      initialRouteName="Tasks"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.tabBarBg,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sans,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = size ?? 22;
          if (route.name === 'Friends') {
            return (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={iconSize}
                color={color}
              />
            );
          }
          if (route.name === 'Tasks') {
            return (
              <Ionicons
                name={focused ? 'clipboard' : 'clipboard-outline'}
                size={iconSize}
                color={color}
              />
            );
          }
          return (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={iconSize}
              color={color}
            />
          );
        },
      })}
    >
      <AppTabs.Screen name="Friends" component={FriendsScreen} />
      <AppTabs.Screen name="Tasks" component={TasksScreen} />
      <AppTabs.Screen name="You" component={ProfileScreen} />
    </AppTabs.Navigator>
  );
}

export function AppNavigator() {
  const { isHydrated, darkModeEnabled } = useAppContext();
  const { isLoading: isAuthLoading, session, profile } = useAuth();

  const c = getThemeColors(darkModeEnabled);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: c.background,
      card: c.surface,
      primary: c.brand,
      text: c.textPrimary,
      border: c.border,
    },
  };

  // Wait until both the local UI state (dark mode, reminder time) and the
  // Supabase session have hydrated before deciding what to render.
  if (!isHydrated || isAuthLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.brand} />
        <Text style={[styles.loadingText, { color: c.textSecondary }]}>
          Loading actbl...
        </Text>
      </View>
    );
  }

  // Auth gate:
  //  - no session         -> SignInScreen
  //  - session but no name (or profile still loading) -> NameSetupScreen
  //  - everything ready   -> main tabs
  let content: React.ReactNode;
  if (!session) {
    content = <SignInScreen />;
  } else if (!profile || !profile.name.trim()) {
    content = <NameSetupScreen />;
  } else {
    content = <MainTabs darkModeEnabled={darkModeEnabled} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={darkModeEnabled ? 'light' : 'dark'} />
      {content}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.parchment,
  },
  loadingText: {
    marginTop: 12,
    color: palette.oliveGray,
    fontFamily: fonts.sans,
  },
});
