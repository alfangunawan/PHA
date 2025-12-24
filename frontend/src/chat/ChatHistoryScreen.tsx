import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { ChatMessage, getSessionMessages } from './chatService';

interface Props {
    route: any;
}

export default function ChatHistoryScreen({ route }: Props) {
    const { sessionId } = route.params;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadMessages();
    }, [sessionId]);

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

    const renderItem = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>{item.message}</Text>
            </View>
        );
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
            />
            <View style={styles.readOnlyBanner}>
                <Text style={styles.readOnlyText}>Riwayat chat (read-only)</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15, paddingBottom: 60 },
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 2 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    text: { fontSize: 16, lineHeight: 22 },
    userText: { color: '#fff' },
    aiText: { color: '#333' },
    readOnlyBanner: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f0f0f0', padding: 15, alignItems: 'center', borderTopWidth: 1, borderColor: '#ddd' },
    readOnlyText: { color: '#888', fontSize: 14 },
});
