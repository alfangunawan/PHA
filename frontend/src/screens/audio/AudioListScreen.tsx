import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { audioAPI } from '../../api';

// ── Tema selaras dengan M (Fun Blue) ─────────────────────────────────────────
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

const CATEGORIES = [
    { key: 'all',     label: 'Semua'  },
    { key: 'general', label: 'Umum'   },
    { key: 'sleep',   label: 'Tidur'  },
    { key: 'focus',   label: 'Fokus'  },
    { key: 'anxiety', label: 'Cemas'  },
    { key: 'nature',  label: 'Alam'   },
];

// ── Ikon headset (garis) ──────────────────────────────────────────────────────
function HeadsetIcon({ size = 22, color = T.primary }: { size?: number; color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M3 18v-6a9 9 0 0 1 18 0v6" {...sp} />
            <Path d="M21 19a2 2 0 0 1-2 2h-1v-5h3v3z" {...sp} />
            <Path d="M3 19a2 2 0 0 0 2 2h1v-5H3v3z" {...sp} />
        </Svg>
    );
}

// ── Ikon waktu ────────────────────────────────────────────────────────────────
function ClockIcon({ size = 12, color = T.textMuted }: { size?: number; color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="9" {...sp} />
            <Path d="M12 7v5l3 3" {...sp} />
        </Svg>
    );
}

// ── Ikon filter per kategori ──────────────────────────────────────────────────
function CatFilterIcon({ cat, size = 14, color = T.textMuted }: { cat: string; size?: number; color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    if (cat === 'all') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="3.2" {...sp} />
            <Path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" {...sp} />
        </Svg>
    );
    if (cat === 'sleep') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" {...sp} />
        </Svg>
    );
    if (cat === 'focus') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="8.2" {...sp} />
            <Circle cx="12" cy="12" r="3.1" {...sp} />
        </Svg>
    );
    if (cat === 'nature') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 22V10M11 20C6 20 4 16 4 11c5 0 7 2 7 6" {...sp} />
            <Path d="M13 16c5 0 7-4 7-9-5 0-7 2-7 6" {...sp} />
        </Svg>
    );
    // general & anxiety
    return <HeadsetIcon size={size} color={color} />;
}

interface AudioItem {
    id: string;
    title: string;
    description?: string;
    category: string;
    duration?: number;
    fileUrl: string;
}

