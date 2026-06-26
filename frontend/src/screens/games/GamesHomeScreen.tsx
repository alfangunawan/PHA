import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GamificationSummary from '../../components/GamificationSummary';

// Fun Blue palette (selaras Beranda)
const FB = {
    bg: '#fcfcfe', card: '#ffffff', border: '#ecedf6',
    primary: '#1A59A1', primaryDeep: '#14457D',
    text: '#353b4a', textDark: '#243a5c', muted: '#949bae', muted2: '#9aa7bd',
    tint: '#e9f1fa', tintBorder: '#d9e6f6', tile: '#f1f2f8', tileText: '#7c8398',
    arcade: '#4571b0', arcadeSoft: '#eef2fb', heroSub: '#cfddf2',
};

export default function GamesHomeScreen({ navigation }: any) {
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.topBar}>
                    <View style={styles.topIcon}><Ionicons name="game-controller-outline" size={22} color={FB.primary} /></View>
                    <Text style={styles.brand}>Games</Text>
                </View>

                <LinearGradient colors={[FB.primary, FB.primaryDeep]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.hero}>
                    <Ionicons name="game-controller-outline" size={128} color="#fff" style={styles.heroGlyph} />
                    <View style={styles.heroBadge}>
                        <Ionicons name="sparkles" size={13} color="#dbe7f7" />
                        <Text style={styles.heroBadgeText}>GAME POSITIF</Text>
                    </View>
                    <Text style={styles.heroTitle}>Main sebentar,{'\n'}kumpulkan XP</Text>
                    <Text style={styles.heroSub}>Pilih aktivitas ringan yang cocok untukmu dan tetap tenang.</Text>
                </LinearGradient>

                <GamificationSummary />

                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Rekomendasi untukmu</Text>
                    <Text style={styles.sectionCount}>2 PERMAINAN</Text>
                </View>

                <GameCard
                    badge="Aa"
                    badgeBg={FB.tint}
                    badgeColor={FB.primary}
                    title="Tebak Kata Positif"
                    subtitle="Susun huruf acak menjadi kata positif dari jurnalmu."
                    tag="Word Puzzle"
                    tagColor={FB.primary}
                    tagBg={FB.tint}
                    xp="+10 XP"
                    onPress={() => navigation.navigate('PositiveWordPuzzle')}
                />

                <GameCard
                    icon="grid"
                    badgeBg={FB.arcadeSoft}
                    badgeColor={FB.arcade}
                    title="Tetris Tenang"
                    subtitle="Susun blok dalam sesi singkat dan klaim reward."
                    tag="Arcade"
                    tagColor={FB.arcade}
                    tagBg={FB.arcadeSoft}
                    xp="+15 XP"
                    onPress={() => navigation.navigate('TetrisGame')}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

function GameCard({ badge, icon, badgeBg, badgeColor, title, subtitle, tag, tagColor, tagBg, xp, onPress }: {
    badge?: string; icon?: any; badgeBg: string; badgeColor: string; title: string; subtitle: string;
    tag: string; tagColor: string; tagBg: string; xp: string; onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
            <View style={[styles.cardIcon, { backgroundColor: badgeBg }]}>
                {badge ? <Text style={[styles.cardBadgeText, { color: badgeColor }]}>{badge}</Text>
                    : <Ionicons name={icon} size={26} color={badgeColor} />}
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSub}>{subtitle}</Text>
                <View style={styles.tagRow}>
                    <View style={[styles.tag, { backgroundColor: tagBg }]}><Text style={[styles.tagText, { color: tagColor }]}>{tag}</Text></View>
                    <View style={[styles.tag, { backgroundColor: FB.tile }]}><Text style={[styles.tagText, { color: FB.tileText }]}>{xp}</Text></View>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b6c0d2" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: FB.bg },
    container: { padding: 18, gap: 16, paddingBottom: 44 },

    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    topIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: FB.tint, alignItems: 'center', justifyContent: 'center' },
    brand: { fontFamily: 'Lora_500Medium', fontSize: 21, color: FB.text, letterSpacing: -0.2 },

    hero: { borderRadius: 24, padding: 22, paddingBottom: 24, overflow: 'hidden', shadowColor: FB.primary, shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.45, shadowRadius: 28, elevation: 6 },
    heroGlyph: { position: 'absolute', right: -16, top: 6, opacity: 0.16 },
    heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    heroBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6, color: '#dbe7f7' },
    heroTitle: { fontFamily: 'Lora_500Medium', fontSize: 25, lineHeight: 29, color: '#fff', marginTop: 13 },
    heroSub: { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: FB.heroSub, marginTop: 9, lineHeight: 20, maxWidth: 250 },

    sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 },
    sectionTitle: { fontFamily: 'Lora_400Regular', fontSize: 18, color: FB.textDark },
    sectionCount: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: FB.muted2, letterSpacing: 0.4 },

    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: FB.card, borderColor: FB.border, borderWidth: 1, borderRadius: 22, padding: 15, gap: 14, shadowColor: FB.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 2 },
    cardIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    cardBadgeText: { fontFamily: 'Lora_600SemiBold', fontSize: 23, letterSpacing: -0.4 },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15.5, color: FB.text },
    cardSub: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: FB.muted, marginTop: 3, lineHeight: 17 },
    tagRow: { flexDirection: 'row', gap: 7, marginTop: 9 },
    tag: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
    tagText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
});
