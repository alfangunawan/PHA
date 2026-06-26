import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { journalAPI } from '../../api';
import { LoadingState } from '../../components/LoadingState';

// Fun Blue palette
const FB = {
    primary: '#1A59A1',
    primaryDeep: '#14457D',
    pageBg: '#dfe7f2',
    card: '#ffffff',
    cardBorder: '#e3ebf6',
    tileBg: '#eaf1fa',
    tileBorder: '#dbe7f6',
    headerSub: '#cfddf2',
    textDark: '#243a5c',
    textBody: '#3f567a',
    textSub: '#7689a6',
    iconDim: '#9aa7bd',
    chevron: '#c2cee0',
};

const LEVEL: Record<string, { label: string; color: string; bg: string }> = {
    rendah: { label: 'Rendah', color: '#1f8a5b', bg: '#e6f4ec' },
    sedang: { label: 'Sedang', color: '#b8791f', bg: '#fbf1de' },
    tinggi: { label: 'Tinggi', color: '#c0463b', bg: '#fbe9e7' },
    risiko_tinggi: { label: 'Butuh Dukungan', color: '#9e2b21', bg: '#fbe9e7' },
};

function HeaderWaves() {
    return (
        <Svg style={{ position: 'absolute', right: -10, top: 30, width: 180, height: 120, opacity: 0.3 }} viewBox="0 0 160 120" fill="none">
            <Path d="M14 84 q22 -20 44 0 t44 0 t44 0" stroke="#9dbbe4" strokeWidth={2} strokeLinecap="round" />
            <Path d="M14 98 q22 -16 44 0 t44 0 t44 0" stroke="#7ba0d6" strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

function DocIcon({ color, size = 22 }: { color: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M14 3.5V8h4.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8.5 13h7M8.5 16.5h5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function JournalListScreen({ navigation }: any) {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

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
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
            {/* App bar — Fun Blue gradient */}
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
                    <Text style={styles.headerTitle}>Jurnal</Text>
                    <View style={styles.headerBtn} />
                </View>
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>Ruang aman untukmu</Text>
                    <Text style={styles.heroSub}>Tulis dan pahami perasaanmu. PHA bantu membaca sinyalnya.</Text>
                </View>
            </LinearGradient>

            {/* Content sheet */}
            <View style={styles.sheet}>
                <View style={styles.sheetTop}>
                    <Text style={styles.sectionTitle}>Riwayat</Text>
                    <Text style={styles.count}>{entries.length} entri</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {entries.length === 0 ? (
                        <View style={styles.empty}>
                            <View style={styles.emptyIcon}><DocIcon color={FB.primary} size={26} /></View>
                            <Text style={styles.emptyTitle}>Belum ada jurnal</Text>
                            <Text style={styles.emptyText}>Mulai tulis refleksi pertamamu hari ini.</Text>
                        </View>
                    ) : entries.map(item => {
                        const lv = LEVEL[item.anxietyLevel] || { label: item.anxietyLevel, color: FB.textSub, bg: FB.tileBg };
                        return (
                            <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate('JournalDetail', { entry: item })} activeOpacity={0.85}>
                                <View style={styles.cardIcon}><DocIcon color={FB.primary} /></View>
                                <View style={styles.cardBody}>
                                    <View style={styles.cardTop}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Jurnal tanpa judul'}</Text>
                                        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} · {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                    <Text numberOfLines={2} style={styles.preview}>{item.content}</Text>
                                    <View style={styles.metaRow}>
                                        <View style={[styles.badge, { backgroundColor: lv.bg }]}>
                                            <View style={[styles.dot, { backgroundColor: lv.color }]} />
                                            <Text style={[styles.badgeText, { color: lv.color }]}>{lv.label}</Text>
                                        </View>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={FB.chevron} style={styles.cardChevron} />
                            </TouchableOpacity>
                        );
                    })}

                    {entries.length > 0 && (
                        <View style={styles.hint}>
                            <Ionicons name="lock-closed-outline" size={14} color={FB.iconDim} />
                            <Text style={styles.hintText}>Hanya kamu yang bisa melihat jurnal ini</Text>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Floating compose */}
            <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 22 }]} onPress={() => navigation.navigate('JournalEditor')} activeOpacity={0.9}>
                <LinearGradient colors={[FB.primary, FB.primaryDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
                    <Ionicons name="create-outline" size={24} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: FB.primary },

    header: { paddingHorizontal: 20, paddingBottom: 30, overflow: 'hidden' },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: 'Lora_500Medium', fontSize: 17, color: '#fff' },
    hero: { marginTop: 18 },
    heroTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 25, lineHeight: 29, color: '#fff', letterSpacing: -0.3 },
    heroSub: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13.5, color: FB.headerSub, marginTop: 8, lineHeight: 20, maxWidth: 280 },

    sheet: { flex: 1, backgroundColor: FB.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, paddingHorizontal: 20, paddingTop: 20 },
    sheetTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    sectionTitle: { fontFamily: 'Lora_500Medium', fontSize: 16, color: FB.textDark },
    count: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12.5, color: FB.textSub },

    list: { gap: 12, paddingBottom: 110, flexGrow: 1 },

    card: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, backgroundColor: FB.card, borderColor: FB.cardBorder, borderWidth: 1, borderRadius: 20, padding: 15, shadowColor: FB.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
    cardIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: FB.tileBg, alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1, minWidth: 0 },
    cardTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
    cardTitle: { flex: 1, fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14.5, color: FB.textDark },
    cardDate: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11.5, color: FB.iconDim },
    preview: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: FB.textSub, lineHeight: 19, marginTop: 5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 4 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11.5 },
    cardChevron: { alignSelf: 'center' },

    hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 22 },
    hintText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: FB.iconDim },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 6 },
    emptyIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: FB.tileBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    emptyTitle: { fontFamily: 'Lora_500Medium', fontSize: 16, color: FB.textDark },
    emptyText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: FB.textSub, textAlign: 'center' },

    fab: { position: 'absolute', right: 22, width: 58, height: 58, borderRadius: 20, shadowColor: FB.primary, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 10 },
    fabInner: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
