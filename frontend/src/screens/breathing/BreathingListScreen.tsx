import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { breathingAPI } from '../../api';
import Card from '../../components/Card';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Typography, Spacing, BorderRadius } from '../../theme';

interface Technique {
    id: string;
    name: string;
    description?: string;
    inhaleDuration: number;
    holdDuration: number;
    exhaleDuration: number;
    holdAfterExhale: number;
    cycles: number;
    colorTheme: string;
    icon: string;
}

export default function BreathingListScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [techniques, setTechniques] = useState<Technique[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        breathingAPI.getTechniques()
            .then(res => setTechniques(res.techniques || []))
            .catch(() => setError('Gagal memuat teknik pernapasan.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <View style={[styles.header, { backgroundColor: colors.bgPrimary }]}>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    Latihan Napas
                </Text>
                <Text style={[styles.subtitle, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                    Pilih teknik pernapasan untuk memulai
                </Text>
            </View>
            {techniques.length === 0
                ? <EmptyState message="Belum ada teknik tersedia." />
                : (
                    <FlatList
                        data={techniques}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item, index }) => (
                            <AnimatedView delay={index * 80}>
                                <Card
                                    onPress={() => navigation.navigate('BreathingExercise', { technique: item })}
                                    style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.colorTheme || colors.softBlue }]}
                                >
                                    <View style={styles.cardRow}>
                                        <Text style={styles.icon}>{item.icon || '🌬️'}</Text>
                                        <View style={styles.cardInfo}>
                                            <Text style={[styles.name, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                                                {item.name}
                                            </Text>
                                            {item.description && (
                                                <Text style={[styles.desc, { color: colors.mediumGray, fontFamily: Typography.body }]} numberOfLines={2}>
                                                    {item.description}
                                                </Text>
                                            )}
                                            <Text style={[styles.meta, { color: colors.softBlue, fontFamily: Typography.bodyMedium }]}>
                                                {item.inhaleDuration}s tarik · {item.holdDuration > 0 ? `${item.holdDuration}s tahan · ` : ''}{item.exhaleDuration}s buang · {item.cycles} siklus
                                            </Text>
                                        </View>
                                    </View>
                                </Card>
                            </AnimatedView>
                        )}
                    />
                )
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { padding: Spacing.lg, paddingBottom: Spacing.md },
    title: { fontSize: Typography.sizes['2xl'] },
    subtitle: { fontSize: Typography.sizes.sm, marginTop: 4 },
    list: { padding: Spacing.md, gap: Spacing.sm },
    card: { marginBottom: 0 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    icon: { fontSize: 32 },
    cardInfo: { flex: 1 },
    name: { fontSize: Typography.sizes.md },
    desc: { fontSize: Typography.sizes.sm, marginTop: 2 },
    meta: { fontSize: Typography.sizes.xs, marginTop: 4 },
});
