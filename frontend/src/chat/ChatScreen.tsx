import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, SafeAreaView, Image } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage, sendMessage, streamMessage, getHistory, createNewSession } from './chatService';

interface Props {
    navigation: any;
    route: any;
}

export default function ChatScreen({ navigation, route }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    // Configure header options to be minimal as per design, mostly handled in-screen or via custom header
    useEffect(() => {
        navigation.setOptions({
            headerTitle: '',
            headerStyle: { backgroundColor: '#F8F9FA', shadowOpacity: 0, elevation: 0 },
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={handleNewChat} style={styles.headerButton}>
                        <Ionicons name="create-outline" size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation]);

    const loadHistory = async () => {
        try {
            const history = await getHistory();
            setMessages(history);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm('Mulai percakapan baru? Chat saat ini akan tersimpan di history.');
            if (confirm) startNewChat();
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
            await createNewSession();
            setMessages([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            message: inputText,
            timestamp: new Date().toISOString(),
        };

        const aiMsgId = (Date.now() + 1).toString();
        const aiMsgPlaceholder: ChatMessage = {
            id: aiMsgId,
            sender: 'ai',
            message: '',
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg, aiMsgPlaceholder]);
        setInputText('');
        setSending(true);

        try {
            await streamMessage(
                userMsg.message,
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

    const renderItem = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <Ionicons name="leaf" size={16} color="#48B096" />
                    </View>
                )}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    <View>
                        {isUser ? (
                            <Text style={styles.userText}>{item.message}</Text>
                        ) : (
                            <Markdown style={markdownStyles}>
                                {item.message}
                            </Markdown>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const GreetingHeader = () => (
        <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Halo, bagaimana</Text>
            <Text style={styles.greetingText}>perasaanmu hari ini?</Text>
            <View style={styles.dateBadge}>
                <Text style={styles.dateText}>Hari ini, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#48B096" /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.chatArea}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={messages.length === 0 ? GreetingHeader : null}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputWrapper}>
                    <TouchableOpacity style={styles.plusButton}>
                        <Ionicons name="add" size={24} color="#999" />
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Tulis apa yang ingin kamu ceritakan..."
                            placeholderTextColor="#aaa"
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
                            {sending && messages[messages.length - 1]?.sender !== 'ai' ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    headerButtons: { flexDirection: 'row', marginRight: 15 },
    headerButton: { padding: 8, marginLeft: 5 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatArea: { flex: 1 },
    listContent: { padding: 20, paddingBottom: 20 },

    greetingContainer: { marginBottom: 30, marginTop: 10 },
    greetingText: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50', lineHeight: 34 },
    dateBadge: { alignSelf: 'center', backgroundColor: '#F0F2F5', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 20 },
    dateText: { fontSize: 12, color: '#999' },

    messageRow: { flexDirection: 'row', marginBottom: 20, maxWidth: '100%' },
    userRow: { justifyContent: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },

    avatarContainer: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 10, alignSelf: 'flex-start' },

    bubble: { padding: 15, borderRadius: 20, maxWidth: '80%' },
    userBubble: { backgroundColor: '#E8F1F8', borderTopRightRadius: 5 }, // Light blue/gray
    aiBubble: { backgroundColor: '#E0F2F1', borderTopLeftRadius: 5 }, // Light green

    userText: { color: '#2C3E50', fontSize: 16, lineHeight: 22 },
    aiText: { color: '#2C3E50', fontSize: 16, lineHeight: 22 },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#f0f0f0',
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    },
    plusButton: { padding: 10, marginRight: 5 },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        paddingHorizontal: 5,
        paddingVertical: 5,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    input: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        color: '#333',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#48B096',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
});

const markdownStyles = StyleSheet.create({
    body: { fontSize: 16, lineHeight: 24, color: '#2C3E50' },
    heading1: { fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
    heading2: { fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
    strong: { fontWeight: 'bold' },
    em: { fontStyle: 'italic' },
    list_item: { marginVertical: 4 },
    bullet_list: { marginBottom: 10 },
    ordered_list: { marginBottom: 10 },
    code_inline: { backgroundColor: '#f0f0f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', borderRadius: 4, padding: 2 },
    code_block: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginVertical: 8 },
});
