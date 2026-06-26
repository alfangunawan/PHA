import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { meditationAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { M, getCatTheme, CategoryIcon, MeditationGlyph, FilterIcon, type CatTheme } from './categories';

const FILTERS = [
    { key: 'all',     label: 'Semua' },
    { key: 'sleep',   label: 'Tidur' },
    { key: 'focus',   label: 'Fokus' },
    { key: 'morning', label: 'Pagi' },
    { key: 'general', label: 'Umum' },
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

function SessionCard({ session, onPress }: { session: Session; onPress: () => void }) {
    const cat: CatTheme = getCatTheme(session.category);
    const durations = session.durationOptions?.length ? session.durationOptions : [5];
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.cardRow}>
                <View style={[styles.cardIcon, { backgroundColor: cat.iconBg }]}>
                    <CategoryIcon kind={cat.icon} size={23} color={cat.iconColor} />
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{session.title}</Text>

                    <View style={[styles.badge, { backgroundColor: cat.badgeBg }]}>
                        <Text style={[styles.badgeText, { color: cat.badgeColor }]}>
                            {(session.category || 'general').toLowerCase()}
                        </Text>
                    </View>

                    {session.description ? (
                        <Text style={styles.cardDesc}>{session.description}</Text>
                    ) : null}

                    <View style={styles.durRow}>
                        {durations.map((d, i) => (
                            <View
                                key={d}
                                style={[styles.durChip, i === 0 ? styles.durChipPrimary : styles.durChipMuted]}
                            >
                                <Text style={[styles.durText, i === 0 ? styles.durTextPrimary : styles.durTextMuted]}>
                                    {d} mnt
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function MeditationListScreen({ navigation }: any) {
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
            const res = await meditationAPI.getSessions();
            setAllSessions(res.sessions || []);
        } catch {
            setError('Gagal memuat sesi meditasi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    useEffect(() => {
        if (activeKey === 'all') {
            setFiltered(allSessions);
        } else {
            setFiltered(allSessions.filter(s => s.category?.toLowerCase() === activeKey.toLowerCase()));
        }
    }, [allSessions, activeKey]);

    const onRefresh = () => { setRefreshing(true); fetchAll(true); };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <MeditationGlyph size={25} color={M.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Meditasi</Text>
                    <Text style={styles.headerSub}>Temukan ketenangan dalam dirimu</Text>
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
                    {FILTERS.map(f => {
                        const isActive = f.key === activeKey;
                        const cfg = getCatTheme(f.key);
                        const iconColor = isActive ? '#fff' : (f.key === 'all' ? M.primary : cfg.iconColor);
                        return (
                            <TouchableOpacity
                                key={f.key}
                                onPress={() => setActiveKey(f.key)}
                                activeOpacity={0.85}
                                style={[styles.chip, isActive ? styles.chipActive : styles.chipIdle]}
                            >
                                <FilterIcon keyName={f.key} size={15} color={iconColor} />
                                <Text style={[styles.chipText, { color: isActive ? '#fff' : M.textSub }]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <View style={styles.favBtn}>
                    <FilterIcon keyName="fav" size={19} color={M.favColor} />
                </View>
            </View>

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
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.primary} />
                    }
                    renderItem={({ item, index }) => (
                        <AnimatedView delay={index * 60}>
                            <SessionCard
                                session={item}
                                onPress={() => navigation.navigate('MeditationPlayer', { session: item })}
                            />
                        </AnimatedView>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: M.screenBg },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 14,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: M.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 23,
        color: M.textDark,
        letterSpacing: -0.2,
    },
    headerSub: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13.5,
        color: '#9197aa',
        marginTop: 3,
    },

    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    filtersScroll: { flexGrow: 0, flexShrink: 1 },
    filtersContent: { gap: 9, alignItems: 'center', paddingRight: 12 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 14,
        paddingHorizontal: 15,
        height: 38,
    },
    chipActive: {
        backgroundColor: M.primary,
        shadowColor: M.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 4,
    },
    chipIdle: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: M.chipBorder,
    },
    chipText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
    },
    favBtn: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: M.favBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 9,
    },

    list: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        gap: 14,
    },

    card: {
        backgroundColor: M.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: M.cardBorder,
        padding: 17,
        shadowColor: '#383f5c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    cardRow: { flexDirection: 'row', gap: 14 },
    cardIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: M.textDark,
        lineHeight: 21,
    },
    badge: {
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginTop: 7,
    },
    badgeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 11,
    },
    cardDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: M.textMuted,
        lineHeight: 19,
        marginTop: 9,
    },
    durRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 13,
    },
    durChip: {
        borderRadius: 11,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    durChipPrimary: { backgroundColor: M.primaryLight },
    durChipMuted: { backgroundColor: M.chipBg },
    durText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    durTextPrimary: { color: M.primary },
    durTextMuted: { color: '#7c8398', fontFamily: 'Inter_500Medium' },
});
