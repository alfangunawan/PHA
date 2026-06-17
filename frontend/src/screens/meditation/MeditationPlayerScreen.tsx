import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
    Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { meditationAPI } from '../../api';
import config from '../../config';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../theme';

const RING_OUTER = 268;
const RING_MID   = 236;
const RING_INNER = 208;

interface CategoryTheme {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeColor: string;
    emoji: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
    sleep:   { iconBg: '#eef2fb', iconColor: '#6477ad', badgeBg: '#eef2fb', badgeColor: '#5868a3', emoji: '🌙' },
    focus:   { iconBg: '#f3eef6', iconColor: '#a87fae', badgeBg: '#f3eef6', badgeColor: '#8f689a', emoji: '🎯' },
    anxiety: { iconBg: '#eaf2ec', iconColor: '#6f9e80', badgeBg: '#eaf2ec', badgeColor: '#558168', emoji: '💚' },
    morning: { iconBg: '#f6efe2', iconColor: '#c2965c', badgeBg: '#f6efe2', badgeColor: '#b58642', emoji: '🌅' },
    general: { iconBg: '#eaf2ec', iconColor: '#6f9e80', badgeBg: '#eaf2ec', badgeColor: '#558168', emoji: '🌿' },
};

const DEFAULT_THEME: CategoryTheme = {
    iconBg: '#eaeef8', iconColor: '#7e8cc4', badgeBg: '#eaeef8', badgeColor: '#7e8cc4', emoji: '🧘',
};