function formatDuration(sec?: number) {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m} mnt${s > 0 ? ` ${s}d` : ''}` : `${s} dtk`;
}

// Warna icon tergantung kategori — selaras palette tema
function getCatColor(cat: string): { iconBg: string; iconColor: string; badgeBg: string; badgeColor: string } {
    const map: Record<string, ReturnType<typeof getCatColor>> = {
        sleep:   { iconBg: '#eef2fb', iconColor: '#8aa0c0', badgeBg: '#eef2fb', badgeColor: '#8aa0c0' },
        focus:   { iconBg: '#f3eef6', iconColor: '#8aa0c0', badgeBg: '#f3eef6', badgeColor: '#8aa0c0' },
        anxiety: { iconBg: '#eaf2ec', iconColor: '#8aa0c0', badgeBg: '#eaf2ec', badgeColor: '#8aa0c0' },
        nature:  { iconBg: '#eaf2ec', iconColor: '#7aaa74', badgeBg: '#eaf2ec', badgeColor: '#7aaa74' },
        general: { iconBg: '#e9f1fa', iconColor: T.primary,  badgeBg: '#e9f1fa', badgeColor: T.primary },
    };
    return map[cat?.toLowerCase()] ?? map.general;
}

function AudioCard({ item, onPress }: { item: AudioItem; onPress: () => void }) {
    const dur = formatDuration(item.duration);
    const c = getCatColor(item.category);
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.cardRow}>
                <View style={[styles.cardIcon, { backgroundColor: c.iconBg }]}>
                    <HeadsetIcon size={23} color={c.iconColor} />
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                    <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
                        <Text style={[styles.badgeText, { color: c.badgeColor }]}>
                            {item.category || 'general'}
                        </Text>
                    </View>

                    {item.description ? (
                        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}

                    {dur && (
                        <View style={styles.durRow}>
                            <View style={styles.durChip}>
                                <ClockIcon />
                                <Text style={styles.durText}>{dur}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Play caret */}
                <View style={styles.playBtn}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill={T.primary}>
                        <Path d="M5 4l15 8L5 20V4z" fill={T.primary} stroke="none" />
                    </Svg>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function AudioListScreen({ navigation }: any) {
    const [allAudios, setAllAudios] = useState<AudioItem[]>([]);
    const [filtered, setFiltered] = useState<AudioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [activeKey, setActiveKey] = useState('all');

    const fetchAll = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError('');
        try {
            const res = await audioAPI.getAvailableAudios();
            setAllAudios(res.audios || []);
        } catch {
            setError('Gagal memuat daftar audio. Periksa koneksi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        setFiltered(
            activeKey === 'all'
                ? allAudios
                : allAudios.filter(a => (a.category || '').toLowerCase() === activeKey)
        );
    }, [allAudios, activeKey]);

    const onRefresh = () => { setRefreshing(true); fetchAll(true); };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <HeadsetIcon size={25} color={T.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Audio Menenangkan</Text>
                    <Text style={styles.headerSub}>Rilekskan pikiran dengan suara</Text>
                </View>
            </View>

            {/* Filter chips */}
            <View style={styles.filterRow}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                    style={styles.filtersScroll}
                >
                    {CATEGORIES.map(cat => {
                        const isActive = cat.key === activeKey;
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                onPress={() => setActiveKey(cat.key)}
                                activeOpacity={0.85}
                                style={[styles.chip, isActive ? styles.chipActive : styles.chipIdle]}
                            >
                                <CatFilterIcon
                                    cat={cat.key}
                                    size={14}
                                    color={isActive ? '#fff' : T.textSub}
                                />
                                <Text style={[styles.chipText, { color: isActive ? '#fff' : T.textSub }]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : filtered.length === 0 ? (
                <EmptyState message="Belum ada audio untuk kategori ini." />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />
                    }
                    renderItem={({ item, index }) => (
                        <AnimatedView delay={index * 60}>
                            <AudioCard
                                item={item}
                                onPress={() => navigation.navigate('AudioPlayer', { audio: item })}
                            />
                        </AnimatedView>
                    )}
                />
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
    headerTitle: {
        fontFamily: 'Lora_600SemiBold', fontSize: 23, color: T.textDark, letterSpacing: -0.2,
    },
    headerSub: {
        fontFamily: 'Inter_400Regular', fontSize: 13.5, color: '#9197aa', marginTop: 3,
    },

    filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
    filtersScroll: { flexGrow: 0, flexShrink: 1 },
    filtersContent: { gap: 9, alignItems: 'center', paddingRight: 12 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        borderRadius: 14, paddingHorizontal: 15, height: 38,
    },
    chipActive: {
        backgroundColor: T.primary,
        shadowColor: T.primary, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45, shadowRadius: 12, elevation: 4,
    },
    chipIdle: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: T.chipBorder },
    chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

    list: { paddingHorizontal: 24, paddingBottom: 40, gap: 14 },

    card: {
        backgroundColor: T.card, borderRadius: 22, borderWidth: 1, borderColor: T.cardBorder,
        padding: 17,
        shadowColor: '#383f5c', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    },
    cardRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    cardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: T.textDark, lineHeight: 21 },
    badge: {
        alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 7,
    },
    badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    cardDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, color: T.textMuted, lineHeight: 19, marginTop: 9 },
    durRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    durChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: T.chipBg, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 5,
    },
    durText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: T.textSub },

    playBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: T.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        paddingLeft: 3,
    },
});
