import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { meditationAPI } from '../../api';
import Card from '../../components/Card';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Typography, Spacing, BorderRadius } from '../../theme';

const CATEGORIES = ['Semua', 'sleep', 'focus', 'anxiety', 'morning', 'general'];

interface Session {
    id: string;
    title: string;
    description?: string;
    category: string;
    colorTheme: string;
    durationOptions: number[];
    thumbnailUrl?: string;
    audioUrl?: string;
}

export default function MeditationListScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');

    useEffect(() => {
        const cat = activeCategory === 'Semua' ? undefined : activeCategory;
        setLoading(true);
        meditationAPI.getSessions(cat)
            .then(res => setSessions(res.sessions || []))
            .catch(() => setError('Gagal memuat sesi meditasi.'))
            .finally(() => setLoading(false));
    }, [activeCategory]);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    Meditasi
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setActiveCategory(cat)}
                            style={[
                                styles.chip,
                                { backgroundColor: activeCategory === cat ? colors.lavender : colors.lightGray }
                            ]}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: activeCategory === cat ? colors.lavenderDark : colors.darkGray, fontFamily: Typography.bodyMedium }
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading
                ? <LoadingState />
                : error
                ? <ErrorState message={error} />
                : sessions.length === 0
                ? <EmptyState message="Tidak ada sesi untuk kategori ini." />
                : (
                    <FlatList
                        data={sessions}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item, index }) => {
                            const minDuration = Math.min(...(item.durationOptions || [5]));
                            return (
                                <AnimatedView delay={index * 80}>
                                    <Card
                                        onPress={() => navigation.navigate('MeditationPlayer', { session: item })}
                                        style={{ borderLeftWidth: 4, borderLeftColor: item.colorTheme || colors.lavender }}
                                    >
                                        <Text style={[styles.sessionTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                                            {item.title}
                                        </Text>
                                        {item.description && (
                                            <Text style={[styles.desc, { color: colors.mediumGray, fontFamily: Typography.body }]} numberOfLines={2}>
                                                {item.description}
                                            </Text>
                                        )}
                                        <View style={styles.row}>
                                            <Text style={[styles.tag, { color: colors.lavenderDark, fontFamily: Typography.bodyMedium }]}>
                                                {item.category}
                                            </Text>
                                            <Text style={[styles.duration, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                                                {minDuration} mnt
                                            </Text>
                                        </View>
                                    </Card>
                                </AnimatedView>
                            );
                        }}
                    />
                )
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { padding: Spacing.lg, paddingBottom: 0 },
    title: { fontSize: Typography.sizes['2xl'], marginBottom: Spacing.md },
    filters: { marginBottom: Spacing.md },
    chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginRight: Spacing.xs },
    chipText: { fontSize: Typography.sizes.sm },
    list: { padding: Spacing.md, gap: Spacing.sm },
    sessionTitle: { fontSize: Typography.sizes.md },
    desc: { fontSize: Typography.sizes.sm, marginTop: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
    tag: { fontSize: Typography.sizes.xs },
    duration: { fontSize: Typography.sizes.xs },
});
