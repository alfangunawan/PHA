import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { gamificationAPI } from '../api';

const C = { card: '#ffffff', border: '#ecedf6', primary: '#8a9ccc', text: '#353b4a', body: '#3b4150', muted: '#9197aa', soft: '#f3f4f9', avatar: '#eef1f9' };

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
            <View style={styles.avatar}><Ionicons name="ribbon-outline" size={17} color={C.primary} /></View>
            <View style={styles.bubble}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Kamu berada di Level {summary.level}</Text>
                    <View style={styles.pointsWrap}><Ionicons name="sparkles-outline" size={14} color={C.primary} /><Text style={styles.points}>{summary.points} poin</Text></View>
                </View>
                <Text style={styles.sub}>{summary.xp} XP • {Math.max(0, nextLevelXp - summary.xp)} XP lagi ke level berikutnya</Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
    compact: { marginBottom: 12 },
    avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    bubble: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 6, padding: 15, gap: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    title: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1 },
    pointsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.soft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
    points: { fontSize: 12, fontWeight: '800', color: C.primary },
    sub: { fontSize: 12, color: C.muted, lineHeight: 17 },
    progressTrack: { height: 8, backgroundColor: C.soft, borderRadius: 99, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 99 },
});
