import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gamesAPI } from '../../api';
import { LoadingState } from '../../components/LoadingState';

const C = { bg: '#fcfcfe', card: '#fff', border: '#ecedf6', primary: '#8a9ccc', text: '#353b4a', body: '#3b4150', muted: '#9197aa', faint: '#aab0bf', soft: '#f3f4f9', avatar: '#eef1f9', green: '#8AAD83', greenSoft: '#f1f8ef', lavender: '#9387c8', lavenderSoft: '#f1eefa', error: '#c45f5f', errorSoft: '#fdeeee' };

type PuzzleItem = {
    id: string;
    scrambled: string;
    length: number;
    hintLetters?: string[];
    answer?: string;
    source?: string;
};

export default function PositiveWordPuzzleScreen() {
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

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <AssistantBubble icon="text-outline">
                        <Text style={styles.title}>Tebak Kata Positif</Text>
                        <Text style={styles.bubbleText}>Aku akan memberi satu kata acak. Susun pelan-pelan, gunakan hint kalau perlu, lalu kumpulkan XP setelah selesai.</Text>
                    </AssistantBubble>

                    <View style={styles.progressBubble}>
                        <View style={styles.progressTop}>
                            <Text style={styles.progressText}>Soal {items.length ? Math.min(currentIndex + 1, items.length) : 0}/{items.length || 0}</Text>
                            {!!limitInfo && <Text style={styles.limitText}>Sisa hari ini {limitInfo.remainingToday}</Text>}
                        </View>
                        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
                    </View>

                    {!current ? (
                        <AssistantBubble icon="refresh-outline">
                            <Text style={styles.bubbleTitle}>Belum ada soal yang tersedia</Text>
                            <Text style={styles.bubbleText}>Coba mulai ulang sesi untuk mengambil kata positif baru.</Text>
                        </AssistantBubble>
                    ) : (
                        <>
                            <AssistantBubble icon="sparkles-outline">
                                <View style={styles.cardHeader}>
                                    <View style={styles.numberBadge}><Text style={styles.numberText}>{currentIndex + 1}</Text></View>
                                    <View style={styles.cardTitleWrap}>
                                        <Text style={styles.bubbleTitle}>Susun huruf ini</Text>
                                        <Text style={styles.metaText}>{current.length} huruf • {current.source === 'personal' ? 'dari jurnalmu' : 'dari PHA'}</Text>
                                    </View>
                                </View>

                                <View style={styles.lettersWrap}>
                                    {current.scrambled.split('').map((letter, letterIndex) => (
                                        <View key={`${current.id}-${letterIndex}`} style={[styles.letterTile, { width: tileSize, height: tileSize, borderRadius: Math.max(10, tileSize / 3) }]}>
                                            <Text style={[styles.letter, { fontSize: Math.max(16, tileSize * 0.42) }]}>{letter}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.hintBox}>
                                    <Ionicons name="bulb-outline" size={17} color={C.lavender} />
                                    <Text style={styles.hintBoxText}>{hintText ? `Hint: dimulai dengan ${hintText}` : 'Hint tersedia: huruf pertama lalu kedua'}</Text>
                                </View>
                            </AssistantBubble>

                            <View style={styles.composerCard}>
                                <TextInput
                                    value={currentAnswer}
                                    onChangeText={updateAnswer}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    maxLength={current.length}
                                    placeholder="Tulis jawaban"
                                    placeholderTextColor={C.faint}
                                    style={styles.input}
                                />
                                <TouchableOpacity disabled={submitting || !!result} style={[styles.sendBtn, (submitting || !!result) && styles.disabled]} onPress={checkAnswer}>
                                    <Ionicons name={currentIndex === items.length - 1 ? 'ribbon-outline' : 'arrow-forward-outline'} size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {feedback && (
                                <AssistantBubble icon={feedback.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'} tone={feedback.type}>
                                    <Text style={[styles.bubbleText, feedback.type === 'error' ? styles.errorText : styles.successText]}>{feedback.text}</Text>
                                </AssistantBubble>
                            )}

                            <View style={styles.quickReplies}>
                                <TouchableOpacity disabled={hintStage >= 2} style={[styles.quickReply, hintStage >= 2 && styles.disabled]} onPress={revealHint}>
                                    <Ionicons name="bulb-outline" size={17} color={C.primary} />
                                    <Text style={styles.quickReplyText}>{hintStage === 0 ? 'Hint 1' : hintStage === 1 ? 'Hint 2' : 'Hint maksimal'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity disabled={submitting || !!result} style={[styles.primaryReply, (submitting || !!result) && styles.disabled]} onPress={checkAnswer}>
                                    <Text style={styles.primaryReplyText}>{currentIndex === items.length - 1 ? (submitting ? 'Mengirim...' : 'Selesai') : 'Lanjut'}</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {result && (
                        <AssistantBubble icon="ribbon-outline" tone="success">
                            <Text style={styles.bubbleTitle}>Puzzle selesai</Text>
                            <Text style={styles.bubbleText}>Benar {result.correctCount}/{result.totalWords} • Skor {result.score}</Text>
                            {result.reward?.event && <Text style={styles.reward}>+{result.reward.event.xp} XP • +{result.reward.event.points} poin</Text>}
                        </AssistantBubble>
                    )}

                    <TouchableOpacity style={styles.secondaryBtn} onPress={start}>
                        <Ionicons name="refresh-outline" size={18} color={C.primary} />
                        <Text style={styles.secondaryText}>{result ? 'Main Lagi' : 'Muat Ulang Soal'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function AssistantBubble({ icon, tone, children }: { icon: any; tone?: 'error' | 'success'; children: React.ReactNode }) {
    const danger = tone === 'error';
    const success = tone === 'success';
    return (
        <View style={styles.assistantRow}>
            <View style={[styles.avatar, danger && styles.avatarError, success && styles.avatarSuccess]}><Ionicons name={icon} size={17} color={danger ? C.error : success ? C.green : C.primary} /></View>
            <View style={[styles.assistantBubble, danger && styles.errorBubble, success && styles.successBubble]}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    flex: { flex: 1 },
    container: { padding: 18, gap: 14, paddingBottom: 44 },
    assistantRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, maxWidth: '96%' },
    avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    avatarError: { backgroundColor: C.errorSoft },
    avatarSuccess: { backgroundColor: C.greenSoft },
    assistantBubble: { flexShrink: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 6, paddingVertical: 13, paddingHorizontal: 15, gap: 10 },
    errorBubble: { backgroundColor: C.errorSoft, borderColor: '#f4caca' },
    successBubble: { backgroundColor: C.greenSoft, borderColor: '#dcefd7' },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    bubbleTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
    bubbleText: { color: C.body, lineHeight: 21, fontSize: 14 },
    progressBubble: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 20, padding: 14, gap: 9 },
    progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    progressText: { color: C.text, fontWeight: '800' },
    limitText: { color: C.muted, fontSize: 12, fontWeight: '700' },
    progressTrack: { height: 8, backgroundColor: C.soft, borderRadius: 99, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 99 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    numberBadge: { width: 32, height: 32, borderRadius: 12, backgroundColor: C.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
    numberText: { color: C.lavender, fontWeight: '900' },
    cardTitleWrap: { flex: 1 },
    metaText: { color: C.muted, fontSize: 12, marginTop: 2, fontWeight: '700' },
    lettersWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    letterTile: { backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', borderColor: C.border, borderWidth: 1 },
    letter: { color: C.primary, fontWeight: '900' },
    hintBox: { backgroundColor: C.lavenderSoft, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    hintBoxText: { color: C.lavender, flex: 1, fontWeight: '800', fontSize: 12, lineHeight: 17 },
    composerCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 6, borderColor: C.border, borderWidth: 1, padding: 10, alignSelf: 'flex-end', maxWidth: '94%' },
    input: { minWidth: 180, flex: 1, backgroundColor: C.soft, borderColor: C.border, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, color: C.text, fontWeight: '900', letterSpacing: 1.5 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4 },
    quickReplies: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
    quickReply: { backgroundColor: C.soft, borderColor: C.border, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
    quickReplyText: { color: C.primary, fontWeight: '800' },
    primaryReply: { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    primaryReplyText: { color: '#fff', fontWeight: '800' },
    disabled: { opacity: 0.55 },
    errorText: { color: C.error, fontWeight: '800' },
    successText: { color: C.green, fontWeight: '800' },
    reward: { color: C.green, fontWeight: '900' },
    secondaryBtn: { backgroundColor: C.soft, borderColor: C.border, borderWidth: 1, padding: 13, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    secondaryText: { color: C.primary, fontWeight: '800' },
});
