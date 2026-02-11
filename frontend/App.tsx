import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuthContext } from './src/auth/AuthContext';
import LoginScreen from './src/auth/LoginScreen';
import RegisterScreen from './src/auth/RegisterScreen';
import HomeScreen from './src/home/HomeScreen';
import ProfileScreen from './src/profile/ProfileScreen';
import ChatScreen from './src/chat/ChatScreen';
import HistoryScreen from './src/chat/HistoryScreen';
import ChatHistoryScreen from './src/chat/ChatHistoryScreen';

// Type definitions for navigation (optional but good practice)
export type RootStackParamList = {
  MainTabs: undefined;
  Chat: { sessionId?: string };
  ChatHistory: { sessionId: string };
  Auth: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder for Journal Screen
function JournalScreen() {
  return (
    <View style={styles.center}>
      <Ionicons name="journal-outline" size={50} color="#ccc" />
      <View style={{ height: 10 }} />
      <View><Text style={{ color: '#999' }}>Fitur Jurnal Segera Hadir</Text></View>
    </View>
  );
}

import { Text } from 'react-native'; // Import Text for Journal placeholder

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Beranda') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Jurnal') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#48B096',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        }
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Chat" component={HistoryScreen} options={{ title: 'Riwayat' }} />
      <Tab.Screen name="Jurnal" component={JournalScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#48B096" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: true,
              title: 'PHA Chatbot',
              headerTintColor: '#48B096',
              headerTitleStyle: { color: '#333' }
            }}
          />
          <Stack.Screen
            name="ChatHistory"
            component={ChatHistoryScreen}
            options={{
              headerShown: true,
              title: 'Detail Riwayat',
              headerTintColor: '#48B096'
            }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
