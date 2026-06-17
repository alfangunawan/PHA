import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { breathingAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Typography, Spacing } from '../../theme';

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

const ICON_COLORS = [
    { bg: '#eceff8', color: '#7d6fb5' },
    { bg: '#eef2fb', color: '#6477ad' },
    { bg: '#e9f1f8', color: '#5b82a8' },
    { bg: '#f3eef6', color: '#a87fae' },
];

const PHASE_TOKENS = {
    inhale: { bg: '#eef2fb', text: '#6477ad' },
    hold: { bg: '#efecfa', text: '#7d6fb5' },
    exhale: { bg: '#e9f1f8', text: '#5b82a8' },
    hold2: { bg: '#f2eef8', text: '#8a7bb0' },
};

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

interface PhaseChipProps {
    label: string;
    value: number;
    bg: string;
    textColor: string;
}

const PhaseChip = ({ label, value, bg, textColor }: PhaseChipProps) => (
    <View style={[styles.chip, { backgroundColor: bg }]}>
        <Text style={[styles.chipValue, { color: textColor }]}>{value}s</Text>
        <Text style={styles.chipLabel}>{label}</Text>
    </View>
);

export default function BreathingListScreen({ navigation }: any) {
    const { colors } = useTheme();
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
            <View style={styles.header}>
                <View style={styles.headerIconBox}>
                    <Text style={styles.headerIconEmoji}>🌬️</Text>
                </View>
                <View>
                    <Text style={[styles.title, { color: colors.charcoal }]}>
                        Latihan Pernapasan
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.darkGray }]}>
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
                        tintColor="#8a9ccc"
                    />
                }
                ListEmptyComponent={<EmptyState message="Belum ada teknik tersedia." />}
                renderItem={({ item, index }) => {
                    const iconStyle = ICON_COLORS[index % ICON_COLORS.length];
                    return (
                        <AnimatedView delay={index * 80}>
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.divider }]}
                                onPress={() => navigation.navigate('BreathingExercise', { technique: item })}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.iconBox, { backgroundColor: iconStyle.bg }]}>
                                    <Text style={styles.iconEmoji}>{resolveIcon(item.icon)}</Text>
                                </View>
                                <View style={styles.cardBody}>
                                    <View style={styles.cardTopRow}>
                                        <Text
                                            style={[styles.name, { color: colors.charcoal }]}
                                            numberOfLines={1}
                                        >
                                            {item.name}
                                        </Text>
                                        <View style={styles.cycleBadge}>
                                            <Text style={styles.cycleBadgeText}>{item.cycles}×</Text>
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
                                    <View style={styles.chips}>
                                        <PhaseChip
                                            label="Tarik"
                                            value={item.inhaleDuration}
                                            bg={PHASE_TOKENS.inhale.bg}
                                            textColor={PHASE_TOKENS.inhale.text}
                                        />
                                        {item.holdDuration > 0 && (
                                            <PhaseChip
                                                label="Tahan"
                                                value={item.holdDuration}
                                                bg={PHASE_TOKENS.hold.bg}
                                                textColor={PHASE_TOKENS.hold.text}
                                            />
                                        )}
                                        <PhaseChip
                                            label="Hembus"
                                            value={item.exhaleDuration}
                                            bg={PHASE_TOKENS.exhale.bg}
                                            textColor={PHASE_TOKENS.exhale.text}
                                        />
                                        {item.holdAfterExhale > 0 && (
                                            <PhaseChip
                                                label="Jeda"
                                                value={item.holdAfterExhale}
                                                bg={PHASE_TOKENS.hold2.bg}
                                                textColor={PHASE_TOKENS.hold2.text}
                                            />
                                        )}
                                    </View>
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
        backgroundColor: '#eef2fb',
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
    list: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.sm,
        gap: 14,
    },
    card: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 17,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    iconEmoji: { fontSize: 20 },
    cardBody: { flex: 1, minWidth: 0 },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 5,
    },
    name: {
        fontFamily: Typography.headingBold,
        fontSize: 16,
        flex: 1,
    },
    cycleBadge: {
        backgroundColor: '#eff1f7',
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 3,
        flexShrink: 0,
    },
    cycleBadgeText: {
        fontFamily: Typography.bodyMedium,
        fontSize: 11,
        fontWeight: '600',
        color: '#9197aa',
    },
    desc: {
        fontFamily: Typography.body,
        fontSize: 13,
        lineHeight: 13 * 1.5,
        marginBottom: 11,
    },
    chips: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 2,
    },
    chip: {
        flex: 1,
        alignItems: 'center',
        borderRadius: 12,
        paddingVertical: 6,
    },
    chipValue: {
        fontFamily: Typography.headingBold,
        fontSize: 13.5,
    },
    chipLabel: {
        fontFamily: Typography.body,
        fontSize: 10,
        color: '#9197aa',
        marginTop: 1,
    },
});
