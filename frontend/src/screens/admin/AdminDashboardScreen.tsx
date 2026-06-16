import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { educationAPI, audioAPI } from '../../api';
import AnimatedView from '../../components/AnimatedView';
import { LoadingState, EmptyState } from '../../components/LoadingState';
import { Typography, Spacing, BorderRadius } from '../../theme';

type Tab = 'education' | 'audio';

const SOURCE_DOTS: Record<string, string> = {
    youtube: '#FF0000',
    tiktok: '#222222',
    other: '#60A5FA',
};

function formatDuration(seconds: number): string {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s > 0 ? s + 's' : ''}`.trim() : `${s}s`;
}

export default function AdminDashboardScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [tab, setTab] = useState<Tab>('education');
    const [eduContents, setEduContents] = useState<any[]>([]);
    const [audios, setAudios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eduRes, audioRes] = await Promise.all([
                educationAPI.getContents({ limit: 50 }),
                audioAPI.getAudios(),
            ]);
            setEduContents(eduRes.contents || []);
            setAudios(audioRes.audios || []);
        } catch (e) {
            console.warn('Fetch admin data failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const deleteEdu = (id: string) => {
        Alert.alert('Hapus Konten', 'Yakin ingin menghapus konten ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive', onPress: async () => {
                    try { await educationAPI.deleteContent(id); fetchData(); } catch { }
                }
            },
        ]);
    };

    const deleteAudio = (id: string) => {
        Alert.alert('Hapus Audio', 'Yakin ingin menghapus audio ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive', onPress: async () => {
                    try { await audioAPI.deleteAudio(id); fetchData(); } catch { }
                }
            },
        ]);
    };

    const TABS: { key: Tab; label: string }[] = [
        { key: 'education', label: 'Konten Edukasi' },
        { key: 'audio', label: 'Audio (Iterasi 2)' },
    ];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    Admin Dashboard
                </Text>

                <View style={styles.tabs}>
                    {TABS.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            onPress={() => setTab(t.key)}
                            style={[
                                styles.tabBtn,
                                {
                                    backgroundColor: tab === t.key ? colors.softBlue : colors.lightGray,
                                    borderBottomWidth: tab === t.key ? 2 : 0,
                                    borderBottomColor: colors.softBlueDark,
                                },
                            ]}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: tab === t.key ? colors.white : colors.darkGray, fontFamily: Typography.bodyMedium },
                            ]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {tab === 'education' && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ContentForm')}
                        style={[styles.addBtn, { backgroundColor: colors.sageGreen }]}
                    >
                        <Text style={[styles.addBtnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>
                            + Tambah Konten
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <LoadingState />
            ) : tab === 'education' ? (
                eduContents.length === 0
                    ? <EmptyState message="Belum ada konten edukasi." />
                    : (
                        <FlatList
                            data={eduContents}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            renderItem={({ item, index }) => (
                                <AnimatedView delay={index * 40}>
                                    <View style={[styles.card, { backgroundColor: colors.bgCard, opacity: item.isActive ? 1 : 0.55 }]}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.sourceRow}>
                                                <View style={[styles.dot, { backgroundColor: SOURCE_DOTS[item.source] || colors.mediumGray }]} />
                                                <Text style={[styles.sourceLabel, { color: colors.darkGray, fontFamily: Typography.bodySemiBold }]}>
                                                    {(item.source || '').toUpperCase()}
                                                </Text>
                                                {item.category ? (
                                                    <View style={[styles.categoryBadge, { backgroundColor: colors.sageGreen + '22' }]}>
                                                        <Text style={[styles.categoryBadgeText, { color: colors.sageGreenDark, fontFamily: Typography.bodyMedium }]}>
                                                            {item.category}
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                            <View style={styles.statusRow}>
                                                <View style={[styles.dot, { backgroundColor: item.isActive ? '#4CAF50' : '#F44336' }]} />
                                                <Text style={[styles.statusText, { color: item.isActive ? '#4CAF50' : '#F44336', fontFamily: Typography.body }]}>
                                                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={[styles.cardTitle, { color: colors.charcoal, fontFamily: Typography.heading }]} numberOfLines={2}>
                                            {item.title}
                                        </Text>
                                        <Text style={[styles.cardUrl, { color: colors.mediumGray, fontFamily: Typography.body }]} numberOfLines={1}>
                                            {item.url}
                                        </Text>

                                        <View style={styles.actions}>
                                            <TouchableOpacity
                                                onPress={() => navigation.navigate('ContentForm', { content: item })}
                                                style={[styles.actionBtn, { backgroundColor: colors.softBlue + '22' }]}
                                            >
                                                <Text style={[styles.actionText, { color: colors.softBlue, fontFamily: Typography.bodyMedium }]}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => deleteEdu(item.id)}
                                                style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]}
                                            >
                                                <Text style={[styles.actionText, { color: colors.error, fontFamily: Typography.bodyMedium }]}>Hapus</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </AnimatedView>
                            )}
                        />
                    )
            ) : (
                <View style={styles.audioTab}>
                    <View style={[styles.audioNote, { backgroundColor: colors.lightGray }]}>
                        <Text style={[styles.audioNoteText, { color: colors.darkGray, fontFamily: Typography.body }]}>
                            Fitur upload audio tersedia di Iterasi 2
                        </Text>
                    </View>

                    {audios.length > 0 && (
                        <FlatList
                            data={audios}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            renderItem={({ item, index }) => (
                                <AnimatedView delay={index * 40}>
                                    <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
                                        <Text style={[styles.cardTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                                            {item.title}
                                        </Text>
                                        <View style={styles.audioMeta}>
                                            {item.category ? (
                                                <View style={[styles.categoryBadge, { backgroundColor: colors.lavender + '33' }]}>
                                                    <Text style={[styles.categoryBadgeText, { color: colors.lavenderDark, fontFamily: Typography.bodyMedium }]}>
                                                        {item.category}
                                                    </Text>
                                                </View>
                                            ) : null}
                                            {item.duration ? (
                                                <Text style={[styles.durationText, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                                                    {formatDuration(item.duration)}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <View style={styles.actions}>
                                            <TouchableOpacity
                                                onPress={() => deleteAudio(item.id)}
                                                style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]}
                                            >
                                                <Text style={[styles.actionText, { color: colors.error, fontFamily: Typography.bodyMedium }]}>Hapus</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </AnimatedView>
                            )}
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
    title: { fontSize: Typography.sizes['2xl'], marginBottom: Spacing.md },
    tabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
    tabBtn: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    tabText: { fontSize: Typography.sizes.xs },
    addBtn: {
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    addBtnText: { fontSize: Typography.sizes.base },
    list: { padding: Spacing.md, gap: Spacing.sm },
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    sourceLabel: { fontSize: Typography.sizes.xs },
    statusText: { fontSize: Typography.sizes.xs },
    categoryBadge: {
        paddingHorizontal: Spacing.xs + 2,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    categoryBadgeText: { fontSize: Typography.sizes.xs },
    cardTitle: { fontSize: Typography.sizes.base, marginBottom: 4 },
    cardUrl: { fontSize: Typography.sizes.xs, marginBottom: Spacing.sm },
    actions: { flexDirection: 'row', gap: Spacing.sm },
    actionBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
    actionText: { fontSize: Typography.sizes.sm },
    audioTab: { flex: 1 },
    audioNote: {
        margin: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    audioNoteText: { fontSize: Typography.sizes.sm, fontStyle: 'italic', textAlign: 'center' },
    audioMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    durationText: { fontSize: Typography.sizes.xs },
});
