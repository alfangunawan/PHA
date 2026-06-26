import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../auth/AuthContext';
import GamificationSummary from '../components/GamificationSummary';

// Fun Blue palette
const FB = {
    primary: '#1A59A1',
    primaryDeep: '#14457D',
    pageBg: '#dfe7f2',
    content: '#ffffff',
    card: '#ffffff',
    cardBorder: '#e3ebf6',
    tileBg: '#eaf1fa',
    tileBorder: '#dbe7f6',
    headerSub: '#cfddf2',
    headerDate: '#bcd2ee',
    textDark: '#243a5c',
    textSub: '#7689a6',
    iconDim: '#9aa7bd',
};

const activities = [
    { key: 'napas', title: 'Latihan Napas', sub: 'Pernapasan', iconBg: '#1A59A1', screen: 'Napas' },
    { key: 'meditasi', title: 'Meditasi', sub: 'Pikiran', iconBg: '#2f6fb8', screen: 'Meditasi' },
    { key: 'edukasi', title: 'Edukasi', sub: 'Artikel', iconBg: '#5a8bcb', screen: 'Edukasi' },
    { key: 'jurnal', title: 'Jurnal', sub: 'Refleksi', iconBg: '#3b7ec4', screen: 'JournalList' },
    { key: 'games', title: 'Games', sub: 'XP & Poin', iconBg: '#234e87', screen: 'GamesHome' },
];

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function todayLabel() {
    const d = new Date();
    return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]}`;
}

function HeaderIllustration() {
    return (
        <Svg
            style={{ position: 'absolute', right: -8, top: 18, width: 180, height: 130, opacity: 0.35 }}
            viewBox="0 0 160 120"
            fill="none"
        >
            <Circle cx="118" cy="40" r="15" stroke="#9dbbe4" strokeWidth={2} strokeLinecap="round" />
            <Path d="M96 40h-12M118 15v-9M140 40h9M101 23l-7-7M135 23l7-7" stroke="#9dbbe4" strokeWidth={2} strokeLinecap="round" />
            <Path d="M14 100 q22 -22 44 0 t44 0 t44 0" stroke="#7ba0d6" strokeWidth={2} strokeLinecap="round" />
            <Path d="M14 112 q22 -18 44 0 t44 0 t44 0" stroke="#5d86c6" strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

function PersonIcon({ color = '#fff' }: { color?: string }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="8.5" r="3.3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5.5 19c1.4-3.4 3.9-5 6.5-5s5.1 1.6 6.5 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ActivityIcon({ type }: { type: string }) {
    const color = '#fff';
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
    if (type === 'edukasi') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12 6.5V19" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 6.5C10.5 5.2 8.2 4.5 5 4.5C4.4 4.5 4 5 4 5.6V16.5C4 17 4.4 17.3 5 17.3C8.2 17.3 10.5 18 12 19" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 6.5C13.5 5.2 15.8 4.5 19 4.5C19.6 4.5 20 5 20 5.6V16.5C20 17 19.6 17.3 19 17.3C15.8 17.3 13.5 18 12 19" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (type === 'jurnal') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M14 3.5V8h4.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8.5 13h7M8.5 16.5h5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    // games
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M7 9.5h2.5M8.25 8.25v2.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="15.5" cy="9.5" r="0.6" fill={color} />
            <Circle cx="17" cy="11" r="0.6" fill={color} />
            <Path d="M7.5 7h6a4.5 4.5 0 0 1 4.4 3.6l.9 4.4a2 2 0 0 1-3.6 1.5L14 15.5h-4l-1.6 1A2 2 0 0 1 4.8 15l.9-4.4A4.5 4.5 0 0 1 7.5 7z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ChatIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M5 6.5C5 5.7 5.7 5 6.5 5h11C18.3 5 19 5.7 19 6.5v8C19 15.3 18.3 16 17.5 16H9l-4 3.5z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ChevronRight({ color = '#fff', size = 22 }: { color?: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function CtaCircles() {
    return (
        <Svg style={{ position: 'absolute', right: -14, bottom: -30, width: 130, height: 130, opacity: 0.18 }} viewBox="0 0 120 120" fill="none">
            <Circle cx="60" cy="60" r="34" stroke="#bcd2ee" strokeWidth={2} />
            <Circle cx="60" cy="60" r="50" stroke="#bcd2ee" strokeWidth={2} />
        </Svg>
    );
}

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { user, canAccessAdminPanel } = useAuthContext();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header — full-bleed Fun Blue */}
                <LinearGradient
                    colors={[FB.primary, FB.primaryDeep]}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 20 }]}
                >
                    <HeaderIllustration />
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.headerDate}>{todayLabel()}</Text>
                            <Text style={styles.greeting} numberOfLines={2}>Halo, {user?.name || 'Teman'}</Text>
                            <Text style={styles.greetingSub}>Senang kamu hadir hari ini.</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                            <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={styles.avatar}>
                                <PersonIcon />
                            </TouchableOpacity>
                            {canAccessAdminPanel && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('AdminDashboard')}
                                    style={styles.adminBadge}
                                >
                                    <Text style={styles.adminBadgeText}>Admin</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </LinearGradient>

                {/* Content — white sheet overlapping header */}
                <View style={styles.content}>

                    {/* Level / XP */}
                    <GamificationSummary />

                    {/* Mulai Cerita — primary action card */}
                    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Chat')}>
                        <LinearGradient
                            colors={[FB.primary, FB.primaryDeep]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ctaCard}
                        >
                            <CtaCircles />
                            <View style={styles.ctaIconWrap}>
                                <ChatIcon color="#fff" size={24} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.ctaTitle}>Mulai Cerita</Text>
                                <Text style={styles.ctaSub}>Ceritakan perasaanmu hari ini.</Text>
                            </View>
                            <ChevronRight color="#fff" size={22} />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Aktivitas */}
                    <View>
                        <Text style={styles.sectionTitle}>Aktivitas</Text>
                        <View style={styles.activityGrid}>
                            {activities.map(a => (
                                <TouchableOpacity
                                    key={a.key}
                                    style={styles.activityTile}
                                    onPress={() => navigation.navigate(a.screen)}
                                >
                                    <View style={[styles.activityIconWrap, { backgroundColor: a.iconBg }]}>
                                        <ActivityIcon type={a.key} />
                                    </View>
                                    <View>
                                        <Text style={styles.activityTitle}>{a.title}</Text>
                                        <Text style={styles.activitySub}>{a.sub}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 16 }} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: FB.primary },
    scroll: { backgroundColor: FB.content, flexGrow: 1 },

    header: { paddingHorizontal: 24, paddingBottom: 44, overflow: 'hidden', position: 'relative' },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    headerDate: { fontSize: 13, color: FB.headerDate, letterSpacing: 0.2 },
    greeting: { fontFamily: 'Lora_600SemiBold', fontSize: 28, lineHeight: 31, color: '#ffffff', letterSpacing: -0.3, marginTop: 6 },
    greetingSub: { fontSize: 14, color: FB.headerSub, marginTop: 8 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
    adminBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    adminBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

    content: {
        backgroundColor: FB.content,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -22,
        paddingHorizontal: 22,
        paddingTop: 20,
        gap: 18,
    },

    ctaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 22,
        padding: 17,
        overflow: 'hidden',
        shadowColor: FB.primary,
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.5,
        shadowRadius: 18,
        elevation: 8,
    },
    ctaIconWrap: {
        width: 48, height: 48, borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
        justifyContent: 'center', alignItems: 'center',
    },
    ctaTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 17, color: '#ffffff', lineHeight: 20 },
    ctaSub: { fontSize: 12.5, color: FB.headerSub, marginTop: 4, lineHeight: 17 },

    sectionTitle: { fontFamily: 'Lora_400Regular', fontSize: 18, color: FB.textDark, marginBottom: 13 },
    activityGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    activityTile: { width: '30.8%', backgroundColor: FB.tileBg, borderWidth: 1, borderColor: FB.tileBorder, borderRadius: 20, padding: 15, paddingHorizontal: 13, gap: 14, minHeight: 128 },
    activityIconWrap: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    activityTitle: { fontSize: 13.5, fontWeight: '600', color: FB.textDark, lineHeight: 17 },
    activitySub: { fontSize: 11.5, color: FB.textSub, marginTop: 4 },
});
