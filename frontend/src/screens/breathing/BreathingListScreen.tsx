import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { breathingAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Typography, Spacing, BorderRadius } from '../../theme';

// === Palet warna sesuai beranda ===
const P = '#8a9ccc';
const D = {
    bg:        '#fcfcfe',
    card:      '#ffffff',
    cardBorder:'#ecedf6',
    gradStart: '#eef2fb',
    gradEnd:   '#dce4f6',
    textDark:  '#353b4a',
    textMid:   '#3b4150',
    textSub:   '#717a96',
    textMuted: '#949bae',
    blue:      '#8a9ccc',
    blueLight: '#eef2fb',
    purple:    '#9387c8',
    purpleLight:'#f1eefa',
    green:     '#7bab97',
    greenLight:'#edf5f1',
    peach:     '#c09475',
    peachLight:'#fdf0e8',
};

const ICON_MAP: Record<string, string> = {
    moon:  '🌙', square: '⬛', wind:  '🌬️', heart: '❤️',
    star:  '⭐', sun:    '☀️', leaf:  '🌿', wave:  '🌊',
    fire:  '🔥', cloud:  '☁️',
};

const resolveIcon = (icon?: string) =>
    icon ? (ICON_MAP[icon.toLowerCase()] ?? '🌬️') : '🌬️';

// Warna fase yang harmonis dengan palet beranda
const PHASE_COLORS = {
    inhale: { bg: D.blueLight,   text: D.blue,   label: 'Tarik' },
    hold:   { bg: D.purpleLight, text: D.purple, label: 'Tahan' },
    exhale: { bg: D.greenLight,  text: D.green,  label: 'Hembus' },
    hold2:  { bg: D.peachLight,  text: D.peach,  label: 'Jeda' },
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

export default function BreathingListScreen({ navigation }: any) {
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
    const onRefresh = () => { setRefreshing(true); fetchTechniques(true); };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header gradient seperti beranda */}
            <LinearGradient
                colors={[D.gradStart, D.gradEnd]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerCard}
            >
                <Text style={styles.headerEmoji}>🫁</Text>
                <View>
                    <Text style={styles.headerTitle}>Latihan Pernapasan</Text>
                    <Text style={styles.headerSub}>Pilih teknik yang kamu suka 🌬️</Text>
                </View>
            </LinearGradient>

            <FlatList
                data={techniques}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P} />
                }
                ListEmptyComponent={<EmptyState message="Belum ada teknik tersedia." />}
                renderItem={({ item, index }) => {
                    const phases = [
                        item.inhaleDuration > 0 && { ...PHASE_COLORS.inhale, val: item.inhaleDuration },
                        item.holdDuration > 0    && { ...PHASE_COLORS.hold,   val: item.holdDuration },
                        item.exhaleDuration > 0  && { ...PHASE_COLORS.exhale, val: item.exhaleDuration },
                        item.holdAfterExhale > 0 && { ...PHASE_COLORS.hold2,  val: item.holdAfterExhale },
                    ].filter(Boolean) as { bg: string; text: string; label: string; val: number }[];

                    return (
                        <AnimatedView delay={index * 80}>
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('BreathingExercise', { technique: item })}
                                activeOpacity={0.85}
                            >
                                {/* Accent strip warna teknik */}
                                <View style={[styles.accentBar, { backgroundColor: item.colorTheme || P }]} />

                                <View style={styles.cardInner}>
                                    {/* Icon + nama */}
                                    <View style={styles.cardTop}>
                                        <View style={[styles.iconBox, { backgroundColor: (item.colorTheme || P) + '20' }]}>
                                            <Text style={styles.iconText}>{resolveIcon(item.icon)}</Text>
                                        </View>
                                        <View style={styles.cardMeta}>
                                            <Text style={styles.cardName}>{item.name}</Text>
                                            {item.description ? (
                                                <Text style={styles.cardDesc} numberOfLines={2}>
                                                    {item.description}
                                                </Text>
                                            ) : null}
                                        </View>
                                        {/* Siklus badge */}
                                        <View style={[styles.cycleBadge, { backgroundColor: D.blueLight }]}>
                                            <Text style={styles.cycleNum}>{item.cycles}x</Text>
                                            <Text style={styles.cycleLbl}>siklus</Text>
                                        </View>
                                    </View>

                                    {/* Phase badges */}
                                    <View style={styles.phasesRow}>
                                        {phases.map(p => (
                                            <View key={p.label} style={[styles.phasePill, { backgroundColor: p.bg }]}>
                                                <Text style={[styles.phaseVal, { color: p.text }]}>{p.val}s</Text>
                                                <Text style={[styles.phaseLbl, { color: p.text + 'bb' }]}>{p.label}</Text>
                                            </View>
                                        ))}
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
    safe: { flex: 1, backgroundColor: D.bg },

    // Header
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderRadius: 24,
        margin: Spacing.lg,
        marginBottom: Spacing.sm,
        padding: Spacing.lg,
        paddingVertical: 18,
    },
    headerEmoji: { fontSize: 38 },
    headerTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 20,
        color: D.textDark,
        letterSpacing: -0.2,
    },
    headerSub: {
        fontSize: 13,
        color: D.textSub,
        marginTop: 3,
    },

    // List
    list: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.xs,
        gap: Spacing.sm,
    },

    // Card
    card: {
        backgroundColor: D.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: D.cardBorder,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: P,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
    },
    accentBar: { width: 4, borderRadius: 2 },
    cardInner: { flex: 1, padding: Spacing.md, gap: Spacing.sm },

    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    iconText: { fontSize: 22 },
    cardMeta: { flex: 1 },
    cardName: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: D.textDark,
        lineHeight: 20,
    },
    cardDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: D.textSub,
        marginTop: 2,
        lineHeight: 16,
    },

    // Cycle badge
    cycleBadge: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignItems: 'center',
        flexShrink: 0,
    },
    cycleNum: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 16,
        color: P,
        lineHeight: 19,
    },
    cycleLbl: {
        fontFamily: 'Inter_400Regular',
        fontSize: 10,
        color: D.textMuted,
    },

    // Phases
    phasesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    phasePill: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    phaseVal: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 13,
    },
    phaseLbl: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
    },
});
