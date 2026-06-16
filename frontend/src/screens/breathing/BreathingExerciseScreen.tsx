import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    cancelAnimation,
    Easing,
    interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { breathingAPI } from '../../api';
import { Typography, Spacing, BorderRadius } from '../../theme';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'holdAfter' | 'done';

const PHASE_COLOR_IDX: Record<string, number> = {
    idle: 0, inhale: 0, hold: 1, exhale: 2, holdAfter: 3, done: 2,
};

const CIRCLE_COLORS = [
    'rgba(168, 197, 218, 0.38)',
    'rgba(201, 184, 232, 0.38)',
    'rgba(178, 201, 173, 0.38)',
    'rgba(245, 203, 167, 0.38)',
];

const INNER_COLORS = [
    'rgba(168, 197, 218, 0.22)',
    'rgba(201, 184, 232, 0.22)',
    'rgba(178, 201, 173, 0.22)',
    'rgba(245, 203, 167, 0.22)',
];

const BORDER_COLORS = ['#A8C5DA', '#C9B8E8', '#B2C9AD', '#F5CBA7'];

export default function BreathingExerciseScreen({ route, navigation }: any) {
    const { technique } = route.params;
    const { colors } = useTheme();

    const [phase, setPhase] = useState<Phase>('idle');
    const [countdown, setCountdown] = useState(0);
    const [cyclesDone, setCyclesDone] = useState(0);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [running, setRunning] = useState(false);

    const circleScale = useSharedValue(0.55);
    const colorProgress = useSharedValue(0);
    const glowScale = useSharedValue(1.0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cycleRef = useRef(0);
    const totalSecondsRef = useRef(0);

    const phases: Array<{ key: Phase; duration: number; label: string }> = (
        [
            { key: 'inhale' as Phase, duration: technique.inhaleDuration, label: 'Tarik Napas' },
            { key: 'hold' as Phase, duration: technique.holdDuration, label: 'Tahan' },
            { key: 'exhale' as Phase, duration: technique.exhaleDuration, label: 'Buang Napas' },
            { key: 'holdAfter' as Phase, duration: technique.holdAfterExhale, label: 'Tahan' },
        ]
    ).filter(p => p.duration > 0);

    const animatedCircleStyle = useAnimatedStyle(() => {
        const bg = interpolateColor(colorProgress.value, [0, 1, 2, 3], CIRCLE_COLORS);
        return { transform: [{ scale: circleScale.value }], backgroundColor: bg };
    });

    const animatedInnerStyle = useAnimatedStyle(() => {
        const bg = interpolateColor(colorProgress.value, [0, 1, 2, 3], INNER_COLORS);
        const border = interpolateColor(colorProgress.value, [0, 1, 2, 3], BORDER_COLORS);
        return { backgroundColor: bg, borderColor: border };
    });

    const animatedGlowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: 0.28,
    }));

    useEffect(() => {
        glowScale.value = withRepeat(
            withSequence(
                withTiming(1.18, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ),
            -1
        );
        return () => {
            cancelAnimation(glowScale);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const animateToPhase = (phaseKey: Phase, duration: number) => {
        const targetScale = phaseKey === 'inhale' ? 1.0 : phaseKey === 'exhale' ? 0.55 : circleScale.value;
        const easing = Easing.inOut(Easing.quad);
        circleScale.value = withTiming(targetScale, { duration: duration * 1000, easing });
        const colorIdx = PHASE_COLOR_IDX[phaseKey] ?? 0;
        colorProgress.value = withTiming(colorIdx, { duration: Math.min(duration * 700, 1500), easing });
    };

    const runCycle = (phaseIndex: number) => {
        if (cycleRef.current >= technique.cycles) {
            setPhase('done');
            setRunning(false);
            saveLog();
            return;
        }
        if (phaseIndex >= phases.length) {
            cycleRef.current += 1;
            setCyclesDone(cycleRef.current);
            runCycle(0);
            return;
        }
        const current = phases[phaseIndex];
        setPhase(current.key);
        setCountdown(current.duration);
        animateToPhase(current.key, current.duration);

        let remaining = current.duration;
        timerRef.current = setInterval(() => {
            remaining -= 1;
            totalSecondsRef.current += 1;
            setCountdown(remaining);
            setTotalSeconds(totalSecondsRef.current);
            if (remaining <= 0) {
                clearInterval(timerRef.current!);
                runCycle(phaseIndex + 1);
            }
        }, 1000);
    };

    const start = () => {
        cycleRef.current = 0;
        totalSecondsRef.current = 0;
        setCyclesDone(0);
        setTotalSeconds(0);
        circleScale.value = withTiming(0.55, { duration: 200 });
        colorProgress.value = withTiming(0, { duration: 200 });
        setRunning(true);
        runCycle(0);
    };

    const stop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        cancelAnimation(circleScale);
        cancelAnimation(colorProgress);
        circleScale.value = withTiming(0.55, { duration: 500, easing: Easing.inOut(Easing.ease) });
        colorProgress.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) });
        setRunning(false);
        setPhase('idle');
    };

    const saveLog = async () => {
        try {
            await breathingAPI.saveLog({
                techniqueId: technique.id,
                duration: totalSecondsRef.current,
                cyclesCompleted: cycleRef.current,
            });
        } catch (e) {
            console.warn('Save log failed', e);
        }
    };

    const phaseLabel = phases.find(p => p.key === phase)?.label || '';
    const baseColor = technique.colorTheme || colors.softBlue;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <TouchableOpacity style={styles.back} onPress={() => { stop(); navigation.goBack(); }}>
                <Text style={[styles.backText, { color: colors.charcoal, fontFamily: Typography.body }]}>← Kembali</Text>
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={[styles.name, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    {technique.name}
                </Text>

                <View style={styles.circleContainer}>
                    <Animated.View style={[styles.glowRing, { borderColor: baseColor }, animatedGlowStyle]} />
                    <Animated.View style={[styles.circle, animatedCircleStyle]} />
                    <Animated.View style={[styles.innerCircle, animatedInnerStyle]}>
                        <Text style={[styles.phaseLabel, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                            {phase === 'idle' ? technique.icon || '🌬️' : phase === 'done' ? '✅' : phaseLabel}
                        </Text>
                        {running && phase !== 'done' && (
                            <Text style={[styles.countdown, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                                {countdown}
                            </Text>
                        )}
                    </Animated.View>
                </View>

                <View style={styles.stats}>
                    <Text style={[styles.statText, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                        Siklus: {cyclesDone}/{technique.cycles}
                    </Text>
                    <Text style={[styles.statText, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                        Waktu: {Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}
                    </Text>
                </View>

                {phase === 'done' ? (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: colors.sageGreen }]} onPress={() => navigation.goBack()}>
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Selesai</Text>
                    </TouchableOpacity>
                ) : running ? (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: colors.error }]} onPress={stop}>
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Stop</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: baseColor }]} onPress={start}>
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Mulai</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const CIRCLE_SIZE = 240;

const styles = StyleSheet.create({
    safe: { flex: 1 },
    back: { padding: Spacing.md },
    backText: { fontSize: Typography.sizes.base },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
    name: { fontSize: Typography.sizes.xl, marginBottom: Spacing.xl, textAlign: 'center' },
    circleContainer: {
        width: CIRCLE_SIZE + 40,
        height: CIRCLE_SIZE + 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    glowRing: {
        position: 'absolute',
        width: CIRCLE_SIZE + 40,
        height: CIRCLE_SIZE + 40,
        borderRadius: (CIRCLE_SIZE + 40) / 2,
        borderWidth: 1.5,
    },
    circle: {
        position: 'absolute',
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
    },
    innerCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseLabel: { fontSize: Typography.sizes.md, textAlign: 'center' },
    countdown: { fontSize: Typography.sizes['3xl'], marginTop: 4 },
    stats: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xl },
    statText: { fontSize: Typography.sizes.sm },
    btn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'], borderRadius: BorderRadius.full },
    btnText: { fontSize: Typography.sizes.md },
});
