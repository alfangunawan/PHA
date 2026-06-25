import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { journalAPI } from '../../api';

const C = { bg: '#fcfcfe', primary: '#8a9ccc', border: '#ecedf6', soft: '#f3f4f9', avatar: '#eef1f9', text: '#353b4a', body: '#3b4150', muted: '#9197aa', danger: '#c45f5f', softDanger: '#fdeeee' };
const levelLabel: Record<string, string> = { rendah: 'Rendah', sedang: 'Sedang', tinggi: 'Tinggi', risiko_tinggi: 'Butuh Dukungan Segera' };

export default function JournalDetailScreen({ navigation, route }: any) {
    const entry = route.params?.entry;
    const analysis = entry?.analysis || {};
    const scores = analysis.skor_per_kategori || {};

    const remove = () => Alert.alert('Hapus jurnal?', 'Jurnal akan dihapus permanen.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: async () => { await journalAPI.deleteEntry(entry.id); navigation.goBack(); } },
    ]);

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.userRow}>
                    <View style={styles.userBubble}>
                        <Text style={styles.userTitle}>{entry?.title || 'Jurnal tanpa judul'}</Text>
                        <Text style={styles.userDate}>{entry?.createdAt ? new Date(entry.createdAt).toLocaleString('id-ID') : ''}</Text>
                        <Text style={styles.userContent}>{entry?.content}</Text>
                    </View>
                </View>

                <AssistantBubble icon={entry?.highRisk ? 'heart-circle-outline' : 'analytics-outline'} danger={entry?.highRisk}>
                    <Text style={[styles.bubbleTitle, entry?.highRisk && { color: C.danger }]}>{levelLabel[entry?.anxietyLevel] || entry?.anxietyLevel}</Text>
                    <Text style={styles.bubbleText}>Skor total: {analysis.totalScore ?? 0}</Text>
                </AssistantBubble>

                {entry?.highRisk && (
                    <AssistantBubble icon="heart-outline" danger>
                        <Text style={[styles.bubbleTitle, { color: C.danger }]}>Kamu tidak sendirian</Text>
                        <Text style={styles.bubbleText}>Jika kamu merasa tidak aman atau ada dorongan menyakiti diri, segera hubungi orang tepercaya, konselor kampus, keluarga, atau layanan darurat setempat. Minta seseorang menemani sekarang juga.</Text>
                    </AssistantBubble>
                )}

                <AssistantBubble icon="bar-chart-outline">
                    <Text style={styles.bubbleTitle}>Skor per kategori</Text>
                    {Object.keys(scores).length === 0 ? <Text style={styles.bubbleText}>Tidak ada kategori anxiety yang terdeteksi.</Text> : (
                        <View style={styles.scoreWrap}>
                            {Object.entries(scores).map(([key, value]) => <View key={key} style={styles.scoreChip}><Text style={styles.scoreKey}>{key}</Text><Text style={styles.scoreValue}>{String(value)}</Text></View>)}
                        </View>
                    )}
                </AssistantBubble>

                <AssistantBubble icon="sparkles-outline">
                    <Text style={styles.bubbleTitle}>Rekomendasi PHA</Text>
                    {(analysis.rekomendasi || []).map((rec: string, idx: number) => <Text key={idx} style={styles.bullet}>• {rec}</Text>)}
                </AssistantBubble>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('JournalEditor', { entry })}><Ionicons name="create-outline" size={17} color={C.primary} /><Text style={styles.secondaryText}>Edit</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={remove}><Ionicons name="trash-outline" size={17} color={C.danger} /><Text style={styles.deleteText}>Hapus</Text></TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function AssistantBubble({ icon, danger, children }: { icon: any; danger?: boolean; children: React.ReactNode }) {
    return (
        <View style={styles.assistantRow}>
            <View style={[styles.avatar, danger && styles.avatarDanger]}><Ionicons name={icon} size={17} color={danger ? C.danger : C.primary} /></View>
            <View style={[styles.assistantBubble, danger && styles.dangerBubble]}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 18, gap: 14, paddingBottom: 88 },
    userRow: { alignItems: 'flex-end' },
    userBubble: { maxWidth: '88%', backgroundColor: C.primary, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 6, padding: 15, gap: 7 },
    userTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
    userDate: { color: 'rgba(255,255,255,0.72)', fontSize: 11 },
    userContent: { color: '#fff', lineHeight: 22, fontSize: 14 },
    assistantRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, maxWidth: '96%' },
    avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    avatarDanger: { backgroundColor: C.softDanger },
    assistantBubble: { flexShrink: 1, backgroundColor: '#fff', borderColor: C.border, borderWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 6, paddingVertical: 13, paddingHorizontal: 15, gap: 7 },
    dangerBubble: { backgroundColor: C.softDanger, borderColor: '#f4caca' },
    bubbleTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
    bubbleText: { color: C.body, lineHeight: 21, fontSize: 14 },
    scoreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    scoreChip: { backgroundColor: C.soft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', gap: 6 },
    scoreKey: { color: C.body, fontSize: 12, fontWeight: '700' },
    scoreValue: { color: C.primary, fontSize: 12, fontWeight: '900' },
    bullet: { color: C.body, lineHeight: 21, fontSize: 14 },
    actions: { flexDirection: 'row', gap: 10 },
    secondaryBtn: { flex: 1, backgroundColor: C.soft, padding: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    secondaryText: { color: C.primary, fontWeight: '800' },
    deleteBtn: { flex: 1, backgroundColor: C.softDanger, padding: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    deleteText: { color: C.danger, fontWeight: '800' },
});
