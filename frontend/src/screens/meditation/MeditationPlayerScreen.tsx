import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
    Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { meditationAPI } from '../../api';
import config from '../../config';
import { M, getCatTheme, CategoryIcon } from './categories';

const RING_OUTER = 268;
const RING_MID   = 236;
const RING_INNER = 208;

export default function MeditationPlayerScreen({ route, navigation }: any) {
    const { session } = route.params;
    const cat = getCatTheme(session.category);

    const durations: number[] = session.durationOptions?.length ? session.durationOptions : [5, 10, 15];
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
    const catLabel = (session.category || 'general').charAt(0).toUpperCase() + (session.category || 'general').slice(1);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>

                {/* Top bar */}
                <TouchableOpacity
                    style={styles.backRow}
                    onPress={() => { stopTimer(); saveLog(false); navigation.goBack(); }}
                    activeOpacity={0.75}
                >
                    <View style={styles.backBtn}>
                        <Svg width={20} height={20} viewBox="0 0 24 24">
                            <Path d="M15 6l-6 6 6 6" stroke="#5a6173" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </Svg>
                    </View>
                    <Text style={styles.backLabel}>Kembali</Text>
                </TouchableOpacity>

                {/* Title block */}
                <View style={styles.titleBlock}>
                    <View style={styles.sessionIconBox}>
                        <CategoryIcon kind={cat.icon} size={28} color={M.primary} />
                    </View>
                    <Text style={styles.sessionTitle} numberOfLines={2}>{session.title}</Text>
                    <Text style={styles.catLabel}>{catLabel}</Text>
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
                                    <Text style={styles.timerText}>{timeStr}</Text>
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
                                style={[styles.durationChip, isSelected ? styles.durationChipActive : styles.durationChipIdle]}
                            >
                                <Text style={[styles.durationText, { color: isSelected ? '#fff' : M.textSub, fontWeight: isSelected ? '600' : '500' }]}>
                                    {d} mnt
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {finished ? (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnText}>Kembali</Text>
                        </TouchableOpacity>
                    ) : playing ? (
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={() => { stopTimer(); saveLog(false); }}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.secondaryBtnText}>Hentikan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={stopTimer} activeOpacity={0.85}>
                                <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.btnIcon}>
                                    <Path d="M8 5v14M16 5v14" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                                </Svg>
                                <Text style={styles.primaryBtnText}>Jeda</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.primaryBtn} onPress={startTimer} activeOpacity={0.85}>
                            <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.btnIcon}>
                                <Path d="M7 5l11 7-11 7z" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </Svg>
                            <Text style={styles.primaryBtnText}>Mulai</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: M.screenBg },
    safe: { flex: 1 },

    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 22,
        height: 54,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: M.chipBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14.5,
        color: M.textSub,
    },

    titleBlock: {
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 24,
        paddingTop: 14,
    },
    sessionIconBox: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: M.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sessionTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 27,
        color: M.textDark,
        letterSpacing: -0.3,
        textAlign: 'center',
        marginTop: 4,
    },
    catLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: M.primary,
        letterSpacing: 0.5,
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
        borderColor: '#b8cce8',
    },
    ringDot: {
        position: 'absolute',
        width: 13,
        height: 13,
        borderRadius: 6.5,
        backgroundColor: M.primary,
        shadowColor: M.primary,
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
        fontFamily: 'Lora_600SemiBold',
        fontSize: 52,
        lineHeight: 60,
        letterSpacing: 0.5,
        color: M.textDark,
        textAlign: 'center',
    },
    statusLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: '#a4aabc',
        marginTop: 12,
    },
    finishedEmoji: { fontSize: 52 },

    durationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 24,
        paddingBottom: 6,
    },
    durationChip: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 14,
        borderWidth: 1,
    },
    durationChipActive: {
        backgroundColor: M.primary,
        borderColor: M.primary,
        shadowColor: M.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 3,
    },
    durationChipIdle: {
        backgroundColor: M.chipBg,
        borderColor: M.chipBorder,
    },
    durationText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13.5,
    },

    controls: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 30,
    },
    btnRow: { flexDirection: 'row', gap: 10 },
    btnIcon: { marginRight: 4 },
    primaryBtn: {
        flexDirection: 'row',
        backgroundColor: M.primary,
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: M.primary,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.5,
        shadowRadius: 18,
        elevation: 8,
    },
    primaryBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    secondaryBtn: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 18,
        backgroundColor: M.chipBg,
        borderWidth: 1,
        borderColor: M.chipBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: M.textSub,
    },
});
