import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { educationAPI } from '../../api';
import Button from '../../components/Button';
import { Typography, Spacing, BorderRadius } from '../../theme';

const SOURCES = ['youtube', 'tiktok', 'other'];

export default function ContentFormScreen({ route, navigation }: any) {
    const existing = route.params?.content;
    const { colors } = useTheme();
    const [title, setTitle] = useState(existing?.title || '');
    const [description, setDescription] = useState(existing?.description || '');
    const [source, setSource] = useState(existing?.source || 'youtube');
    const [url, setUrl] = useState(existing?.url || '');
    const [category, setCategory] = useState(existing?.category || '');
    const [thumbnailUrl, setThumbnailUrl] = useState(existing?.thumbnailUrl || '');
    const [loading, setLoading] = useState(false);

    const save = async () => {
        if (!title || !url || !category) {
            Alert.alert('Error', 'Judul, URL, dan kategori wajib diisi.');
            return;
        }
        setLoading(true);
        try {
            const payload = { title, description, source, url, category, thumbnailUrl: thumbnailUrl || undefined };
            if (existing) await educationAPI.updateContent(existing.id, payload);
            else await educationAPI.createContent(payload);
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Gagal menyimpan konten.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.heading, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    {existing ? 'Edit Konten' : 'Tambah Konten'}
                </Text>

                {[
                    { label: 'Judul *', value: title, setter: setTitle, placeholder: 'Judul konten' },
                    { label: 'Deskripsi', value: description, setter: setDescription, placeholder: 'Deskripsi singkat', multiline: true },
                    { label: 'URL *', value: url, setter: setUrl, placeholder: 'https://...' },
                    { label: 'Kategori *', value: category, setter: setCategory, placeholder: 'anxiety, stress, sleep...' },
                    { label: 'Thumbnail URL', value: thumbnailUrl, setter: setThumbnailUrl, placeholder: 'https://...' },
                ].map(({ label, value, setter, placeholder, multiline }) => (
                    <View key={label} style={styles.field}>
                        <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>{label}</Text>
                        <TextInput
                            value={value}
                            onChangeText={setter}
                            placeholder={placeholder}
                            placeholderTextColor={colors.mediumGray}
                            multiline={multiline}
                            numberOfLines={multiline ? 3 : 1}
                            style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body, height: multiline ? 80 : undefined }]}
                        />
                    </View>
                ))}

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Source *</Text>
                    <View style={styles.sourceRow}>
                        {SOURCES.map(s => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => setSource(s)}
                                style={[styles.sourceChip, { backgroundColor: source === s ? colors.softBlue : colors.lightGray }]}
                            >
                                <Text style={[styles.sourceText, { color: source === s ? colors.white : colors.darkGray, fontFamily: Typography.bodyMedium }]}>{s}</Text>
                            </TouchableOpacity>
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
    content: { padding: Spacing.lg },
    heading: { fontSize: Typography.sizes.xl, marginBottom: Spacing.lg },
    field: { marginBottom: Spacing.md },
    label: { fontSize: Typography.sizes.sm, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.sizes.base },
    sourceRow: { flexDirection: 'row', gap: Spacing.sm },
    sourceChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
    sourceText: { fontSize: Typography.sizes.sm },
    saveBtn: { marginTop: Spacing.md },
    cancelBtn: { marginTop: Spacing.sm },
});
