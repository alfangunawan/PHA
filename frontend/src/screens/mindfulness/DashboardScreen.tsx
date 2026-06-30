import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LoadingState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { mindfulnessAPI } from '../../api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Tema selaras Fun Blue ─────────────────────────────────────────────────────
const T = {
    primary:      '#1A59A1',
    primaryDeep:  '#14457D',
    primaryLight: '#e9f1fa',
    screenBg:     '#fcfcfe',
    card:         '#ffffff',
    cardBorder:   '#ecedf6',
    textDark:     '#353b4a',
    textSub:      '#6a7185',
    textMuted:    '#949bae',
    chipBg:       '#f1f2f8',
    chipBorder:   '#e7e9f2',
};

// Tema per tipe log — selaras palet theme.ts categories
const TYPE_THEME: Record<string, { iconBg: string; iconColor: string; label: string }> = {
    breathing:  { iconBg: '#e9f1fa', iconColor: T.primary,  label: 'Pernapasan' },
    meditation: { iconBg: '#f3eef6', iconColor: '#8a6db8',  label: 'Meditasi'   },
    audio:      { iconBg: '#eef2fb', iconColor: '#5a7ec0',  label: 'Audio'       },
    education:  { iconBg: '#eaf2ec', iconColor: '#5a9460',  label: 'Edukasi'     },
};

// ── Ikon SVG garis ─────────────────────────────────────────────────────────────
function BarChartIcon({ size = 25, color = T.primary }: { size?: number; color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 20h16M4 20V14M8 20V8M12 20V11M16 20V5M20 20V9" {...sp} />
        </Svg>
    );
}

function TypeIcon({ type, size = 18, color = T.primary }: { type: string; size?: number; color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    if (type === 'breathing') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M2 8h11a3 3 0 1 0-3-3" {...sp} />
            <Path d="M2 12h15a3 3 0 1 1-3 3" {...sp} />
            <Path d="M2 16h9" {...sp} />
        </Svg>
    );
    if (type === 'meditation') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="5.5" r="2.3" {...sp} />
            <Path d="M12 8.5c-3 0-5 2-5.5 5" {...sp} />
            <Path d="M12 8.5c3 0 5 2 5.5 5" {...sp} />
            <Path d="M5 17.5h14" {...sp} />
        </Svg>
    );
    if (type === 'audio') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M3 18v-6a9 9 0 0 1 18 0v6" {...sp} />
            <Path d="M21 19a2 2 0 0 1-2 2h-1v-5h3v3z" {...sp} />
            <Path d="M3 19a2 2 0 0 0 2 2h1v-5H3v3z" {...sp} />
        </Svg>
    );
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 6.5V19" {...sp} />
            <Path d="M12 6.5C10.5 5.2 8.2 4.5 5 4.5C4.4 4.5 4 5 4 5.6V16.5C4 17 4.4 17.3 5 17.3C8.2 17.3 10.5 18 12 19" {...sp} />
            <Path d="M12 6.5C13.5 5.2 15.8 4.5 19 4.5C19.6 4.5 20 5 20 5.6V16.5C20 17 19.6 17.3 19 17.3C15.8 17.3 13.5 18 12 19" {...sp} />
        </Svg>
    );
}

