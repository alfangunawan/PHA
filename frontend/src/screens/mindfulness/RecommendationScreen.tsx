import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { mindfulnessAPI } from '../../api';

// ── Tema selaras Fun Blue ─────────────────────────────────────────────────────
const T = {
    primary:      '#1A59A1',
    primaryDeep:  '#14457D',
    primaryLight: '#e9f1fa',
    screenBg:     '#fcfcfe',
    card:         '#ffffff',
    cardBorder:   '#ecedf6',
    textDark:     '#353b4a',
    textSub:      '#6a7185',
    textMuted:    '#949bae',
    chipBg:       '#f1f2f8',
    chipBorder:   '#e7e9f2',
};

// Warna badge severity sesuai intensitas (pastel lembut)
const SEVERITY_STYLE: Record<string, { bg: string; text: string }> = {
    Minimal: { bg: '#eaf2ec', text: '#4a7d50' },
    Ringan:  { bg: '#e9f1fa', text: '#1A59A1' },
    Sedang:  { bg: '#f6efe2', text: '#8a6a30' },
    Berat:   { bg: '#f7eded', text: '#9b3a3a' },
};

// Tema per tipe konten — mengikuti palet theme.ts
const CONTENT_THEME: Record<string, { iconBg: string; iconColor: string; label: string }> = {
    breathing:  { iconBg: '#e9f1fa', iconColor: T.primary,  label: 'Pernapasan' },
    meditation: { iconBg: '#f3eef6', iconColor: '#8a6db8',  label: 'Meditasi'   },
    audio:      { iconBg: '#eef2fb', iconColor: '#5a7ec0',  label: 'Audio'       },
    education:  { iconBg: '#eaf2ec', iconColor: '#5a9460',  label: 'Edukasi'     },
};

// ── Ikon SVG garis ────────────────────────────────────────────────────────────
function SparkleIcon({ size = 25, color = T.primary }: { size?: number; color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" {...sp} />
        </Svg>
    );
}

function ContentTypeIcon({ type, size = 20, color = T.primary }: { type: string; size?: number; color?: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    if (type === 'breathing') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M2 8h11a3 3 0 1 0-3-3" {...sp} />
            <Path d="M2 12h15a3 3 0 1 1-3 3" {...sp} />
            <Path d="M2 16h9" {...sp} />
        </Svg>
    );
    if (type === 'meditation') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="5.5" r="2.3" {...sp} />
            <Path d="M12 8.5c-3 0-5 2-5.5 5" {...sp} />
            <Path d="M12 8.5c3 0 5 2 5.5 5" {...sp} />
            <Path d="M5 17.5h14" {...sp} />
        </Svg>
    );
    if (type === 'audio') return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M3 18v-6a9 9 0 0 1 18 0v6" {...sp} />
            <Path d="M21 19a2 2 0 0 1-2 2h-1v-5h3v3z" {...sp} />
            <Path d="M3 19a2 2 0 0 0 2 2h1v-5H3v3z" {...sp} />
        </Svg>
    );
    // education
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 6.5V19" {...sp} />
            <Path d="M12 6.5C10.5 5.2 8.2 4.5 5 4.5C4.4 4.5 4 5 4 5.6V16.5C4 17 4.4 17.3 5 17.3C8.2 17.3 10.5 18 12 19" {...sp} />
            <Path d="M12 6.5C13.5 5.2 15.8 4.5 19 4.5C19.6 4.5 20 5 20 5.6V16.5C20 17 19.6 17.3 19 17.3C15.8 17.3 13.5 18 12 19" {...sp} />
        </Svg>
    );
}

function ChevronRight({ color = T.textMuted, size = 18 }: { color?: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ── Navigasi tipe → screen ────────────────────────────────────────────────────
const NAV_TARGET: Record<string, { screen: string; paramKey: string }> = {
    breathing:  { screen: 'BreathingExercise',     paramKey: 'technique' },
    meditation: { screen: 'MeditationPlayer',      paramKey: 'session'   },
    audio:      { screen: 'AudioPlayer',           paramKey: 'audio'     },
    education:  { screen: 'EducationVideoDetail',  paramKey: 'content'   },
};

function SectionHeader({ type }: { type: string }) {
    const ct = CONTENT_THEME[type];
    return (
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: ct.iconBg }]}>
                <ContentTypeIcon type={type} size={18} color={ct.iconColor} />
            </View>
            <Text style={styles.sectionTitle}>{ct.label}</Text>
        </View>
    );
}

function ContentCard({ type, item, onPress }: { type: string; item: any; onPress: () => void }) {
    const ct = CONTENT_THEME[type];
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.cardRow}>
                <View style={[styles.cardIcon, { backgroundColor: ct.iconBg }]}>
                    <ContentTypeIcon type={type} size={20} color={ct.iconColor} />
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title ?? item.name}</Text>
                    {item.description ? (
                        <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
                    ) : null}
                    {item.category ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.category}</Text>
                        </View>
                    ) : null}
                </View>
                <ChevronRight />
            </View>
        </TouchableOpacity>
    );
}

