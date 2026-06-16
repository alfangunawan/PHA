import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { meditationAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Spacing, BorderRadius } from '../../theme';

// === Palet warna sesuai beranda ===
const P = '#8a9ccc';
const D = {
    bg:          '#fcfcfe',
    card:        '#ffffff',
    cardBorder:  '#ecedf6',
    gradStart:   '#eef2fb',
    gradEnd:     '#dce4f6',
    textDark:    '#353b4a',
    textSub:     '#717a96',
    textMuted:   '#949bae',
    blue:        '#8a9ccc',
    blueLight:   '#eef2fb',
    purple:      '#9387c8',
    purpleLight: '#f1eefa',
    green:       '#7bab97',
    greenLight:  '#edf5f1',
    peach:       '#c09475',
    peachLight:  '#fdf0e8',
    lavender:    '#b5a8d8',
    gold:        '#c9a96e',
    goldLight:   '#fdf7ee',
};

interface CategoryConfig {
    key: string;
    label: string;
    color: string;
    bg: string;
}

const CATEGORY_CONFIG: CategoryConfig[] = [
    { key: 'all',     label: 'Semua',     color: D.blue,    bg: D.blueLight },
    { key: 'sleep',   label: 'Tidur',     color: D.lavender, bg: D.purpleLight },
    { key: 'focus',   label: 'Fokus',     color: D.blue,    bg: D.blueLight },
    { key: 'anxiety', label: 'Cemas',     color: D.green,   bg: D.greenLight },
    { key: 'morning', label: 'Pagi',      color: D.gold,    bg: D.goldLight },
    { key: 'general', label: 'Umum',      color: D.green,   bg: D.greenLight },
];

interface Session {
    id: string;
    title: string;
    description?: string;
    category: string;
    colorTheme: string;
    durationOptions: number[];
    thumbnailUrl?: string;
    audioUrl?: string;
}

function SessionCard({ session, onPress, catCfg }: {
    session: Session;
    onPress: () => void;
    catCfg: CategoryConfig;
}) {
    const hasAudio = !!session.audioUrl;
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={[styles.accentTop, { backgroundColor: catCfg.color }]} />
            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <View style={[styles.colorDot, { backgroundColor: (session.colorTheme || catCfg.color) + '33', borderColor: session.colorTheme || catCfg.color }]}>
                        <View style={[styles.colorDotInner, { backgroundColor: session.colorTheme || catCfg.color }]} />
                    </View>
                    <View style={styles.cardMeta}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{session.title}</Text>
                        <View style={styles.badgeRow}>
                            <View style={[styles.catChip, { backgroundColor: catCfg.bg }]}>
                                <Text style={[styles.catChipText, { color: catCfg.color }]}>{catCfg.label}</Text>
                            </View>
                            {hasAudio && (
                                <View style={[styles.catChip, { backgroundColor: D.greenLight }]}>
                                    <Text style={[styles.catChipText, { color: D.green }]}>Audio</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {session.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{session.description}</Text>
                ) : null}

                <View style={styles.durRow}>
                    <Text style={styles.durLabel}>Durasi:</Text>
                    {(session.durationOptions || [5]).map(d => (
                        <View key={d} style={[styles.durChip, { backgroundColor: D.blueLight }]}>
                            <Text style={[styles.durText, { color: D.blue }]}>{d} mnt</Text>
                        </View>
                    ))}
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function MeditationListScreen({ navigation }: any) {
    // Semua data disimpan di sini — filter dilakukan client-side untuk menghindari bug re-fetch
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [filtered, setFiltered] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [activeKey, setActiveKey] = useState('all');

    const fetchAll = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError('');
        try {
            const res = await meditationAPI.getSessions(); // ambil semua tanpa filter
            setAllSessions(res.sessions || []);
        } catch {
            setError('Gagal memuat sesi meditasi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // Filter client-side setiap kali allSessions atau activeKey berubah
    useEffect(() => {
        if (activeKey === 'all') {
            setFiltered(allSessions);
        } else {
            setFiltered(allSessions.filter(s =>
                s.category?.toLowerCase() === activeKey.toLowerCase()
            ));
        }
    }, [allSessions, activeKey]);

    const onRefresh = () => { setRefreshing(true); fetchAll(true); };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <LinearGradient
                colors={[D.gradStart, D.gradEnd]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerCard}
            >
                <View>
                    <Text style={styles.headerTitle}>Meditasi</Text>
                    <Text style={styles.headerSub}>Temukan ketenangan hari ini</Text>
                </View>
            </LinearGradient>

            {/* Category filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContent}
                style={styles.filtersBar}
            >
                {CATEGORY_CONFIG.map((cat, index) => {
                    const isActive = cat.key === activeKey;
                    const isLast = index === CATEGORY_CONFIG.length - 1;
                    return (
                        <TouchableOpacity
                            key={cat.key}
                            onPress={() => setActiveKey(cat.key)}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: isActive ? cat.color : D.card,
                                    borderColor: isActive ? cat.color : D.cardBorder,
                                    marginRight: isLast ? 0 : Spacing.sm,
                                },
                            ]}
                        >
                            <Text style={[styles.chipText, { color: isActive ? '#fff' : D.textSub }]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : filtered.length === 0 ? (
                <EmptyState message="Tidak ada sesi untuk kategori ini." />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P} />
                    }
                    renderItem={({ item, index }) => {
                        const cfg = CATEGORY_CONFIG.find(c => c.key === item.category?.toLowerCase())
                            ?? CATEGORY_CONFIG[0];
                        return (
                            <AnimatedView delay={index * 60}>
                                <SessionCard
                                    session={item}
                                    catCfg={cfg}
                                    onPress={() => navigation.navigate('MeditationPlayer', { session: item })}
                                />
                            </AnimatedView>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: D.bg },

    headerCard: {
        borderRadius: 20,
        margin: Spacing.lg,
        marginBottom: Spacing.sm,
        padding: Spacing.lg,
        paddingVertical: 18,
    },
    headerTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 22,
        color: D.textDark,
        letterSpacing: -0.2,
    },
    headerSub: {
        fontSize: 13,
        color: D.textSub,
        marginTop: 3,
    },

    filtersBar: { flexGrow: 0, marginBottom: Spacing.xs },
    filtersContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 4,
        paddingBottom: Spacing.md,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
    },
    chipText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
    },

    list: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        gap: Spacing.sm,
    },

    card: {
        backgroundColor: D.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: D.cardBorder,
        overflow: 'hidden',
        shadowColor: P,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    accentTop: { height: 3 },
    cardBody: { padding: Spacing.md, gap: Spacing.sm },

    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    colorDot: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    colorDotInner: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    cardMeta: { flex: 1, gap: 5 },
    cardTitle: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: D.textDark,
        lineHeight: 21,
    },
    badgeRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
    catChip: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    catChipText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
    },
    cardDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: D.textSub,
        lineHeight: 17,
    },
    durRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    durLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: D.textMuted,
    },
    durChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    durText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
    },
});
