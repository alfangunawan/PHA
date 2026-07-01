import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Alert,
    BackHandler, Animated, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { submitGad7 } from './chatService';
import { useAuthContext } from '../auth/AuthContext';

const PRIMARY = '#1A59A1';
const PRIMARY_DEEP = '#14457D';

const GAD7_QUESTIONS = [
    'Merasa gugup, cemas, atau tegang?',
    'Tidak mampu menghentikan atau mengendalikan rasa khawatir?',
    'Terlalu banyak khawatir tentang berbagai hal?',
    'Kesulitan untuk santai?',
    'Sangat gelisah sehingga sulit untuk duduk diam?',
    'Mudah tersinggung atau mudah marah?',
    'Merasa takut seolah-olah sesuatu yang buruk akan terjadi?',
];

const GAD7_OPTIONS = [
    { label: 'Tidak sama sekali', value: 0 },
    { label: 'Beberapa hari', value: 1 },
    { label: 'Lebih dari separuh hari', value: 2 },
    { label: 'Hampir setiap hari', value: 3 },
];

interface Props {
    navigation: any;
    route: any;
}

export default function Gad7OnboardingScreen({ navigation, route }: Props) {
    const insets = useSafeAreaInsets();
    const { refreshGad7Status } = useAuthContext();
    const retake: boolean = route?.params?.retake === true;
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>(new Array(7).fill(-1));
    const [submitting, setSubmitting] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Android hardware back: exit alert at Q0, go back at Q1+
    useFocusEffect(useCallback(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (currentQuestion > 0) {
                goBack();
            } else {
                showExitAlert();
            }
            return true;
        });
        return () => sub.remove();
    }, [currentQuestion]));

    const showExitAlert = () => {
        Alert.alert(
            'Keluar?',
            'Jawabanmu tidak akan disimpan.',
            [
                { text: 'Batal', style: 'cancel' },
                { text: 'Keluar', onPress: () => navigation.goBack() },
            ],
        );
    };

    const slideToNext = (callback: () => void) => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: -400, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            callback();
            slideAnim.setValue(400);
            Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
        });
    };

    const slideToPrev = (callback: () => void) => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: 400, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            callback();
            slideAnim.setValue(-400);
            Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
        });
    };

    const handleSelect = (value: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = value;
        setAnswers(newAnswers);
    };

    const goForward = () => {
        if (currentQuestion < 6) {
            // Clamp inside the updater: rapid taps during the slide animation
            // read a stale currentQuestion, so the bound must live here.
            slideToNext(() => setCurrentQuestion(q => Math.min(6, q + 1)));
        } else {
            handleSubmit();
        }
    };

    const goBack = () => {
        slideToPrev(() => setCurrentQuestion(q => Math.max(0, q - 1)));
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await submitGad7(answers, { retake });
            // Do NOT await refreshGad7Status here — that would hang the submit screen.
            // Refresh happens in Gad7ResultScreen before navigating to Chat.
            navigation.replace('Gad7Result', { severity: result.severity, retake });
        } catch (error: any) {
            if (error?.response?.status === 409 && error?.response?.data?.code === 'TOO_SOON') {
                // Already submitted recently — refresh and go to chat silently
                await refreshGad7Status();
                navigation.replace('Chat');
                return;
            }
            Alert.alert('Gagal', 'Gagal mengirim jawaban. Silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    const currentAnswer = answers[currentQuestion];
    const isAnswered = currentAnswer !== -1;
    const isLastQuestion = currentQuestion === 6;
    const progress = (currentQuestion + 1) / 7;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={currentQuestion === 0 ? showExitAlert : goBack}
                    style={styles.backBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text style={styles.backText}>{currentQuestion === 0 ? '✕' : '←'}</Text>
                </TouchableOpacity>
                <Text style={styles.progress}>{currentQuestion + 1} / 7</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            {/* Question */}
            <Animated.View
                style={[styles.content, { transform: [{ translateX: slideAnim }] }]}
            >
                <Text style={styles.preamble}>Dalam 2 minggu terakhir, seberapa sering kamu…</Text>
                <Text style={styles.question}>{GAD7_QUESTIONS[currentQuestion]}</Text>

                <View style={styles.options}>
                    {GAD7_OPTIONS.map(opt => {
                        const selected = currentAnswer === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.option, selected && styles.optionSelected]}
                                onPress={() => handleSelect(opt.value)}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.View>

            {/* Next / Submit button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[styles.nextBtn, !isAnswered && styles.nextBtnDisabled]}
                    onPress={goForward}
                    disabled={!isAnswered || submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.nextBtnText}>
                            {isLastQuestion ? 'Lihat Hasilku' : 'Lanjut →'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    backText: { fontSize: 20, color: '#243a5c' },
    progress: { fontSize: 13, color: '#7689a6', fontWeight: '600' },
    progressTrack: {
        height: 4,
        backgroundColor: '#eaf1fa',
        marginHorizontal: 20,
        borderRadius: 2,
    },
    progressFill: {
        height: 4,
        backgroundColor: PRIMARY,
        borderRadius: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 36,
    },
    preamble: {
        fontSize: 14,
        color: '#7689a6',
        marginBottom: 8,
    },
    question: {
        fontSize: 22,
        fontWeight: '700',
        color: '#243a5c',
        lineHeight: 30,
        marginBottom: 32,
        fontFamily: Platform.OS === 'ios' ? undefined : undefined,
    },
    options: { gap: 12 },
    option: {
        borderWidth: 1.5,
        borderColor: '#dbe7f6',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#f7faff',
    },
    optionSelected: {
        borderColor: PRIMARY,
        backgroundColor: '#eaf1fa',
    },
    optionText: { fontSize: 15, color: '#243a5c' },
    optionTextSelected: { color: PRIMARY, fontWeight: '600' },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    nextBtn: {
        backgroundColor: PRIMARY,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    nextBtnDisabled: { backgroundColor: '#a8c5e8' },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
