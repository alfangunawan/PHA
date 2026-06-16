import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { breathingAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Typography, Spacing, BorderRadius } from '../../theme';

const ICON_MAP: Record<string, string> = {
    moon: '🌙',
    square: '⬛',
    wind: '🌬️',
    heart: '❤️',
    star: '⭐',
    sun: '☀️',
    leaf: '🌿',
    wave: '🌊',
    fire: '🔥',
    cloud: '☁️',
};

const resolveIcon = (icon?: string) =>
    icon ? (ICON_MAP[icon.toLowerCase()] ?? icon) : '🌬️';

interface Technique {
    id: string;
    name: string;
    description?: string;
    inhaleDuration: number;
    holdDuration: number;
    exhaleDuration: number;
    holdAfterExhale: number;
    cycles: number;
    colorTheme: string;
    icon: string;
}

interface PhaseBadgeProps {
    label: string;
    value: number;
    color: string;
    textColor: string;
}

const PhaseBadge = ({ label, value, color, textColor }: PhaseBadgeProps) => (
    <View style={[styles.badge, { backgroundColor: color + '28' }]}>
        <Text style={[styles.badgeValue, { color }]}>{value}s</Text>
        <Text style={[styles.badgeLabel, { color: textColor }]}>{label}</Text>
    </View>
);

export default function BreathingListScreen({ navigation }: any) {
    const { colors, shadows } = useTheme();
    const [techniques, setTechniques] = useState<Technique[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchTechniques = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError('');
        try {
            const res = await breathingAPI.getTechniques();
            setTechniques(res.techniques || []);
        } catch {
            setError('Gagal memuat teknik pernapasan.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchTechniques(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTechniques(true);
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerEmoji}>🫁</Text>
                <View>
                    <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                        Latihan Pernapasan
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.darkGray, fontFamily: Typography.body }]}>
                        Pilih teknik yang kamu suka
                    </Text>
                </View>
            </View>

            <FlatList
                data={techniques}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.softBlue}
                    />
                }
                ListEmptyComponent={<EmptyState message="Belum ada teknik tersedia." />}
                renderItem={({ item, index }) => (
                    <AnimatedView delay={index * 80}>
                        <TouchableOpacity
                            style={[
                                styles.card,
                                { backgroundColor: colors.bgCard, borderTopColor: item.colorTheme || colors.softBlue },
                                shadows.md,
                            ]}
                            onPress={() => navigation.navigate('BreathingExercise', { technique: item })}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.iconBox, { backgroundColor: (item.colorTheme || colors.softBlue) + '22' }]}>
                                <Text style={styles.icon}>{resolveIcon(item.icon)}</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={[styles.name, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                                    {item.name}
                                </Text>
                                {item.description ? (
                                    <Text
                                        style={[styles.desc, { color: colors.darkGray, fontFamily: Typography.body }]}
                                        numberOfLines={2}
                                    >
                                        {item.description}
                                    </Text>
                                ) : null}
                                <View style={styles.badges}>
                                    <PhaseBadge label="Tarik" value={item.inhaleDuration} color={colors.softBlue} textColor={colors.darkGray} />
                                    {item.holdDuration > 0 && (
                                        <PhaseBadge label="Tahan" value={item.holdDuration} color={colors.lavender} textColor={colors.darkGray} />
                                    )}
                                    <PhaseBadge label="Hembus" value={item.exhaleDuration} color={colors.sageGreen} textColor={colors.darkGray} />
                                    {item.holdAfterExhale > 0 && (
                                        <PhaseBadge label="Jeda" value={item.holdAfterExhale} color={colors.peach} textColor={colors.darkGray} />
                                    )}
                                </View>
                            </View>
                            <Text style={[styles.cycles, { color: colors.mediumGray, fontFamily: Typography.headingBold }]}>
                                {item.cycles}x
                            </Text>
                        </TouchableOpacity>
                    </AnimatedView>
                )}
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
    headerEmoji: { fontSize: 44 },
    title: { fontSize: Typography.sizes.xl },
    subtitle: { fontSize: Typography.sizes.sm, marginTop: 2 },
    list: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.sm,
    },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderTopWidth: 3,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    icon: { fontSize: 22 },
    cardBody: { flex: 1 },
    name: { fontSize: Typography.sizes.md, marginBottom: 4 },
    desc: {
        fontSize: Typography.sizes.sm,
        lineHeight: Typography.sizes.sm * 1.6,
        marginBottom: Spacing.sm,
    },
    badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    badge: {
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    badgeValue: { fontFamily: 'Poppins_700Bold', fontSize: Typography.sizes.sm },
    badgeLabel: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizes.xs },
    cycles: { fontSize: Typography.sizes.sm, marginLeft: Spacing.sm },
});
