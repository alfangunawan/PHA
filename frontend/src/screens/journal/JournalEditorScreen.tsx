import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { journalAPI } from '../../api';

// Fun Blue palette
const FB = {
    primary: '#1A59A1',
    primaryDeep: '#14457D',
    card: '#ffffff',
    cardBorder: '#e3ebf6',
    inputBg: '#f5f8fd',
    tileBg: '#eaf1fa',
    tileBorder: '#dbe7f6',
    headerSub: '#cfddf2',
    textDark: '#243a5c',
    textBody: '#3f567a',
    textSub: '#7689a6',
    faint: '#9aa7bd',
    counter: '#bcc8db',
};

const MAX = 2000;

export default function JournalEditorScreen({ navigation, route }: any) {
    const existing = route.params?.entry;
    const insets = useSafeAreaInsets();
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
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
            {/* App bar */}
            <LinearGradient
                colors={[FB.primary, FB.primaryDeep]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                <View style={styles.headerBar}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{existing ? 'Edit Jurnal' : 'Tulis Jurnal'}</Text>
                    <View style={styles.headerBtn} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>

                    {/* PHA greeting */}
                    <View style={styles.greetRow}>
                        <View style={styles.phaAvatar}>
                            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                <Path d="M5 6.5C5 5.7 5.7 5 6.5 5h11C18.3 5 19 5.7 19 6.5v8C19 15.3 18.3 16 17.5 16H9l-4 3.5z" stroke={FB.primary} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                        </View>
                        <View style={styles.greetBubble}>
                            <Text style={styles.greetTitle}>{existing ? 'Mari rapikan refleksimu.' : 'Aku siap mendengarkan.'}</Text>
                            <Text style={styles.greetText}>Apa yang kamu rasakan hari ini? Tulis bebas — PHA akan bantu membaca sinyal kecemasan.</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <View>
                        <Text style={styles.label}>Judul <Text style={styles.labelOpt}>(opsional)</Text></Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Beri judul singkat…"
                            placeholderTextColor={FB.faint}
                            style={styles.titleInput}
                        />
                    </View>

                    {/* Body */}
                    <View style={styles.bodyBlock}>
                        <Text style={styles.label}>Ceritamu</Text>
                        <View style={styles.bodyWrap}>
                            <TextInput
                                value={content}
                                onChangeText={(t) => setContent(t.slice(0, MAX))}
                                placeholder="Tulis apa pun yang ada di pikiranmu…"
                                placeholderTextColor={FB.faint}
                                style={styles.bodyInput}
                                multiline
                                textAlignVertical="top"
                            />
                            <Text style={styles.counter}>{content.length} / {MAX}</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Submit bar */}
                <View style={[styles.submitBar, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity disabled={saving} onPress={submit} activeOpacity={0.9}>
                        <LinearGradient colors={[FB.primary, FB.primaryDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.submitBtn, saving && { opacity: 0.7 }]}>
                            <Text style={styles.submitText}>{saving ? 'Menganalisis…' : 'Kirim & Analisis'}</Text>
                            <Ionicons name="send" size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: FB.primary },

    header: { paddingHorizontal: 18, paddingBottom: 26 },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: 'Lora_500Medium', fontSize: 17, color: '#fff' },

    sheet: { flex: 1, backgroundColor: FB.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -14 },
    container: { padding: 20, gap: 16, paddingBottom: 24, flexGrow: 1 },

    greetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    phaAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: FB.tileBg, alignItems: 'center', justifyContent: 'center' },
    greetBubble: { flex: 1, backgroundColor: FB.tileBg, borderWidth: 1, borderColor: FB.tileBorder, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 6, paddingVertical: 13, paddingHorizontal: 15 },
    greetTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14.5, color: FB.textDark },
    greetText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: '#5b6e8c', lineHeight: 20, marginTop: 5 },

    label: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, color: FB.textSub, marginBottom: 7 },
    labelOpt: { fontFamily: 'HankenGrotesk_400Regular', color: FB.faint },
    titleInput: { backgroundColor: FB.inputBg, borderWidth: 1, borderColor: FB.tileBorder, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: FB.textDark },

    bodyBlock: { flex: 1, minHeight: 0 },
    bodyWrap: { flex: 1, backgroundColor: FB.inputBg, borderWidth: 1, borderColor: FB.tileBorder, borderRadius: 18, padding: 16, minHeight: 240 },
    bodyInput: { flex: 1, fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: FB.textBody, lineHeight: 22, minHeight: 200, padding: 0 },
    counter: { position: 'absolute', right: 14, bottom: 12, fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: FB.counter },

    submitBar: { borderTopWidth: 1, borderTopColor: FB.cardBorder, paddingHorizontal: 20, paddingTop: 14, backgroundColor: FB.card },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, paddingVertical: 16, shadowColor: FB.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
    submitText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15.5, color: '#fff' },
});
