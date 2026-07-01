import React, { useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Linking, Alert,
    BackHandler, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthContext } from '../auth/AuthContext';

const PRIMARY = '#1A59A1';

const HEADLINES: Record<string, string> = {
    minimal:  'Kamu tampak cukup baik-baik saja belakangan ini.',
    mild:     'Ada sedikit gelombang yang kamu hadapi — itu wajar.',
    moderate: 'Kamu sedang menanggung cukup banyak. Itu bukan salahmu.',
    severe:   'Ini terdengar berat. Kamu tidak harus menanggungnya sendiri.',
};

interface Props {
    navigation: any;
    route: any;
}

export default function Gad7ResultScreen({ navigation, route }: Props) {
    const insets = useSafeAreaInsets();
    const { refreshGad7Status } = useAuthContext();
    const { severity } = route.params;
    const retake: boolean = route?.params?.retake === true;
    const headline = HEADLINES[severity] ?? HEADLINES.mild;
    const isModerate = severity === 'moderate' || severity === 'severe';
    const isSevere = severity === 'severe';

    const goHome = () => navigation.navigate('MainTabs', { screen: 'Beranda' });

    // Android hardware back → Beranda on the testing retake path, Chat otherwise
    // (give user a way out, not a wall).
    useFocusEffect(useCallback(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (retake) {
                goHome();
            } else {
                refreshGad7Status().then(() => navigation.replace('Chat'));
            }
            return true;
        });
        return () => sub.remove();
    }, [refreshGad7Status, retake]));

    const handlePrimary = async () => {
        if (retake) {
            // Testing retake: refresh status so the chatbot gate reflects the new
            // result, then return to Beranda for another loop.
            await refreshGad7Status();
            goHome();
            return;
        }
        // Await refresh here (Result → Chat), NOT in submit → Result.
        // This ensures ChatScreen mount guard sees updated status.
        await refreshGad7Status();
        navigation.replace('Chat');
    };

    const handleBreathing = () => {
        // Navigate to Breathing tab via MainTabs
        navigation.navigate('MainTabs', { screen: 'Napas' });
    };

    const handleHotline = async () => {
        try {
            await Linking.openURL('tel:119');
        } catch {
            Alert.alert('Tidak bisa membuka telepon', 'Hubungi 119 secara manual, lalu tekan ext 8.');
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Headline */}
                <View style={styles.headlineSection}>
                    <Text style={styles.headline}>{headline}</Text>
                    <Text style={styles.disclaimer}>
                        Ini gambaran perasaanmu sementara — bukan diagnosis.
                    </Text>
                </View>

                {/* Moderate+ — breathing */}
                {isModerate && (
                    <TouchableOpacity style={styles.card} onPress={handleBreathing} activeOpacity={0.85}>
                        <Text style={styles.cardIcon}>🌬️</Text>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Coba teknik pernapasan sekarang</Text>
                            <Text style={styles.cardSub}>Bantu menenangkan pikiran dalam 3 menit</Text>
                        </View>
                        <Text style={styles.cardArrow}>→</Text>
                    </TouchableOpacity>
                )}

                {/* Severe — counseling signpost */}
                {isSevere && (
                    <View style={styles.card}>
                        <Text style={styles.cardIcon}>🤝</Text>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Konseling kampus — gratis & rahasia</Text>
                            <Text style={styles.cardSub}>
                                Berbicara dengan konselor bisa membantu ketika beban terasa besar.
                                Layanan ini tersedia untukmu di kampus (CB-FR-08).
                            </Text>
                        </View>
                    </View>
                )}

                {/* Severe — hotline (crisis framing only) */}
                {isSevere && (
                    <View style={styles.hotlineSection}>
                        <Text style={styles.hotlineLabel}>
                            Kalau ada pikiran menyakiti diri atau merasa tidak aman:
                        </Text>
                        <TouchableOpacity style={styles.hotlineBtn} onPress={handleHotline} activeOpacity={0.8}>
                            <Text style={styles.hotlineBtnText}>Hubungi 119</Text>
                        </TouchableOpacity>
                        <Text style={styles.hotlineNote}>Setelah tersambung, tekan ext 8</Text>
                    </View>
                )}
            </ScrollView>

            {/* Start Chat — pinned bottom */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={styles.chatBtn} onPress={handlePrimary} activeOpacity={0.85}>
                    <Text style={styles.chatBtnText}>
                        {retake ? 'Kembali ke Beranda' : 'Mulai Chat dengan PHA'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#ffffff' },
    scroll: { paddingHorizontal: 24, paddingTop: 48 },

    headlineSection: { marginBottom: 32 },
    headline: {
        fontSize: 26,
        fontWeight: '700',
        color: '#243a5c',
        lineHeight: 34,
        marginBottom: 12,
    },
    disclaimer: {
        fontSize: 13,
        color: '#7689a6',
        fontStyle: 'italic',
        lineHeight: 18,
    },

    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#eaf1fa',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        gap: 12,
    },
    cardIcon: { fontSize: 24, marginTop: 2 },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: '#243a5c', marginBottom: 4 },
    cardSub: { fontSize: 13, color: '#7689a6', lineHeight: 18 },
    cardArrow: { fontSize: 18, color: PRIMARY, alignSelf: 'center' },

    hotlineSection: {
        marginTop: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#dbe7f6',
        backgroundColor: '#f7faff',
        alignItems: 'flex-start',
    },
    hotlineLabel: { fontSize: 13, color: '#243a5c', marginBottom: 10, lineHeight: 18 },
    hotlineBtn: {
        backgroundColor: PRIMARY,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    hotlineBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    hotlineNote: { fontSize: 12, color: '#7689a6' },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 12,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#eef3fa',
    },
    chatBtn: {
        backgroundColor: PRIMARY,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    chatBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
