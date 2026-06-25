import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../auth/AuthContext';
import GamificationSummary from '../components/GamificationSummary';

const PRIMARY = '#8a9ccc';

const D = {
    bg: '#fcfcfe',
    card: '#ffffff',
    cardBorder: '#ecedf6',
    gradStart: '#eef2fb',
    gradEnd: '#dce4f6',
    tile1: '#eef2fb',
    tile2: '#eaeef8',
    tile3: '#f1eefa',
    tileIcon2: '#7e8cc4',
    tileIcon3: '#9387c8',
    textDark: '#353b4a',
    textMid: '#3b4150',
    textSub: '#717a96',
    textMuted: '#949bae',
    iconDim: '#a7adbf',
    chevron: '#c0c6d5',
    moodSelected: '#5f73ad',
};

const moods = [
    { key: 'buruk', label: 'Buruk' },
    { key: 'kurang', label: 'Kurang' },
    { key: 'biasa', label: 'Biasa' },
    { key: 'baik', label: 'Baik' },
    { key: 'hebat', label: 'Hebat' },
];

const activities = [
    { key: 'napas', title: 'Latihan Napas', sub: 'Pernapasan', bg: D.tile1, iconColor: PRIMARY, screen: 'Napas' },
    { key: 'meditasi', title: 'Meditasi', sub: 'Pikiran', bg: D.tile2, iconColor: D.tileIcon2, screen: 'Meditasi' },
    { key: 'edukasi', title: 'Edukasi', sub: 'Artikel', bg: D.tile3, iconColor: D.tileIcon3, screen: 'Edukasi' },
    { key: 'jurnal', title: 'Jurnal', sub: 'Refleksi', bg: '#edf7ef', iconColor: '#7da878', screen: 'JournalList' },
    { key: 'games', title: 'Games', sub: 'XP & Poin', bg: '#f1eefa', iconColor: '#9387c8', screen: 'GamesHome' },
];

