import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
    cancelAnimation, Easing, interpolateColor,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import AnimatedView from '../../components/AnimatedView';
import { breathingAPI } from '../../api';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../theme';
import config from '../../config';

const { width: SCREEN_W } = Dimensions.get('window');

const CONTAINER    = SCREEN_W * 0.74;
const OUTER_RING   = CONTAINER * 0.967;
const MIDDLE_SHAPE = CONTAINER * 0.747;
const INNER_MAX    = CONTAINER * 0.567;
const INNER_MIN    = INNER_MAX * 0.48;

const PHASE_COLORS = ['#6477ad', '#7d6fb5', '#5b82a8', '#8a7bb0'];

const CIRCLE_BG = [
    'rgba(100,119,173,0.22)',
    'rgba(125,111,181,0.22)',
    'rgba(91,130,168,0.22)',
    'rgba(138,123,176,0.22)',
];

type Status = 'ready' | 'running' | 'paused' | 'done';

interface PhaseStep {
    key: string;
    label: string;
    duration: number;
    instruction: string;
    colorIdx: number;
}

export default function BreathingExerciseScreen({ route, navigation }: any) {
    const { technique } = route.params;
    const { colors } = useTheme();

    const phases: PhaseStep[] = ([
        { key: 'inhale', label: 'Tarik Napas',  duration: technique.inhaleDuration,    instruction: 'Hirup perlahan...',       colorIdx: 0 },
        { key: 'hold',   label: 'Tahan',         duration: technique.holdDuration,       instruction: 'Tahan napas...',          colorIdx: 1 },
        { key: 'exhale', label: 'Hembus',         duration: technique.exhaleDuration,    instruction: 'Lepaskan perlahan...',    colorIdx: 2 },
        { key: 'hold2',  label: 'Jeda',           duration: technique.holdAfterExhale,   instruction: 'Istirahat sejenak...',    colorIdx: 3 },
    ] as PhaseStep[]).filter(p => p.duration > 0);

    const [status,          setStatus]          = useState<Status>('ready');
    const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
    const [phaseCountdown,  setPhaseCountdown]  = useState(phases[0]?.duration ?? 0);
    const [cyclesDone,      setCyclesDone]      = useState(0);
    const [elapsedSeconds,  setElapsedSeconds]  = useState(0);
    const [phaseColorIdx,   setPhaseColorIdx]   = useState(0);

    const statusRef    = useRef<Status>('ready');
    const phaseTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
    const sessionTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef   = useRef(0);
    const cyclesRef    = useRef(0);
    const inhaleSound  = useRef<Audio.Sound | null>(null);
    const exhaleSound  = useRef<Audio.Sound | null>(null);

    const progress      = useSharedValue(0);
    const colorProgress = useSharedValue(0);
    const glowScale     = useSharedValue(1.0);

    const innerGlowStyle = useAnimatedStyle(() => {
        const size = INNER_MIN + (INNER_MAX - INNER_MIN) * progress.value;
        const bg   = interpolateColor(colorProgress.value, [0, 1, 2, 3], CIRCLE_BG);
        return {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
        };
    });

    const ambientGlowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: 0.15,
    }));

    useEffect(() => {
        glowScale.value = withRepeat(
            withSequence(
                withTiming(1.14, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0,  { duration: 1800, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
        );

        (async () => {
            try {
                await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
                const { sound: inS } = await Audio.Sound.createAsync(
                    { uri: `${config.API_URL}/uploads/breathing/breath_in.mp3` },
                );
                const { sound: exS } = await Audio.Sound.createAsync(
                    { uri: `${config.API_URL}/uploads/breathing/breath_out.mp3` },
                );
                inhaleSound.current = inS;
                exhaleSound.current = exS;
            } catch (e) {
                console.warn('Breathing audio load failed', e);
            }
        })();

        return () => {
            cancelAnimation(glowScale);
            cancelAnimation(progress);
            cancelAnimation(colorProgress);
            if (phaseTimer.current)   clearInterval(phaseTimer.current);
            if (sessionTimer.current) clearInterval(sessionTimer.current);
            inhaleSound.current?.unloadAsync();
            exhaleSound.current?.unloadAsync();
        };
    }, []);

    const playCue = useCallback((phaseKey: string) => {
        const sound =
            phaseKey === 'inhale' ? inhaleSound.current :
            phaseKey === 'exhale' ? exhaleSound.current : null;
        if (sound) sound.replayAsync().catch(() => {});
    }, []);

    const animatePhase = useCallback((phaseKey: string, colorIdx: number, duration: number) => {
        const isHold = phaseKey === 'hold' || phaseKey === 'hold2';
        if (!isHold) {
            progress.value = withTiming(phaseKey === 'inhale' ? 1 : 0, {
                duration: duration * 1000,
                easing: Easing.inOut(Easing.quad),
            });
        }
        colorProgress.value = withTiming(colorIdx, {
            duration: Math.min(duration * 700, 1500),
            easing: Easing.inOut(Easing.quad),
        });
    }, []);

    const runPhase = useCallback((phaseIndex: number, cyclesCount: number) => {
        if (statusRef.current !== 'running') return;

        if (phaseIndex >= phases.length) {
            const newCycles = cyclesCount + 1;
            cyclesRef.current = newCycles;
            setCyclesDone(newCycles);
            if (newCycles >= technique.cycles) {
                statusRef.current = 'done';
                setStatus('done');
                if (sessionTimer.current) clearInterval(sessionTimer.current);
                progress.value = withTiming(0.5, { duration: 500 });
                saveLog();
            } else {
                runPhase(0, newCycles);
            }
            return;
        }

        const phase = phases[phaseIndex];
        setCurrentPhaseIdx(phaseIndex);
        setPhaseCountdown(phase.duration);
        setPhaseColorIdx(phase.colorIdx);
        animatePhase(phase.key, phase.colorIdx, phase.duration);
        playCue(phase.key);

        let remaining = phase.duration;
        phaseTimer.current = setInterval(() => {
            remaining -= 1;
            setPhaseCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(phaseTimer.current!);
                runPhase(phaseIndex + 1, cyclesCount);
            }
        }, 1000);
    }, [phases, technique.cycles, animatePhase]);

    const startSession = useCallback(() => {
        statusRef.current = 'running';
        setStatus('running');
        cyclesRef.current  = 0;
        elapsedRef.current = 0;
        setCyclesDone(0);
        setElapsedSeconds(0);
        progress.value      = withTiming(0, { duration: 200 });
        colorProgress.value = withTiming(0, { duration: 200 });

        sessionTimer.current = setInterval(() => {
            elapsedRef.current += 1;
            setElapsedSeconds(elapsedRef.current);
        }, 1000);

        runPhase(0, 0);
    }, [runPhase]);

    const pauseSession = () => {
        if (statusRef.current === 'running') {
            statusRef.current = 'paused';
            setStatus('paused');
            if (phaseTimer.current)   clearInterval(phaseTimer.current);
            if (sessionTimer.current) clearInterval(sessionTimer.current);
        } else if (statusRef.current === 'paused') {
            statusRef.current = 'running';
            setStatus('running');
            sessionTimer.current = setInterval(() => {
                elapsedRef.current += 1;
                setElapsedSeconds(elapsedRef.current);
            }, 1000);
            runPhase(currentPhaseIdx, cyclesDone);
        }
    };

    const confirmStop = () => {
        Alert.alert(
            'Hentikan Sesi?',
            'Kemajuanmu akan tetap tersimpan.',
            [
                { text: 'Lanjutkan', style: 'cancel' },
                {
                    text: 'Hentikan',
                    onPress: () => {
                        if (phaseTimer.current)   clearInterval(phaseTimer.current);
                        if (sessionTimer.current) clearInterval(sessionTimer.current);
                        saveLog();
                        navigation.goBack();
                    },
                },
            ],
        );
    };

    const resetSession = () => {
        setStatus('ready');
        setCyclesDone(0);
        setElapsedSeconds(0);
        setCurrentPhaseIdx(0);
        setPhaseColorIdx(0);
        elapsedRef.current = 0;
        cyclesRef.current  = 0;
        progress.value      = withTiming(0, { duration: 300 });
        colorProgress.value = withTiming(0, { duration: 300 });
    };

    const saveLog = async () => {
        try {
            await breathingAPI.saveLog({
                techniqueId: technique.id,
                duration: elapsedRef.current,
                cyclesCompleted: cyclesRef.current,
            });
        } catch (e) {
            console.warn('Save log failed', e);
        }
    };

    const pad          = (n: number) => String(Math.floor(n)).padStart(2, '0');
    const currentPhase = phases[currentPhaseIdx];
    const phaseColor   = PHASE_COLORS[phaseColorIdx] ?? PHASE_COLORS[0];

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            <SafeAreaView style={styles.safe}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.closeBtn, { backgroundColor: colors.lightGray }]}
                        onPress={status === 'running' || status === 'paused' ? confirmStop : () => navigation.goBack()}
                    >
                        <Text style={[styles.closeBtnText, { color: colors.darkGray }]}>✕</Text>
                    </TouchableOpacity>
                    <Text style={[styles.techniqueTitle, { color: colors.charcoal }]} numberOfLines={1}>
                        {technique.name}
                    </Text>
                    <Text style={styles.cycleText}>
                        {cyclesDone}/{technique.cycles} siklus
                    </Text>
                </View>

                {/* Circle */}
                <View style={styles.circleArea}>
                    <View style={styles.circleContainer}>
                        {/* Outer ring */}
                        <View style={styles.outerRing} />
                        {/* Middle guide shape */}
                        <View style={styles.middleShape} />
                        {/* Ambient glow pulse */}
                        <Animated.View style={[styles.ambientGlow, ambientGlowStyle]} />
                        {/* Breathing circle (animates) */}
                        <Animated.View style={[styles.innerGlow, innerGlowStyle]} />

                        {/* Center text */}
                        <View style={styles.centerContent}>
                            {status === 'ready' && (
                                <AnimatedView style={styles.centeredItems}>
                                    <Text style={styles.phaseUpperLabel}>Bersiap</Text>
                                    <Text style={[styles.readyText, { color: colors.charcoal }]}>
                                        Siap memulai?
                                    </Text>
                                    <Text style={[styles.readySubtext, { color: colors.darkGray }]}>
                                        Tarik napas perlahan, lalu mulai
                                    </Text>
                                </AnimatedView>
                            )}

                            {(status === 'running' || status === 'paused') && (
                                <View style={styles.centeredItems}>
                                    <Text style={[styles.phaseUpperLabel, { color: phaseColor }]}>
                                        {currentPhase?.label}
                                    </Text>
                                    <Text style={[styles.phaseCountdown, { color: colors.charcoal }]}>
                                        {phaseCountdown}
                                    </Text>
                                    <Text style={[styles.phaseInstruction, { color: colors.darkGray }]}>
                                        {status === 'paused' ? 'Dijeda' : currentPhase?.instruction}
                                    </Text>
                                </View>
                            )}

                            {status === 'done' && (
                                <AnimatedView style={styles.centeredItems}>
                                    <Text style={styles.phaseUpperLabel}>Selesai</Text>
                                    <Text style={[styles.readyText, { color: colors.charcoal }]}>
                                        Luar biasa!
                                    </Text>
                                    <Text style={[styles.readySubtext, { color: colors.darkGray }]}>
                                        Sesi napas kamu selesai ✨
                                    </Text>
                                </AnimatedView>
                            )}
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={[styles.statsRow, { borderTopColor: colors.divider, marginHorizontal: Spacing.lg }]}>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.charcoal }]}>
                            {pad(Math.floor(elapsedSeconds / 60))}:{pad(elapsedSeconds % 60)}
                        </Text>
                        <Text style={styles.statLabel}>Durasi</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.charcoal }]}>{cyclesDone}</Text>
                        <Text style={styles.statLabel}>Siklus</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.charcoal }]}>
                            {technique.cycles - cyclesDone}
                        </Text>
                        <Text style={styles.statLabel}>Tersisa</Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {status === 'ready' && (
                        <TouchableOpacity style={styles.primaryBtn} onPress={startSession}>
                            <Text style={styles.primaryBtnText}>▶  Mulai Sekarang</Text>
                        </TouchableOpacity>
                    )}

                    {(status === 'running' || status === 'paused') && (
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={[styles.secondaryBtn, { backgroundColor: colors.lightGray }]}
                                onPress={confirmStop}
                            >
                                <Text style={[styles.secondaryBtnText, { color: colors.darkGray }]}>
                                    Hentikan
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.primaryBtn,
                                    { flex: 1, backgroundColor: status === 'paused' ? '#8a9ccc' : '#b0bcdf' },
                                ]}
                                onPress={pauseSession}
                            >
                                <Text style={styles.primaryBtnText}>
                                    {status === 'paused' ? '▶  Lanjutkan' : '⏸  Jeda'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {status === 'done' && (
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={[styles.secondaryBtn, { backgroundColor: colors.lightGray }]}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={[styles.secondaryBtnText, { color: colors.darkGray }]}>
                                    ← Kembali
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryBtn, { flex: 1 }]}
                                onPress={resetSession}
                            >
                                <Text style={styles.primaryBtnText}>🔄 Ulangi</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    closeBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: { fontSize: 15, fontWeight: '600' },
    techniqueTitle: {
        fontFamily: Typography.heading,
        fontSize: 17,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Spacing.sm,
    },
    cycleText: {
        fontFamily: Typography.bodyMedium,
        fontSize: 13,
        color: '#9197aa',
        minWidth: 64,
        textAlign: 'right',
    },

    circleArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleContainer: {
        width: CONTAINER,
        height: CONTAINER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerRing: {
        position: 'absolute',
        width: OUTER_RING,
        height: OUTER_RING,
        borderRadius: OUTER_RING / 2,
        borderWidth: 1,
        borderColor: '#e8eaf3',
    },
    middleShape: {
        position: 'absolute',
        width: MIDDLE_SHAPE,
        height: MIDDLE_SHAPE,
        borderRadius: MIDDLE_SHAPE * 0.178,
        borderWidth: 2,
        borderColor: '#d6deef',
    },
    ambientGlow: {
        position: 'absolute',
        width: INNER_MAX + 24,
        height: INNER_MAX + 24,
        borderRadius: (INNER_MAX + 24) / 2,
        backgroundColor: '#e1e8f7',
    },
    innerGlow: {
        position: 'absolute',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        paddingHorizontal: Spacing.md,
    },
    centeredItems: { alignItems: 'center' },

    phaseUpperLabel: {
        fontFamily: Typography.bodyMedium,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: '#a4aabc',
        fontWeight: '600',
        marginBottom: 8,
    },
    readyText: {
        fontFamily: Typography.heading,
        fontSize: 30,
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    readySubtext: {
        fontFamily: Typography.body,
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    phaseCountdown: {
        fontFamily: Typography.headingBold,
        fontSize: 52,
        lineHeight: 60,
        textAlign: 'center',
    },
    phaseInstruction: {
        fontFamily: Typography.body,
        fontSize: 14,
        marginTop: 6,
        textAlign: 'center',
    },

    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingVertical: 20,
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: {
        fontFamily: Typography.headingBold,
        fontSize: 26,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontFamily: Typography.bodyMedium,
        fontSize: 10.5,
        color: '#a4aabc',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginTop: 4,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 36,
    },

    controls: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    btnRow: { flexDirection: 'row', gap: Spacing.sm },
    primaryBtn: {
        backgroundColor: '#8a9ccc',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8a9ccc',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.55,
        shadowRadius: 18,
        elevation: 8,
    },
    primaryBtnText: {
        fontFamily: Typography.heading,
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    secondaryBtn: {
        paddingVertical: 18,
        paddingHorizontal: Spacing.lg,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        fontFamily: Typography.bodyMedium,
        fontSize: 14,
    },
});
