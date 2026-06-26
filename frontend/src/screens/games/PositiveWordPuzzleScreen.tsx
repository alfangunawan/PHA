import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gamesAPI } from '../../api';
import { LoadingState } from '../../components/LoadingState';

// Fun Blue palette (selaras Beranda)
const FB = {
    bg: '#fcfcfe', card: '#ffffff', border: '#ecedf6', borderSoft: '#e1e5ee',
    primary: '#1A59A1', primaryDeep: '#14457D',
    text: '#353b4a', textDark: '#243a5c', body: '#3b4150',
    muted: '#9197aa', muted2: '#9aa7bd', faint: '#aab1c2',
    tint: '#e9f1fa', tintBorder: '#d9e6f6', tintText: '#3a5c87', hintBg: '#f5f8fc', hintBorder: '#e7eef8',
    tile: '#f1f2f8', tileText: '#7c8398', track: '#eef1f7',
    green: '#3f8f63', greenSoft: '#eaf6ef', greenBorder: '#cfe8da',
    error: '#c45f5f', errorSoft: '#fdeeee', errorBorder: '#f4caca',
};

type PuzzleItem = {
    id: string;
    scrambled: string;
    length: number;
    hintLetters?: string[];
    answer?: string;
    source?: string;
};

export default function PositiveWordPuzzleScreen({ navigation }: any) {
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [items, setItems] = useState<PuzzleItem[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hintStage, setHintStage] = useState(0);
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [startedAt, setStartedAt] = useState(Date.now());
    const [result, setResult] = useState<any>(null);
    const [limitInfo, setLimitInfo] = useState<{ dailyLimit: number; usedToday: number; remainingToday: number; limitReached: boolean } | null>(null);

    const current = items[currentIndex];
    const currentAnswer = current ? answers[current.id] || '' : '';
    const tileSize = useMemo(() => Math.max(34, Math.min(48, Math.floor((width - 96) / Math.max(5, current?.scrambled.length || 5)))), [width, current]);

    const start = async () => {
        setLoading(true);
        setResult(null);
        setAnswers({});
        setCurrentIndex(0);
        setHintStage(0);
        setFeedback(null);
        try {
            const res = await gamesAPI.startWordPuzzle({ maxWords: 6 });
            setLimitInfo({
                dailyLimit: res.dailyLimit || 6,
                usedToday: res.usedToday || 0,
                remainingToday: res.remainingToday || 0,
                limitReached: !!res.limitReached,
            });
            setSessionId(res.sessionId || '');
            setItems(res.items || []);
            setStartedAt(Date.now());
        } catch (error: any) {
            Alert.alert('Gagal memulai puzzle', error?.response?.data?.error || 'Coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { start(); }, []);

    const updateAnswer = (value: string) => {
        if (!current) return;
        setFeedback(null);
        setAnswers(prev => ({ ...prev, [current.id]: value.toUpperCase().replace(/[^A-Z]/g, '') }));
    };

    const revealHint = () => {
        if (!current) return;
        if (hintStage >= Math.min(2, current.hintLetters?.length || 0)) {
            setFeedback({ type: 'error', text: 'Hint untuk soal ini sudah maksimal.' });
            return;
        }
        setHintStage(prev => prev + 1);
        setFeedback(null);
    };

    const finish = async () => {
        if (!sessionId || submitting) return;
        try {
            setSubmitting(true);
            const durationSec = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
            const payload = {
                answers: items.map(item => ({ id: item.id, answer: answers[item.id] || '' })),
                durationSec,
            };
            const res = await gamesAPI.completeWordPuzzle(sessionId, payload);
            setResult(res);
            Alert.alert('Puzzle selesai', `Benar ${res.correctCount}/${res.totalWords}. XP: ${res.reward?.event?.xp || 0}, Poin: ${res.reward?.event?.points || 0}`);
        } catch (error: any) {
            Alert.alert('Gagal menyelesaikan', error?.response?.data?.error || 'Coba lagi nanti.');
        } finally {
            setSubmitting(false);
        }
    };

    const checkAnswer = async () => {
        if (!current) return;
        if (!currentAnswer.trim()) {
            setFeedback({ type: 'error', text: 'Isi jawaban terlebih dahulu.' });
            return;
        }

        const expectedPrefix = (current.hintLetters || []).join('').slice(0, hintStage);
        if (expectedPrefix && !currentAnswer.startsWith(expectedPrefix)) {
            setFeedback({ type: 'error', text: `Jawaban belum cocok dengan hint: ${expectedPrefix}` });
            return;
        }

        if (currentAnswer.length < current.length) {
            setFeedback({ type: 'error', text: `Jawaban harus ${current.length} huruf.` });
            return;
        }

        if (current.answer && currentAnswer !== current.answer) {
            setFeedback({ type: 'error', text: 'Jawaban belum tepat. Coba susun lagi atau gunakan hint.' });
            return;
        }

        if (currentIndex < items.length - 1) {
            setFeedback({ type: 'success', text: 'Jawaban disimpan. Lanjut ke soal berikutnya.' });
            setCurrentIndex(prev => prev + 1);
            setHintStage(0);
            return;
        }

        await finish();
    };

    if (loading) return <LoadingState message="Menyiapkan tebak kata..." />;

    const hintText = current?.hintLetters?.slice(0, hintStage).join('') || '';
    const progress = items.length ? ((currentIndex + 1) / items.length) * 100 : 0;
    const isLast = currentIndex === items.length - 1;
    const locked = submitting || !!result;

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={20} color="#5a6173" />
                    </TouchableOpacity>
                    <View style={styles.topBadge}><Text style={styles.topBadgeText}>Aa</Text></View>
                    <View style={styles.flex}>
                        <Text style={styles.topTitle}>Tebak Kata Positif</Text>
                        <Text style={styles.topSub}>Word Puzzle</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={styles.introCard}>
                        <View style={styles.introIcon}><Ionicons name="sparkles" size={17} color="#fff" /></View>
                        <Text style={styles.introText}>Aku akan memberi satu kata acak. Susun pelan-pelan, gunakan hint kalau perlu, lalu kumpulkan XP setelah selesai.</Text>
                    </View>

                    <View style={styles.progressCard}>
                        <View style={styles.progressTop}>
                            <Text style={styles.progressText}>Soal {items.length ? Math.min(currentIndex + 1, items.length) : 0} / {items.length || 0}</Text>
                            {!!limitInfo && <Text style={styles.limitText}>Sisa hari ini <Text style={styles.limitNum}>{limitInfo.remainingToday}</Text></Text>}
                        </View>
                        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
                    </View>

                    {!current ? (
                        <View style={styles.questionCard}>
                            <Text style={styles.qTitle}>Belum ada soal yang tersedia</Text>
                            <Text style={styles.metaText}>Coba mulai ulang sesi untuk mengambil kata positif baru.</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.questionCard}>
                                <View style={styles.qHeader}>
                                    <View style={styles.numberBadge}><Text style={styles.numberText}>{currentIndex + 1}</Text></View>
                                    <View style={styles.flex}>
                                        <Text style={styles.qTitle}>Susun huruf ini</Text>
                                        <Text style={styles.metaText}>{current.length} huruf • {current.source === 'personal' ? 'dari jurnalmu' : 'dari PHA'}</Text>
                                    </View>
                                </View>

                                <View style={styles.lettersWrap}>
                                    {current.scrambled.split('').map((letter, letterIndex) => (
                                        <View key={`${current.id}-${letterIndex}`} style={[styles.letterTile, { width: tileSize, height: tileSize, borderRadius: Math.max(12, tileSize / 3) }]}>
                                            <Text style={[styles.letter, { fontSize: Math.max(18, tileSize * 0.5) }]}>{letter}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.hintBox}>
                                    <Ionicons name="bulb-outline" size={16} color={FB.primary} />
                                    <Text style={styles.hintBoxText}>
                                        <Text style={styles.hintBoxStrong}>{hintText ? `Hint: dimulai dengan ${hintText}. ` : 'Hint tersedia: '}</Text>
                                        {hintText ? '' : 'huruf pertama lalu kedua.'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.composerCard}>
                                <TextInput
                                    value={currentAnswer}
                                    onChangeText={updateAnswer}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    maxLength={current.length}
                                    placeholder="Tulis jawaban…"
                                    placeholderTextColor={FB.faint}
                                    style={styles.input}
                                />
                                <TouchableOpacity disabled={locked} style={[styles.sendBtn, locked && styles.disabled]} onPress={checkAnswer}>
                                    <Ionicons name={isLast ? 'ribbon-outline' : 'arrow-forward'} size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {feedback && (
                                <View style={[styles.feedbackCard, feedback.type === 'error' ? styles.errorCard : styles.successCard]}>
                                    <Ionicons name={feedback.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color={feedback.type === 'error' ? FB.error : FB.green} />
                                    <Text style={[styles.feedbackText, { color: feedback.type === 'error' ? FB.error : FB.green }]}>{feedback.text}</Text>
                                </View>
                            )}

                            <View style={styles.actions}>
                                <TouchableOpacity disabled={hintStage >= 2} style={[styles.hintBtn, hintStage >= 2 && styles.disabled]} onPress={revealHint}>
                                    <Ionicons name="bulb-outline" size={16} color={FB.primary} />
                                    <Text style={styles.hintBtnText}>{hintStage === 0 ? 'Hint 1' : hintStage === 1 ? 'Hint 2' : 'Hint maksimal'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity disabled={locked} style={[styles.primaryBtn, locked && styles.disabled]} onPress={checkAnswer}>
                                    <Text style={styles.primaryBtnText}>{isLast ? (submitting ? 'Mengirim…' : 'Selesai') : 'Lanjut'}</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {result && (
                        <View style={[styles.feedbackCard, styles.successCard]}>
                            <Ionicons name="ribbon" size={18} color={FB.green} />
                            <View style={styles.flex}>
                                <Text style={[styles.feedbackText, { color: FB.green }]}>Puzzle selesai • Benar {result.correctCount}/{result.totalWords} • Skor {result.score}</Text>
                                {result.reward?.event && <Text style={styles.reward}>+{result.reward.event.xp} XP • +{result.reward.event.points} poin</Text>}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={styles.reloadBtn} onPress={start}>
                        <Ionicons name="refresh" size={16} color={FB.tileText} />
                        <Text style={styles.reloadText}>{result ? 'Main Lagi' : 'Muat Ulang Soal'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: FB.bg },
    flex: { flex: 1 },
    container: { padding: 18, gap: 14, paddingBottom: 44 },

    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: FB.tile, alignItems: 'center', justifyContent: 'center' },
    topBadge: { width: 40, height: 40, borderRadius: 13, backgroundColor: FB.tint, alignItems: 'center', justifyContent: 'center' },
    topBadgeText: { fontFamily: 'Lora_600SemiBold', fontSize: 17, color: FB.primary },
    topTitle: { fontFamily: 'Lora_500Medium', fontSize: 19, color: FB.text, letterSpacing: -0.2 },
    topSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: FB.muted, marginTop: 2 },

    introCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: FB.tint, borderColor: FB.tintBorder, borderWidth: 1, borderRadius: 20, padding: 15 },
    introIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: FB.primary, alignItems: 'center', justifyContent: 'center' },
    introText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: FB.tintText, lineHeight: 20 },

    progressCard: { backgroundColor: FB.card, borderColor: FB.border, borderWidth: 1, borderRadius: 20, padding: 15, gap: 11, shadowColor: FB.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2 },
    progressTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    progressText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: FB.text },
    limitText: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: FB.muted },
    limitNum: { fontFamily: 'Inter_600SemiBold', color: FB.primary },
    progressTrack: { height: 8, backgroundColor: FB.track, borderRadius: 99, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: FB.primary, borderRadius: 99 },

    questionCard: { backgroundColor: FB.card, borderColor: FB.border, borderWidth: 1, borderRadius: 22, padding: 18, gap: 16, shadowColor: FB.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2 },
    qHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    numberBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: FB.primary, alignItems: 'center', justifyContent: 'center' },
    numberText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
    qTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: FB.text },
    metaText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: FB.muted2, marginTop: 2 },
    lettersWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, justifyContent: 'center' },
    letterTile: { backgroundColor: FB.tint, borderColor: FB.tintBorder, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    letter: { fontFamily: 'Lora_600SemiBold', color: FB.primary },
    hintBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: FB.hintBg, borderColor: FB.hintBorder, borderWidth: 1, borderRadius: 14, padding: 12 },
    hintBoxText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12.5, color: '#5a6f8c', lineHeight: 18 },
    hintBoxStrong: { fontFamily: 'Inter_600SemiBold', color: FB.primary },

    composerCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: FB.card, borderColor: FB.borderSoft, borderWidth: 1, borderRadius: 18, padding: 7, paddingLeft: 16, shadowColor: FB.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2 },
    input: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, color: FB.text, letterSpacing: 1.5, paddingVertical: 10 },
    sendBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: FB.primary, alignItems: 'center', justifyContent: 'center', shadowColor: FB.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 4 },

    feedbackCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 13 },
    errorCard: { backgroundColor: FB.errorSoft, borderColor: FB.errorBorder },
    successCard: { backgroundColor: FB.greenSoft, borderColor: FB.greenBorder },
    feedbackText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
    reward: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: FB.green, marginTop: 2 },

    actions: { flexDirection: 'row', gap: 11 },
    hintBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FB.card, borderColor: FB.borderSoft, borderWidth: 1, borderRadius: 15, paddingVertical: 13 },
    hintBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#5a6f8c' },
    primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FB.primary, borderRadius: 15, paddingVertical: 13, shadowColor: FB.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 4 },
    primaryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
    disabled: { opacity: 0.5 },

    reloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: FB.tile, borderRadius: 15, paddingVertical: 13 },
    reloadText: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5, color: FB.tileText },
});
