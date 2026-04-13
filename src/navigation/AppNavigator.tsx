import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { AuthScreen } from '../screens/AuthScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { palette, typography } from '../theme/claudeTheme';

type AuthStackParamList = {
  Auth: undefined;
};

type AppTabParamList = {
  Tasks: undefined;
  Friends: undefined;
  Settings: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.parchment },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: typography.serif,
          fontSize: 24,
          color: palette.nearBlack,
        },
        contentStyle: { backgroundColor: palette.parchment },
      }}
    >
      <AuthStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ title: 'Welcome to ACTBL' }}
      />
    </AuthStack.Navigator>
  );
}

function MainTabs({ darkModeEnabled }: { darkModeEnabled: boolean }) {
  const insets = useSafeAreaInsets();
  const tabBackground = darkModeEnabled ? '#141618' : palette.darkSurface;
  const tabBorder = darkModeEnabled ? '#202327' : palette.nearBlack;
  const activeColor = darkModeEnabled ? '#f2f2f2' : palette.ivory;
  const inactiveColor = darkModeEnabled ? '#9fa4ab' : palette.warmSilver;

  return (
    <AppTabs.Navigator
      initialRouteName="Tasks"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBackground,
          borderTopColor: tabBorder,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: typography.sans,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Tasks') {
            return <Ionicons name="checkmark-done-outline" size={size} color={color} />;
          }
          if (route.name === 'Friends') {
            return <Ionicons name="people-outline" size={size} color={color} />;
          }
          return <Ionicons name="settings-outline" size={size} color={color} />;
        },
      })}
    >
      <AppTabs.Screen name="Tasks" component={TasksScreen} />
      <AppTabs.Screen name="Friends" component={FriendsScreen} />
      <AppTabs.Screen name="Settings" component={ProfileScreen} />
    </AppTabs.Navigator>
  );
}

export function AppNavigator() {
  const { currentUser, isHydrated, darkModeEnabled } = useAppContext();

  const appTheme = darkModeEnabled
    ? {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#111315',
          card: '#1a1d20',
          primary: palette.terracotta,
          text: '#f2f2f2',
          border: '#2a2f35',
        },
      }
    : AppTheme;

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your workspace...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={appTheme}>
      <StatusBar style={darkModeEnabled ? 'light' : 'dark'} />
      {currentUser ? <MainTabs darkModeEnabled={darkModeEnabled} /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.parchment,
    card: palette.ivory,
    primary: palette.terracotta,
    text: palette.nearBlack,
    border: palette.borderCream,
  },
};

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
    fontFamily: typography.sans,
  },
});
