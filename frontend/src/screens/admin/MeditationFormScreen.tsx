import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, SafeAreaView,
    ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { meditationAPI } from '../../api';
import Button from '../../components/Button';
import { Typography, Spacing, BorderRadius } from '../../theme';

const CATEGORIES = [
    { key: 'sleep', label: 'Tidur', icon: 'moon-outline' },
    { key: 'focus', label: 'Fokus', icon: 'scan-circle-outline' },
    { key: 'anxiety', label: 'Cemas', icon: 'heart-outline' },
    { key: 'morning', label: 'Pagi', icon: 'sunny-outline' },
    { key: 'general', label: 'Umum', icon: 'leaf-outline' },
];

const COLORS = ['#C9B8E8', '#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#F87171'];

export default function MeditationFormScreen({ route, navigation }: any) {
    const existing = route.params?.session;
    const { colors } = useTheme();

    const [title, setTitle] = useState(existing?.title || '');
    const [description, setDescription] = useState(existing?.description || '');
    const [category, setCategory] = useState(existing?.category || 'general');
    const [audioUrl, setAudioUrl] = useState(existing?.audioUrl || '');
    const [thumbnailUrl, setThumbnailUrl] = useState(existing?.thumbnailUrl || '');
    const [durationsText, setDurationsText] = useState(
        existing?.durationOptions ? existing.durationOptions.join(', ') : '5, 10, 15'
    );
    const [colorTheme, setColorTheme] = useState(existing?.colorTheme || COLORS[0]);
    const [loading, setLoading] = useState(false);

    const save = async () => {
        if (!title || !durationsText) {
            Alert.alert('Error', 'Judul dan opsi durasi wajib diisi.');
            return;
        }
        const durationOptions = durationsText
            .split(',')
            .map((s: string) => Number(s.trim()))
            .filter((n: number) => !isNaN(n) && n > 0);
        if (durationOptions.length === 0) {
            Alert.alert('Error', 'Masukkan durasi yang valid, contoh: 5, 10, 15');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                title,
                description: description || undefined,
                category,
                audioUrl: audioUrl || undefined,
                thumbnailUrl: thumbnailUrl || undefined,
                durationOptions,
                colorTheme,
            };
            if (existing) {
                await meditationAPI.updateSession(existing.id, payload);
            } else {
                await meditationAPI.createSession(payload);
            }
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Gagal menyimpan sesi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.heading, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    {existing ? 'Edit Sesi Meditasi' : 'Tambah Sesi Meditasi'}
                </Text>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Judul *</Text>
                    <TextInput
                        value={title} onChangeText={setTitle}
                        placeholder="Contoh: Tidur Nyenyak Malam Ini"
                        placeholderTextColor={colors.mediumGray}
                        style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body }]}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Deskripsi</Text>
                    <TextInput
                        value={description} onChangeText={setDescription}
                        placeholder="Deskripsi sesi meditasi ini"
                        placeholderTextColor={colors.mediumGray}
                        multiline numberOfLines={3}
                        style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body, height: 80 }]}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Kategori *</Text>
                    <View style={styles.chipRow}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.key}
                                onPress={() => setCategory(cat.key)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: category === cat.key ? colors.lavender : colors.lightGray,
                                        borderColor: category === cat.key ? colors.lavenderDark : 'transparent',
                                        borderWidth: 1.5,
                                    },
                                ]}
                            >
                                <Ionicons name={cat.icon as any} size={15} color={category === cat.key ? colors.lavenderDark : colors.darkGray} />
                                <Text style={[styles.chipText, { color: category === cat.key ? colors.lavenderDark : colors.darkGray, fontFamily: Typography.bodyMedium }]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Opsi Durasi (menit, pisahkan koma) *</Text>
                    <TextInput
                        value={durationsText} onChangeText={setDurationsText}
                        placeholder="5, 10, 15"
                        placeholderTextColor={colors.mediumGray}
                        keyboardType="default"
                        style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body }]}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>URL Audio (opsional)</Text>
                    <TextInput
                        value={audioUrl} onChangeText={setAudioUrl}
                        placeholder="https://... atau /uploads/file.mp3"
                        placeholderTextColor={colors.mediumGray}
                        style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body }]}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>URL Thumbnail (opsional)</Text>
                    <TextInput
                        value={thumbnailUrl} onChangeText={setThumbnailUrl}
                        placeholder="https://..."
                        placeholderTextColor={colors.mediumGray}
                        style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body }]}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Warna Tema</Text>
                    <View style={styles.colorRow}>
                        {COLORS.map(c => (
                            <TouchableOpacity
                                key={c}
                                onPress={() => setColorTheme(c)}
                                style={[
                                    styles.colorDot,
                                    { backgroundColor: c },
                                    colorTheme === c && styles.colorDotSelected,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                <Button title={loading ? 'Menyimpan...' : 'Simpan'} onPress={save} loading={loading} style={styles.saveBtn} />
                <Button title="Batal" onPress={() => navigation.goBack()} variant="outline" style={styles.cancelBtn} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    content: { padding: Spacing.lg, paddingBottom: 40 },
    heading: { fontSize: Typography.sizes.xl, marginBottom: Spacing.lg },
    field: { marginBottom: Spacing.md },
    label: { fontSize: Typography.sizes.sm, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.sizes.base },
    chipRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
    chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', gap: 4 },
    chipText: { fontSize: Typography.sizes.sm },
    colorRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    colorDot: { width: 36, height: 36, borderRadius: 18 },
    colorDotSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
    saveBtn: { marginTop: Spacing.md },
    cancelBtn: { marginTop: Spacing.sm },
});
