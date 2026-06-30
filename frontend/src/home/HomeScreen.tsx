import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../auth/AuthContext';
import GamificationSummary from '../components/GamificationSummary';

const MASCOT = require('../../assets/maskot-main.gif');

const FB = {
    primary: '#1A59A1',
    primaryDeep: '#14457D',
    content: '#ffffff',
    tileBg: '#eaf1fa',
    tileBorder: '#dbe7f6',
    headerSub: '#cfddf2',
    headerDate: '#bcd2ee',
    textDark: '#243a5c',
    textSub: '#7689a6',
};

const activities = [
    { key: 'napas',    title: 'Latihan Napas', sub: 'Pernapasan', iconBg: '#1A59A1', screen: 'Napas'       },
    { key: 'meditasi', title: 'Meditasi',      sub: 'Pikiran',    iconBg: '#2f6fb8', screen: 'Meditasi'    },
    { key: 'audio',    title: 'Audio',         sub: 'Relaksasi',  iconBg: '#4478B4', screen: 'AudioList'   },
    { key: 'edukasi',  title: 'Edukasi',       sub: 'Artikel',    iconBg: '#5a8bcb', screen: 'Edukasi'     },
    { key: 'jurnal',   title: 'Jurnal',        sub: 'Refleksi',   iconBg: '#3b7ec4', screen: 'JournalList' },
    { key: 'games',    title: 'Games',         sub: 'XP & Poin',  iconBg: '#234e87', screen: 'GamesHome'   },
];

