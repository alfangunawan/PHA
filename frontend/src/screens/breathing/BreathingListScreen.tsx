import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import { breathingAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Spacing } from '../../theme';

// === Palet Fun Blue (#1A59A1) ===
const C = {
    funBlue:   '#1A59A1',
    funBlueDk: '#14457D',
    bg:        '#ffffff',
    card:      '#ffffff',
    cardBorder:'#e3ebf6',
    textDark:  '#243a5c',
    textSub:   '#7689a6',
    textMuted: '#8aa0c0',
    iconBg:    '#eaf1fa',
};

// Empat fase dalam gradasi biru (Tarik → Tahan → Hembus → Jeda)
const PHASE_COLORS = {
    inhale: { bg: '#eaf1fa', text: '#1A59A1', label: 'Tarik' },
    hold:   { bg: '#e3edfa', text: '#2f6fb8', label: 'Tahan' },
    exhale: { bg: '#e9f0fb', text: '#3b7ec4', label: 'Hembus' },
    hold2:  { bg: '#eef3fb', text: '#5a8bcb', label: 'Jeda' },
};

// Ikon garis monokrom biru — dipetakan dari field `icon` teknik
const ICON_PATHS: Record<string, React.ReactNode> = {
    moon:   <Path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />,
    square: <Rect x="5" y="5" width="14" height="14" rx="3.5" />,
    wind:   <><Path d="M2 8h11a3 3 0 1 0-3-3" /><Path d="M2 12h15a3 3 0 1 1-3 3" /><Path d="M2 16h9" /></>,
    wave:   <><Path d="M3 12c3-4.5 6-4.5 9 0s6 4.5 9 0" /><Path d="M3 17c3-4.5 6-4.5 9 0s6 4.5 9 0" /></>,
    heart:  <Path d="M12 19.5C12 19.5 4 14.6 4 9.3 4 6.7 6 5 8 5c1.6 0 2.9 1 3.5 2.3l.5 1 .5-1C13.1 6 14.4 5 16 5c2 0 4 1.7 4 4.3 0 5.3-8 10.2-8 10.2z" />,
    leaf:   <><Path d="M5 19C5 11 11 5 19 5C19 13 13 19 5 19Z" /><Path d="M5 19C8 15 12 12 16 10.5" /></>,
    star:   <Path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z" />,
    sun:    <><Path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /><Path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" /></>,
    cloud:  <Path d="M7 17h9a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6 9.5 3.5 3.5 0 0 0 7 17z" />,
    fire:   <Path d="M12 3c0 3-4 4-4 8a4 4 0 0 0 8 0c0-2-1-3-1-3 0 2-1.5 2.5-1.5 2.5C13.5 8 12 6 12 3z" />,
};

const TechniqueIcon = ({ icon, color }: { icon?: string; color: string }) => (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        {ICON_PATHS[(icon || '').toLowerCase()] ?? ICON_PATHS.wave}
    </Svg>
);

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
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header full-bleed Fun Blue dengan gelombang dekoratif */}
            <LinearGradient
                colors={[C.funBlue, C.funBlueDk]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerWaves} pointerEvents="none">
                    <Svg width={170} height={120} viewBox="0 0 160 120" fill="none"
                        strokeWidth={2} strokeLinecap="round">
                        <Path d="M8 44 q24 -22 48 0 t48 0 t48 0" stroke="#7ba0d6" />
                        <Path d="M8 60 q24 -20 48 0 t48 0 t48 0" stroke="#5d86c6" />
                        <Path d="M8 76 q24 -18 48 0 t48 0 t48 0" stroke="#7ba0d6" />
                    </Svg>
                </View>
                <View style={styles.headerRow}>
                    <View style={styles.headerIcon}>
                        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="#fff"
                            strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M2 8h11a3 3 0 1 0-3-3" />
                            <Path d="M2 12h15a3 3 0 1 1-3 3" />
                            <Path d="M2 16h9" />
                        </Svg>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Latihan Pernapasan</Text>
                        <Text style={styles.headerSub}>Pilih teknik yang kamu suka</Text>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                data={techniques}
                keyExtractor={item => item.id}
                style={styles.sheet}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.funBlue} />
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
                                <View style={styles.cardTop}>
                                    <View style={styles.iconBox}>
                                        <TechniqueIcon icon={item.icon} color={C.funBlue} />
                                    </View>
                                    <View style={styles.cardMeta}>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                                            <View style={styles.cycleBadge}>
                                                <Text style={styles.cycleTxt}>{item.cycles}×</Text>
                                            </View>
                                        </View>
                                        {item.description ? (
                                            <Text style={styles.cardDesc} numberOfLines={2}>
                                                {item.description}
                                            </Text>
                                        ) : null}

                                        <View style={styles.phasesRow}>
                                            {phases.map(p => (
                                                <View key={p.label} style={[styles.phasePill, { backgroundColor: p.bg }]}>
                                                    <Text style={[styles.phaseVal, { color: p.text }]}>{p.val}s</Text>
                                                    <Text style={styles.phaseLbl}>{p.label}</Text>
                                                </View>
                                            ))}
                                        </View>
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
    safe: { flex: 1, backgroundColor: C.funBlue },

    // Header
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 20,
        paddingBottom: 40,
        overflow: 'hidden',
    },
    headerWaves: { position: 'absolute', right: -6, top: 18, opacity: 0.4 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerIcon: {
        width: 48, height: 48, borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 22,
        color: '#ffffff',
        letterSpacing: -0.2,
    },
    headerSub: { fontSize: 13.5, color: '#cfddf2', marginTop: 4 },

    // White sheet overlapping header
    sheet: {
        flex: 1,
        backgroundColor: C.bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -18,
    },
    list: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 20,
        paddingBottom: Spacing.xl,
        gap: 14,
    },

    // Card
    card: {
        backgroundColor: C.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 17,
        shadowColor: C.funBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 2,
    },
    cardTop: { flexDirection: 'row', gap: 14 },
    iconBox: {
        width: 46, height: 46, borderRadius: 14,
        backgroundColor: C.iconBg,
        justifyContent: 'center', alignItems: 'center',
    },
    cardMeta: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
    cardName: {
        flex: 1,
        fontFamily: 'Poppins_700Bold',
        fontSize: 16,
        color: C.textDark,
    },
    cycleBadge: {
        backgroundColor: C.iconBg,
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    cycleTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.funBlue },
    cardDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: C.textSub,
        marginTop: 5,
        lineHeight: 18,
    },

    // Phases
    phasesRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    phasePill: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 6,
        alignItems: 'center',
    },
    phaseVal: { fontFamily: 'Poppins_700Bold', fontSize: 13.5 },
    phaseLbl: { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.textSub, marginTop: 1 },
});
