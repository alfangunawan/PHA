import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
} from '@expo-google-fonts/lora';

import { AuthProvider, useAuthContext } from './src/auth/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import LoginScreen from './src/auth/LoginScreen';
import RegisterScreen from './src/auth/RegisterScreen';
import HomeScreen from './src/home/HomeScreen';
import ProfileScreen from './src/profile/ProfileScreen';
import ChatScreen from './src/chat/ChatScreen';
import ChatHistoryScreen from './src/chat/ChatHistoryScreen';
import HistoryScreen from './src/chat/HistoryScreen';
import ActivityHistoryScreen from './src/screens/ActivityHistoryScreen';

import BreathingListScreen from './src/screens/breathing/BreathingListScreen';
import BreathingExerciseScreen from './src/screens/breathing/BreathingExerciseScreen';
import MeditationListScreen from './src/screens/meditation/MeditationListScreen';
import MeditationPlayerScreen from './src/screens/meditation/MeditationPlayerScreen';
import EducationFeedScreen from './src/screens/education/EducationFeedScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import ContentFormScreen from './src/screens/admin/ContentFormScreen';
import AudioFormScreen from './src/screens/admin/AudioFormScreen';
import BreathingFormScreen from './src/screens/admin/BreathingFormScreen';
import MeditationFormScreen from './src/screens/admin/MeditationFormScreen';
import GamificationRulesScreen from './src/screens/admin/GamificationRulesScreen';
import JournalListScreen from './src/screens/journal/JournalListScreen';
import JournalEditorScreen from './src/screens/journal/JournalEditorScreen';
import JournalDetailScreen from './src/screens/journal/JournalDetailScreen';
import GamesHomeScreen from './src/screens/games/GamesHomeScreen';
import PositiveWordPuzzleScreen from './src/screens/games/PositiveWordPuzzleScreen';
import TetrisGameScreen from './src/screens/games/TetrisGameScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons: Record<string, [string, string]> = {
    Beranda: ['home', 'home-outline'],
    Napas: ['leaf', 'leaf-outline'],
    Meditasi: ['planet', 'planet-outline'],
    Edukasi: ['book', 'book-outline'],
    Profil: ['person', 'person-outline'],
};

function CustomTabBar({ state, descriptors, navigation }: any) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.tabBar,
                {
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.tabBarBorder,
                },
            ]}
        >
            {state.routes.map((route: any, index: number) => {
                const focused = state.index === index;
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;
                const [active, inactive] = tabIcons[route.name] || ['ellipse', 'ellipse-outline'];
                const color = focused ? colors.softBlue : colors.mediumGray;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!focused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={focused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarButtonTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tabItem}
                    >
                        <Ionicons name={(focused ? active : inactive) as any} size={24} color={color} />
                        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function MainTabs() {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    const [active, inactive] = tabIcons[route.name] || ['ellipse', 'ellipse-outline'];
                    return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.softBlue,
                tabBarInactiveTintColor: colors.mediumGray,
                tabBarStyle: {
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.tabBarBorder,
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarLabelStyle: { fontSize: 11, marginTop: -2 },
            })}
        >
            <Tab.Screen name="Beranda" component={HomeScreen} />
            <Tab.Screen name="Napas" component={BreathingListScreen} />
            <Tab.Screen name="Meditasi" component={MeditationListScreen} />
            <Tab.Screen name="Edukasi" component={EducationFeedScreen} />
            <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function AccessDeniedScreen() {
    const { colors } = useTheme();
    return (
        <View style={[styles.center, { backgroundColor: colors.bgPrimary, padding: 24 }]}>
            <Ionicons name="lock-closed-outline" size={34} color={colors.mediumGray} />
            <Text style={{ color: colors.darkGray, marginTop: 12, textAlign: 'center', fontWeight: '700' }}>Akses tidak tersedia untuk role akun ini.</Text>
        </View>
    );
}

function RootNavigator() {
    const { isAuthenticated, isLoading, canManageGamification, canManageMindfulness } = useAuthContext();
    const { colors } = useTheme();

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
                <ActivityIndicator size="large" color={colors.softBlue} />
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
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ChatHistory"
                        component={ChatHistoryScreen}
                        options={{ headerShown: true, title: 'Detail Riwayat', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }}
                    />
                    <Stack.Screen
                        name="History"
                        component={HistoryScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ActivityHistory"
                        component={ActivityHistoryScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="BreathingExercise"
                        component={BreathingExerciseScreen}
                        options={{ gestureEnabled: false }}
                    />
                    <Stack.Screen
                        name="MeditationPlayer"
                        component={MeditationPlayerScreen}
                        options={{ gestureEnabled: false }}
                    />
                    <Stack.Screen name="AdminDashboard" component={canManageMindfulness ? AdminDashboardScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Admin Mindfulness', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="ContentForm" component={canManageMindfulness ? ContentFormScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Konten', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="AudioForm" component={canManageMindfulness ? AudioFormScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Audio', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="BreathingForm" component={canManageMindfulness ? BreathingFormScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Teknik Napas', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="MeditationForm" component={canManageMindfulness ? MeditationFormScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Sesi Meditasi', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="GamificationRules" component={canManageGamification ? GamificationRulesScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Gamifikasi', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="JournalList" component={JournalListScreen} options={{ headerShown: true, title: 'Jurnal', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="JournalEditor" component={JournalEditorScreen} options={{ headerShown: true, title: 'Tulis Jurnal', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="JournalDetail" component={JournalDetailScreen} options={{ headerShown: true, title: 'Detail Jurnal', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="GamesHome" component={GamesHomeScreen} options={{ headerShown: true, title: 'Games', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="PositiveWordPuzzle" component={PositiveWordPuzzleScreen} options={{ headerShown: true, title: 'Word Puzzle', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="TetrisGame" component={TetrisGameScreen} options={{ gestureEnabled: false }} />
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

function AppContent() {
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Lora_400Regular,
        Lora_500Medium,
        Lora_600SemiBold,
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return <RootNavigator />;
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabBar: {
        flexDirection: 'row',
        borderTopWidth: StyleSheet.hairlineWidth,
        height: 60,
        paddingBottom: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    tabLabel: {
        fontSize: 11,
    },
});
