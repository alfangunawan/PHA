import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, SafeAreaView,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { breathingAPI, meditationAPI } from '../api';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../theme';

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

export default function ActivityHistoryScreen({ navigation }: any) {
    const { colors } = useTheme();
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

    const renderBreathItem = ({ item, index }: any) => (
        <View style={[styles.logCard, { backgroundColor: colors.bgCard }]}>
            <View style={[styles.logIcon, { backgroundColor: colors.softBlue + '22' }]}>
                <Text style={{ fontSize: 22 }}>🌬️</Text>
            </View>
            <View style={styles.logBody}>
                <Text style={[styles.logTitle, { color: colors.charcoal, fontFamily: Typography.bodyMedium }]}>
                    {item.technique?.name || 'Latihan Napas'}
                </Text>
                <Text style={[styles.logMeta, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                    {item.cyclesCompleted} siklus · {formatDuration(item.duration)}
                </Text>
                <Text style={[styles.logDate, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                    {formatDate(item.completedAt)}
                </Text>
            </View>
        </View>
    );

    const renderMeditItem = ({ item, index }: any) => (
        <View style={[styles.logCard, { backgroundColor: colors.bgCard }]}>
            <View style={[styles.logIcon, { backgroundColor: colors.lavender + '33' }]}>
                <Text style={{ fontSize: 22 }}>🧘</Text>
            </View>
            <View style={styles.logBody}>
                <Text style={[styles.logTitle, { color: colors.charcoal, fontFamily: Typography.bodyMedium }]}>
                    {item.session?.title || 'Sesi Meditasi'}
                </Text>
                <View style={styles.logRow}>
                    <Text style={[styles.logMeta, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                        {formatDuration(item.duration)}
                    </Text>
                    {item.completed && (
                        <View style={[styles.completedBadge, { backgroundColor: '#4CAF5022' }]}>
                            <Text style={[styles.completedText, { color: '#4CAF50', fontFamily: Typography.bodyMedium }]}>✓ Selesai</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.logDate, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                    {formatDate(item.completedAt)}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.charcoal} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    Riwayat Latihan
                </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
                {([
                    { key: 'breathing', label: '🫁 Pernapasan' },
                    { key: 'meditation', label: '🧘 Meditasi' },
                ] as { key: Tab; label: string }[]).map(t => (
                    <TouchableOpacity
                        key={t.key}
                        onPress={() => setTab(t.key)}
                        style={[
                            styles.tabBtn,
                            { backgroundColor: tab === t.key ? colors.softBlue : colors.lightGray },
                        ]}
                    >
                        <Text style={[styles.tabText, { color: tab === t.key ? '#fff' : colors.darkGray, fontFamily: Typography.bodyMedium }]}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.softBlue} />
                </View>
            ) : (
                <>
                    {/* Stats bar */}
                    <View style={[styles.statsBar, { backgroundColor: colors.bgCard }]}>
                        {tab === 'breathing' ? (
                            <>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: colors.softBlue, fontFamily: Typography.headingBold }]}>{breathStats.total}</Text>
                                    <Text style={[styles.statLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>Sesi</Text>
                                </View>
                                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: colors.softBlue, fontFamily: Typography.headingBold }]}>{breathStats.cycles}</Text>
                                    <Text style={[styles.statLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>Siklus</Text>
                                </View>
                                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: colors.softBlue, fontFamily: Typography.headingBold }]}>{formatDuration(breathStats.totalTime)}</Text>
                                    <Text style={[styles.statLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>Total Waktu</Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: colors.lavender, fontFamily: Typography.headingBold }]}>{meditStats.total}</Text>
                                    <Text style={[styles.statLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>Sesi</Text>
                                </View>
                                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: colors.lavender, fontFamily: Typography.headingBold }]}>{meditStats.completed}</Text>
                                    <Text style={[styles.statLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>Selesai</Text>
                                </View>
                                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: colors.lavender, fontFamily: Typography.headingBold }]}>{formatDuration(meditStats.totalTime)}</Text>
                                    <Text style={[styles.statLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>Total Waktu</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* List */}
                    {tab === 'breathing' ? (
                        <FlatList
                            data={breathLogs}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            renderItem={renderBreathItem}
                            ListEmptyComponent={
                                <View style={styles.center}>
                                    <Text style={[styles.emptyText, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                                        Belum ada riwayat pernapasan
                                    </Text>
                                </View>
                            }
                        />
                    ) : (
                        <FlatList
                            data={meditationLogs}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            renderItem={renderMeditItem}
                            ListEmptyComponent={
                                <View style={styles.center}>
                                    <Text style={[styles.emptyText, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                                        Belum ada riwayat meditasi
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
    backBtn: { padding: Spacing.xs },
    title: { fontSize: Typography.sizes.xl },
    tabRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
    tabBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
    tabText: { fontSize: Typography.sizes.sm },
    statsBar: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: Typography.sizes.xl },
    statLabel: { fontSize: Typography.sizes.xs, marginTop: 2 },
    divider: { width: 1, marginVertical: 4 },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 32, gap: Spacing.sm },
    logCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    logIcon: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    logBody: { flex: 1 },
    logTitle: { fontSize: Typography.sizes.base, marginBottom: 2 },
    logRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    logMeta: { fontSize: Typography.sizes.sm, marginBottom: 2 },
    logDate: { fontSize: Typography.sizes.xs },
    completedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
    completedText: { fontSize: Typography.sizes.xs },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    emptyText: { fontSize: Typography.sizes.base, textAlign: 'center' },
});
