import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GamificationSummary from '../../components/GamificationSummary';

const C = { bg: '#fcfcfe', card: '#fff', border: '#ecedf6', primary: '#8a9ccc', text: '#353b4a', body: '#3b4150', muted: '#9197aa', soft: '#f3f4f9', avatar: '#eef1f9', green: '#8AAD83', lavender: '#9387c8' };

export default function GamesHomeScreen({ navigation }: any) {
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.assistantRow}>
                    <View style={styles.avatar}><Ionicons name="game-controller-outline" size={18} color={C.primary} /></View>
                    <View style={styles.assistantBubble}>
                        <Text style={styles.title}>Game Positif</Text>
                        <Text style={styles.subtitle}>Mau main sebentar untuk mengumpulkan XP? Pilih aktivitas ringan yang cocok untukmu.</Text>
                    </View>
                </View>

                <GamificationSummary />

                <Text style={styles.sectionLabel}>REKOMENDASI PHA</Text>
                <GameCard
                    icon="text-outline"
                    iconColor={C.green}
                    iconBg="#e8f3e4"
                    title="Tebak Kata Positif"
                    subtitle="Susun huruf acak menjadi kata positif dari jurnalmu sendiri."
                    onPress={() => navigation.navigate('PositiveWordPuzzle')}
                />

                <GameCard
                    icon="grid-outline"
                    iconColor={C.lavender}
                    iconBg="#f1eefa"
                    title="Tetris Tenang"
                    subtitle="Susun blok dalam sesi singkat dan klaim reward setelah selesai."
                    onPress={() => navigation.navigate('TetrisGame')}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

function GameCard({ icon, iconColor, iconBg, title, subtitle, onPress }: { icon: any; iconColor: string; iconBg: string; title: string; subtitle: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
            <View style={[styles.icon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={25} color={iconColor} /></View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSub}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={C.muted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 18, gap: 14, paddingBottom: 44 },
    assistantRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
    avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    assistantBubble: { flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 6, padding: 15, gap: 5 },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle: { color: C.body, lineHeight: 21, fontSize: 14 },
    sectionLabel: { color: C.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginTop: 4 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 22, padding: 15, gap: 13 },
    icon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1 },
    cardTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
    cardSub: { color: C.muted, marginTop: 4, lineHeight: 19, fontSize: 13 },
});
