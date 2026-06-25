import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
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
    tileBg: '#eaf1fa',
    tileBorder: '#dbe7f6',
    textDark: '#243a5c',
    textBody: '#3f567a',
    textSub: '#7689a6',
    iconDim: '#9aa7bd',
    danger: '#c0463b',
    dangerBg: '#fbe9e7',
    dangerBorder: '#f3d3ce',
};

const LEVEL: Record<string, { label: string; color: string; bg: string; fill: number }> = {
    rendah: { label: 'Rendah', color: '#1f8a5b', bg: '#e6f4ec', fill: 0.25 },
    sedang: { label: 'Sedang', color: '#b8791f', bg: '#fbf1de', fill: 0.6 },
    tinggi: { label: 'Tinggi', color: '#c0463b', bg: '#fbe9e7', fill: 0.85 },
    risiko_tinggi: { label: 'Butuh Dukungan', color: '#9e2b21', bg: '#fbe9e7', fill: 1 },
};

function HeaderWaves() {
    return (
        <Svg style={{ position: 'absolute', right: -10, top: 22, width: 170, height: 110, opacity: 0.28 }} viewBox="0 0 160 120" fill="none">
            <Path d="M14 84 q22 -20 44 0 t44 0 t44 0" stroke="#9dbbe4" strokeWidth={2} strokeLinecap="round" />
            <Path d="M14 98 q22 -16 44 0 t44 0 t44 0" stroke="#7ba0d6" strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

export default function JournalDetailScreen({ navigation, route }: any) {
    const entry = route.params?.entry;
    const analysis = entry?.analysis || {};
    const scores = analysis.skor_per_kategori || {};
    const insets = useSafeAreaInsets();
    const lv = LEVEL[entry?.anxietyLevel] || { label: entry?.anxietyLevel, color: FB.textSub, bg: FB.tileBg, fill: 0.4 };
    const recs: string[] = analysis.rekomendasi || [];

    const remove = () => Alert.alert('Hapus jurnal?', 'Jurnal akan dihapus permanen.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: async () => { await journalAPI.deleteEntry(entry.id); navigation.goBack(); } },
    ]);

    return (
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
            {/* App bar */}
            <LinearGradient
                colors={[FB.primary, FB.primaryDeep]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                <HeaderWaves />
                <View style={styles.headerBar}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detail Jurnal</Text>
                    <View style={styles.headerBtn} />
                </View>
            </LinearGradient>

            <View style={styles.sheet}>
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                    {/* Entry card */}
                    <View style={styles.card}>
                        <View style={styles.cardHead}>
                            <View style={styles.tile}>
                                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                    <Path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" stroke={FB.primary} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                                    <Path d="M14 3.5V8h4.5" stroke={FB.primary} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                                </Svg>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.entryTitle}>{entry?.title || 'Jurnal tanpa judul'}</Text>
                                <Text style={styles.entryDate}>{entry?.createdAt ? new Date(entry.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                            </View>
                        </View>
                        <Text style={styles.entryBody}>{entry?.content}</Text>
                    </View>

                    {/* Tingkat kecemasan */}
                    <View style={styles.card}>
                        <View style={styles.rowHead}>
                            <View style={styles.tile}>
                                <Ionicons name="pulse-outline" size={20} color={FB.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.kicker}>TINGKAT KECEMASAN</Text>
                                <View style={styles.levelRow}>
                                    <Text style={styles.levelValue}>{lv.label}</Text>
                                    <Text style={styles.levelScore}>skor {analysis.totalScore ?? 0}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${Math.round(lv.fill * 100)}%`, backgroundColor: lv.color }]} />
                        </View>
                        <View style={styles.barLabels}>
                            <Text style={[styles.barLabel, entry?.anxietyLevel === 'rendah' && { color: '#1f8a5b', fontFamily: 'HankenGrotesk_700Bold' }]}>Rendah</Text>
                            <Text style={[styles.barLabel, entry?.anxietyLevel === 'sedang' && { color: '#b8791f', fontFamily: 'HankenGrotesk_700Bold' }]}>Sedang</Text>
                            <Text style={[styles.barLabel, (entry?.anxietyLevel === 'tinggi' || entry?.anxietyLevel === 'risiko_tinggi') && { color: '#c0463b', fontFamily: 'HankenGrotesk_700Bold' }]}>Tinggi</Text>
                        </View>
                    </View>

                    {/* Crisis support */}
                    {entry?.highRisk && (
                        <View style={[styles.card, styles.crisisCard]}>
                            <View style={styles.rowHead}>
                                <View style={[styles.tile, { backgroundColor: '#fff0ee' }]}>
                                    <Ionicons name="heart-outline" size={18} color={FB.danger} />
                                </View>
                                <Text style={[styles.cardTitle, { color: FB.danger }]}>Kamu tidak sendirian</Text>
                            </View>
                            <Text style={styles.entryBody}>Jika kamu merasa tidak aman atau ada dorongan menyakiti diri, segera hubungi orang tepercaya, konselor kampus, keluarga, atau layanan darurat setempat. Minta seseorang menemani sekarang juga.</Text>
                        </View>
                    )}

                    {/* Skor per kategori */}
                    <View style={styles.card}>
                        <View style={styles.rowHead}>
                            <View style={styles.tile}><Ionicons name="bar-chart-outline" size={18} color={FB.primary} /></View>
                            <Text style={styles.cardTitle}>Skor per kategori</Text>
                        </View>
                        {Object.keys(scores).length === 0 ? (
                            <View style={styles.emptyScore}>
                                <Ionicons name="help-circle-outline" size={17} color="#9dbbe4" />
                                <Text style={styles.emptyScoreText}>Tidak ada kategori kecemasan yang terdeteksi.</Text>
                            </View>
                        ) : (
                            <View style={styles.scoreWrap}>
                                {Object.entries(scores).map(([key, value]) => (
                                    <View key={key} style={styles.scoreChip}>
                                        <Text style={styles.scoreKey}>{key}</Text>
                                        <Text style={styles.scoreValue}>{String(value)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Rekomendasi PHA */}
                    <LinearGradient colors={['#eef4fb', '#e6eefa']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.phaCard}>
                        <View style={styles.phaHead}>
                            <View style={styles.phaAvatar}>
                                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                    <Path d="M5 6.5C5 5.7 5.7 5 6.5 5h11C18.3 5 19 5.7 19 6.5v8C19 15.3 18.3 16 17.5 16H9l-4 3.5z" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                                </Svg>
                            </View>
                            <View>
                                <Text style={styles.phaTitle}>Rekomendasi PHA</Text>
                                <Text style={styles.phaSub}>Pendamping kamu</Text>
                            </View>
                        </View>
                        {recs.length === 0 ? (
                            <Text style={styles.phaText}>Terima kasih sudah menulis jurnal. Pertahankan kebiasaan refleksi ini, dan coba latihan napas singkat bila dibutuhkan.</Text>
                        ) : recs.map((rec, idx) => (
                            <View key={idx} style={styles.recRow}>
                                <View style={styles.recDot} />
                                <Text style={styles.phaText}>{rec}</Text>
                            </View>
                        ))}
                    </LinearGradient>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('JournalEditor', { entry })} activeOpacity={0.85}>
                            <Ionicons name="create-outline" size={18} color={FB.primary} />
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={remove} activeOpacity={0.85}>
                            <Ionicons name="trash-outline" size={18} color={FB.danger} />
                            <Text style={styles.deleteText}>Hapus</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 12 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: FB.primary },

    header: { paddingHorizontal: 18, paddingBottom: 26, overflow: 'hidden' },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: 'Lora_500Medium', fontSize: 17, color: '#fff' },

    sheet: { flex: 1, backgroundColor: FB.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -14 },
    container: { padding: 20, gap: 14, paddingBottom: 30 },

    card: { backgroundColor: FB.card, borderColor: FB.cardBorder, borderWidth: 1, borderRadius: 22, padding: 18, shadowColor: FB.primary, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.07, shadowRadius: 24, elevation: 2 },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rowHead: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 6 },
    tile: { width: 36, height: 36, borderRadius: 11, backgroundColor: FB.tileBg, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14.5, color: FB.textDark },

    entryTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15.5, color: FB.textDark },
    entryDate: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11.5, color: FB.iconDim, marginTop: 2 },
    entryBody: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: FB.textBody, lineHeight: 22, marginTop: 14 },

    kicker: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, color: FB.textSub, letterSpacing: 0.3 },
    levelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 3 },
    levelValue: { fontFamily: 'Lora_500Medium', fontSize: 21, color: FB.textDark },
    levelScore: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12.5, color: FB.textSub },
    barTrack: { marginTop: 14, height: 8, borderRadius: 99, backgroundColor: '#e7eef8', overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 99 },
    barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    barLabel: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 10.5, color: FB.iconDim },

    crisisCard: { backgroundColor: FB.dangerBg, borderColor: FB.dangerBorder },

    emptyScore: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#f5f8fd', borderWidth: 1, borderStyle: 'dashed', borderColor: '#d8e3f3', borderRadius: 14, padding: 13, marginTop: 8 },
    emptyScoreText: { flex: 1, fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: FB.textSub, lineHeight: 19 },
    scoreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    scoreChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: FB.tileBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
    scoreKey: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: FB.textBody },
    scoreValue: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 12, color: FB.primary },

    phaCard: { borderWidth: 1, borderColor: FB.tileBorder, borderRadius: 22, padding: 18 },
    phaHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 },
    phaAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: FB.primary, alignItems: 'center', justifyContent: 'center' },
    phaTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14.5, color: FB.textDark },
    phaSub: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: FB.textSub },
    phaText: { flex: 1, fontFamily: 'HankenGrotesk_400Regular', fontSize: 13.5, color: FB.textBody, lineHeight: 21 },
    recRow: { flexDirection: 'row', gap: 9, marginTop: 8 },
    recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: FB.primary, marginTop: 7 },

    actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FB.tileBg, borderWidth: 1, borderColor: FB.tileBorder, borderRadius: 16, paddingVertical: 14 },
    editText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14.5, color: FB.primary },
    deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FB.dangerBg, borderWidth: 1, borderColor: FB.dangerBorder, borderRadius: 16, paddingVertical: 14 },
    deleteText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14.5, color: FB.danger },
});
