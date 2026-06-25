import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { journalAPI } from '../../api';

const C = { bg: '#fcfcfe', primary: '#8a9ccc', border: '#ecedf6', input: '#f3f4f9', avatar: '#eef1f9', text: '#353b4a', body: '#3b4150', muted: '#9197aa', faint: '#aab0bf' };

export default function JournalEditorScreen({ navigation, route }: any) {
    const existing = route.params?.entry;
    const { height } = useWindowDimensions();
    const [title, setTitle] = useState(existing?.title || '');
    const [content, setContent] = useState(existing?.content || '');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!content.trim()) return Alert.alert('Jurnal kosong', 'Tuliskan isi jurnal terlebih dahulu.');
        setSaving(true);
        try {
            const payload = { title: title.trim() || undefined, content: content.trim() };
            const res = existing ? await journalAPI.updateEntry(existing.id, payload) : await journalAPI.createEntry(payload);
            navigation.replace('JournalDetail', { entry: res.entry });
        } catch (error: any) {
            Alert.alert('Gagal menyimpan', error?.response?.data?.error || 'Coba lagi nanti.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    <View style={styles.assistantRow}>
                        <View style={styles.avatar}><Ionicons name="chatbubble-ellipses-outline" size={17} color={C.primary} /></View>
                        <View style={styles.assistantBubble}>
                            <Text style={styles.promptTitle}>{existing ? 'Mari rapikan refleksimu.' : 'Aku siap mendengarkan.'}</Text>
                            <Text style={styles.promptText}>Apa yang kamu rasakan hari ini? Tulis bebas, PHA akan bantu membaca sinyal kecemasan secara rule-based.</Text>
                        </View>
                    </View>

                    <View style={styles.composerCard}>
                        <TextInput value={title} onChangeText={setTitle} placeholder="Judul opsional" placeholderTextColor={C.faint} style={styles.titleInput} />
                        <TextInput
                            value={content}
                            onChangeText={setContent}
                            placeholder="Tulis ceritamu di sini..."
                            placeholderTextColor={C.faint}
                            style={[styles.messageInput, { minHeight: Math.max(360, height * 0.62) }]}
                            multiline
                            scrollEnabled={false}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity disabled={saving} style={[styles.sendBtn, saving && { opacity: 0.7 }]} onPress={submit} activeOpacity={0.9}>
                        <Text style={styles.sendText}>{saving ? 'Menganalisis...' : 'Kirim & Analisis'}</Text>
                        <Ionicons name="send-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    flex: { flex: 1 },
    container: { padding: 18, gap: 14, paddingBottom: 88, flexGrow: 1 },
    assistantRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, maxWidth: '94%' },
    avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    assistantBubble: { flexShrink: 1, backgroundColor: '#fff', borderColor: C.border, borderWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 6, paddingVertical: 13, paddingHorizontal: 15, gap: 5 },
    promptTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
    promptText: { color: C.body, fontSize: 14, lineHeight: 21 },
    composerCard: { backgroundColor: '#fff', borderColor: C.border, borderWidth: 1, borderRadius: 24, padding: 12, gap: 10 },
    titleInput: { backgroundColor: C.input, borderColor: C.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 11, color: C.text, fontWeight: '700' },
    messageInput: { backgroundColor: C.input, borderColor: C.border, borderWidth: 1, borderRadius: 22, padding: 15, color: C.body, lineHeight: 22, fontSize: 14 },
    sendBtn: { alignSelf: 'flex-end', backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 11, elevation: 5 },
    sendText: { color: '#fff', fontWeight: '800' },
});
