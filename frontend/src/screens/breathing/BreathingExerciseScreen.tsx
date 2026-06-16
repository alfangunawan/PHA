import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
    cancelAnimation, Easing, interpolateColor,
} from 'react-native-reanimated';
import AnimatedView from '../../components/AnimatedView';
import { breathingAPI } from '../../api';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_W * 0.62;
const MIN_SIZE = CIRCLE_SIZE * 0.55;

const PHASE_COLORS = ['#A8C5DA', '#C9B8E8', '#B2C9AD', '#F5CBA7'];

const CIRCLE_BG = [
    'rgba(168, 197, 218, 0.21)',
    'rgba(201, 184, 232, 0.21)',
    'rgba(178, 201, 173, 0.21)',
    'rgba(245, 203, 167, 0.21)',
];

const CIRCLE_BORDER = [
    'rgba(168, 197, 218, 0.50)',
    'rgba(201, 184, 232, 0.50)',
    'rgba(178, 201, 173, 0.50)',
    'rgba(245, 203, 167, 0.50)',
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
        { key: 'inhale', label: 'Tarik Napas', duration: technique.inhaleDuration, instruction: 'Hirup perlahan...', colorIdx: 0 },
        { key: 'hold', label: 'Tahan', duration: technique.holdDuration, instruction: 'Tahan napas...', colorIdx: 1 },
        { key: 'exhale', label: 'Hembus', duration: technique.exhaleDuration, instruction: 'Lepaskan perlahan...', colorIdx: 2 },
        { key: 'hold2', label: 'Jeda', duration: technique.holdAfterExhale, instruction: 'Istirahat sejenak...', colorIdx: 3 },
    ] as PhaseStep[]).filter(p => p.duration > 0);

    const [status, setStatus] = useState<Status>('ready');
    const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
    const [phaseCountdown, setPhaseCountdown] = useState(phases[0]?.duration ?? 0);
    const [cyclesDone, setCyclesDone] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [phaseColorIdx, setPhaseColorIdx] = useState(0);

    const statusRef = useRef<Status>('ready');
    const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const sessionTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef = useRef(0);
    const cyclesRef = useRef(0);

    const progress = useSharedValue(0);
    const colorProgress = useSharedValue(0);
    const glowScale = useSharedValue(1.0);

    const circleStyle = useAnimatedStyle(() => {
        const size = MIN_SIZE + (CIRCLE_SIZE - MIN_SIZE) * progress.value;
        const bg = interpolateColor(colorProgress.value, [0, 1, 2, 3], CIRCLE_BG);
        const border = interpolateColor(colorProgress.value, [0, 1, 2, 3], CIRCLE_BORDER);
        return {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            borderColor: border,
            borderWidth: 2,
            opacity: 0.35 + progress.value * 0.65,
        };
    });

    const innerCircleStyle = useAnimatedStyle(() => {
        const size = MIN_SIZE * 0.7 + (CIRCLE_SIZE * 0.7 - MIN_SIZE * 0.7) * progress.value;
        const bg = interpolateColor(colorProgress.value, [0, 1, 2, 3], CIRCLE_BG);
        return {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
        };
    });

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: 0.22,
    }));

    useEffect(() => {
        glowScale.value = withRepeat(
            withSequence(
                withTiming(1.18, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
        );
        return () => {
            cancelAnimation(glowScale);
            cancelAnimation(progress);
            cancelAnimation(colorProgress);
            if (phaseTimer.current) clearInterval(phaseTimer.current);
            if (sessionTimer.current) clearInterval(sessionTimer.current);
        };
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
        cyclesRef.current = 0;
        elapsedRef.current = 0;
        setCyclesDone(0);
        setElapsedSeconds(0);
        progress.value = withTiming(0, { duration: 200 });
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
            if (phaseTimer.current) clearInterval(phaseTimer.current);
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
            'Kemajuanmu akan tetap tersimpan 🌿',
            [
                { text: 'Lanjutkan', style: 'cancel' },
                {
                    text: 'Hentikan',
                    onPress: () => {
                        if (phaseTimer.current) clearInterval(phaseTimer.current);
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
        cyclesRef.current = 0;
        progress.value = withTiming(0, { duration: 300 });
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

    const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

    const currentPhase = phases[currentPhaseIdx];
    const phaseColor = PHASE_COLORS[phaseColorIdx] ?? PHASE_COLORS[0];
    const themeColor = technique.colorTheme || PHASE_COLORS[0];

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            <SafeAreaView style={styles.safe}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={status === 'running' || status === 'paused' ? confirmStop : () => navigation.goBack()}
                    >
                        <Text style={[styles.closeBtn, { color: colors.darkGray }]}>✕</Text>
                    </TouchableOpacity>
                    <Text style={[styles.techniqueTitle, { color: colors.charcoal }]} numberOfLines={1}>
                        {technique.name}
                    </Text>
                    <Text style={[styles.cycleText, { color: colors.mediumGray }]}>
                        {cyclesDone}/{technique.cycles} siklus
                    </Text>
                </View>

                {/* Circle area */}
                <View style={styles.circleContainer}>
                    <Animated.View style={[styles.glowRing, { borderColor: phaseColor }, glowStyle]} />
                    <Animated.View style={[styles.breathCircle, circleStyle]} />
                    <Animated.View style={[styles.innerCircle, innerCircleStyle]} />

                    <View style={styles.centerContent}>
                        {status === 'ready' && (
                            <AnimatedView style={styles.centeredItems}>
                                <Text style={styles.readyEmoji}>{technique.icon || '🌬️'}</Text>
                                <Text style={[styles.readyText, { color: colors.charcoal }]}>Siap memulai?</Text>
                            </AnimatedView>
                        )}

                        {(status === 'running' || status === 'paused') && (
                            <View style={styles.centeredItems}>
                                <Text style={[styles.phaseLabel, { color: phaseColor }]}>
                                    {currentPhase?.label}
                                </Text>
                                <Text style={[styles.phaseCountdown, { color: colors.charcoal }]}>
                                    {phaseCountdown}
                                </Text>
                                <Text style={[styles.phaseInstruction, { color: colors.darkGray }]}>
                                    {status === 'paused' ? '⏸ Dijeda' : currentPhase?.instruction}
                                </Text>
                            </View>
                        )}

                        {status === 'done' && (
                            <AnimatedView style={styles.centeredItems}>
                                <Text style={styles.doneEmoji}>✨</Text>
                                <Text style={[styles.doneText, { color: colors.charcoal }]}>Luar biasa!</Text>
                            </AnimatedView>
                        )}
                    </View>
                </View>

                {/* Stats */}
                <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.charcoal }]}>
                            {pad(Math.floor(elapsedSeconds / 60))}:{pad(elapsedSeconds % 60)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.mediumGray }]}>Durasi</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.charcoal }]}>{cyclesDone}</Text>
                        <Text style={[styles.statLabel, { color: colors.mediumGray }]}>Siklus</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.charcoal }]}>
                            {technique.cycles - cyclesDone}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.mediumGray }]}>Tersisa</Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {status === 'ready' && (
                        <TouchableOpacity
                            style={[styles.mainBtn, { backgroundColor: themeColor }]}
                            onPress={startSession}
                        >
                            <Text style={styles.mainBtnText}>Mulai Sekarang</Text>
                        </TouchableOpacity>
                    )}

                    {(status === 'running' || status === 'paused') && (
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={[styles.stopBtn, { backgroundColor: colors.lightGray }]}
                                onPress={confirmStop}
                            >
                                <Text style={[styles.stopBtnText, { color: colors.darkGray }]}>⬛ Hentikan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.mainBtn,
                                    { backgroundColor: status === 'paused' ? themeColor : colors.peachDark, flex: 1 },
                                ]}
                                onPress={pauseSession}
                            >
                                <Text style={styles.mainBtnText}>
                                    {status === 'paused' ? '▶ Lanjutkan' : '⏸ Jeda'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {status === 'done' && (
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={[styles.stopBtn, { backgroundColor: colors.lightGray }]}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={[styles.stopBtnText, { color: colors.darkGray }]}>← Kembali</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mainBtn, { backgroundColor: themeColor, flex: 1 }]}
                                onPress={resetSession}
                            >
                                <Text style={styles.mainBtnText}>🔄 Ulangi</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    headerBtn: { padding: 4, minWidth: 32 },
    closeBtn: { fontSize: 20 },
    techniqueTitle: {
        fontFamily: Typography.heading,
        fontSize: Typography.sizes.base,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Spacing.sm,
    },
    cycleText: {
        fontFamily: Typography.bodyMedium,
        fontSize: Typography.sizes.sm,
        minWidth: 64,
        textAlign: 'right',
    },
    circleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowRing: {
        position: 'absolute',
        width: CIRCLE_SIZE + 60,
        height: CIRCLE_SIZE + 60,
        borderRadius: (CIRCLE_SIZE + 60) / 2,
        borderWidth: 2,
    },
    breathCircle: {
        position: 'absolute',
    },
    innerCircle: {
        position: 'absolute',
    },
    centerContent: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: Spacing.lg,
    },
    centeredItems: { alignItems: 'center' },
    readyEmoji: { fontSize: 48, marginBottom: 8, textAlign: 'center' },
    readyText: {
        fontFamily: Typography.heading,
        fontSize: Typography.sizes.xl,
        textAlign: 'center',
    },
    phaseLabel: {
        fontFamily: Typography.headingBold,
        fontSize: Typography.sizes.md,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4,
        textAlign: 'center',
    },
    phaseCountdown: {
        fontFamily: Typography.headingBold,
        fontSize: Typography.sizes['4xl'],
        lineHeight: Typography.sizes['4xl'] + 8,
        textAlign: 'center',
    },
    phaseInstruction: {
        fontFamily: Typography.body,
        fontSize: Typography.sizes.base,
        marginTop: 8,
        textAlign: 'center',
    },
    doneEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 8 },
    doneText: {
        fontFamily: Typography.headingBold,
        fontSize: Typography.sizes.xl,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
    },
    stat: { alignItems: 'center' },
    statValue: {
        fontFamily: Typography.headingBold,
        fontSize: Typography.sizes.xl,
        letterSpacing: 1,
    },
    statLabel: {
        fontFamily: Typography.body,
        fontSize: Typography.sizes.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 2,
    },
    controls: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    btnRow: { flexDirection: 'row', gap: Spacing.sm },
    mainBtn: {
        paddingVertical: 16,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainBtnText: {
        fontFamily: Typography.heading,
        fontSize: Typography.sizes.md,
        color: '#FFFFFF',
    },
    stopBtn: {
        paddingVertical: 16,
        paddingHorizontal: Spacing.lg,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopBtnText: {
        fontFamily: Typography.bodyMedium,
        fontSize: Typography.sizes.sm,
    },
});
