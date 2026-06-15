import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Typography } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import BreathingListScreen from '../screens/breathing/BreathingListScreen';
import BreathingExerciseScreen from '../screens/breathing/BreathingExerciseScreen';
import MeditationListScreen from '../screens/meditation/MeditationListScreen';
import MeditationPlayerScreen from '../screens/meditation/MeditationPlayerScreen';
import EducationFeedScreen from '../screens/education/EducationFeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ContentFormScreen from '../screens/admin/ContentFormScreen';
import AudioFormScreen from '../screens/admin/AudioFormScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: '🏠',
  Breathing: '🫁',
  Meditation: '🧘',
  Education: '📚',
  Profile: '👤',
};

const MainTabs = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarActiveTintColor: colors.softBlueDark,
        tabBarInactiveTintColor: colors.mediumGray,
        tabBarLabelStyle: {
          fontFamily: Typography.bodyMedium,
          fontSize: 10,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 4,
          paddingBottom: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Beranda' }} />
      <Tab.Screen name="Breathing" component={BreathingListScreen} options={{ tabBarLabel: 'Napas' }} />
      <Tab.Screen name="Meditation" component={MeditationListScreen} options={{ tabBarLabel: 'Meditasi' }} />
      <Tab.Screen name="Education" component={EducationFeedScreen} options={{ tabBarLabel: 'Edukasi' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator size="large" color={colors.softBlue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="BreathingExercise"
              component={BreathingExerciseScreen}
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen
              name="MeditationPlayer"
              component={MeditationPlayerScreen}
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="ContentForm" component={ContentFormScreen} />
            <Stack.Screen name="AudioForm" component={AudioFormScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
