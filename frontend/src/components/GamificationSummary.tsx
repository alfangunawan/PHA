import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { gamificationAPI } from '../api';

const C = { card: '#ffffff', border: '#e3ebf6', primary: '#1A59A1', primaryEnd: '#2f6fb8', text: '#243a5c', muted: '#7689a6', track: '#e7eef8', iconBg: '#eaf1fa' };

export default function GamificationSummary({ compact = false }: { compact?: boolean }) {
    const [summary, setSummary] = useState<any>(null);

    const load = useCallback(async () => {
        try {
            const res = await gamificationAPI.getMe();
            setSummary(res.summary);
        } catch (error) {
            console.warn('Load gamification summary failed', error);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    useFocusEffect(useCallback(() => { load(); }, [load]));

    if (!summary) return null;

    const nextLevelXp = summary.level * 100;
    const currentLevelBase = (summary.level - 1) * 100;
    const progress = Math.min(1, Math.max(0, (summary.xp - currentLevelBase) / Math.max(1, nextLevelXp - currentLevelBase)));

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={load} style={[styles.row, compact && styles.compact]}>
            <View style={styles.iconBox}><Ionicons name="trophy-outline" size={24} color={C.primary} /></View>
            <View style={styles.bubble}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Kamu berada di Level {summary.level}</Text>
                    <View style={styles.pointsWrap}><Ionicons name="sparkles" size={14} color={C.primary} /><Text style={styles.points}>{summary.points} poin</Text></View>
                </View>
                <Text style={styles.sub}>{summary.xp} XP • {Math.max(0, nextLevelXp - summary.xp)} XP lagi ke level berikutnya</Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 15,
        backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 16, paddingHorizontal: 18,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.1, shadowRadius: 22, elevation: 3,
    },
    compact: { marginBottom: 12 },
    iconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.iconBg, alignItems: 'center', justifyContent: 'center' },
    bubble: { flex: 1, gap: 3 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
    title: { fontSize: 14.5, fontWeight: '600', color: C.text, flex: 1 },
    pointsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    points: { fontSize: 13, fontWeight: '700', color: C.primary },
    sub: { fontSize: 12, color: C.muted, lineHeight: 17 },
    progressTrack: { height: 7, backgroundColor: C.track, borderRadius: 99, overflow: 'hidden', marginTop: 7 },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 99 },
});