export default function MeditationPlayerScreen({ route, navigation }: any) {
    const { session } = route.params;
    const { colors } = useTheme();
    const catTheme = CATEGORY_THEMES[session.category] || DEFAULT_THEME;

    const durations: number[] = session.durationOptions || [5, 10, 15];
    const [selectedDuration, setSelectedDuration] = useState(durations[0]);
    const [secondsLeft, setSecondsLeft]   = useState(durations[0] * 60);
    const [playing, setPlaying]           = useState(false);
    const [finished, setFinished]         = useState(false);

    const soundRef   = useRef<Audio.Sound | null>(null);
    const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef = useRef(0);

    const glowScale = useSharedValue(1.0);
    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: 0.65,
    }));

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
        glowScale.value = withRepeat(
            withSequence(
                withTiming(1.07, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0,  { duration: 2200, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
        );
        return () => {
            cancelAnimation(glowScale);
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
        const uri = session.audioUrl.startsWith('http')
            ? session.audioUrl
            : `${config.API_URL}${session.audioUrl}`;
        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true, isLooping: true },
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

    const minutes  = Math.floor(secondsLeft / 60);
    const secs     = secondsLeft % 60;
    const timeStr  = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const dotTop   = (RING_OUTER - RING_MID) / 2 - 6.5;

    const statusLabel = finished ? 'Selesai' : playing ? 'Berlangsung' : 'Siap';

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            <SafeAreaView style={styles.safe}>

                {/* Top bar */}
                <TouchableOpacity
                    style={styles.backRow}
                    onPress={() => { stopTimer(); saveLog(false); navigation.goBack(); }}
                    activeOpacity={0.75}
                >
                    <View style={[styles.backBtn, { backgroundColor: colors.lightGray }]}>
                        <Text style={[styles.backBtnIcon, { color: colors.darkGray }]}>‹</Text>
                    </View>
                    <Text style={[styles.backLabel, { color: colors.darkGray }]}>Kembali</Text>
                </TouchableOpacity>

                {/* Title block */}
                <View style={styles.titleBlock}>
                    <View style={[styles.sessionIconBox, { backgroundColor: catTheme.iconBg }]}>
                        <Text style={styles.sessionEmoji}>{catTheme.emoji}</Text>
                    </View>
                    <Text style={[styles.sessionTitle, { color: colors.charcoal }]} numberOfLines={2}>
                        {session.title}
                    </Text>
                    <View style={[styles.catBadge, { backgroundColor: catTheme.badgeBg }]}>
                        <Text style={[styles.catBadgeText, { color: catTheme.badgeColor }]}>
                            {session.category}
                        </Text>
                    </View>
                </View>

                {/* Timer ring */}
                <View style={styles.ringArea}>
                    <View style={styles.ringContainer}>
                        <Animated.View style={[styles.ringGlow, glowStyle]} />
                        <View style={styles.ringMid} />
                        <View style={styles.ringInner} />
                        <View style={[styles.ringDot, { top: dotTop }]} />
                        <View style={styles.ringCenter}>
                            {finished ? (
                                <Text style={styles.finishedEmoji}>✅</Text>
                            ) : (
                                <>
                                    <Text style={[styles.timerText, { color: colors.charcoal }]}>
                                        {timeStr}
                                    </Text>
                                    <Text style={styles.statusLabel}>{statusLabel}</Text>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Duration selector */}
                <View style={styles.durationRow}>
                    {durations.map(d => {
                        const isSelected = d === selectedDuration;
                        return (
                            <TouchableOpacity
                                key={d}
                                disabled={playing}
                                onPress={() => setSelectedDuration(d)}
                                activeOpacity={0.8}
                                style={[
                                    styles.durationChip,
                                    {
                                        backgroundColor: isSelected ? '#8a9ccc' : '#f1f2f8',
                                        borderColor: isSelected ? '#8a9ccc' : '#e7e9f2',
                                        shadowColor: isSelected ? '#8a9ccc' : 'transparent',
                                    },
                                ]}
                            >
                                <Text style={[
                                    styles.durationText,
                                    { color: isSelected ? '#fff' : '#6a7185', fontWeight: isSelected ? '600' : '500' },
                                ]}>
                                    {d} mnt
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {finished ? (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.primaryBtnText}>← Kembali</Text>
                        </TouchableOpacity>
                    ) : playing ? (
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={[styles.secondaryBtn, { backgroundColor: colors.lightGray }]}
                                onPress={() => { stopTimer(); saveLog(false); }}
                            >
                                <Text style={[styles.secondaryBtnText, { color: colors.darkGray }]}>
                                    Hentikan
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryBtn, { flex: 1, backgroundColor: '#b0bcdf' }]}
                                onPress={stopTimer}
                            >
                                <Text style={styles.primaryBtnText}>⏸  Jeda</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.primaryBtn} onPress={startTimer}>
                            <Text style={styles.primaryBtnText}>▶  Mulai</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1 },

    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: Spacing.lg,
        height: 54,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnIcon: { fontSize: 22, lineHeight: 26 },
    backLabel: {
        fontFamily: Typography.bodyMedium,
        fontSize: 14.5,
    },

    titleBlock: {
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: Spacing.lg,
        paddingTop: 14,
    },
    sessionIconBox: {
        width: 58,
        height: 58,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sessionEmoji: { fontSize: 26 },
    sessionTitle: {
        fontFamily: Typography.heading,
        fontSize: 26,
        letterSpacing: -0.3,
        textAlign: 'center',
        marginTop: 4,
    },
    catBadge: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 20,
    },
    catBadgeText: {
        fontFamily: Typography.bodyMedium,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'capitalize',
    },

    ringArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringContainer: {
        width: RING_OUTER,
        height: RING_OUTER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringGlow: {
        position: 'absolute',
        width: RING_OUTER,
        height: RING_OUTER,
        borderRadius: RING_OUTER / 2,
        backgroundColor: '#e6ecfa',
    },
    ringMid: {
        position: 'absolute',
        width: RING_MID,
        height: RING_MID,
        borderRadius: RING_MID / 2,
        borderWidth: 1,
        borderColor: '#e3e7f3',
    },
    ringInner: {
        position: 'absolute',
        width: RING_INNER,
        height: RING_INNER,
        borderRadius: RING_INNER / 2,
        borderWidth: 2,
        borderColor: '#cdd7ef',
    },
    ringDot: {
        position: 'absolute',
        width: 13,
        height: 13,
        borderRadius: 6.5,
        backgroundColor: '#8a9ccc',
        shadowColor: '#8a9ccc',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 4,
    },
    ringCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerText: {
        fontFamily: Typography.headingBold,
        fontSize: 52,
        lineHeight: 60,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    statusLabel: {
        fontFamily: Typography.bodyMedium,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: '#a4aabc',
        fontWeight: '600',
        marginTop: 12,
    },
    finishedEmoji: { fontSize: 52 },

    durationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: Spacing.lg,
        paddingBottom: 6,
    },
    durationChip: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 14,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 3,
    },
    durationText: {
        fontFamily: Typography.bodyMedium,
        fontSize: 13.5,
    },

    controls: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 20,
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
