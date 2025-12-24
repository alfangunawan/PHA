import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { ChatMessage, sendMessage, getHistory, createNewSession } from './chatService';

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

    // Configure header buttons
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={handleNewChat} style={styles.headerButton}>
                        <Text style={styles.headerIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.headerButton}>
                        <Text style={styles.headerIcon}>📋</Text>
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
            // Web specific confirmation
            const confirm = window.confirm('Mulai percakapan baru? Chat saat ini akan tersimpan di history.');
            if (confirm) {
                startNewChat();
            }
        } else {
            // Mobile native alert
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

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setSending(true);

        try {
            const newMessages = await sendMessage(userMsg.message);
            const aiMsg = newMessages.find(m => m.sender === 'ai');
            if (aiMsg) {
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                sender: 'ai',
                message: 'Maaf, pesan gagal terkirim.',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setSending(false);
        }
    };

    const renderItem = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>{item.message}</Text>
            </View>
        );
    };

    const renderEmptyChat = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.welcomeEmoji}>👋</Text>
            <Text style={styles.welcomeTitle}>Halo! Saya PHA</Text>
            <Text style={styles.welcomeText}>Asisten kesehatan pribadimu. Ceritakan apa yang kamu rasakan hari ini.</Text>
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            {/* Scrollable Chat Area */}
            <View style={styles.chatArea}>
                {messages.length === 0 ? (
                    renderEmptyChat()
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}
            </View>

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ceritakan harimu..."
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
                        {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        // Web strict resizing
        height: Platform.OS === 'web' ? 'calc(100vh - 64px)' : '100%',
    },
    chatArea: {
        flex: 1,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: {
        padding: 15,
        paddingBottom: 20,
        flexGrow: 1,
    },
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 2 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    text: { fontSize: 16, lineHeight: 22 },
    userText: { color: '#fff' },
    aiText: { color: '#333' },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#eee',
        alignItems: 'flex-end',
    },
    input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, fontSize: 16, maxHeight: 100 },
    sendButton: { backgroundColor: '#007AFF', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center' },
    sendText: { color: '#fff', fontWeight: 'bold' },
    headerButtons: { flexDirection: 'row', marginRight: 15 },
    headerButton: { padding: 8, marginLeft: 5 },
    headerIcon: { fontSize: 22 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, height: '100%' },
    welcomeEmoji: { fontSize: 60, marginBottom: 20 },
    welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    welcomeText: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
});
