import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { getSessions, ChatSession } from './chatService';

interface Props {
    navigation: any;
}

export default function HistoryScreen({ navigation }: Props) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderItem = ({ item }: { item: ChatSession }) => (
        <TouchableOpacity
            style={styles.sessionItem}
            onPress={() => navigation.navigate('ChatHistory', { sessionId: item.id })}
        >
            <View style={styles.sessionContent}>
                <Text style={styles.preview} numberOfLines={1}>{item.preview}</Text>
                <Text style={styles.date}>{formatDate(item.startedAt)}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Riwayat Chat</Text>

            {sessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada riwayat chat</Text>
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', padding: 20, color: '#333' },
    listContent: { paddingHorizontal: 15 },
    sessionItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sessionContent: { flex: 1 },
    preview: { fontSize: 16, color: '#333', marginBottom: 5 },
    date: { fontSize: 12, color: '#888' },
    arrow: { fontSize: 24, color: '#ccc' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#888' },
});
