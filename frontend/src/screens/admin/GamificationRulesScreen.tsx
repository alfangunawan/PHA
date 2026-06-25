import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gamificationAPI } from '../../api';
import { LoadingState } from '../../components/LoadingState';

const C = { bg: '#fcfcfe', card: '#fff', border: '#ecedf6', primary: '#8a9ccc', text: '#353b4a', body: '#3b4150', muted: '#9197aa', soft: '#f3f4f9', avatar: '#eef1f9', green: '#8AAD83' };
const LABELS: Record<string, string> = {
    BREATHING: 'Pernapasan', MEDITATION: 'Meditasi', EDUCATION_CONTENT: 'Konten Edukasi', AUDIO_CONTENT: 'Audio', JOURNAL_ENTRY: 'Jurnal', WORD_PUZZLE: 'Tebak Kata', TETRIS: 'Tetris',
};
const ICONS: Record<string, string> = {
    BREATHING: 'leaf-outline', MEDITATION: 'planet-outline', EDUCATION_CONTENT: 'book-outline', AUDIO_CONTENT: 'musical-notes-outline', JOURNAL_ENTRY: 'journal-outline', WORD_PUZZLE: 'text-outline', TETRIS: 'grid-outline',
};

export default function GamificationRulesScreen() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await gamificationAPI.getRules();
            setRules(res.rules || []);
        } catch (error: any) {
            Alert.alert('Gagal memuat aturan', error?.response?.data?.error || 'Coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const updateLocal = (activityType: string, patch: any) => setRules(prev => prev.map(rule => rule.activityType === activityType ? { ...rule, ...patch } : rule));
    const save = async (rule: any) => {
        setSaving(rule.activityType);
        try {
            const payload = { xp: Number(rule.xp) || 0, points: Number(rule.points) || 0, isActive: !!rule.isActive };
            const res = await gamificationAPI.updateRule(rule.activityType, payload);
            updateLocal(rule.activityType, res.rule);
            Alert.alert('Tersimpan', `Aturan ${LABELS[rule.activityType] || rule.activityType} diperbarui.`);
        } catch (error: any) {
            Alert.alert('Gagal menyimpan', error?.response?.data?.error || 'Coba lagi nanti.');
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <LoadingState message="Memuat aturan gamifikasi..." />;

    return (
        <SafeAreaView style={styles.safe}>
            <FlatList
                data={rules}
                keyExtractor={item => item.activityType}
                contentContainerStyle={styles.list}
                ListHeaderComponent={() => (
                    <View style={styles.headerRow}>
                        <View style={styles.headerIcon}><Ionicons name="ribbon-outline" size={22} color={C.primary} /></View>
                        <View style={styles.headerCopy}>
                            <Text style={styles.title}>Aturan XP & Poin</Text>
                            <Text style={styles.sub}>Admin gamifikasi dapat mengatur reward untuk tiap aktivitas.</Text>
                        </View>
                    </View>
                )}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardTop}>
                            <View style={styles.ruleInfo}>
                                <View style={styles.ruleIcon}><Ionicons name={(ICONS[item.activityType] || 'options-outline') as any} size={20} color={C.primary} /></View>
                                <View style={styles.ruleCopy}><Text style={styles.ruleTitle}>{LABELS[item.activityType] || item.activityType}</Text><Text style={styles.ruleSub}>{item.activityType}</Text></View>
                            </View>
                            <Switch
                                value={!!item.isActive}
                                onValueChange={value => updateLocal(item.activityType, { isActive: value })}
                                trackColor={{ false: '#d8dbe7', true: '#dbe1f3' }}
                                thumbColor={item.isActive ? C.primary : '#fff'}
                            />
                        </View>
                        <View style={styles.inputs}>
                            <View style={styles.inputGroup}><Text style={styles.label}>XP</Text><TextInput keyboardType="number-pad" value={String(item.xp)} onChangeText={text => updateLocal(item.activityType, { xp: text })} style={styles.input} /></View>
                            <View style={styles.inputGroup}><Text style={styles.label}>Poin</Text><TextInput keyboardType="number-pad" value={String(item.points)} onChangeText={text => updateLocal(item.activityType, { points: text })} style={styles.input} /></View>
                        </View>
                        <TouchableOpacity disabled={saving === item.activityType} onPress={() => save(item)} style={[styles.saveBtn, saving === item.activityType && styles.disabled]}>
                            <Ionicons name="save-outline" size={17} color="#fff" />
                            <Text style={styles.saveText}>{saving === item.activityType ? 'Menyimpan...' : 'Simpan'}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    list: { padding: 18, gap: 12, paddingBottom: 34 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 4 },
    headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    headerCopy: { flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 6, padding: 15, gap: 5 },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    sub: { color: C.body, lineHeight: 20, fontSize: 14 },
    card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 22, padding: 15, gap: 14 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    ruleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    ruleIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    ruleCopy: { flex: 1 },
    ruleTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
    ruleSub: { color: C.muted, fontSize: 12, marginTop: 2 },
    inputs: { flexDirection: 'row', gap: 12 },
    inputGroup: { flex: 1, gap: 6 },
    label: { color: C.muted, fontSize: 12, fontWeight: '800' },
    input: { backgroundColor: C.soft, borderColor: C.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 12, color: C.text, fontWeight: '800' },
    saveBtn: { backgroundColor: C.primary, padding: 13, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, shadowColor: C.primary, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 3 },
    disabled: { opacity: 0.6 },
    saveText: { color: '#fff', fontWeight: '800' },
});