const HARI  = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function todayLabel() {
    const d = new Date();
    return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]}`;
}

function CalendarIcon({ color = '#bcd2ee' }: { color?: string }) {
    return (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function PersonIcon({ color = '#fff' }: { color?: string }) {
    return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="8.5" r="3.3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5.5 19c1.4-3.4 3.9-5 6.5-5s5.1 1.6 6.5 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ActivityIcon({ type }: { type: string }) {
    const s = '#fff';
    if (type === 'napas') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M2 8h11a3 3 0 1 0-3-3"   stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M2 12h15a3 3 0 1 1-3 3"  stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M2 16h9"                  stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (type === 'meditasi') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="5.5" r="2.3" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 8.5c-3 0-5 2-5.5 5"  stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 8.5c3 0 5 2 5.5 5"   stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5 17.5h14"              stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (type === 'edukasi') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12 6.5V19" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 6.5C10.5 5.2 8.2 4.5 5 4.5C4.4 4.5 4 5 4 5.6V16.5C4 17 4.4 17.3 5 17.3C8.2 17.3 10.5 18 12 19" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 6.5C13.5 5.2 15.8 4.5 19 4.5C19.6 4.5 20 5 20 5.6V16.5C20 17 19.6 17.3 19 17.3C15.8 17.3 13.5 18 12 19" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (type === 'jurnal') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M14 3.5V8h4.5" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8.5 13h7M8.5 16.5h5"   stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    if (type === 'audio') return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M21 19a2 2 0 0 1-2 2h-1v-5h3v3z" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3 19a2 2 0 0 0 2 2h1v-5H3v3z" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M7 9.5h2.5M8.25 8.25v2.5" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="15.5" cy="9.5" r="0.6" fill={s} />
            <Circle cx="17"   cy="11"  r="0.6" fill={s} />
            <Path d="M7.5 7h6a4.5 4.5 0 0 1 4.4 3.6l.9 4.4a2 2 0 0 1-3.6 1.5L14 15.5h-4l-1.6 1A2 2 0 0 1 4.8 15l.9-4.4A4.5 4.5 0 0 1 7.5 7z" stroke={s} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
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
                    style={[styles.header, { paddingTop: insets.top + 14 }]}
                >
                    {/* Decorative radial orb */}
                    <View style={styles.orb} />

                    {/* Row 1: date + profile avatar */}
                    <View style={styles.headerTopRow}>
                        <View style={styles.dateRow}>
                            <CalendarIcon />
                            <Text style={styles.headerDate}>{todayLabel()}</Text>
                        </View>
                        <View style={styles.avatarActions}>
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

                    {/* Row 2: greeting + mascot */}
                    <View style={styles.greetingRow}>
                        <View style={styles.greetingText}>
                            <Text style={styles.greeting}>Halo, {user?.name || 'Teman'}</Text>
                            <Text style={styles.greetingSub}>Senang kamu hadir hari ini.</Text>
                        </View>
                        <View style={styles.mascotWrap}>
                            <View style={styles.mascotShadow} />
                            <Image
                                source={MASCOT}
                                style={styles.mascotImage}
                                contentFit="contain"
                                autoplay
                                loop={0}
                            />
                        </View>
                    </View>
                </LinearGradient>

                {/* Content — white sheet overlapping header */}
                <View style={styles.content}>

                    {/* Level / XP */}
                    <GamificationSummary />

                    {/* Mulai Cerita — primary action card */}
                    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('ChatGate')}>
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

                    {/* Rekomendasi Khusus */}
                    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('MindfulnessRecommendation')}>
                        <View style={styles.recommendationCard}>
                            <View style={styles.recIconWrap}>
                                <Ionicons name="sparkles" size={22} color={FB.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.recTitle}>Rekomendasi Khusus</Text>
                                <Text style={styles.recSub}>Berdasarkan hasil tes kecemasanmu.</Text>
                            </View>
                            <ChevronRight color={FB.primary} size={22} />
                        </View>
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
    safe:   { flex: 1, backgroundColor: FB.primary },
    scroll: { backgroundColor: FB.content, flexGrow: 1 },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
        paddingHorizontal: 22,
        paddingBottom: 36,
        overflow: 'hidden',
        position: 'relative',
    },
    orb: {
        position: 'absolute',
        right: -46,
        top: -34,
        width: 210,
        height: 210,
        borderRadius: 105,
        backgroundColor: 'rgba(132,170,225,0.22)',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 3,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    headerDate: { fontSize: 13, color: FB.headerDate, letterSpacing: 0.2 },
    avatarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminBadge: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    adminBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

    greetingRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 18,
        position: 'relative',
        zIndex: 2,
    },
    greetingText: { flex: 1, minWidth: 0, paddingBottom: 8 },
    greeting:    { fontFamily: 'Lora_600SemiBold', fontSize: 29, lineHeight: 32, color: '#ffffff', letterSpacing: -0.1 },
    greetingSub: { fontSize: 14, color: FB.headerSub, marginTop: 9, lineHeight: 20 },

    mascotWrap:  { position: 'relative', width: 112, height: 112, flexShrink: 0 },
    mascotShadow: {
        position: 'absolute',
        bottom: 3,
        left: '50%' as any,
        marginLeft: -37,
        width: 74,
        height: 13,
        borderRadius: 999,
        backgroundColor: 'rgba(8,30,60,0.28)',
    },
    mascotImage: {
        width: 112,
        height: 112,
        backgroundColor: 'transparent',
    },

    // ── Content sheet ────────────────────────────────────────────────────────
    content: {
        backgroundColor: FB.content,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -14,
        paddingHorizontal: 22,
        paddingTop: 20,
        gap: 18,
    },

    // ── CTA card ─────────────────────────────────────────────────────────────
    ctaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 22,
        padding: 17,
        overflow: 'hidden',
        shadowColor: FB.primary,
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.85,
        shadowRadius: 18,
        elevation: 8,
    },
    ctaIconWrap: {
        width: 48, height: 48, borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
        justifyContent: 'center', alignItems: 'center',
    },
    ctaTitle: { fontFamily: 'Lora_400Regular', fontSize: 17, color: '#ffffff', lineHeight: 20 },
    ctaSub:   { fontSize: 12.5, color: FB.headerSub, marginTop: 4, lineHeight: 17 },

    recommendationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 22,
        padding: 17,
        backgroundColor: '#eaf1fa',
        borderWidth: 1,
        borderColor: '#ccdcf0',
        shadowColor: FB.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 2,
    },
    recIconWrap: {
        width: 48, height: 48, borderRadius: 15,
        backgroundColor: '#ffffff',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#d6e8f8',
    },
    recTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 16, color: FB.textDark, lineHeight: 20 },
    recSub:   { fontSize: 12.5, color: FB.textSub, marginTop: 4, lineHeight: 17 },

    // ── Activity grid ────────────────────────────────────────────────────────
    sectionTitle:  { fontFamily: 'Lora_400Regular', fontSize: 18, color: FB.textDark, marginBottom: 13 },
    activityGrid:  { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    activityTile:  { width: '30.8%', backgroundColor: FB.tileBg, borderWidth: 1, borderColor: FB.tileBorder, borderRadius: 20, padding: 15, paddingHorizontal: 13, gap: 14, minHeight: 128 },
    activityIconWrap: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    activityTitle: { fontSize: 13.5, fontWeight: '600', color: FB.textDark, lineHeight: 17 },
    activitySub:   { fontSize: 11.5, color: FB.textSub, marginTop: 4 },
});
