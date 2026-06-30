import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    AppState, AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { audioAPI } from '../../api';
import config from '../../config';

// ── Tema selaras Fun Blue ─────────────────────────────────────────────────────
const T = {
    primary:      '#1A59A1',
    primaryDeep:  '#14457D',
    primaryLight: '#e9f1fa',
    screenBg:     '#fcfcfe',
    card:         '#ffffff',
    cardBorder:   '#ecedf6',
    textDark:     '#353b4a',
    textSub:      '#6a7185',
    textMuted:    '#949bae',
    inactive:     '#d8daea',
    error:        '#F5A8A8',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n: number) { return String(Math.floor(n)).padStart(2, '0'); }
function formatTime(ms: number) {
    const total = Math.floor(ms / 1000);
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// ── Ikon SVG garis ────────────────────────────────────────────────────────────
function HeadsetIcon({ size = 72, color = T.primary }: { size?: number; color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M3 18v-6a9 9 0 0 1 18 0v6" {...sp} />
            <Path d="M21 19a2 2 0 0 1-2 2h-1v-5h3v3z" {...sp} />
            <Path d="M3 19a2 2 0 0 0 2 2h1v-5H3v3z" {...sp} />
        </Svg>
    );
}

function BackIcon({ color = T.primary }: { color?: string }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function PlayIcon({ color = '#fff' }: { color?: string }) {
    return (
        <Svg width={30} height={30} viewBox="0 0 24 24" fill={color}>
            <Path d="M5 4l15 8L5 20V4z" fill={color} stroke="none" />
        </Svg>
    );
}

function PauseIcon({ color = '#fff' }: { color?: string }) {
    const sp = { stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const };
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M8 5v14M16 5v14" {...sp} />
        </Svg>
    );
}

function SkipBackIcon({ color = T.textSub }: { color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 20L9 12l10-8v16z" {...sp} />
            <Path d="M5 4v16" {...sp} />
        </Svg>
    );
}

function SkipFwdIcon({ color = T.textSub }: { color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M5 4l10 8-10 8V4z" {...sp} />
            <Path d="M19 4v16" {...sp} />
        </Svg>
    );
}

interface AudioItem {
    id: string;
    title: string;
    description?: string;
    category: string;
    duration?: number;
    fileUrl: string;
}

export default function AudioPlayerScreen({ route, navigation }: any) {
    const audio: AudioItem = route.params?.audio;

    const soundRef = useRef<Audio.Sound | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [positionMs, setPositionMs] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const [loadError, setLoadError] = useState('');

    const lastPlayStartRef = useRef<number | null>(null);
    const totalPlayedSecRef = useRef<number>(0);
    const logSentRef = useRef(false);

    // ── Kirim log ke backend ──────────────────────────────────────────────────
    const sendLog = useCallback(async (completed: boolean) => {
        if (logSentRef.current) return;
        logSentRef.current = true;
        if (lastPlayStartRef.current !== null) {
            totalPlayedSecRef.current += Math.floor((Date.now() - lastPlayStartRef.current) / 1000);
            lastPlayStartRef.current = null;
        }
        const duration = Math.max(totalPlayedSecRef.current, 1);
        try {
            await audioAPI.saveLog({ audioId: audio.id, duration, completed });
        } catch { /* best-effort */ }
    }, [audio.id]);

    // ── Load audio ────────────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        const loadSound = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                });
                const audioUrl = audio.fileUrl.startsWith('http')
                    ? audio.fileUrl
                    : `${config.API_URL}${audio.fileUrl}`;
                const { sound } = await Audio.Sound.createAsync(
                    { uri: audioUrl },
                    { shouldPlay: false },
                    (status: AVPlaybackStatus) => {
                        if (!mounted || !status.isLoaded) return;
                        setPositionMs(status.positionMillis ?? 0);
                        setDurationMs(status.durationMillis ?? 0);
                        setIsPlaying(status.isPlaying);
                        if (status.didJustFinish) {
                            lastPlayStartRef.current = null;
                            sendLog(true);
                        }
                    },
                );
                soundRef.current = sound;
                if (mounted) setIsLoading(false);
            } catch {
                if (mounted) setLoadError('Gagal memuat audio. Kembali dan coba lagi.');
                setIsLoading(false);
            }
        };
        loadSound();
        return () => {
            mounted = false;
            soundRef.current?.unloadAsync();
        };
    }, [audio.fileUrl, sendLog]);

    // ── AppState handler ──────────────────────────────────────────────────────
    useEffect(() => {
        const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
            if (next === 'background' || next === 'inactive') {
                const s = soundRef.current;
                if (!s) return;
                const status = await s.getStatusAsync();
                if (status.isLoaded && status.isPlaying) {
                    await s.pauseAsync();
                    sendLog(false);
                }
            }
        });
        return () => sub.remove();
    }, [sendLog]);

    // ── Kontrol ───────────────────────────────────────────────────────────────
    const togglePlay = async () => {
        const s = soundRef.current;
        if (!s) return;
        const status = await s.getStatusAsync();
        if (!status.isLoaded) return;
        if (status.isPlaying) {
            await s.pauseAsync();
            if (lastPlayStartRef.current !== null) {
                totalPlayedSecRef.current += Math.floor((Date.now() - lastPlayStartRef.current) / 1000);
                lastPlayStartRef.current = null;
            }
        } else {
            await s.playAsync();
            lastPlayStartRef.current = Date.now();
        }
    };

    const seekTo = async (ms: number) => {
        if (!soundRef.current) return;
        await soundRef.current.setPositionAsync(ms);
        setPositionMs(ms);
    };

    const handleBack = () => {
        if (isPlaying) {
            soundRef.current?.pauseAsync().then(() => sendLog(false));
        }
        navigation.goBack();
    };

    const progress = durationMs > 0 ? positionMs / durationMs : 0;

    // ── Error state ───────────────────────────────────────────────────────────
    if (loadError) {
        return (
            <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <HeadsetIcon size={56} color={T.inactive} />
                <Text style={[styles.title, { textAlign: 'center', marginTop: 16, fontSize: 15 }]}>{loadError}</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.primaryBtnText}>Kembali</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
            {/* Navigasi atas */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={styles.headerLabel}>Pemutaran Audio</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.body}>
                {/* Album art */}
                <View style={styles.albumArt}>
                    <HeadsetIcon size={72} color={T.primary} />
                </View>

                {/* Judul & kategori */}
                <Text style={styles.title} numberOfLines={2}>{audio.title}</Text>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{audio.category || 'general'}</Text>
                </View>
                {audio.description ? (
                    <Text style={styles.desc} numberOfLines={3}>{audio.description}</Text>
                ) : null}

                {/* Progress bar */}
                <View style={styles.progressArea}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => {
                            if (durationMs === 0) return;
                            const { locationX } = e.nativeEvent;
                            const ratio = Math.min(Math.max(locationX / 300, 0), 1);
                            seekTo(ratio * durationMs);
                        }}
                        style={styles.progressBarWrap}
                        hitSlop={{ top: 12, bottom: 12 }}
                    >
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
                            <View style={[styles.progressThumb, { left: `${progress * 100}%` as any }]} />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
                        <Text style={styles.timeText}>{durationMs > 0 ? formatTime(durationMs) : '--:--'}</Text>
                    </View>
                </View>

                {/* Kontrol */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={() => seekTo(Math.max(0, positionMs - 10000))}
                        style={styles.ctrlBtn}
                        disabled={isLoading}
                    >
                        <SkipBackIcon color={isLoading ? T.inactive : T.textSub} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={togglePlay}
                        style={[styles.playBtnLarge, isLoading && { opacity: 0.5 }]}
                        disabled={isLoading}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => seekTo(Math.min(durationMs, positionMs + 10000))}
                        style={styles.ctrlBtn}
                        disabled={isLoading}
                    >
                        <SkipFwdIcon color={isLoading ? T.inactive : T.textSub} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.statusLabel}>
                    {isLoading ? 'Memuat audio…' : isPlaying ? 'Sedang diputar' : 'Dijeda'}
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: T.screenBg },

    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 13,
        backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder,
        alignItems: 'center', justifyContent: 'center',
    },
    headerLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: T.textDark },

    body: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingBottom: 40, justifyContent: 'center' },

    albumArt: {
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: T.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 32,
        shadowColor: T.primary, shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.14, shadowRadius: 24, elevation: 8,
    },
    title: {
        fontFamily: 'Lora_600SemiBold', fontSize: 22, color: T.textDark,
        textAlign: 'center', lineHeight: 30,
    },
    categoryBadge: {
        marginTop: 10, marginBottom: 8,
        backgroundColor: T.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4,
    },
    categoryText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: T.primary },
    desc: { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: T.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 8 },

    progressArea: { width: '100%', marginTop: 28 },
    progressBarWrap: { width: '100%', paddingVertical: 10 },
    progressTrack: { height: 4, backgroundColor: T.inactive, borderRadius: 2, position: 'relative', overflow: 'visible' },
    progressFill: { height: 4, backgroundColor: T.primary, borderRadius: 2, position: 'absolute', top: 0, left: 0 },
    progressThumb: {
        width: 16, height: 16, borderRadius: 8, backgroundColor: T.primary,
        position: 'absolute', top: -6, marginLeft: -8,
    },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    timeText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: T.textMuted },

    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 32 },
    ctrlBtn: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder,
        alignItems: 'center', justifyContent: 'center',
    },
    playBtnLarge: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
        paddingLeft: 4,
        shadowColor: T.primary, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    },
    statusLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: T.textMuted, marginTop: 20 },

    primaryBtn: {
        marginTop: 24, backgroundColor: T.primary,
        paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
    },
    primaryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
});
