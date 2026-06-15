import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../theme';

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthContext();
    const { colors, shadows } = useTheme();

    const quickCards = [
        { title: 'Latihan Napas', subtitle: 'Teknik pernapasan', icon: '🌬️', color: colors.softBlue, screen: 'BreathingList' },
        { title: 'Meditasi', subtitle: 'Tenangkan pikiran', icon: '🧘', color: colors.lavender, screen: 'MeditationList' },
        { title: 'Edukasi', subtitle: 'Artikel & video', icon: '📚', color: colors.sageGreen, screen: 'EducationFeed' },
    ];

    const moodOptions = [
        { label: 'Buruk', icon: '😫' },
        { label: 'Kurang', icon: '😕' },
        { label: 'Biasa', icon: '😐' },
        { label: 'Baik', icon: '🙂' },
        { label: 'Hebat', icon: '🤩' },
    ];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                            Halo, {user?.name || 'Teman'} 👋
                        </Text>
                        <Text style={[styles.sub, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                            Bagaimana perasaanmu hari ini?
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Profil')}>
                        <View style={[styles.avatar, { backgroundColor: colors.softBlueLight }]}>
                            <Ionicons name="person" size={20} color={colors.softBlue} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Mood Check-in */}
                <View style={[styles.card, { backgroundColor: colors.bgCard }, shadows.sm]}>
                    <Text style={[styles.sectionTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                        Check-in Mood
                    </Text>
                    <View style={styles.moodRow}>
                        {moodOptions.map((m) => (
                            <TouchableOpacity key={m.label} style={styles.moodItem}>
                                <Text style={styles.moodEmoji}>{m.icon}</Text>
                                <Text style={[styles.moodLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Tools */}
                <Text style={[styles.sectionTitle, { color: colors.charcoal, fontFamily: Typography.heading, marginBottom: Spacing.sm }]}>
                    Aktivitas
                </Text>
                <View style={styles.quickGrid}>
                    {quickCards.map((c) => (
                        <TouchableOpacity
                            key={c.screen}
                            style={[styles.quickCard, { backgroundColor: c.color + '22' }, shadows.sm]}
                            onPress={() => navigation.navigate(c.screen)}
                        >
                            <Text style={styles.quickIcon}>{c.icon}</Text>
                            <Text style={[styles.quickTitle, { color: colors.charcoal, fontFamily: Typography.headingMedium }]}>{c.title}</Text>
                            <Text style={[styles.quickSub, { color: colors.mediumGray, fontFamily: Typography.body }]}>{c.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Chat CTA */}
                <TouchableOpacity style={[styles.chatCard, { backgroundColor: colors.bgCard }, shadows.md]} onPress={() => navigation.navigate('Chat')}>
                    <View style={[styles.chatIcon, { backgroundColor: colors.softBlueLight }]}>
                        <Ionicons name="chatbubbles" size={24} color={colors.softBlue} />
                    </View>
                    <View style={styles.chatInfo}>
                        <Text style={[styles.chatTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>Cerita ke PHA</Text>
                        <Text style={[styles.chatSub, { color: colors.mediumGray, fontFamily: Typography.body }]}>Mulai percakapan baru</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <LinearGradient
                colors={['rgba(0,0,0,0)', colors.bgPrimary]}
                style={styles.fabContainer}
                pointerEvents="box-none"
            >
                <TouchableOpacity style={styles.fabWrap} onPress={() => navigation.navigate('Chat')}>
                    <LinearGradient
                        colors={[colors.softBlue, colors.softBlueDark]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.fab}
                    >
                        <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={[styles.fabText, { fontFamily: Typography.headingMedium }]}>Mulai Cerita</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Spacing.lg, paddingTop: Spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    greeting: { fontSize: Typography.sizes.xl },
    sub: { fontSize: Typography.sizes.sm, marginTop: 4 },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    card: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
    sectionTitle: { fontSize: Typography.sizes.md },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
    moodItem: { alignItems: 'center' },
    moodEmoji: { fontSize: 24 },
    moodLabel: { fontSize: Typography.sizes.xs, marginTop: 4 },
    quickGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    quickCard: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.md },
    quickIcon: { fontSize: 24, marginBottom: Spacing.xs },
    quickTitle: { fontSize: Typography.sizes.sm },
    quickSub: { fontSize: Typography.sizes.xs, marginTop: 2 },
    chatCard: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md },
    chatIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    chatInfo: { flex: 1 },
    chatTitle: { fontSize: Typography.sizes.base },
    chatSub: { fontSize: Typography.sizes.xs, marginTop: 2 },
    fabContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: Spacing.lg },
    fabWrap: { width: '85%', height: 52, borderRadius: 26 },
    fab: { flex: 1, borderRadius: 26, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    fabText: { color: '#fff', fontSize: Typography.sizes.base },
});
