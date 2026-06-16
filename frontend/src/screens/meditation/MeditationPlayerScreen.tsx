import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Animated as RNAnimated,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { meditationAPI } from '../../api';
import config from '../../config';
import { Typography, Spacing, BorderRadius } from '../../theme';

interface CategoryTheme {
    color: string;
    glow: string;
    bg: string;
    emoji: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
    sleep:   { color: '#A78BFA', glow: '#7C3AED', bg: '#0F0A1E', emoji: '🌙' },
    focus:   { color: '#60A5FA', glow: '#2563EB', bg: '#0A0F1E', emoji: '🎯' },
    anxiety: { color: '#34D399', glow: '#059669', bg: '#0A1A14', emoji: '💚' },
    morning: { color: '#FBBF24', glow: '#D97706', bg: '#1A100A', emoji: '🌅' },
    general: { color: '#A78BFA', glow: '#7C3AED', bg: '#0F0A1E', emoji: '🌿' },
};

const ORB_SIZE = 200;
const CONTAINER_SIZE = 300;
const INSET = (CONTAINER_SIZE - ORB_SIZE) / 2;

function FloatingOrb({ color, size, top, left, duration }: {
    color: string; size: number; top: string; left: string; duration: number;
}) {
    const opacity = useRef(new RNAnimated.Value(0.05)).current;
    const translateY = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        const loop = RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.parallel([
                    RNAnimated.timing(opacity, { toValue: 0.28, duration, useNativeDriver: true }),
                    RNAnimated.timing(translateY, { toValue: -14, duration, useNativeDriver: true }),
                ]),
                RNAnimated.parallel([
                    RNAnimated.timing(opacity, { toValue: 0.05, duration, useNativeDriver: true }),
                    RNAnimated.timing(translateY, { toValue: 0, duration, useNativeDriver: true }),
                ]),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <RNAnimated.View
            style={{
                position: 'absolute',
                top,
                left,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity,
                transform: [{ translateY }],
            }}
        />
    );
}

function FloatingOrbs({ color }: { color: string }) {
    const orbs = useRef([
        { size: 8, top: '8%', left: '12%', duration: 2200 },
        { size: 5, top: '15%', left: '75%', duration: 3100 },
        { size: 10, top: '28%', left: '88%', duration: 2600 },
        { size: 6, top: '55%', left: '5%', duration: 2900 },
        { size: 9, top: '65%', left: '82%', duration: 2400 },
        { size: 7, top: '75%', left: '30%', duration: 3300 },
        { size: 5, top: '85%', left: '65%', duration: 2800 },
        { size: 11, top: '40%', left: '50%', duration: 3500 },
    ]).current;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {orbs.map((o, i) => (
                <FloatingOrb key={i} color={color} {...o} />
            ))}
        </View>
    );
}

function AuroraBlob({ color, top, left, size, duration }: {
    color: string; top: string; left: string; size: number; duration: number;
}) {
    const opacity = useRef(new RNAnimated.Value(0.06)).current;
    const scale = useRef(new RNAnimated.Value(1.0)).current;

    useEffect(() => {
        const loop = RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.parallel([
                    RNAnimated.timing(opacity, { toValue: 0.14, duration, useNativeDriver: true }),
                    RNAnimated.timing(scale, { toValue: 1.1, duration, useNativeDriver: true }),
                ]),
                RNAnimated.parallel([
                    RNAnimated.timing(opacity, { toValue: 0.06, duration, useNativeDriver: true }),
                    RNAnimated.timing(scale, { toValue: 1.0, duration, useNativeDriver: true }),
                ]),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <RNAnimated.View
            style={{
                position: 'absolute',
                top,
                left,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity,
                transform: [{ scale }],
            }}
        />
    );
}

function AuroraLayer({ color, glow }: { color: string; glow: string }) {
    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <AuroraBlob color={color} top="-10%" left="-5%" size={260} duration={5000} />
            <AuroraBlob color={glow} top="30%" left="60%" size={220} duration={6500} />
            <AuroraBlob color={color} top="65%" left="10%" size={200} duration={4800} />
        </View>
    );
}

