import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../../context/ThemeContext';
import { meditationAPI } from '../../api';
import TimerDisplay from '../../components/TimerDisplay';
import { Typography, Spacing, BorderRadius } from '../../theme';

export default function MeditationPlayerScreen({ route, navigation }: any) {
    const { session } = route.params;
    const { colors } = useTheme();

    const durations: number[] = session.durationOptions || [5, 10, 15];
    const [selectedDuration, setSelectedDuration] = useState(durations[0]);
    const [secondsLeft, setSecondsLeft] = useState(durations[0] * 60);
    const [playing, setPlaying] = useState(false);
    const [finished, setFinished] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef = useRef(0);

    const color = session.colorTheme || colors.lavender;

    useEffect(() => {
        setSecondsLeft(selectedDuration * 60);
        elapsedRef.current = 0;
        setFinished(false);
        if (playing) stopTimer();
    }, [selectedDuration]);

    useEffect(() => {
        return () => {
            stopTimer();
            if (soundRef.current) soundRef.current.unloadAsync();
        };
    }, []);

    const loadAndPlayAudio = async () => {
        if (!session.audioUrl) return;
        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
            const { sound } = await Audio.Sound.createAsync({ uri: session.audioUrl }, { shouldPlay: true, isLooping: true });
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

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlaying(false);
        if (soundRef.current) { soundRef.current.stopAsync(); soundRef.current.unloadAsync(); soundRef.current = null; }
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

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <TouchableOpacity style={styles.back} onPress={() => { stopTimer(); navigation.goBack(); }}>
                <Text style={[styles.backText, { color: colors.charcoal, fontFamily: Typography.body }]}>← Kembali</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    {session.title}
                </Text>
                <Text style={[styles.category, { color: colors.lavenderDark, fontFamily: Typography.bodyMedium }]}>
                    {session.category}
                </Text>

                <View style={[styles.timerCircle, { borderColor: color }]}>
                    {finished
                        ? <Text style={styles.doneEmoji}>✅</Text>
                        : <TimerDisplay seconds={secondsLeft} size="lg" />
                    }
                </View>

                <View style={styles.durationRow}>
                    {durations.map(d => (
                        <TouchableOpacity
                            key={d}
                            disabled={playing}
                            onPress={() => setSelectedDuration(d)}
                            style={[
                                styles.durationChip,
                                { backgroundColor: selectedDuration === d ? color : colors.lightGray }
                            ]}
                        >
                            <Text style={[
                                styles.durationText,
                                { color: selectedDuration === d ? colors.white : colors.darkGray, fontFamily: Typography.bodyMedium }
                            ]}>
                                {d} mnt
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {finished ? (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: colors.sageGreen }]} onPress={() => navigation.goBack()}>
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Selesai</Text>
                    </TouchableOpacity>
                ) : playing ? (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: colors.error }]} onPress={() => { stopTimer(); saveLog(false); }}>
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Pause</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={startTimer}>
                        <Text style={[styles.btnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>Mulai</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    back: { padding: Spacing.md },
    backText: { fontSize: Typography.sizes.base },
    content: { alignItems: 'center', padding: Spacing.lg },
    title: { fontSize: Typography.sizes.xl, textAlign: 'center' },
    category: { fontSize: Typography.sizes.sm, marginTop: 4, marginBottom: Spacing.xl },
    timerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
    doneEmoji: { fontSize: 48 },
    durationRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
    durationChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
    durationText: { fontSize: Typography.sizes.sm },
    btn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'], borderRadius: BorderRadius.full },
    btnText: { fontSize: Typography.sizes.md },
});
