import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { meditationAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Typography, Spacing, BorderRadius } from '../../theme';

interface CategoryConfig {
    key: string;
    label: string;
    emoji: string;
    color: string;
}

const CATEGORY_CONFIG: CategoryConfig[] = [
    { key: 'all', label: 'Semua', emoji: '✨', color: '#C9B8E8' },
    { key: 'sleep', label: 'Tidur', emoji: '🌙', color: '#A78BFA' },
    { key: 'focus', label: 'Fokus', emoji: '🎯', color: '#A8C5DA' },
    { key: 'anxiety', label: 'Cemas', emoji: '💚', color: '#B2C9AD' },
    { key: 'morning', label: 'Pagi', emoji: '🌅', color: '#F5CBA7' },
    { key: 'general', label: 'Umum', emoji: '🌿', color: '#B2C9AD' },
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

function SessionCard({ session, onPress, catColor, catEmoji }: {
    session: Session;
    onPress: () => void;
    catColor: string;
    catEmoji: string;
}) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.bgCard, borderTopColor: catColor }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.cardTop}>
                <View style={[styles.emojiBadge, { backgroundColor: catColor + '33' }]}>
                    <Text style={styles.emoji}>{catEmoji}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[styles.sessionTitle, { color: colors.charcoal, fontFamily: Typography.heading }]} numberOfLines={2}>
                        {session.title}
                    </Text>
                    <View style={[styles.catTag, { backgroundColor: catColor + '22' }]}>
                        <Text style={[styles.catTagText, { color: catColor, fontFamily: Typography.bodyMedium }]}>
                            {session.category}
                        </Text>
                    </View>
                </View>
            </View>

            {session.description ? (
                <Text style={[styles.desc, { color: colors.mediumGray, fontFamily: Typography.body }]} numberOfLines={2}>
                    {session.description}
                </Text>
            ) : null}

            <View style={styles.durationRow}>
                {(session.durationOptions || [5]).map(d => (
                    <View key={d} style={[styles.durationChip, { backgroundColor: colors.lightGray }]}>
                        <Text style={[styles.durationText, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>
                            {d} mnt
                        </Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
}

export default function MeditationListScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeKey, setActiveKey] = useState('all');

    useEffect(() => {
        const cat = activeKey === 'all' ? undefined : activeKey;
        setLoading(true);
        setError('');
        meditationAPI.getSessions(cat)
            .then(res => setSessions(res.sessions || []))
            .catch(() => setError('Gagal memuat sesi meditasi.'))
            .finally(() => setLoading(false));
    }, [activeKey]);

    const activeCfg = CATEGORY_CONFIG.find(c => c.key === activeKey) || CATEGORY_CONFIG[0];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    Meditasi
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
                    {CATEGORY_CONFIG.map(cat => {
                        const isActive = cat.key === activeKey;
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                onPress={() => setActiveKey(cat.key)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: isActive ? colors.lavender : colors.bgCard,
                                        borderColor: isActive ? colors.lavenderDark : colors.lightGray,
                                    },
                                ]}
                            >
                                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                                <Text style={[
                                    styles.chipText,
                                    { color: isActive ? colors.lavenderDark : colors.darkGray, fontFamily: Typography.bodyMedium }
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading
                ? <LoadingState />
                : error
                ? <ErrorState message={error} />
                : sessions.length === 0
                ? <EmptyState message="Tidak ada sesi untuk kategori ini." />
                : (
                    <FlatList
                        data={sessions}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item, index }) => {
                            const cfg = CATEGORY_CONFIG.find(c => c.key === item.category) || {
                                color: item.colorTheme || colors.lavender,
                                emoji: '🧘',
                            };
                            return (
                                <AnimatedView delay={index * 70}>
                                    <SessionCard
                                        session={item}
                                        catColor={cfg.color}
                                        catEmoji={cfg.emoji || '🧘'}
                                        onPress={() => navigation.navigate('MeditationPlayer', { session: item })}
                                    />
                                </AnimatedView>
                            );
                        }}
                    />
                )
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 0 },
    title: { fontSize: Typography.sizes['2xl'], marginBottom: Spacing.md },
    filtersContent: { paddingBottom: Spacing.md, gap: Spacing.xs },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        marginRight: Spacing.xs,
        gap: 4,
    },
    chipEmoji: { fontSize: 14 },
    chipText: { fontSize: Typography.sizes.sm },
    list: { padding: Spacing.md, gap: Spacing.sm },
    card: {
        borderRadius: BorderRadius.lg,
        borderTopWidth: 3,
        padding: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs },
    emojiBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    emoji: { fontSize: 22 },
    cardInfo: { flex: 1, gap: 4 },
    sessionTitle: { fontSize: Typography.sizes.md, lineHeight: 22 },
    catTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    catTagText: { fontSize: Typography.sizes.xs },
    desc: { fontSize: Typography.sizes.sm, lineHeight: 20, marginBottom: Spacing.sm },
    durationRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
    durationChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
    },
    durationText: { fontSize: Typography.sizes.xs },
});