export default function RecommendationScreen({ navigation }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError('');
        try {
            const res = await mindfulnessAPI.getRecommendations();
            setData(res);
        } catch {
            setError('Gagal memuat rekomendasi. Periksa koneksi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(true); };

    const navigate = (type: string, item: any) => {
        const t = NAV_TARGET[type];
        if (t) navigation.navigate(t.screen, { [t.paramKey]: item });
    };

    const sections = [
        { type: 'breathing',  items: data?.breathing  ?? [] },
        { type: 'meditation', items: data?.meditation ?? [] },
        { type: 'audio',      items: data?.audio      ?? [] },
        { type: 'education',  items: data?.education  ?? [] },
    ].filter(s => s.items.length > 0);

    const sev = data?.severity;
    const sevStyle = sev ? SEVERITY_STYLE[sev] ?? SEVERITY_STYLE.Ringan : null;

    // ── Belum pernah GAD-7 ─────────────────────────────────────────────────────
    const NotYetTested = () => (
        <ScrollView
            contentContainerStyle={styles.promptContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
        >
            <View style={styles.promptIllustration}>
                <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
                    <Path d="M9 11l3 3L22 4" stroke={T.primary} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={T.primary} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            </View>
            <Text style={styles.promptTitle}>Isi Tes Kecemasan Dulu, yuk!</Text>
            <Text style={styles.promptDesc}>
                Rekomendasi ini dibuat khusus berdasarkan tingkat kecemasanmu. Kamu perlu mengisi kuesioner GAD-7 terlebih dahulu agar rekomendasi yang muncul sesuai kebutuhanmu.
            </Text>
            <TouchableOpacity
                style={styles.promptBtn}
                onPress={() => navigation.navigate('ChatGate')}
                activeOpacity={0.88}
            >
                <Text style={styles.promptBtnText}>Mulai Tes GAD-7</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <SparkleIcon size={25} color={T.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Rekomendasi Untukmu</Text>
                    <Text style={styles.headerSub}>Berdasarkan hasil tes kecemasanmu</Text>
                </View>
            </View>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : !data?.hasTakenGad7 ? (
                <NotYetTested />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
                >
                    {/* Badge severity */}
                    {sev && sevStyle && (
                        <AnimatedView delay={0}>
                            <View style={[styles.gad7Card, { backgroundColor: sevStyle.bg, borderColor: sevStyle.bg }]}>
                                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                    <Path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
                                        stroke={sevStyle.text} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </Svg>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.gad7Label, { color: sevStyle.text }]}>
                                        Tingkat kecemasan: <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{sev}</Text>
                                    </Text>
                                    {data.gad7LastTaken && (
                                        <Text style={[styles.gad7Date, { color: sevStyle.text, opacity: 0.7 }]}>
                                            Diisi: {new Date(data.gad7LastTaken).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </AnimatedView>
                    )}

                    {sections.length === 0 ? (
                        <EmptyState message="Belum ada konten yang tersedia untuk tingkat kecemasanmu saat ini." />
                    ) : (
                        sections.map((section, si) => (
                            <AnimatedView key={section.type} delay={si * 70 + 80}>
                                <View style={styles.section}>
                                    <SectionHeader type={section.type} />
                                    {section.items.map((item: any) => (
                                        <ContentCard
                                            key={item.id}
                                            type={section.type}
                                            item={item}
                                            onPress={() => navigate(section.type, item)}
                                        />
                                    ))}
                                </View>
                            </AnimatedView>
                        ))
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: T.screenBg },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 24, paddingTop: 8, paddingBottom: 14,
    },
    headerIcon: {
        width: 48, height: 48, borderRadius: 15,
        backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 23, color: T.textDark, letterSpacing: -0.2 },
    headerSub: { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: '#9197aa', marginTop: 3 },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },

    gad7Card: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 20,
    },
    gad7Label: { fontFamily: 'Inter_400Regular', fontSize: 13.5, lineHeight: 20 },
    gad7Date: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },

    noGad7Card: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: T.chipBg, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: T.chipBorder, marginBottom: 20,
    },
    noGad7Text: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: T.textSub, lineHeight: 18 },

    promptContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 40 },
    promptIllustration: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    promptTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 22, color: T.textDark, textAlign: 'center', marginBottom: 12 },
    promptDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, color: T.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    promptBtn: { backgroundColor: T.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, shadowColor: T.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
    promptBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },

    section: { marginBottom: 22 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    sectionIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15.5, color: T.textDark },

    card: {
        backgroundColor: T.card, borderRadius: 22, borderWidth: 1, borderColor: T.cardBorder,
        padding: 17, marginBottom: 10,
        shadowColor: '#383f5c', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    },
    cardRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    cardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: T.textDark, lineHeight: 20 },
    cardDesc: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: T.textMuted, marginTop: 4, lineHeight: 17 },
    badge: {
        alignSelf: 'flex-start', backgroundColor: T.primaryLight,
        borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, marginTop: 6,
    },
    badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: T.primary },
});
