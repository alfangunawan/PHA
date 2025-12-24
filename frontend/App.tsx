import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuthContext } from './src/auth/AuthContext';
import LoginScreen from './src/auth/LoginScreen';
import RegisterScreen from './src/auth/RegisterScreen';
import ProfileScreen from './src/profile/ProfileScreen';
import ChatScreen from './src/chat/ChatScreen';
import HistoryScreen from './src/chat/HistoryScreen';
import ChatHistoryScreen from './src/chat/ChatHistoryScreen';

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to PHA!</Text>
      <Button title="Chat with AI" onPress={() => navigation.navigate('Chat')} />
      <View style={{ height: 20 }} />
      <Button title="Go to Profile" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
}

// History icon component
function HistoryButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.historyButton}>
      <Text style={styles.historyIcon}>📋</Text>
    </TouchableOpacity>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AppStack.Navigator>
          <AppStack.Screen name="Home" component={HomeScreen} />
          <AppStack.Screen name="Profile" component={ProfileScreen} />
          <AppStack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ navigation }) => ({
              title: 'PHA Chatbot',
              headerRight: () => (
                <HistoryButton onPress={() => navigation.navigate('History')} />
              ),
            })}
          />
          <AppStack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: 'Riwayat Chat' }}
          />
          <AppStack.Screen
            name="ChatHistory"
            component={ChatHistoryScreen}
            options={{ title: 'Detail Riwayat' }}
          />
        </AppStack.Navigator>
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 20, marginBottom: 20, fontWeight: 'bold' },
  historyButton: { marginRight: 15, padding: 5 },
  historyIcon: { fontSize: 20 },
});
