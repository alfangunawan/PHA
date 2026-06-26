import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { breathingAPI, meditationAPI } from '../api';
import { Spacing } from '../theme';

// === Palet Fun Blue (#1A59A1) ===
const C = {
    funBlue:    '#1A59A1',
    funBlueDk:  '#14457D',
    bg:         '#ffffff',
    card:       '#ffffff',
    cardBorder: '#e3ebf6',
    divider:    '#eef3fa',
    textDark:   '#243a5c',
    textSub:    '#7689a6',
    textMuted:  '#9aa9c0',
    iconBg:     '#eaf1fa',
    emptyBg:    '#f5f8fc',
    emptyBorder:'#d4e0f0',
    tabInactive:'#dbe7f8',
};

type Tab = 'breathing' | 'meditation';

function formatDuration(seconds: number): string {
    if (!seconds) return '–';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} mnt${s > 0 ? ' ' + s + 'd' : ''}` : `${s} detik`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Ikon garis monokrom — paru-paru (pernapasan) & meditasi
const LungIcon = ({ size = 22, color = C.funBlue }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 4v8" />
        <Path d="M12 12c0 4-1.5 7-4 7-1.5 0-2-1-2-2.5 0-3 1-5.5 2.5-7C9.5 8.5 10 9 12 9" />
        <Path d="M12 12c0 4 1.5 7 4 7 1.5 0 2-1 2-2.5 0-3-1-5.5-2.5-7C14.5 8.5 14 9 12 9" />
    </Svg>
);
const MeditateIcon = ({ size = 22, color = C.funBlue }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={12} cy={5.5} r={2.3} />
        <Path d="M12 8.5c-3 0-5 2-5.5 5" />
        <Path d="M12 8.5c3 0 5 2 5.5 5" />
        <Path d="M5 17.5h14" />
    </Svg>
);

export default function ActivityHistoryScreen({ navigation }: any) {
    const [tab, setTab] = useState<Tab>('breathing');
    const [breathLogs, setBreathLogs] = useState<any[]>([]);
    const [meditationLogs, setMeditationLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const [bRes, mRes] = await Promise.all([
                    breathingAPI.getLogs(),
                    meditationAPI.getLogs(),
                ]);
                setBreathLogs(bRes.logs || []);
                setMeditationLogs(mRes.logs || []);
            } catch { }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const isBreathing = tab === 'breathing';

    const breathStats = {
        total: breathLogs.length,
        totalTime: breathLogs.reduce((s: number, l: any) => s + (l.duration || 0), 0),
        cycles: breathLogs.reduce((s: number, l: any) => s + (l.cyclesCompleted || 0), 0),
    };
    const meditStats = {
        total: meditationLogs.length,
        totalTime: meditationLogs.reduce((s: number, l: any) => s + (l.duration || 0), 0),
        completed: meditationLogs.filter((l: any) => l.completed).length,
    };

    const stats = isBreathing
        ? [
            { value: String(breathStats.total), label: 'Sesi' },
            { value: String(breathStats.cycles), label: 'Siklus' },
            { value: formatDuration(breathStats.totalTime), label: 'Total Waktu' },
        ]
        : [
            { value: String(meditStats.total), label: 'Sesi' },
            { value: String(meditStats.completed), label: 'Selesai' },
            { value: formatDuration(meditStats.totalTime), label: 'Total Waktu' },
        ];

    const data = isBreathing ? breathLogs : meditationLogs;

    // Pemetaan log → tampilan kartu seragam
    const items = data.map((it: any) => {
        if (isBreathing) {
            return {
                key: it.id,
                title: it.technique?.name || 'Latihan Napas',
                duration: `${it.cyclesCompleted || 0} siklus · ${formatDuration(it.duration)}`,
                date: formatDate(it.completedAt),
                done: true,
            };
        }
        return {
            key: it.id,
            title: it.session?.title || 'Sesi Meditasi',
            duration: it.completed ? formatDuration(it.duration) : 'Belum selesai',
            date: formatDate(it.completedAt),
            done: !!it.completed,
        };
    });

    const tabPills: { key: Tab; label: string }[] = [
        { key: 'breathing', label: 'Pernapasan' },
        { key: 'meditation', label: 'Meditasi' },
    ];

    const renderItem = ({ item }: any) => (
        <View style={styles.logCard}>
            <View style={styles.logIcon}>
                {isBreathing ? <LungIcon /> : <MeditateIcon />}
            </View>
            <View style={styles.logBody}>
                <Text style={styles.logTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.logRow}>
                    <Text style={[styles.logDur, !item.done && styles.logDurMuted]}>{item.duration}</Text>
                    <Text style={styles.logDate}>{item.date}</Text>
                </View>
            </View>
            {item.done && (
                <View style={styles.doneCircle}>
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.funBlue}
                        strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M5 12l5 5 9-10" />
                    </Svg>
                </View>
            )}
        </View>
    );

    const ListHeader = (
        <View style={styles.sheetTop}>
            {/* Kartu ringkasan statistik */}
            <View style={styles.statsCard}>
                {stats.map((s, i) => (
                    <View
                        key={s.label}
                        style={[styles.statItem, i < stats.length - 1 && styles.statDivider]}
                    >
                        <Text style={styles.statNum}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Label seksi */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>
                    {isBreathing ? 'Sesi Pernapasan' : 'Sesi Meditasi'}
                </Text>
                {items.length > 0 && (
                    <Text style={styles.sectionCount}>{items.length} sesi</Text>
                )}
            </View>
        </View>
    );

    const ListEmpty = (
        <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
                {isBreathing ? <LungIcon size={32} /> : <MeditateIcon size={32} />}
            </View>
            <Text style={styles.emptyTitle}>
                {isBreathing ? 'Belum ada riwayat pernapasan' : 'Belum ada riwayat meditasi'}
            </Text>
            <Text style={styles.emptyDesc}>
                {isBreathing
                    ? 'Mulai latihan pernapasan pertamamu untuk melihat progresnya di sini.'
                    : 'Mulai sesi meditasi pertamamu untuk melihat progresnya di sini.'}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header full-bleed Fun Blue */}
            <LinearGradient
                colors={[C.funBlue, C.funBlueDk]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerWaves} pointerEvents="none">
                    <Svg width={170} height={120} viewBox="0 0 160 120" fill="none"
                        strokeWidth={2} strokeLinecap="round">
                        <Path d="M8 44 q24 -22 48 0 t48 0 t48 0" stroke="#7ba0d6" />
                        <Path d="M8 60 q24 -20 48 0 t48 0 t48 0" stroke="#5d86c6" />
                        <Path d="M8 76 q24 -18 48 0 t48 0 t48 0" stroke="#4f7bc0" />
                    </Svg>
                </View>

                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff"
                            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M15 6l-6 6 6 6" />
                        </Svg>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerEyebrow}>Progresmu</Text>
                        <Text style={styles.headerTitle}>Riwayat Latihan</Text>
                    </View>
                </View>

                {/* Segmented tab switcher */}
                <View style={styles.tabBar}>
                    {tabPills.map(t => {
                        const active = tab === t.key;
                        return (
                            <TouchableOpacity
                                key={t.key}
                                onPress={() => setTab(t.key)}
                                activeOpacity={0.85}
                                style={[styles.tabPill, active && styles.tabPillActive]}
                            >
                                {t.key === 'breathing'
                                    ? <LungIcon size={17} color={active ? C.funBlue : C.tabInactive} />
                                    : <MeditateIcon size={17} color={active ? C.funBlue : C.tabInactive} />}
                                <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.sheet}>
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={C.funBlue} />
                    </View>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.key}
                    style={styles.sheet}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={ListEmpty}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.funBlue },

    // Header
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 16,
        paddingBottom: 34,
        overflow: 'hidden',
    },
    headerWaves: { position: 'absolute', right: -6, top: 14, opacity: 0.36 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    backBtn: {
        width: 42, height: 42, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerEyebrow: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: '#bcd2ee', letterSpacing: 0.2 },
    headerTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 25,
        color: '#ffffff',
        letterSpacing: -0.2,
        marginTop: 3,
    },

    // Segmented switcher
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 5,
        marginTop: 20,
    },
    tabPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingVertical: 11,
        borderRadius: 12,
    },
    tabPillActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 9,
        elevation: 3,
    },
    tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5 },
    tabTextActive: { color: C.funBlue },
    tabTextInactive: { color: C.tabInactive },

    // White sheet overlapping header
    sheet: {
        flex: 1,
        backgroundColor: C.bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -14,
    },
    list: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: Spacing.xl },
    sheetTop: { gap: 16, marginBottom: 16 },

    // Stats summary card
    statsCard: {
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: C.card,
        borderWidth: 1, borderColor: C.cardBorder,
        borderRadius: 22,
        paddingVertical: 18, paddingHorizontal: 8,
        shadowColor: C.funBlue,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.10,
        shadowRadius: 18,
        elevation: 2,
    },
    statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statDivider: { borderRightWidth: 1, borderRightColor: C.divider },
    statNum: { fontFamily: 'Lora_600SemiBold', fontSize: 24, color: C.funBlue },
    statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11.5, color: C.textSub, marginTop: 6 },

    // Section label
    sectionRow: {
        flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    sectionTitle: { fontFamily: 'Lora_500Medium', fontSize: 17, color: C.textDark },
    sectionCount: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSub },

    // History card
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: C.card,
        borderWidth: 1, borderColor: C.cardBorder,
        borderRadius: 20,
        paddingVertical: 13, paddingHorizontal: 15,
        marginBottom: 11,
        shadowColor: C.funBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 1,
    },
    logIcon: {
        width: 46, height: 46, borderRadius: 14,
        backgroundColor: C.iconBg,
        alignItems: 'center', justifyContent: 'center',
    },
    logBody: { flex: 1, minWidth: 0 },
    logTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14.5, color: C.textDark },
    logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
    logDur: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.funBlue },
    logDurMuted: { color: C.textMuted, fontFamily: 'Inter_500Medium' },
    logDate: { fontFamily: 'Inter_400Regular', fontSize: 11.5, color: C.textMuted },
    doneCircle: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: C.iconBg,
        alignItems: 'center', justifyContent: 'center',
    },

    // Empty state
    emptyCard: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 46, paddingHorizontal: 24,
        backgroundColor: C.emptyBg,
        borderWidth: 1, borderColor: C.emptyBorder, borderStyle: 'dashed',
        borderRadius: 22,
        marginTop: 4,
    },
    emptyIcon: {
        width: 66, height: 66, borderRadius: 20,
        backgroundColor: C.iconBg,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.textDark, marginTop: 16 },
    emptyDesc: {
        fontFamily: 'Inter_400Regular', fontSize: 12.5, color: C.textSub,
        marginTop: 6, lineHeight: 18, textAlign: 'center', maxWidth: 220,
    },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
});
