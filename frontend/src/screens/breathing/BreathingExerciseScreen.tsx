import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
    cancelAnimation, Easing, interpolateColor,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import AnimatedView from '../../components/AnimatedView';
import { breathingAPI } from '../../api';
import { Spacing } from '../../theme';
import config from '../../config';

const { width: SCREEN_W } = Dimensions.get('window');
const RING = Math.min(SCREEN_W - 70, 300);          // outer decorative ring
const CIRCLE_SIZE = RING * 0.58;                      // max breathing circle
const MIN_SIZE = CIRCLE_SIZE * 0.55;

// === Palet Fun Blue (#1A59A1) ===
const C = {
    funBlue:   '#1A59A1',
    funBlueDk: '#14457D',
    bg:        '#ffffff',
    textDark:  '#243a5c',
    textSub:   '#7689a6',
    textMuted: '#8aa0c0',
    iconBg:    '#eaf1fa',
    border:    '#e3ebf6',
    ring:      '#d4def0',
    ringInner: '#bcd2ee',
};

// Aksen per fase dalam gradasi biru
const PHASE_COLORS = ['#1A59A1', '#2f6fb8', '#3b7ec4', '#5a8bcb'];

const CIRCLE_BG = [
    'rgba(26, 89, 161, 0.16)',
    'rgba(47, 111, 184, 0.16)',
    'rgba(59, 126, 196, 0.16)',
    'rgba(90, 139, 203, 0.16)',
];

