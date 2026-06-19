import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import { audioAPI } from '../../api';
import Button from '../../components/Button';
import { Typography, Spacing, BorderRadius } from '../../theme';

export default function AudioFormScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [file, setFile] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
            if (!result.canceled && result.assets?.length) setFile(result.assets[0]);
        } catch {
            Alert.alert('Error', 'Gagal memilih file audio.');
        }
    };

    const save = async () => {
        if (!title || !category || !file) {
            Alert.alert('Error', 'Judul, kategori, dan file audio wajib diisi.');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('audio', { uri: file.uri, name: file.name, type: file.mimeType || 'audio/mpeg' } as any);
            formData.append('title', title);
            formData.append('category', category);
            if (description) formData.append('description', description);
            if (duration) formData.append('duration', duration);
            await audioAPI.uploadAudio(formData);
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Gagal mengupload audio.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.heading, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    Upload Audio
                </Text>

                {[
                    { label: 'Judul *', value: title, setter: setTitle, placeholder: 'Judul audio' },
                    { label: 'Kategori *', value: category, setter: setCategory, placeholder: 'sleep, focus, anxiety...' },
                    { label: 'Deskripsi', value: description, setter: setDescription, placeholder: 'Deskripsi singkat', multiline: true },
                    { label: 'Durasi (detik)', value: duration, setter: setDuration, placeholder: '300', keyboard: 'numeric' as const },
                ].map(({ label, value, setter, placeholder, multiline, keyboard }) => (
                    <View key={label} style={styles.field}>
                        <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>{label}</Text>
                        <TextInput
                            value={value}
                            onChangeText={setter}
                            placeholder={placeholder}
                            placeholderTextColor={colors.mediumGray}
                            multiline={multiline}
                            keyboardType={keyboard}
                            style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body, height: multiline ? 80 : undefined }]}
                        />
                    </View>
                ))}

                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>File Audio *</Text>
                    <Button title={file ? file.name : 'Pilih File Audio'} onPress={pickFile} variant="outline" />
                </View>

                <Button title={loading ? 'Mengupload...' : 'Upload'} onPress={save} loading={loading} style={styles.saveBtn} />
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
    saveBtn: { marginTop: Spacing.md },
    cancelBtn: { marginTop: Spacing.sm },
});
