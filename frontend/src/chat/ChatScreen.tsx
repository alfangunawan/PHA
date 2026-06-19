import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
    Alert, SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, streamMessage, getHistory, createNewSession } from './chatService';
import Gad7Form from './Gad7Form';

const PRIMARY = '#8a9ccc';

const D = {
    bg: '#fcfcfe',
    appBarBorder: '#f0f1f6',
    cardBorder: '#ecedf6',
    inputBg: '#f3f4f9',
    textDark: '#3b4150',
    textSub: '#9197aa',
    textMuted: '#aab0bf',
    iconDim: '#5a6173',
    timePillBg: '#f1f2f8',
    suggBg: '#f3f4f9',
    phaAvatarBg: '#eef1f9',
};

const SUGGESTIONS = [
    'Aku lagi banyak pikiran',
    'Merasa cemas akhir-akhir ini',
    'Cuma butuh teman cerita',
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

interface Props {
    navigation: any;
    route: any;
}

export default function ChatScreen({ navigation, route }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
    const flatListRef = useRef<FlatList>(null);
    const isAtBottomRef = useRef(true);

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
                () => setSending(false),
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

        let parsedMessage: any = null;
        if (!isUser) {
            try { parsedMessage = JSON.parse(item.message); } catch { }
        }

        if (parsedMessage?.action === 'show_gad7') {
            return (
                <View style={styles.aiBubbleRow}>
                    <View style={styles.phaAvatar}><PHAChatIcon size={16} /></View>
                    <Gad7Form
                        data={parsedMessage.data}
                        sessionId={item.sessionId ?? ''}
                        onSubmitted={(aiMsg) => setMessages(prev => [...prev, aiMsg])}
                    />
                </View>
            );
        }

        if (!isUser && item.message === '' && sending) {
            return (
                <View style={styles.aiBubbleRow}>
                    <View style={styles.phaAvatar}><PHAChatIcon size={16} /></View>
                    <View style={styles.typingBubble}>
                        <View style={[styles.dot, { backgroundColor: '#c0c6d5' }]} />
                        <View style={[styles.dot, { backgroundColor: '#aab0bf' }]} />
                        <View style={[styles.dot, { backgroundColor: '#c0c6d5' }]} />
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
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>

            {/* App Bar */}
            <View style={styles.appBar}>
                <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={22} color={D.iconDim} />
                </TouchableOpacity>

                <View style={styles.appBarCenter}>
                    <View style={styles.phaAvatarLg}>
                        <PHAChatIcon color={PRIMARY} size={19} />
                    </View>
                    <View>
                        <Text style={styles.phaName}>PHA</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>
                                {isTyping ? 'Sedang mengetik…' : 'Pendamping kamu'}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.appBarBtn} onPress={handleNewChat}>
                    <Ionicons name="ellipsis-horizontal" size={22} color={D.iconDim} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {messages.length === 0 ? (
                    /* Empty state */
                    <View style={styles.emptyState}>
                        <Text style={styles.greetingText}>Halo, bagaimana perasaanmu hari ini?</Text>
                        <View style={styles.timePill}>
                            <Text style={styles.timePillText}>Hari ini, {timeStr}</Text>
                        </View>
                        <View style={styles.suggestionsWrap}>
                            <Text style={styles.suggestLabel}>Mulai dengan</Text>
                            {SUGGESTIONS.map(s => (
                                <TouchableOpacity key={s} style={styles.suggChip} onPress={() => handleSend(s)}>
                                    <Text style={styles.suggText}>{s}</Text>
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
                <View style={styles.inputBar}>
                    <TouchableOpacity style={styles.plusBtn}>
                        <Ionicons name="add" size={24} color={D.textSub} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Tulis apa yang ingin kamu ceritakan…"
                        placeholderTextColor={D.textMuted}
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
    safe: { flex: 1, backgroundColor: D.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    appBar: {
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: D.appBarBorder,
        backgroundColor: D.bg,
    },
    appBarBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    phaAvatarLg: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: D.phaAvatarBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    phaName: { fontFamily: 'Lora_500Medium', fontSize: 16, color: D.textDark, lineHeight: 20 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY },
    statusText: { fontSize: 11, color: D.textSub },

    // Empty state
    emptyState: { flex: 1, padding: 24, paddingTop: 24 },
    greetingText: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 25,
        lineHeight: 32,
        color: '#353b4a',
        letterSpacing: -0.2,
    },
    timePill: {
        alignSelf: 'center',
        backgroundColor: D.timePillBg,
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingVertical: 5,
        marginTop: 18,
    },
    timePillText: { fontSize: 11.5, color: D.textSub },
    suggestionsWrap: { marginTop: 'auto' as any, paddingBottom: 8 },
    suggestLabel: {
        fontSize: 12,
        letterSpacing: 0.4,
        color: '#a4aabc',
        fontWeight: '600',
        marginBottom: 12,
    },
    suggChip: {
        backgroundColor: D.suggBg,
        borderWidth: 1,
        borderColor: D.cardBorder,
        borderRadius: 16,
        paddingVertical: 13,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    suggText: { fontSize: 14, color: '#525a6b' },

    // Chat list
    chatArea: { flex: 1 },
    listContent: { padding: 20, paddingBottom: 10, flexGrow: 1 },
    timeStampRow: {
        alignSelf: 'center',
        backgroundColor: D.timePillBg,
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
        backgroundColor: D.phaAvatarBg,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    phaBubble: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: D.cardBorder,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 15,
        flexShrink: 1,
    },
    typingBubble: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: D.cardBorder,
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
        borderTopColor: D.cardBorder,
        paddingHorizontal: 18,
        paddingTop: 13,
        paddingBottom: Platform.OS === 'ios' ? 26 : 22,
        backgroundColor: D.bg,
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
        backgroundColor: D.inputBg,
        borderWidth: 1,
        borderColor: D.cardBorder,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 13,
        fontSize: 14,
        color: D.textDark,
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
    body: { fontSize: 14, lineHeight: 21, color: D.textDark },
    heading1: { fontSize: 18, fontWeight: '700', marginVertical: 8 },
    heading2: { fontSize: 16, fontWeight: '600', marginVertical: 6 },
    strong: { fontWeight: '600' },
    em: { fontStyle: 'italic' },
    list_item: { marginVertical: 3 },
    bullet_list: { marginBottom: 8 },
    ordered_list: { marginBottom: 8 },
    code_inline: {
        backgroundColor: '#f1f2f8',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        borderRadius: 4,
        paddingHorizontal: 4,
    } as any,
    code_block: {
        backgroundColor: '#f1f2f8',
        padding: 10,
        borderRadius: 8,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginVertical: 6,
    } as any,
});
