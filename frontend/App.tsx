import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
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
import {
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';

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

// Fun Blue bottom-nav palette (fixed, per reference design)
const NAV = { active: '#1A59A1', activePill: '#eaf1fa', inactive: '#aeb9cb', bg: '#ffffff', border: '#eef3fa' };

// Custom stroke icons matching the reference footer exactly
function NavIcon({ name, color, size }: { name: string; color: string; size: number }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    if (name === 'Beranda') return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M4 10.5 12 4l8 6.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M10 20v-5h4v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (name === 'Napas') return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M5 19C5 11 11 5 19 5C19 13 13 19 5 19Z" {...sp} />
            <Path d="M5 19C8 15 12 12 16 10.5" {...sp} />
        </Svg>
    );
    if (name === 'Meditasi') return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="5.5" r="2.3" {...sp} />
            <Path d="M12 8.5c-3 0-5 2-5.5 5" {...sp} />
            <Path d="M12 8.5c3 0 5 2 5.5 5" {...sp} />
            <Path d="M5 17.5h14" {...sp} />
        </Svg>
    );
    if (name === 'Edukasi') return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M12 6.5V19" {...sp} />
            <Path d="M12 6.5C10.5 5.2 8.2 4.5 5 4.5C4.4 4.5 4 5 4 5.6V16.5C4 17 4.4 17.3 5 17.3C8.2 17.3 10.5 18 12 19" {...sp} />
            <Path d="M12 6.5C13.5 5.2 15.8 4.5 19 4.5C19.6 4.5 20 5 20 5.6V16.5C20 17 19.6 17.3 19 17.3C15.8 17.3 13.5 18 12 19" {...sp} />
        </Svg>
    );
    if (name === 'Jurnal') return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" {...sp} />
            <Path d="M14 3.5V8h4.5" {...sp} />
            <Path d="M8.5 13h7M8.5 16.5h5" {...sp} />
        </Svg>
    );
    // Games
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M7 9.5h2.5M8.25 8.25v2.5" {...sp} />
            <Circle cx="15.5" cy="9.5" r="0.6" fill={color} />
            <Circle cx="17" cy="11" r="0.6" fill={color} />
            <Path d="M7.5 7h6a4.5 4.5 0 0 1 4.4 3.6l.9 4.4a2 2 0 0 1-3.6 1.5L14 15.5h-4l-1.6 1A2 2 0 0 1 4.8 15l.9-4.4A4.5 4.5 0 0 1 7.5 7z" {...sp} />
        </Svg>
    );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.tabBar, { paddingBottom: Math.max(0, insets.bottom) }]}>
            {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const focused = state.index === index;
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

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
                    navigation.emit({ type: 'tabLongPress', target: route.key });
                };

                const common = {
                    key: route.key,
                    accessibilityRole: 'button' as const,
                    accessibilityState: focused ? { selected: true } : {},
                    accessibilityLabel: options.tabBarAccessibilityLabel,
                    testID: options.tabBarButtonTestID,
                    onPress,
                    onLongPress,
                };

                // Active tab → pill with icon + label; inactive → icon only
                if (focused) {
                    return (
                        <TouchableOpacity {...common} style={styles.tabPill}>
                            <NavIcon name={route.name} color={NAV.active} size={21} />
                            <Text style={styles.tabPillLabel}>{label}</Text>
                        </TouchableOpacity>
                    );
                }
                return (
                    <TouchableOpacity {...common} style={styles.tabIconOnly}>
                        <NavIcon name={route.name} color={NAV.inactive} size={23} />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function MainTabs() {
    return (
        <Tab.Navigator
            initialRouteName="Beranda"
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Beranda" component={HomeScreen} />
            <Tab.Screen name="Napas" component={BreathingListScreen} />
            <Tab.Screen name="Meditasi" component={MeditationListScreen} />
            <Tab.Screen name="Edukasi" component={EducationFeedScreen} />
            <Tab.Screen name="Jurnal" component={JournalListScreen} />
            <Tab.Screen name="Games" component={GamesHomeScreen} />
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
    const { isAuthenticated, isLoading, canAccessAdminPanel } = useAuthContext();
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
                        name="Profil"
                        component={ProfileScreen}
                        options={{ headerShown: true, title: 'Profil', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }}
                    />
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
                    <Stack.Screen name="AdminDashboard" component={canAccessAdminPanel ? AdminDashboardScreen : AccessDeniedScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ContentForm" component={canAccessAdminPanel ? ContentFormScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Konten', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="AudioForm" component={canAccessAdminPanel ? AudioFormScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Audio', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="BreathingForm" component={canAccessAdminPanel ? BreathingFormScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Teknik Napas', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="MeditationForm" component={canAccessAdminPanel ? MeditationFormScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Sesi Meditasi', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
                    <Stack.Screen name="GamificationRules" component={canAccessAdminPanel ? GamificationRulesScreen : AccessDeniedScreen} options={{ headerShown: true, title: 'Gamifikasi', headerTintColor: colors.softBlue, headerStyle: { backgroundColor: colors.bgCard } }} />
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
        HankenGrotesk_400Regular,
        HankenGrotesk_500Medium,
        HankenGrotesk_600SemiBold,
        HankenGrotesk_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return <RootNavigator />;
}

export default function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: NAV.bg,
        borderTopWidth: 1,
        borderTopColor: NAV.border,
        minHeight: 74,
        paddingHorizontal: 16,
        shadowColor: '#1A59A1',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 12,
    },
    tabPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: NAV.activePill,
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 14,
    },
    tabPillLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: NAV.active,
    },
    tabIconOnly: {
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
