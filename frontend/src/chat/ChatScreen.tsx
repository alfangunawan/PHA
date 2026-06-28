import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
    Alert, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, streamMessage, getHistory, createNewSession } from './chatService';
import { useAuthContext } from '../auth/AuthContext';
import { resolveChatRoute } from './chatGateUtils';

// Fun Blue palette
const PRIMARY = '#1A59A1';
const PRIMARY_DEEP = '#14457D';

const FB = {
    sheetBg: '#ffffff',
    headerSub: '#cfddf2',
    statusGreen: '#8fd0a8',
    tileBg: '#eaf1fa',
    tileBorder: '#dbe7f6',
    inputBorder: '#e3ebf6',
    textDark: '#243a5c',
    textSub: '#7689a6',
    textMuted: '#9aa7bd',
    bubbleText: '#243a5c',
    typingDim: '#9dbbe4',
};

const SUGGESTIONS: { text: string; Icon: React.FC }[] = [
    { text: 'Aku lagi banyak pikiran', Icon: SuggThinkingIcon },
    { text: 'Merasa cemas akhir-akhir ini', Icon: SuggAnxiousIcon },
    { text: 'Cuma butuh teman cerita', Icon: SuggTalkIcon },
];

function PHAChatIcon({ color = PRIMARY, size = 19 }: { color?: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 6.5C5 5.7 5.7 5 6.5 5h11C18.3 5 19 5.7 19 6.5v8C19 15.3 18.3 16 17.5 16H9l-4 3.5z"
                stroke={color}
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function SendIcon() {
    return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
            <Path d="M21 3 10.5 13.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M21 3 14.5 21l-4-7.5-7.5-4z" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ChevronLeftIcon() {
    return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
            <Path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function PencilIcon() {
    return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
            <Path d="M12 20h9" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function HistoryIcon() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M3 5v6h6" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3.5 11a9 9 0 1 1 .9 5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 8v4l3 2" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SuggThinkingIcon() {
    return (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3a7 7 0 0 0-4 12.7V18h8v-2.3A7 7 0 0 0 12 3z" stroke={PRIMARY} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M9.5 21h5" stroke={PRIMARY} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SuggAnxiousIcon() {
    return (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path d="M12 21s-7-4.5-9-9a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c-2 4.5-7 9-7 9z" stroke={PRIMARY} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
            <Path d="M3 12h4l2-4 3 7 2-4h5" stroke={PRIMARY} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SuggTalkIcon() {
    return (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path d="M17 8h2a2 2 0 0 1 2 2v9l-3.5-2.5H10a2 2 0 0 1-2-2" stroke={PRIMARY} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7l-4 3z" stroke={PRIMARY} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

interface Props {
    navigation: any;
    route: any;
}

export default function ChatScreen({ navigation, route }: Props) {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
    const flatListRef = useRef<FlatList>(null);
    const isAtBottomRef = useRef(true);

    const { gad7LoadingState, gad7Status } = useAuthContext();

    // Safety net: if reached without going through ChatGate
    useEffect(() => {
        if (gad7LoadingState !== 'ready') return;
        if (resolveChatRoute(gad7Status) === 'Gad7Onboarding') {
            navigation.replace('Gad7Onboarding');
        }
    }, [gad7LoadingState]);

    useEffect(() => { loadHistory(); }, []);

    const prevMessageCountRef = useRef(0);
    useEffect(() => {
        const newCount = messages.length;
        if (newCount > prevMessageCountRef.current) isAtBottomRef.current = true;
        prevMessageCountRef.current = newCount;
    }, [messages.length]);

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        isAtBottomRef.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 80;
    };

    const handleContentSizeChange = () => {
        if (isAtBottomRef.current) flatListRef.current?.scrollToEnd({ animated: false });
    };

    const loadHistory = async () => {
        try {
            const history = await getHistory();
            setMessages(history);
            if (history.length > 0 && history[history.length - 1].sessionId) {
                setCurrentSessionId(history[history.length - 1].sessionId);
            } else {
                const newSession = await createNewSession();
                setCurrentSessionId(newSession.id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        if (Platform.OS === 'web') {
            const confirmed = (window as any).confirm('Mulai percakapan baru? Chat saat ini akan tersimpan di history.');
            if (confirmed) startNewChat();
        } else {
            Alert.alert(
                'Chat Baru',
                'Mulai percakapan baru? Chat saat ini akan tersimpan di history.',
                [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Ya, Mulai Baru', onPress: startNewChat },
                ]
            );
        }
    };

    const startNewChat = async () => {
        try {
            const newSession = await createNewSession();
            setCurrentSessionId(newSession.id);
            setMessages([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSend = async (text?: string) => {
        const msgText = (text ?? inputText).trim();
        if (!msgText) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            message: msgText,
            timestamp: new Date().toISOString(),
        };
        const aiMsgId = (Date.now() + 1).toString();
        const aiPlaceholder: ChatMessage = {
            id: aiMsgId,
            sender: 'ai',
            message: '',
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg, aiPlaceholder]);
        setInputText('');
        setSending(true);

        try {
            await streamMessage(
                userMsg.message,
                currentSessionId,
                (chunk) => {
                    setMessages(prev => prev.map(m =>
                        m.id === aiMsgId ? { ...m, message: m.message + chunk } : m
                    ));
                },
                (final) => {
                    setSending(false);
                },
                (error) => {
                    console.error('Stream error:', error);
                    setMessages(prev => prev.map(m =>
                        m.id === aiMsgId ? { ...m, message: m.message + '\n\n[Maaf, koneksi terputus]' } : m
                    ));
                    setSending(false);
                }
            );
        } catch (error) {
            console.error('Send error:', error);
            setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, message: '[Gagal mengirim pesan]' } : m
            ));
            setSending(false);
        }
    };

    const isTyping = sending &&
        messages.length > 0 &&
        messages[messages.length - 1]?.sender === 'ai' &&
        messages[messages.length - 1]?.message === '';

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const renderItem = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';

        if (!isUser && item.message === '' && sending) {
            return (
                <View style={styles.aiBubbleRow}>
                    <View style={styles.phaAvatar}><PHAChatIcon size={16} /></View>
                    <View style={styles.typingBubble}>
                        <View style={[styles.dot, { backgroundColor: FB.typingDim }]} />
                        <View style={[styles.dot, { backgroundColor: PRIMARY }]} />
                        <View style={[styles.dot, { backgroundColor: FB.typingDim }]} />
                    </View>
                </View>
            );
        }

        if (isUser) {
            return (
                <View style={styles.userBubbleRow}>
                    <View style={styles.userBubble}>
                        <Text style={styles.userText}>{item.message}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.aiBubbleRow}>
                <View style={styles.phaAvatar}><PHAChatIcon size={16} /></View>
                <View style={styles.phaBubble}>
                    <Markdown style={markdownStyles}>{item.message}</Markdown>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={['left', 'right']}>
                <StatusBar barStyle="light-content" />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
            <StatusBar barStyle="light-content" />

            {/* App Bar — full-bleed Fun Blue */}
            <LinearGradient
                colors={[PRIMARY, PRIMARY_DEEP]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.appBar, { paddingTop: insets.top + 12 }]}
            >
                <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeftIcon />
                </TouchableOpacity>

                <View style={styles.appBarCenter}>
                    <View style={styles.phaAvatarLg}>
                        <PHAChatIcon color="#ffffff" size={20} />
                    </View>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={styles.phaName} numberOfLines={1}>SiBiru</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText} numberOfLines={1}>
                                {isTyping ? 'Sedang mengetik…' : 'Pendamping kamu'}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.appBarBtn} onPress={handleNewChat}>
                    <PencilIcon />
                </TouchableOpacity>

                <TouchableOpacity style={styles.riwayatBtn} onPress={() => navigation.navigate('History')}>
                    <HistoryIcon />
                    <Text style={styles.riwayatText}>Riwayat</Text>
                </TouchableOpacity>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.sheet}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {messages.length === 0 ? (
                    /* Empty state */
                    <View style={styles.emptyState}>
                        <View style={styles.greetIconBox}>
                            <PHAChatIcon size={28} />
                        </View>
                        <Text style={styles.greetingText}>Halo, bagaimana perasaanmu hari ini?</Text>
                        <Text style={styles.greetingSub}>
                            Aku di sini untuk mendengarkan, tanpa menghakimi. Ceritakan apa pun yang ada di pikiranmu.
                        </Text>
                        <View style={styles.suggestionsWrap}>
                            <Text style={styles.suggestLabel}>Mulai dengan</Text>
                            {SUGGESTIONS.map(({ text, Icon }) => (
                                <TouchableOpacity key={text} style={styles.suggChip} onPress={() => handleSend(text)}>
                                    <Icon />
                                    <Text style={styles.suggText}>{text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={() => (
                            <View style={styles.timeStampRow}>
                                <Text style={styles.timePillText}>Hari ini, {timeStr}</Text>
                            </View>
                        )}
                        style={styles.chatArea}
                        onScroll={handleScroll}
                        scrollEventThrottle={100}
                        onContentSizeChange={handleContentSizeChange}
                    />
                )}

                {/* Input Bar */}
                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 14) + 8 }]}>
                    <TouchableOpacity style={styles.plusBtn}>
                        <Ionicons name="add" size={24} color={FB.textSub} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Tulis apa yang ingin kamu ceritakan…"
                        placeholderTextColor={FB.textMuted}
                        multiline
                        maxLength={500}
                    />

                    <TouchableOpacity
                        style={[styles.sendBtn, sending && { opacity: 0.7 }]}
                        onPress={() => handleSend()}
                        disabled={sending}
                    >
                        {sending && !isTyping ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <SendIcon />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: PRIMARY },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: FB.sheetBg },

    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 18,
    },
    appBarBtn: {
        width: 40,
        height: 40,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    riwayatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        height: 40,
        paddingLeft: 11,
        paddingRight: 13,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    riwayatText: { fontSize: 12.5, fontWeight: '600', color: '#ffffff' },
    appBarCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, minWidth: 0 },
    phaAvatarLg: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    phaName: { fontFamily: 'Lora_500Medium', fontSize: 16, color: '#ffffff', lineHeight: 20 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: FB.statusGreen },
    statusText: { fontSize: 11, color: FB.headerSub },

    // White sheet overlapping header
    sheet: {
        flex: 1,
        backgroundColor: FB.sheetBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -14,
        overflow: 'hidden',
    },

    // Empty state
    emptyState: { flex: 1, padding: 24, paddingTop: 26 },
    greetIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: FB.tileBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    greetingText: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 25,
        lineHeight: 32,
        color: FB.textDark,
        letterSpacing: -0.2,
    },
    greetingSub: {
        fontSize: 13.5,
        lineHeight: 20,
        color: FB.textSub,
        marginTop: 10,
    },
    timePill: {
        alignSelf: 'center',
        backgroundColor: FB.tileBg,
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingVertical: 5,
        marginTop: 18,
    },
    timePillText: { fontSize: 11.5, color: FB.textSub },
    suggestionsWrap: { marginTop: 'auto' as any, paddingBottom: 8 },
    suggestLabel: {
        fontSize: 12,
        letterSpacing: 0.6,
        color: FB.textSub,
        fontWeight: '600',
        marginBottom: 12,
    },
    suggChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: FB.tileBg,
        borderWidth: 1,
        borderColor: FB.tileBorder,
        borderRadius: 16,
        paddingVertical: 13,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    suggText: { fontSize: 14, color: FB.textDark, flexShrink: 1 },

    // Chat list
    chatArea: { flex: 1 },
    listContent: { padding: 20, paddingBottom: 10, flexGrow: 1 },
    timeStampRow: {
        alignSelf: 'center',
        backgroundColor: FB.tileBg,
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingVertical: 5,
        marginBottom: 16,
    },

    // Bubbles
    aiBubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, maxWidth: '84%', marginBottom: 14 },
    phaAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: FB.tileBg,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    phaBubble: {
        backgroundColor: FB.tileBg,
        borderWidth: 1,
        borderColor: FB.tileBorder,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 15,
        flexShrink: 1,
    },
    typingBubble: {
        backgroundColor: FB.tileBg,
        borderWidth: 1,
        borderColor: FB.tileBorder,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 6,
        paddingVertical: 15,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dot: { width: 7, height: 7, borderRadius: 3.5 },

    userBubbleRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 14 },
    userBubble: {
        backgroundColor: PRIMARY,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 6,
        borderBottomLeftRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 15,
        maxWidth: '80%',
    },
    userText: { color: '#fff', fontSize: 14, lineHeight: 21 },

    // Input bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: FB.inputBorder,
        paddingHorizontal: 18,
        paddingTop: 13,
        backgroundColor: FB.sheetBg,
    },
    plusBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    textInput: {
        flex: 1,
        backgroundColor: FB.tileBg,
        borderWidth: 1,
        borderColor: FB.tileBorder,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 13,
        fontSize: 14,
        color: FB.textDark,
        maxHeight: 120,
    },
    sendBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.55,
        shadowRadius: 11,
        elevation: 6,
    },
});

const markdownStyles = StyleSheet.create({
    body: { fontSize: 14, lineHeight: 21, color: FB.bubbleText },
    heading1: { fontSize: 18, fontWeight: '700', marginVertical: 8, color: FB.textDark },
    heading2: { fontSize: 16, fontWeight: '600', marginVertical: 6, color: FB.textDark },
    strong: { fontWeight: '600' },
    em: { fontStyle: 'italic' },
    list_item: { marginVertical: 3 },
    bullet_list: { marginBottom: 8 },
    ordered_list: { marginBottom: 8 },
    code_inline: {
        backgroundColor: '#dbe7f6',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        borderRadius: 4,
        paddingHorizontal: 4,
    } as any,
    code_block: {
        backgroundColor: '#dbe7f6',
        padding: 10,
        borderRadius: 8,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginVertical: 6,
    } as any,
});