const CIRCLE_BORDER = [
    'rgba(26, 89, 161, 0.45)',
    'rgba(47, 111, 184, 0.45)',
    'rgba(59, 126, 196, 0.45)',
    'rgba(90, 139, 203, 0.45)',
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
    const inhaleSound = useRef<Audio.Sound | null>(null);
    const exhaleSound = useRef<Audio.Sound | null>(null);

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
            opacity: 0.4 + progress.value * 0.6,
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
        opacity: 0.18,
    }));

    useEffect(() => {
        glowScale.value = withRepeat(
            withSequence(
                withTiming(1.18, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
        );

        // Preload breathing cue sounds served by the backend. playsInSilentModeIOS
        // is required or the iOS ringer switch silences playback.
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
            if (phaseTimer.current) clearInterval(phaseTimer.current);
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
    const running = status === 'running' || status === 'paused';

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                {/* Top bar */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeBox}
                        onPress={running ? confirmStop : () => navigation.goBack()}
                    >
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.funBlue}
                            strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M6 6l12 12M18 6 6 18" />
                        </Svg>
                    </TouchableOpacity>
                    <Text style={styles.techniqueTitle} numberOfLines={1}>{technique.name}</Text>
                    <Text style={styles.cycleText}>{cyclesDone}/{technique.cycles} siklus</Text>
                </View>

                {/* Breathing guide */}
                <View style={styles.circleContainer}>
                    <View style={styles.guide}>
                        {/* Decorative concentric rings */}
                        <View style={styles.outerRing} />
                        <View style={styles.roundSquare} />
                        <Svg width={RING * 0.57} height={RING * 0.57} style={styles.radial}>
                            <Defs>
                                <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                                    <Stop offset="0%" stopColor="#d2e1f5" stopOpacity={1} />
                                    <Stop offset="72%" stopColor="#d2e1f5" stopOpacity={0} />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50%" cy="50%" r="50%" fill="url(#glow)" />
                        </Svg>
                        {/* Progress dot at top */}
                        <View style={styles.dot} />

                        {/* Animated breathing circle */}
                        <Animated.View style={[styles.glowRing, { borderColor: phaseColor }, glowStyle]} />
                        <Animated.View style={[styles.breathCircle, circleStyle]} />
                        <Animated.View style={[styles.innerCircle, innerCircleStyle]} />

                        {/* Center content */}
                        <View style={styles.centerContent}>
                            {status === 'ready' && (
                                <AnimatedView style={styles.centeredItems}>
                                    <Text style={styles.eyebrow}>Bersiap</Text>
                                    <Text style={styles.bigTitle}>Siap memulai?</Text>
                                    <Text style={styles.subText}>Tarik napas perlahan, lalu mulai</Text>
                                </AnimatedView>
                            )}

                            {running && (
                                <View style={styles.centeredItems}>
                                    <Text style={[styles.eyebrow, { color: phaseColor }]}>
                                        {currentPhase?.label}
                                    </Text>
                                    <Text style={styles.countdown}>{phaseCountdown}</Text>
                                    <Text style={styles.subText}>
                                        {status === 'paused' ? 'Dijeda' : currentPhase?.instruction}
                                    </Text>
                                </View>
                            )}

                            {status === 'done' && (
                                <AnimatedView style={styles.centeredItems}>
                                    <Text style={styles.eyebrow}>Selesai</Text>
                                    <Text style={styles.bigTitle}>Luar biasa!</Text>
                                    <Text style={styles.subText}>Sesi tersimpan</Text>
                                </AnimatedView>
                            )}
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>
                            {pad(Math.floor(elapsedSeconds / 60))}:{pad(elapsedSeconds % 60)}
                        </Text>
                        <Text style={styles.statLabel}>Durasi</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{cyclesDone}</Text>
                        <Text style={styles.statLabel}>Siklus</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{technique.cycles - cyclesDone}</Text>
                        <Text style={styles.statLabel}>Tersisa</Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {status === 'ready' && (
                        <TouchableOpacity activeOpacity={0.9} onPress={startSession}>
                            <LinearGradient
                                colors={[C.funBlue, C.funBlueDk]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.mainBtn}
                            >
                                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff"
                                    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                    <Path d="M7 5l11 7-11 7z" />
                                </Svg>
                                <Text style={styles.mainBtnText}>Mulai Sekarang</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {running && (
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.ghostBtn} onPress={confirmStop}>
                                <Text style={styles.ghostBtnText}>Hentikan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }} onPress={pauseSession}>
                                <LinearGradient
                                    colors={status === 'paused' ? [C.funBlue, C.funBlueDk] : ['#5a8bcb', '#3b7ec4']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.mainBtn}
                                >
                                    <Text style={styles.mainBtnText}>
                                        {status === 'paused' ? 'Lanjutkan' : 'Jeda'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {status === 'done' && (
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.ghostBtnText}>Kembali</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }} onPress={resetSession}>
                                <LinearGradient
                                    colors={[C.funBlue, C.funBlueDk]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.mainBtn}
                                >
                                    <Text style={styles.mainBtnText}>Ulangi</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    safe: { flex: 1 },

    // Top bar
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 22,
        height: 54,
    },
    closeBox: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: C.iconBg,
        alignItems: 'center', justifyContent: 'center',
    },
    techniqueTitle: {
        flex: 1,
        fontFamily: 'Lora_600SemiBold',
        fontSize: 17,
        color: C.textDark,
        textAlign: 'center',
        marginHorizontal: Spacing.sm,
    },
    cycleText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: C.textSub,
        minWidth: 64,
        textAlign: 'right',
    },

    // Guide
    circleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    guide: {
        width: RING, height: RING,
        alignItems: 'center', justifyContent: 'center',
    },
    outerRing: {
        position: 'absolute',
        width: RING, height: RING,
        borderRadius: RING / 2,
        borderWidth: 1, borderColor: C.ring,
    },
    roundSquare: {
        position: 'absolute',
        width: RING * 0.77, height: RING * 0.77,
        borderRadius: 40,
        borderWidth: 2, borderColor: C.ringInner,
    },
    radial: { position: 'absolute' },
    dot: {
        position: 'absolute',
        top: RING * 0.115,
        width: 15, height: 15, borderRadius: 8,
        backgroundColor: C.funBlue,
        shadowColor: C.funBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
    },
    glowRing: {
        position: 'absolute',
        width: CIRCLE_SIZE + 50,
        height: CIRCLE_SIZE + 50,
        borderRadius: (CIRCLE_SIZE + 50) / 2,
        borderWidth: 2,
    },
    breathCircle: { position: 'absolute' },
    innerCircle: { position: 'absolute' },
    centerContent: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: Spacing.lg,
    },
    centeredItems: { alignItems: 'center' },
    eyebrow: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 11,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        color: C.textMuted,
    },
    bigTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 30,
        color: C.textDark,
        letterSpacing: -0.3,
        marginTop: 8,
        textAlign: 'center',
    },
    countdown: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 56,
        lineHeight: 64,
        color: C.textDark,
        marginTop: 4,
    },
    subText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: C.textSub,
        marginTop: 8,
        textAlign: 'center',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: C.border,
        marginHorizontal: Spacing.lg,
        paddingVertical: 20,
    },
    stat: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: C.border },
    statValue: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 26,
        color: C.textDark,
    },
    statLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 10.5,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: C.textMuted,
        marginTop: 4,
    },

    // Controls
    controls: { paddingHorizontal: Spacing.lg, paddingTop: 14, paddingBottom: 30 },
    btnRow: { flexDirection: 'row', gap: Spacing.sm },
    mainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 18,
        shadowColor: C.funBlue,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
        elevation: 6,
    },
    mainBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    ghostBtn: {
        paddingVertical: 18,
        paddingHorizontal: Spacing.lg,
        borderRadius: 18,
        backgroundColor: C.iconBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ghostBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: C.funBlue,
    },
});