function HeaderIllustration() {
    return (
        <Svg
            style={{ position: 'absolute', right: -6, bottom: -10, width: 170, height: 128, opacity: 0.55 }}
            viewBox="0 0 160 120"
            fill="none"
        >
            <Circle cx="118" cy="34" r="15" stroke="#aab8e2" strokeWidth={2} strokeLinecap="round" />
            <Path d="M96 34h-12M118 9v-9M140 34h9M101 17l-7-7M135 17l7-7" stroke="#aab8e2" strokeWidth={2} strokeLinecap="round" />
            <Path d="M20 96 q22 -22 44 0 t44 0 t44 0" stroke="#c4cfee" strokeWidth={2} strokeLinecap="round" />
            <Path d="M20 108 q22 -18 44 0 t44 0 t44 0" stroke="#d6deef" strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

function PersonIcon() {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="8.5" r="3.3" stroke={PRIMARY} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5.5 19c1.4-3.4 3.9-5 6.5-5s5.1 1.6 6.5 5" stroke={PRIMARY} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function MoodFaceIcon({ type, color }: { type: string; color: string }) {
    return (
        <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9.2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            {type === 'buruk' && <>
                <Circle cx="9" cy="10" r="0.9" fill={color} />
                <Circle cx="15" cy="10" r="0.9" fill={color} />
                <Path d="M8 16.2 Q12 12.8 16 16.2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            </>}
            {type === 'kurang' && <>
                <Circle cx="9" cy="10" r="0.9" fill={color} />
                <Circle cx="15" cy="10" r="0.9" fill={color} />
                <Path d="M8.6 15.6 Q12 13.6 15.4 15.6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            </>}
            {type === 'biasa' && <>
                <Circle cx="9" cy="10" r="0.9" fill={color} />
                <Circle cx="15" cy="10" r="0.9" fill={color} />
                <Path d="M8.6 15 H15.4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            </>}
            {type === 'baik' && <>
                <Circle cx="9" cy="10" r="0.9" fill={color} />
                <Circle cx="15" cy="10" r="0.9" fill={color} />
                <Path d="M8.6 14.4 Q12 16.4 15.4 14.4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            </>}
            {type === 'hebat' && <>
                <Path d="M7.8 10.4 Q9 9.2 10.2 10.4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
                <Path d="M13.8 10.4 Q15 9.2 16.2 10.4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
                <Path d="M8 14 Q12 17.6 16 14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            </>}
        </Svg>
    );
}

function ActivityIcon({ type, color }: { type: string; color: string }) {
    if (type === 'napas') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M2 8h11a3 3 0 1 0-3-3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M2 12h15a3 3 0 1 1-3 3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M2 16h9" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (type === 'meditasi') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="5.5" r="2.3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 8.5c-3 0-5 2-5.5 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 8.5c3 0 5 2 5.5 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5 17.5h14" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (type === 'jurnal') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M6 4.5h9l3 3v12H6z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15 4.5v3h3M8.5 11h7M8.5 14h7M8.5 17h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (type === 'games') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M7 8h10c2 0 3.5 1.8 3.5 4.3v2.2c0 1.4-.9 2.5-2.1 2.5-.8 0-1.4-.4-1.9-1.1L15.5 14h-7l-1 1.9C7 16.6 6.4 17 5.6 17c-1.2 0-2.1-1.1-2.1-2.5v-2.2C3.5 9.8 5 8 7 8z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 11v3M6.5 12.5h3M15.5 11.8h.01M17.5 13.5h.01" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12 6.5V19" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 6.5C10.5 5.2 8.2 4.5 5 4.5C4.4 4.5 4 5 4 5.6V16.5C4 17 4.4 17.3 5 17.3C8.2 17.3 10.5 18 12 19" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 6.5C13.5 5.2 15.8 4.5 19 4.5C19.6 4.5 20 5 20 5.6V16.5C20 17 19.6 17.3 19 17.3C15.8 17.3 13.5 18 12 19" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ChatIcon({ color = PRIMARY, size = 23 }: { color?: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M5 6.5C5 5.7 5.7 5 6.5 5h11C18.3 5 19 5.7 19 6.5v8C19 15.3 18.3 16 17.5 16H9l-4 3.5z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M9 10h6M9 12.5h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ChevronIcon() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={D.chevron} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { user, canManageGamification, canManageMindfulness } = useAuthContext();
    const [selectedMood, setSelectedMood] = useState<string>('baik');
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.safe, { paddingTop: insets.top > 0 ? 0 : 20 }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header card with illustration */}
                <LinearGradient
                    colors={[D.gradStart, D.gradEnd]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerCard}
                >
                    <HeaderIllustration />
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.greeting} numberOfLines={2}>Halo, {user?.name || 'Teman'}</Text>
                            <Text style={styles.greetingSub}>Senang kamu hadir hari ini.</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                            <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={styles.avatar}>
                                <PersonIcon />
                            </TouchableOpacity>
                            {(canManageMindfulness || canManageGamification) && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate(canManageMindfulness ? 'AdminDashboard' : 'GamificationRules')}
                                    style={styles.adminBadge}
                                >
                                    <Text style={styles.adminBadgeText}>{canManageMindfulness ? 'Admin Mindfulness' : 'Admin Gamifikasi'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </LinearGradient>

                {/* Mood check-in */}
                <View style={styles.moodCard}>
                    <Text style={styles.moodTitle}>Bagaimana perasaanmu?</Text>
                    <View style={styles.moodRow}>
                        {moods.map(m => {
                            const sel = selectedMood === m.key;
                            return (
                                <TouchableOpacity key={m.key} style={styles.moodItem} onPress={() => setSelectedMood(m.key)}>
                                    <View style={[styles.moodBubble, sel && styles.moodBubbleActive]}>
                                        <MoodFaceIcon type={m.key} color={sel ? '#fff' : D.iconDim} />
                                    </View>
                                    <Text style={[styles.moodLabel, sel && styles.moodLabelActive]}>{m.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <GamificationSummary />

                {/* Aktivitas */}
                <View>
                    <Text style={styles.sectionTitle}>Aktivitas</Text>
                    <View style={styles.activityGrid}>
                        {activities.map(a => (
                            <TouchableOpacity
                                key={a.key}
                                style={[styles.activityTile, { backgroundColor: a.bg }]}
                                onPress={() => navigation.navigate(a.screen)}
                            >
                                <View style={styles.activityIconWrap}>
                                    <ActivityIcon type={a.key} color={a.iconColor} />
                                </View>
                                <View>
                                    <Text style={styles.activityTitle}>{a.title}</Text>
                                    <Text style={styles.activitySub}>{a.sub}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Cerita ke PHA */}
                <TouchableOpacity style={styles.ceritaCard} onPress={() => navigation.navigate('Chat')}>
                    <View style={styles.ceritaIconWrap}>
                        <ChatIcon color={PRIMARY} size={23} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.ceritaTitle}>Cerita ke PHA</Text>
                        <Text style={styles.ceritaSub}>Mulai percakapan baru</Text>
                    </View>
                    <ChevronIcon />
                </TouchableOpacity>

                <View style={{ height: 88 }} />
            </ScrollView>

            {/* CTA button */}
            <View style={styles.ctaWrap}>
                <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Chat')}>
                    <ChatIcon color="#fff" size={20} />
                    <Text style={styles.ctaText}>Mulai Cerita</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: D.bg },
    scroll: { padding: 22, paddingTop: 6, gap: 18 },

    headerCard: { borderRadius: 26, padding: 22, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    greeting: { fontFamily: 'Lora_600SemiBold', fontSize: 26, lineHeight: 30, color: D.textDark, letterSpacing: -0.2 },
    greetingSub: { fontSize: 14, color: D.textSub, marginTop: 8 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
    adminBadge: { backgroundColor: PRIMARY, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    adminBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

    moodCard: { backgroundColor: D.card, borderWidth: 1, borderColor: D.cardBorder, borderRadius: 24, padding: 18, paddingBottom: 20 },
    moodTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 14, color: '#474d5e', marginBottom: 16 },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    moodItem: { alignItems: 'center', gap: 9, width: 54 },
    moodBubble: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    moodBubbleActive: {
        backgroundColor: PRIMARY,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
        elevation: 6,
    },
    moodLabel: { fontSize: 11, color: D.iconDim, textAlign: 'center' },
    moodLabelActive: { color: D.moodSelected, fontWeight: '600' },

    sectionTitle: { fontFamily: 'Lora_400Regular', fontSize: 18, color: D.textMid, marginBottom: 13 },
    activityGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    activityTile: { width: '30.8%', borderRadius: 20, padding: 15, paddingHorizontal: 13, gap: 14, minHeight: 128 },
    activityIconWrap: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    activityTitle: { fontSize: 13.5, fontWeight: '600', color: '#3a4150', lineHeight: 17 },
    activitySub: { fontSize: 11.5, color: '#9197b2', marginTop: 4 },

    ceritaCard: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: D.card, borderWidth: 1, borderColor: D.cardBorder, borderRadius: 22, padding: 15, paddingHorizontal: 18 },
    ceritaIconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#eef1f9', justifyContent: 'center', alignItems: 'center' },
    ceritaTitle: { fontSize: 15, color: '#3a4150', fontWeight: '600' },
    ceritaSub: { fontSize: 13, color: D.textMuted, marginTop: 2 },

    ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, paddingBottom: 24 },
    ctaBtn: {
        backgroundColor: PRIMARY,
        borderRadius: 18,
        padding: 17,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
    },
    ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
