import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import Markdown from 'react-native-markdown-display';
import { ChatMessage, getSessionMessages } from './chatService';

// Fun Blue palette (shared with ChatScreen)
const PRIMARY = '#1A59A1';
const PRIMARY_DEEP = '#14457D';

const FB = {
    sheetBg: '#ffffff',
    headerSub: '#cfddf2',
    tileBg: '#eaf1fa',
    tileBorder: '#dbe7f6',
    footerBg: '#f7faff',
    inputBorder: '#e3ebf6',
    textDark: '#243a5c',
    textSub: '#7689a6',
    textMuted: '#9aa7bd',
};

function ChevronLeftIcon() {
    return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
            <Path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ChatIcon({ color = PRIMARY, size = 20 }: { color?: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 6.5C5 5.7 5.7 5 6.5 5h11C18.3 5 19 5.7 19 6.5v8C19 15.3 18.3 16 17.5 16H9l-4 3.5z"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function LockIcon() {
    return (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Rect x={4.5} y={11} width={15} height={9} rx={2} stroke={FB.textMuted} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={FB.textMuted} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

interface Props {
    navigation: any;
    route: any;
}

function formatDate(ts?: string): string {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(ts?: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
}

export default function ChatHistoryScreen({ navigation, route }: Props) {
    const insets = useSafeAreaInsets();
    const { sessionId, title: paramTitle, startedAt: paramStartedAt } = route.params;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadMessages(); }, [sessionId]);

    const loadMessages = async () => {
        try {
            const data = await getSessionMessages(sessionId);
            setMessages(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const firstTs = messages[0]?.timestamp;
    const title =
        paramTitle ||
        messages.find(m => m.sender === 'user')?.message ||
        'Percakapan';
    const dateLabel = formatDate(paramStartedAt || firstTs);
    const dateTimeLabel = formatDateTime(paramStartedAt || firstTs);

    const appBar = (
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
                <View style={styles.avatar}>
                    <ChatIcon color="#ffffff" size={20} />
                </View>
                <View style={{ flexShrink: 1 }}>
                    <Text style={styles.barTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.barSub} numberOfLines={1}>
                        SiBiru{dateLabel ? ` · ${dateLabel}` : ''}
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );

    const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isUser = item.sender === 'user';

        if (isUser) {
            return (
                <View style={styles.userBubbleRow}>
                    <View style={styles.userBubble}>
                        <Text style={styles.userText}>{item.message}</Text>
                    </View>
                </View>
            );
        }

        // AI bubble — show avatar only for first message in a SiBiru run
        const showAvatar = index === 0 || messages[index - 1]?.sender !== 'ai';
        return (
            <View style={styles.aiBubbleRow}>
                {showAvatar ? (
                    <View style={styles.aiAvatar}><ChatIcon size={16} /></View>
                ) : (
                    <View style={styles.aiAvatarSpacer} />
                )}
                <View style={styles.aiBubble}>
                    <Markdown style={markdownStyles}>{item.message}</Markdown>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
            <StatusBar barStyle="light-content" />
            {appBar}

            <View style={styles.sheet}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={PRIMARY} />
                    </View>
                ) : (
                    <FlatList
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            dateTimeLabel ? (
                                <View style={styles.datePillRow}>
                                    <Text style={styles.datePill}>{dateTimeLabel}</Text>
                                </View>
                            ) : null
                        }
                    />
                )}

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) + 12 }]}>
                    <LockIcon />
                    <Text style={styles.footerText}>Riwayat chat · hanya bisa dibaca</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: PRIMARY },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // App bar
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
    appBarCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, minWidth: 0 },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    barTitle: { fontFamily: 'Lora_500Medium', fontSize: 16, color: '#ffffff', lineHeight: 20 },
    barSub: { fontSize: 11, color: FB.headerSub, marginTop: 3 },

    // White sheet
    sheet: {
        flex: 1,
        backgroundColor: FB.sheetBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -14,
        overflow: 'hidden',
    },

    // List
    listContent: { padding: 20, paddingBottom: 14 },
    datePillRow: { alignItems: 'center', marginBottom: 14 },
    datePill: {
        fontSize: 11.5,
        color: FB.textSub,
        backgroundColor: FB.tileBg,
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingVertical: 5,
        overflow: 'hidden',
    },

    // Bubbles
    aiBubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, maxWidth: '84%', marginBottom: 14 },
    aiAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: FB.tileBg,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    aiAvatarSpacer: { width: 30, height: 30, flexShrink: 0 },
    aiBubble: {
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

    // Read-only footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderTopWidth: 1,
        borderTopColor: FB.inputBorder,
        backgroundColor: FB.footerBg,
        paddingTop: 14,
        paddingHorizontal: 18,
    },
    footerText: { fontSize: 12, color: FB.textMuted },
});

const markdownStyles = StyleSheet.create({
    body: { fontSize: 14, lineHeight: 21, color: FB.textDark },
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
