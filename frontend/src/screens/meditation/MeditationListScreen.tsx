import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { meditationAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Typography, Spacing } from '../../theme';

interface CategoryConfig {
    key: string;
    label: string;
    emoji: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeColor: string;
}

const CATEGORY_CONFIG: CategoryConfig[] = [
    { key: 'all',     label: 'Semua', emoji: '✨', iconBg: '#eaeef8', iconColor: '#7e8cc4', badgeBg: '#eaeef8', badgeColor: '#7e8cc4' },
    { key: 'sleep',   label: 'Tidur', emoji: '🌙', iconBg: '#eef2fb', iconColor: '#6477ad', badgeBg: '#eef2fb', badgeColor: '#5868a3' },
    { key: 'focus',   label: 'Fokus', emoji: '🎯', iconBg: '#f3eef6', iconColor: '#a87fae', badgeBg: '#f3eef6', badgeColor: '#8f689a' },
    { key: 'morning', label: 'Pagi',  emoji: '🌅', iconBg: '#f6efe2', iconColor: '#c2965c', badgeBg: '#f6efe2', badgeColor: '#b58642' },
    { key: 'general', label: 'Umum',  emoji: '🌿', iconBg: '#eaf2ec', iconColor: '#6f9e80', badgeBg: '#eaf2ec', badgeColor: '#558168' },
    { key: 'anxiety', label: 'Cemas', emoji: '💚', iconBg: '#eaf2ec', iconColor: '#6f9e80', badgeBg: '#eaf2ec', badgeColor: '#558168' },
];

const DEFAULT_CAT = CATEGORY_CONFIG[0];

interface Session {
    id: string;
    title: string;
    description?: string;
    category: string;
    colorTheme: string;
    durationOptions: number[];
    audioUrl?: string;
}

export default function MeditationListScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [activeKey, setActiveKey] = useState('all');

    const fetchSessions = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError('');
        const cat = activeKey === 'all' ? undefined : activeKey;
        try {
            const res = await meditationAPI.getSessions(cat);
            setSessions(res.sessions || []);
        } catch {
            setError('Gagal memuat sesi meditasi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchSessions(); }, [activeKey]);

    const onRefresh = () => { setRefreshing(true); fetchSessions(true); };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <View style={styles.headerIconBox}>
                    <Text style={styles.headerIconEmoji}>🧘</Text>
                </View>
                <View>
                    <Text style={[styles.title, { color: colors.charcoal }]}>Meditasi</Text>
                    <Text style={[styles.subtitle, { color: colors.darkGray }]}>
                        Temukan ketenangan dalam dirimu
                    </Text>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContent}
            >
                {CATEGORY_CONFIG.map(cat => {
                    const isActive = cat.key === activeKey;
                    return (
                        <TouchableOpacity
                            key={cat.key}
                            onPress={() => setActiveKey(cat.key)}
                            style={[
                                styles.chip,
                                isActive ? styles.chipActive : styles.chipInactive,
                            ]}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                            <Text style={[styles.chipText, { color: isActive ? '#fff' : colors.darkGray }]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <FlatList
                data={sessions}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8a9ccc" />
                }
                ListEmptyComponent={<EmptyState message="Tidak ada sesi untuk kategori ini." />}
                renderItem={({ item, index }) => {
                    const cfg = CATEGORY_CONFIG.find(c => c.key === item.category) || DEFAULT_CAT;
                    const durations = item.durationOptions || [5];
                    return (
                        <AnimatedView delay={index * 70}>
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.divider }]}
                                onPress={() => navigation.navigate('MeditationPlayer', { session: item })}
                                activeOpacity={0.85}
                            >
                                <View style={styles.cardRow}>
                                    <View style={[styles.iconBox, { backgroundColor: cfg.iconBg }]}>
                                        <Text style={styles.iconEmoji}>{cfg.emoji}</Text>
                                    </View>
                                    <View style={styles.cardMeta}>
                                        <Text
                                            style={[styles.sessionTitle, { color: colors.charcoal }]}
                                            numberOfLines={1}
                                        >
                                            {item.title}
                                        </Text>
                                        <View style={[styles.catBadge, { backgroundColor: cfg.badgeBg }]}>
                                            <Text style={[styles.catBadgeText, { color: cfg.badgeColor }]}>
                                                {item.category}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {item.description ? (
                                    <Text
                                        style={[styles.desc, { color: colors.darkGray }]}
                                        numberOfLines={2}
                                    >
                                        {item.description}
                                    </Text>
                                ) : null}

                                <View style={styles.durationRow}>
                                    {durations.map((d, i) => (
                                        <View
                                            key={d}
                                            style={[
                                                styles.durationChip,
                                                { backgroundColor: i === 0 ? '#eef2fb' : '#f1f2f8' },
                                            ]}
                                        >
                                            <Text style={[
                                                styles.durationText,
                                                { color: i === 0 ? '#5f6b9e' : '#7c8398' },
                                            ]}>
                                                {d} mnt
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </TouchableOpacity>
                        </AnimatedView>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    headerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: '#eaeef8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIconEmoji: { fontSize: 22 },
    title: {
        fontFamily: Typography.heading,
        fontSize: 22,
        letterSpacing: -0.2,
    },
    subtitle: {
        fontFamily: Typography.body,
        fontSize: Typography.sizes.sm,
        marginTop: 3,
    },
    filtersContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
        gap: 9,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 14,
        borderWidth: 1,
    },
    chipActive: {
        backgroundColor: '#8a9ccc',
        borderColor: '#8a9ccc',
        shadowColor: '#8a9ccc',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 4,
    },
    chipInactive: {
        backgroundColor: '#ffffff',
        borderColor: '#e7e9f2',
        elevation: 0,
    },
    chipEmoji: { fontSize: 13 },
    chipText: {
        fontFamily: Typography.bodyMedium,
        fontSize: 13,
    },
    list: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.xs,
        gap: 14,
    },
    card: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 17,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 9,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    iconEmoji: { fontSize: 21 },
    cardMeta: { flex: 1, gap: 6 },
    sessionTitle: {
        fontFamily: Typography.headingBold,
        fontSize: 16,
    },
    catBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    catBadgeText: {
        fontFamily: Typography.bodyMedium,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    desc: {
        fontFamily: Typography.body,
        fontSize: 13,
        lineHeight: 13 * 1.5,
        marginBottom: 11,
    },
    durationRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    durationChip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 11,
    },
    durationText: {
        fontFamily: Typography.bodyMedium,
        fontSize: 12,
        fontWeight: '600',
    },
});
