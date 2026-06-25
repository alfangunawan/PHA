import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { journalAPI } from '../../api';
import { LoadingState, EmptyState } from '../../components/LoadingState';

const C = { bg: '#fcfcfe', primary: '#8a9ccc', border: '#ecedf6', soft: '#f3f4f9', avatar: '#eef1f9', text: '#353b4a', body: '#3b4150', muted: '#9197aa', faint: '#aab0bf', danger: '#c45f5f', softDanger: '#fdeeee' };

const levelLabel: Record<string, string> = {
    rendah: 'Rendah', sedang: 'Sedang', tinggi: 'Tinggi', risiko_tinggi: 'Butuh Dukungan',
};

export default function JournalListScreen({ navigation }: any) {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await journalAPI.getEntries();
            setEntries(res.entries || []);
        } catch (error) {
            console.warn('Load journals failed', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    if (loading) return <LoadingState message="Memuat jurnal..." />;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View style={styles.headerIdentity}>
                    <View style={styles.headerAvatar}><Ionicons name="journal-outline" size={19} color={C.primary} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Jurnal Refleksi</Text>
                        <Text style={styles.subtitle}>Ruang aman untuk menulis dan memahami perasaanmu.</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.composeBtn} onPress={() => navigation.navigate('JournalEditor')} activeOpacity={0.85}>
                    <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.listWrap}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
            >
                {entries.length === 0 ? (
                    <View style={styles.emptyCard}><EmptyState message="Belum ada jurnal. Mulai tulis refleksi pertamamu." /></View>
                ) : entries.map(item => (
                    <TouchableOpacity key={item.id} style={[styles.threadCard, item.highRisk && styles.threadDanger]} onPress={() => navigation.navigate('JournalDetail', { entry: item })} activeOpacity={0.86}>
                        <View style={styles.avatar}><Ionicons name={item.highRisk ? 'heart-circle-outline' : 'chatbubble-ellipses-outline'} size={18} color={item.highRisk ? C.danger : C.primary} /></View>
                        <View style={styles.threadBody}>
                            <View style={styles.threadTop}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Jurnal tanpa judul'}</Text>
                                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</Text>
                            </View>
                            <Text numberOfLines={2} style={styles.preview}>{item.content}</Text>
                            <View style={styles.metaRow}>
                                <Text style={[styles.badge, item.highRisk && styles.badgeDanger]}>{levelLabel[item.anxietyLevel] || item.anxietyLevel}</Text>
                                <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.faint} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 18, paddingVertical: 14, borderBottomColor: '#f0f1f6', borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    headerAvatar: { width: 38, height: 38, borderRadius: 14, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', color: C.text },
    subtitle: { color: C.muted, marginTop: 3, fontSize: 12, lineHeight: 17 },
    composeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4 },
    listWrap: { flex: 1 },
    list: { padding: 18, gap: 12, paddingBottom: 88, flexGrow: 1 },
    emptyCard: { flex: 1, justifyContent: 'center' },
    threadCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderColor: C.border, borderWidth: 1, borderRadius: 22, padding: 13 },
    threadDanger: { backgroundColor: C.softDanger, borderColor: '#f4caca' },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    threadBody: { flex: 1, gap: 5 },
    threadTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1 },
    date: { color: C.faint, fontSize: 11, fontWeight: '700' },
    preview: { color: C.body, lineHeight: 19, fontSize: 13 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { overflow: 'hidden', backgroundColor: C.soft, color: C.primary, fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
    badgeDanger: { backgroundColor: '#fff3f3', color: C.danger },
    time: { color: C.muted, fontSize: 11 },
});