function RippleRing({ color, delay }: { color: string; delay: number }) {
    const scale = useRef(new RNAnimated.Value(1.0)).current;
    const opacity = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        const steps: any[] = [];
        if (delay > 0) steps.push(RNAnimated.delay(delay));
        steps.push(
            RNAnimated.parallel([
                RNAnimated.timing(scale, { toValue: 2.0, duration: 2200, useNativeDriver: true }),
                RNAnimated.sequence([
                    RNAnimated.timing(opacity, { toValue: 0.45, duration: 120, useNativeDriver: true }),
                    RNAnimated.timing(opacity, { toValue: 0, duration: 2080, useNativeDriver: true }),
                ]),
            ])
        );
        steps.push(
            RNAnimated.parallel([
                RNAnimated.timing(scale, { toValue: 1.0, duration: 0, useNativeDriver: true }),
                RNAnimated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        );
        const loop = RNAnimated.loop(RNAnimated.sequence(steps));
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <RNAnimated.View
            style={{
                position: 'absolute',
                top: INSET,
                left: INSET,
                width: ORB_SIZE,
                height: ORB_SIZE,
                borderRadius: ORB_SIZE / 2,
                borderWidth: 1.5,
                borderColor: color,
                opacity,
                transform: [{ scale }],
            }}
        />
    );
}

export default function MeditationPlayerScreen({ route, navigation }: any) {
    const { session } = route.params;
    const theme = CATEGORY_THEMES[session.category] || CATEGORY_THEMES.general;

    const durations: number[] = session.durationOptions || [5, 10, 15];
    const [selectedDuration, setSelectedDuration] = useState(durations[0]);
    const [secondsLeft, setSecondsLeft] = useState(durations[0] * 60);
    const [playing, setPlaying] = useState(false);
    const [finished, setFinished] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef = useRef(0);

    const orbScale = useSharedValue(1.0);
    const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: orbScale.value }] }));

    const stopTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlaying(false);
        if (soundRef.current) {
            soundRef.current.stopAsync();
            soundRef.current.unloadAsync();
            soundRef.current = null;
        }
    }, []);

    useEffect(() => {
        orbScale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.95, { duration: 1600, easing: Easing.inOut(Easing.ease) })
            ),
            -1
        );
        return () => {
            cancelAnimation(orbScale);
            stopTimer();
        };
    }, []);

    useEffect(() => {
        setSecondsLeft(selectedDuration * 60);
        elapsedRef.current = 0;
        setFinished(false);
        if (playing) stopTimer();
    }, [selectedDuration]);

    const loadAndPlayAudio = async () => {
        if (!session.audioUrl) return;
        // audioUrl from backend is a relative path (/uploads/...); resolve it
        // against the API base so it stays reachable from device (LAN/ngrok).
        const uri = session.audioUrl.startsWith('http')
            ? session.audioUrl
            : `${config.API_URL}${session.audioUrl}`;
        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true, isLooping: true }
            );
            soundRef.current = sound;
        } catch (e) {
            console.warn('Audio load failed', e);
        }
    };

    const startTimer = async () => {
        setPlaying(true);
        await loadAndPlayAudio();
        timerRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setPlaying(false);
                    setFinished(true);
                    saveLog(true);
                    return 0;
                }
                elapsedRef.current += 1;
                return prev - 1;
            });
        }, 1000);
    };

    const saveLog = async (completed = false) => {
        try {
            await meditationAPI.saveLog({
                sessionId: session.id,
                duration: elapsedRef.current,
                completed,
            });
        } catch (e) {
            console.warn('Save log failed', e);
        }
    };

    const totalSecs = selectedDuration * 60;
    const progressPct = totalSecs > 0 ? ((totalSecs - secondsLeft) / totalSecs) * 100 : 0;

    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
            <FloatingOrbs color={theme.color} />
            <AuroraLayer color={theme.color} glow={theme.glow} />

            <TouchableOpacity
                style={styles.back}
                onPress={() => { stopTimer(); saveLog(false); navigation.goBack(); }}
            >
                <Text style={[styles.backText, { fontFamily: Typography.body }]}>← Kembali</Text>
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={[styles.emoji]}>{theme.emoji}</Text>
                <Text style={[styles.title, { color: '#FFFFFF', fontFamily: Typography.headingBold }]} numberOfLines={2}>
                    {session.title}
                </Text>
                <Text style={[styles.category, { color: theme.color, fontFamily: Typography.bodyMedium }]}>
                    {session.category}
                </Text>

                <View style={styles.orbContainer}>
                    {playing && <RippleRing color={theme.color} delay={0} />}
                    {playing && <RippleRing color={theme.color} delay={800} />}
                    {playing && <RippleRing color={theme.color} delay={1600} />}

                    <Animated.View
                        style={[
                            styles.mainOrb,
                            { backgroundColor: theme.color + '22', borderColor: theme.color },
                            orbStyle,
                        ]}
                    >
                        {finished ? (
                            <Text style={styles.doneEmoji}>✅</Text>
                        ) : (
                            <>
                                <Text style={[styles.timerText, { color: '#FFFFFF', fontFamily: Typography.headingBold }]}>
                                    {timeStr}
                                </Text>
                                <Text style={[styles.timerLabel, { color: theme.color, fontFamily: Typography.body }]}>
                                    {playing ? 'berlangsung' : 'siap'}
                                </Text>
                            </>
                        )}
                    </Animated.View>
                </View>

                <View style={styles.durationRow}>
                    {durations.map(d => (
                        <TouchableOpacity
                            key={d}
                            disabled={playing}
                            onPress={() => setSelectedDuration(d)}
                            style={[
                                styles.durationChip,
                                {
                                    backgroundColor: selectedDuration === d ? theme.color + '33' : 'rgba(255,255,255,0.08)',
                                    borderColor: selectedDuration === d ? theme.color : 'rgba(255,255,255,0.15)',
                                },
                            ]}
                        >
                            <Text style={[
                                styles.durationText,
                                { color: selectedDuration === d ? theme.color : 'rgba(255,255,255,0.6)', fontFamily: Typography.bodyMedium }
                            ]}>
                                {d} mnt
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {finished ? (
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#34D399' }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={[styles.btnText, { fontFamily: Typography.headingMedium }]}>Selesai</Text>
                    </TouchableOpacity>
                ) : playing ? (
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 }]}
                        onPress={() => { stopTimer(); saveLog(false); }}
                    >
                        <Text style={[styles.btnText, { color: '#FFFFFF', fontFamily: Typography.headingMedium }]}>Pause</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: theme.color }]}
                        onPress={startTimer}
                    >
                        <Text style={[styles.btnText, { fontFamily: Typography.headingMedium }]}>Mulai</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progressPct}%` as any, backgroundColor: theme.color }]} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    back: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    backText: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.sizes.base },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
    emoji: { fontSize: 32, marginBottom: Spacing.sm },
    title: { fontSize: Typography.sizes.xl, textAlign: 'center', marginBottom: 4 },
    category: { fontSize: Typography.sizes.sm, marginBottom: Spacing.xl, textTransform: 'capitalize' },
    orbContainer: {
        width: CONTAINER_SIZE,
        height: CONTAINER_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    mainOrb: {
        position: 'absolute',
        top: INSET,
        left: INSET,
        width: ORB_SIZE,
        height: ORB_SIZE,
        borderRadius: ORB_SIZE / 2,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerText: { fontSize: Typography.sizes['3xl'] },
    timerLabel: { fontSize: Typography.sizes.xs, marginTop: 2 },
    doneEmoji: { fontSize: 48 },
    durationRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
    durationChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    durationText: { fontSize: Typography.sizes.sm },
    btn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'], borderRadius: BorderRadius.full },
    btnText: { fontSize: Typography.sizes.md, color: '#FFFFFF' },
    progressTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: Spacing.sm,
    },
    progressBar: {
        height: 3,
    },
});
