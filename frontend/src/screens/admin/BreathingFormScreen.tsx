import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, SafeAreaView,
    ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { breathingAPI } from '../../api';
import Button from '../../components/Button';
import { Typography, Spacing, BorderRadius } from '../../theme';

const COLORS = ['#A8C5DA', '#B2C9AD', '#C9B8E8', '#F5CBA7', '#F4B8C1', '#8DADA0'];
const ICONS = ['wind', 'moon', 'heart', 'star', 'sun', 'leaf', 'wave', 'fire', 'cloud', 'square'];

export default function BreathingFormScreen({ route, navigation }: any) {
    const existing = route.params?.technique;
    const { colors } = useTheme();

    const [name, setName] = useState(existing?.name || '');
    const [description, setDescription] = useState(existing?.description || '');
    const [inhale, setInhale] = useState(String(existing?.inhaleDuration || 4));
    const [hold, setHold] = useState(String(existing?.holdDuration || 0));
    const [exhale, setExhale] = useState(String(existing?.exhaleDuration || 6));
    const [holdAfter, setHoldAfter] = useState(String(existing?.holdAfterExhale || 0));
    const [cycles, setCycles] = useState(String(existing?.cycles || 4));
    const [colorTheme, setColorTheme] = useState(existing?.colorTheme || COLORS[0]);
    const [icon, setIcon] = useState(existing?.icon || 'wind');
    const [loading, setLoading] = useState(false);

    const save = async () => {
        if (!name || !inhale || !exhale) {
            Alert.alert('Error', 'Nama, durasi tarik napas, dan hembus wajib diisi.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name,
                description: description || undefined,
                inhaleDuration: Number(inhale),
                holdDuration: Number(hold) || 0,
                exhaleDuration: Number(exhale),
                holdAfterExhale: Number(holdAfter) || 0,
                cycles: Number(cycles) || 4,
                colorTheme,
                icon,
            };
            if (existing) {
                await breathingAPI.updateTechnique(existing.id, payload);
            } else {
                await breathingAPI.createTechnique(payload);
            }
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Gagal menyimpan teknik.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.heading, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    {existing ? 'Edit Teknik' : 'Tambah Teknik Napas'}
                </Text>

                {/* Nama */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Nama Teknik *</Text>
                    <TextInput
                        value={name} onChangeText={setName}
                        placeholder="Contoh: Pernapasan 4-7-8"
                        placeholderTextColor={colors.mediumGray}
                        style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body }]}
                    />
                </View>

                {/* Deskripsi */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Deskripsi</Text>
                    <TextInput
                        value={description} onChangeText={setDescription}
                        placeholder="Deskripsi singkat manfaat teknik ini"
                        placeholderTextColor={colors.mediumGray}
                        multiline numberOfLines={3}
                        style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body, height: 80 }]}
                    />
                </View>

                {/* Durasi Fase */}
                <Text style={[styles.sectionLabel, { color: colors.charcoal, fontFamily: Typography.heading }]}>Durasi Fase (detik)</Text>
                <View style={styles.phaseRow}>
                    {[
                        { label: 'Tarik *', value: inhale, setter: setInhale, color: colors.softBlue },
                        { label: 'Tahan', value: hold, setter: setHold, color: colors.lavender },
                        { label: 'Hembus *', value: exhale, setter: setExhale, color: colors.sageGreen },
                        { label: 'Jeda', value: holdAfter, setter: setHoldAfter, color: colors.peach },
                    ].map(({ label, value, setter, color }) => (
                        <View key={label} style={styles.phaseItem}>
                            <Text style={[styles.phaseLabel, { color, fontFamily: Typography.bodyMedium }]}>{label}</Text>
                            <TextInput
                                value={value} onChangeText={setter}
                                keyboardType="numeric"
                                style={[styles.phaseInput, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: color + '66', fontFamily: Typography.headingBold }]}
                            />
                        </View>
                    ))}
                </View>

                {/* Siklus */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Jumlah Siklus *</Text>
                    <TextInput
                        value={cycles} onChangeText={setCycles}
                        keyboardType="numeric"
                        style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body }]}
                    />
                </View>

                {/* Warna Tema */}
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

                {/* Icon */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>Icon</Text>
                    <View style={styles.iconRow}>
                        {ICONS.map(i => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => setIcon(i)}
                                style={[
                                    styles.iconChip,
                                    {
                                        backgroundColor: icon === i ? colorTheme + '33' : colors.lightGray,
                                        borderColor: icon === i ? colorTheme : 'transparent',
                                        borderWidth: 1.5,
                                    },
                                ]}
                            >
                                <Text style={styles.iconText}>{i}</Text>
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
    content: { padding: Spacing.lg, paddingBottom: 40 },
    heading: { fontSize: Typography.sizes.xl, marginBottom: Spacing.lg },
    sectionLabel: { fontSize: Typography.sizes.base, marginBottom: Spacing.sm, marginTop: Spacing.xs },
    field: { marginBottom: Spacing.md },
    label: { fontSize: Typography.sizes.sm, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.sizes.base },
    phaseRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    phaseItem: { flex: 1, alignItems: 'center', gap: 6 },
    phaseLabel: { fontSize: Typography.sizes.xs, textAlign: 'center' },
    phaseInput: {
        borderWidth: 1.5,
        borderRadius: BorderRadius.md,
        width: '100%',
        textAlign: 'center',
        padding: Spacing.sm,
        fontSize: Typography.sizes.lg,
    },
    colorRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    colorDot: { width: 36, height: 36, borderRadius: 18 },
    colorDotSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
    iconRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
    iconChip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
    iconText: { fontSize: Typography.sizes.xs },
    saveBtn: { marginTop: Spacing.md },
    cancelBtn: { marginTop: Spacing.sm },
});
