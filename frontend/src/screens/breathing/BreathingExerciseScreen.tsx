import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { breathingAPI } from '../../api';
import { Typography, Spacing, BorderRadius } from '../../theme';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'holdAfter' | 'done';

export default function BreathingExerciseScreen({ route, navigation }: any) {
    const { technique } = route.params;
    const { colors } = useTheme();

    const [phase, setPhase] = useState<Phase>('idle');
    const [countdown, setCountdown] = useState(0);
    const [cyclesDone, setCyclesDone] = useState(0);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [running, setRunning] = useState(false);

    const circleAnim = useRef(new Animated.Value(0.6)).current;
    const circleScaleRef = useRef(0.6);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cycleRef = useRef(0);
    const totalSecondsRef = useRef(0);

    const phases: Array<{ key: Phase; duration: number; label: string }> = (
        [
            { key: 'inhale' as Phase, duration: technique.inhaleDuration, label: 'Tarik Napas' },
            { key: 'hold' as Phase, duration: technique.holdDuration, label: 'Tahan' },
            { key: 'exhale' as Phase, duration: technique.exhaleDuration, label: 'Buang Napas' },
            { key: 'holdAfter' as Phase, duration: technique.holdAfterExhale, label: 'Tahan' },
        ] as Array<{ key: Phase; duration: number; label: string }>
    ).filter(p => p.duration > 0);

    const animateCircle = (targetScale: number, duration: number) => {
        Animated.timing(circleAnim, {
            toValue: targetScale,
            duration: duration * 1000,
            useNativeDriver: true,
        }).start();
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
        const targetScale = current.key === 'inhale' ? 1 : current.key === 'exhale' ? 0.6 : circleScaleRef.current;
        circleScaleRef.current = targetScale;
        animateCircle(targetScale, current.duration);

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
        setRunning(true);
        runCycle(0);
    };

    const stop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
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

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const phaseLabel = phases.find(p => p.key === phase)?.label || '';
    const color = technique.colorTheme || colors.softBlue;

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
                    <Animated.View
                        style={[
                            styles.circle,
                            { backgroundColor: color + '33', transform: [{ scale: circleAnim }] },
                        ]}
                    />
                    <View style={[styles.innerCircle, { backgroundColor: color + '66', borderColor: color }]}>
                        <Text style={[styles.phaseLabel, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                            {phase === 'idle' ? technique.icon || '🌬️' : phase === 'done' ? '✅' : phaseLabel}
                        </Text>
                        {running && phase !== 'done' && (
                            <Text style={[styles.countdown, { color: color, fontFamily: Typography.headingBold }]}>
                                {countdown}
                            </Text>
                        )}
                    </View>
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
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: colors.sageGreen }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Selesai</Text>
                    </TouchableOpacity>
                ) : running ? (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: colors.error }]} onPress={stop}>
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Stop</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={start}>
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Mulai</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    back: { padding: Spacing.md },
    backText: { fontSize: Typography.sizes.base },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
    name: { fontSize: Typography.sizes.xl, marginBottom: Spacing.xl },
    circleContainer: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
    circle: { position: 'absolute', width: 240, height: 240, borderRadius: 120 },
    innerCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    phaseLabel: { fontSize: Typography.sizes.md, textAlign: 'center' },
    countdown: { fontSize: Typography.sizes['3xl'], marginTop: 4 },
    stats: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xl },
    statText: { fontSize: Typography.sizes.sm },
    btn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'], borderRadius: BorderRadius.full },
    btnText: { fontSize: Typography.sizes.md },
});