function CheckIcon({ color = '#5a9460' }: { color?: string }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.7} />
            <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function formatDuration(sec: number) {
    if (sec === 0) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h} jam ${m > 0 ? m + ' mnt' : ''}`.trim();
    if (m > 0) return `${m} mnt${s > 0 ? ` ${s} dtk` : ''}`;
    return `${s} dtk`;
}

function getEncouragementMessage(totalSessions: number) {
    if (totalSessions === 0) return "Setiap perjalanan panjang dimulai dari satu tarikan napas. Ayo mulai langkah pertamamu hari ini! 🌱";
    if (totalSessions <= 3) return "Pemanasan yang bagus! Sel-sel di otakmu sedang berterima kasih padamu saat ini. 🧠✨";
    if (totalSessions <= 9) return "Wah, konsistensimu juara! Kamu tuh ibarat pizza, selalu bikin suasana jadi lebih baik! 🍕😎";
    return "Suhu! Tingkat ketenanganmu sudah setara dengan kapibara yang sedang berendam air panas. 🧘‍♂️♨️";
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value }: { icon: (p: any) => JSX.Element; label: string; value: string }) {
    return (
        <View style={styles.statCard}>
            <View style={styles.statIconWrap}><Icon size={20} color={T.primary} /></View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

// ── Bar chart (View-based, tanpa library) ─────────────────────────────────────
function WeeklyBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const chartW = SCREEN_W - 48 - 36;
    const barW = Math.floor((chartW - (data.length - 1) * 8) / data.length);

    return (
        <View style={styles.chartBars}>
            {data.map((d) => {
                const ratio = d.count / maxCount;
                const barH = Math.max(ratio * 96, d.count > 0 ? 8 : 3);
                return (
                    <View key={d.date} style={[styles.barWrap, { width: barW }]}>
                        <Text style={styles.barCount}>{d.count > 0 ? String(d.count) : ''}</Text>
                        <View style={styles.barBg}>
                            <View style={[styles.barFill, {
                                height: barH,
                                backgroundColor: d.count > 0 ? T.primary : T.chipBorder,
                            }]} />
                        </View>
                        <Text style={styles.barLabel}>
                            {new Date(d.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'narrow' })}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

// ── Riwayat item ──────────────────────────────────────────────────────────────
function HistoryItem({ item }: { item: any }) {
    const meta = TYPE_THEME[item.type] ?? TYPE_THEME.breathing;
    const time = new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return (
        <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: meta.iconBg }]}>
                <TypeIcon type={item.type} size={16} color={meta.iconColor} />
            </View>
            <View style={styles.historyBody}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.historyMeta}>
                    {meta.label}
                    {item.duration > 0 ? ` · ${formatDuration(item.duration)}` : ''}
                    {' · '}{time}
                </Text>
            </View>
            {item.completed && <CheckIcon />}
        </View>
    );
}

function groupByDate(history: any[]) {
    const groups: Record<string, any[]> = {};
    history.forEach(item => {
        const day = new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!groups[day]) groups[day] = [];
        groups[day].push(item);
    });
    return Object.entries(groups);
}

// ── Ikon stats ────────────────────────────────────────────────────────────────
function LayersIcon({ size = 20, color = T.primary }: any) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M2 10l10 5 10-5M2 14l10 5 10-5M12 5l10 5-10 5L2 10l10-5z" {...sp} /></Svg>;
}

function ClockIcon({ size = 20, color = T.primary }: any) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="9" {...sp} /><Path d="M12 7v5l3 3" {...sp} /></Svg>;
}

function TrendIcon({ size = 20, color = T.primary }: any) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M3 17l5-5 4 4 9-10" {...sp} /><Path d="M14 6h6v6" {...sp} /></Svg>;
}

export default function DashboardScreen() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError('');
        try {
            const res = await mindfulnessAPI.getDashboard();
            setData(res);
        } catch {
            setError('Gagal memuat dashboard. Periksa koneksi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(true); };

    const groupedHistory = data?.recentHistory ? groupByDate(data.recentHistory) : [];

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <BarChartIcon size={25} color={T.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Progress Mindfulness</Text>
                    <Text style={styles.headerSub}>Riwayat aktivitas latihanmu</Text>
                </View>
            </View>

            {/* Encouragement Banner */}
            {!loading && !error && data && (
                <View style={styles.encouragementBanner}>
                    <Text style={styles.encouragementText}>{getEncouragementMessage(data.totalSessions)}</Text>
                </View>
            )}

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : data?.empty ? (
                <ScrollView
                    contentContainerStyle={styles.emptyContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
                >
                    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
                        <Path d="M4 20h16M4 20V14M8 20V8M12 20V11M16 20V5M20 20V9"
                            stroke={T.chipBorder} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.emptyTitle}>Belum Ada Aktivitas</Text>
                    <Text style={styles.emptyDesc}>
                        Mulai sesi pernapasan, meditasi, atau dengarkan audio untuk melacak progressmu.
                    </Text>
                </ScrollView>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
                >
                    {/* Statistik */}
                    <AnimatedView delay={0}>
                        <View style={styles.statsRow}>
                            <StatCard icon={LayersIcon} label="Total Sesi" value={String(data.totalSessions)} />
                            <StatCard icon={ClockIcon}  label="Total Durasi" value={formatDuration(data.totalDurationSec)} />
                            <StatCard icon={TrendIcon}  label="Rata-rata"    value={formatDuration(data.avgDurationSec)} />
                        </View>
                    </AnimatedView>

                    {/* Grafik mingguan */}
                    {data.weeklyChart?.length > 0 && (
                        <AnimatedView delay={80}>
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>Aktivitas 7 Hari Terakhir</Text>
                                <WeeklyBarChart data={data.weeklyChart} />
                            </View>
                        </AnimatedView>
                    )}

                    {/* Riwayat */}
                    {groupedHistory.length > 0 && (
                        <AnimatedView delay={150}>
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>Riwayat Latihan</Text>
                                {groupedHistory.map(([day, items]) => (
                                    <View key={day} style={styles.dayGroup}>
                                        <Text style={styles.dayLabel}>{day}</Text>
                                        {items.map((item: any, ii: number) => (
                                            <HistoryItem key={`${item.type}-${ii}`} item={item} />
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </AnimatedView>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: T.screenBg },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 24, paddingTop: 8, paddingBottom: 14,
    },
    headerIcon: {
        width: 48, height: 48, borderRadius: 15,
        backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 23, color: T.textDark, letterSpacing: -0.2 },
    headerSub: { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: '#9197aa', marginTop: 3 },

    encouragementBanner: {
        backgroundColor: '#f7faff',
        marginHorizontal: 24,
        marginBottom: 16,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#dbe7f6',
    },
    encouragementText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13.5,
        color: '#243a5c',
        lineHeight: 20,
        textAlign: 'center',
    },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 20, color: T.textDark, marginTop: 18, textAlign: 'center' },
    emptyDesc: { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: T.textMuted, textAlign: 'center', lineHeight: 21, marginTop: 10 },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    statCard: {
        flex: 1, backgroundColor: T.card, borderRadius: 20, borderWidth: 1, borderColor: T.cardBorder,
        padding: 14, alignItems: 'center',
        shadowColor: '#383f5c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    statIconWrap: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: T.primaryLight,
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    statValue: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: T.textDark },
    statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: T.textMuted, marginTop: 2, textAlign: 'center' },

    sectionCard: {
        backgroundColor: T.card, borderRadius: 22, borderWidth: 1, borderColor: T.cardBorder,
        padding: 18, marginBottom: 18,
        shadowColor: '#383f5c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: T.textDark, marginBottom: 16 },

    chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
    barWrap: { alignItems: 'center' },
    barCount: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: T.primary, marginBottom: 4, minHeight: 16 },
    barBg: { width: '100%', height: 96, justifyContent: 'flex-end', backgroundColor: T.chipBg, borderRadius: 8 },
    barFill: { width: '100%', borderRadius: 8 },
    barLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: T.textMuted, marginTop: 6 },

    dayGroup: { marginBottom: 14 },
    dayLabel: {
        fontFamily: 'Inter_600SemiBold', fontSize: 11.5, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
    },
    historyItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.chipBg,
    },
    historyIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    historyBody: { flex: 1, minWidth: 0 },
    historyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: T.textDark },
    historyMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: T.textMuted, marginTop: 2 },
});
