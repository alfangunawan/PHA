import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { educationAPI, audioAPI, breathingAPI, meditationAPI } from '../../api';
import AnimatedView from '../../components/AnimatedView';
import { LoadingState, EmptyState } from '../../components/LoadingState';
import { Typography, Spacing, BorderRadius } from '../../theme';

type Tab = 'education' | 'audio' | 'breathing' | 'meditation';

const SOURCE_DOTS: Record<string, string> = {
    youtube: '#FF0000',
    tiktok: '#222222',
    other: '#60A5FA',
};

const CATEGORY_EMOJIS: Record<string, string> = {
    sleep: '🌙', focus: '🎯', anxiety: '💚', morning: '🌅', general: '🌿',
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
    const [techniques, setTechniques] = useState<any[]>([]);
    const [meditationSessions, setMeditationSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eduRes, audioRes, breathRes, meditRes] = await Promise.all([
                educationAPI.getContents({ limit: 50 }),
                audioAPI.getAudios(),
                breathingAPI.getTechniques(),
                meditationAPI.getSessions(),
            ]);
            setEduContents(eduRes.contents || []);
            setAudios(audioRes.audios || []);
            setTechniques(breathRes.techniques || []);
            setMeditationSessions(meditRes.sessions || []);
        } catch (e) {
            console.warn('Fetch admin data failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const confirmDelete = (title: string, onConfirm: () => void) => {
        Alert.alert(`Hapus "${title}"`, 'Tindakan ini tidak bisa dibatalkan.', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: onConfirm },
        ]);
    };

    const deleteEdu = (item: any) => confirmDelete(item.title, async () => {
        try { await educationAPI.deleteContent(item.id); fetchData(); } catch { }
    });
    const deleteAudio = (item: any) => confirmDelete(item.title, async () => {
        try { await audioAPI.deleteAudio(item.id); fetchData(); } catch { }
    });
    const deleteTechnique = (item: any) => confirmDelete(item.name, async () => {
        try { await breathingAPI.deleteTechnique(item.id); fetchData(); } catch { }
    });
    const deleteMeditation = (item: any) => confirmDelete(item.title, async () => {
        try { await meditationAPI.deleteSession(item.id); fetchData(); } catch { }
    });

    const TABS: { key: Tab; label: string; emoji: string }[] = [
        { key: 'education', label: 'Edukasi', emoji: '📚' },
        { key: 'breathing', label: 'Napas', emoji: '🫁' },
        { key: 'meditation', label: 'Meditasi', emoji: '🧘' },
        { key: 'audio', label: 'Audio', emoji: '🎵' },
    ];

    const renderAddButton = () => {
        const config: Record<Tab, { label: string; onPress: () => void }> = {
            education: { label: '+ Tambah Konten', onPress: () => navigation.navigate('ContentForm') },
            audio: { label: '+ Upload Audio', onPress: () => navigation.navigate('AudioForm') },
            breathing: { label: '+ Tambah Teknik', onPress: () => navigation.navigate('BreathingForm') },
            meditation: { label: '+ Tambah Sesi', onPress: () => navigation.navigate('MeditationForm') },
        };
        const { label, onPress } = config[tab];
        return (
            <TouchableOpacity onPress={onPress} style={[styles.addBtn, { backgroundColor: colors.sageGreen }]}>
                <Text style={[styles.addBtnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const renderEduItem = ({ item, index }: any) => (
        <AnimatedView delay={index * 40}>
            <View style={[styles.card, { backgroundColor: colors.bgCard, opacity: item.isActive ? 1 : 0.55 }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.sourceRow}>
                        <View style={[styles.dot, { backgroundColor: SOURCE_DOTS[item.source] || colors.mediumGray }]} />
                        <Text style={[styles.sourceLabel, { color: colors.darkGray, fontFamily: Typography.bodySemiBold }]}>
                            {(item.source || '').toUpperCase()}
                        </Text>
                        {item.category ? (
                            <View style={[styles.badge, { backgroundColor: colors.sageGreen + '22' }]}>
                                <Text style={[styles.badgeText, { color: colors.sageGreenDark, fontFamily: Typography.bodyMedium }]}>
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
                    <TouchableOpacity onPress={() => navigation.navigate('ContentForm', { content: item })} style={[styles.actionBtn, { backgroundColor: colors.softBlue + '22' }]}>
                        <Text style={[styles.actionText, { color: colors.softBlue, fontFamily: Typography.bodyMedium }]}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEdu(item)} style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]}>
                        <Text style={[styles.actionText, { color: colors.error, fontFamily: Typography.bodyMedium }]}>🗑️ Hapus</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AnimatedView>
    );

    const renderBreathItem = ({ item, index }: any) => (
        <AnimatedView delay={index * 40}>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderLeftWidth: 4, borderLeftColor: item.colorTheme || colors.softBlue }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.charcoal, fontFamily: Typography.heading, flex: 1 }]}>
                        {item.icon ? `${item.icon}  ` : ''}{item.name}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.softBlue + '22' }]}>
                        <Text style={[styles.badgeText, { color: colors.softBlue, fontFamily: Typography.bodyMedium }]}>
                            {item.cycles}x siklus
                        </Text>
                    </View>
                </View>
                <View style={styles.phaseRow}>
                    {[
                        { label: 'Tarik', val: item.inhaleDuration, c: colors.softBlue },
                        { label: 'Tahan', val: item.holdDuration, c: colors.lavender },
                        { label: 'Hembus', val: item.exhaleDuration, c: colors.sageGreen },
                        { label: 'Jeda', val: item.holdAfterExhale, c: colors.peach },
                    ].filter(p => p.val > 0).map(p => (
                        <View key={p.label} style={[styles.phasePill, { backgroundColor: p.c + '22' }]}>
                            <Text style={[styles.phasePillText, { color: p.c, fontFamily: Typography.bodySemiBold }]}>{p.val}s</Text>
                            <Text style={[styles.phasePillLabel, { color: colors.darkGray, fontFamily: Typography.body }]}>{p.label}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => navigation.navigate('BreathingForm', { technique: item })} style={[styles.actionBtn, { backgroundColor: colors.softBlue + '22' }]}>
                        <Text style={[styles.actionText, { color: colors.softBlue, fontFamily: Typography.bodyMedium }]}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTechnique(item)} style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]}>
                        <Text style={[styles.actionText, { color: colors.error, fontFamily: Typography.bodyMedium }]}>🗑️ Hapus</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AnimatedView>
    );

    const renderMeditationItem = ({ item, index }: any) => (
        <AnimatedView delay={index * 40}>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderLeftWidth: 4, borderLeftColor: item.colorTheme || colors.lavender }]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[item.category] || '🧘'}</Text>
                    <Text style={[styles.cardTitle, { color: colors.charcoal, fontFamily: Typography.heading, flex: 1 }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.lavender + '33' }]}>
                        <Text style={[styles.badgeText, { color: colors.lavenderDark, fontFamily: Typography.bodyMedium }]}>
                            {item.category}
                        </Text>
                    </View>
                </View>
                <View style={styles.durationsRow}>
                    {(item.durationOptions || []).map((d: number) => (
                        <View key={d} style={[styles.durationPill, { backgroundColor: colors.lightGray }]}>
                            <Text style={[styles.durationPillText, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>{d}m</Text>
                        </View>
                    ))}
                    {item.audioUrl && (
                        <View style={[styles.durationPill, { backgroundColor: colors.sageGreen + '22' }]}>
                            <Text style={[styles.durationPillText, { color: colors.sageGreenDark, fontFamily: Typography.bodyMedium }]}>🎵 Audio</Text>
                        </View>
                    )}
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => navigation.navigate('MeditationForm', { session: item })} style={[styles.actionBtn, { backgroundColor: colors.softBlue + '22' }]}>
                        <Text style={[styles.actionText, { color: colors.softBlue, fontFamily: Typography.bodyMedium }]}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteMeditation(item)} style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]}>
                        <Text style={[styles.actionText, { color: colors.error, fontFamily: Typography.bodyMedium }]}>🗑️ Hapus</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AnimatedView>
    );

    const renderAudioItem = ({ item, index }: any) => (
        <AnimatedView delay={index * 40}>
            <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.charcoal, fontFamily: Typography.heading, flex: 1 }]}>
                        🎵 {item.title}
                    </Text>
                    {item.category ? (
                        <View style={[styles.badge, { backgroundColor: colors.lavender + '33' }]}>
                            <Text style={[styles.badgeText, { color: colors.lavenderDark, fontFamily: Typography.bodyMedium }]}>{item.category}</Text>
                        </View>
                    ) : null}
                </View>
                {item.duration ? (
                    <Text style={[styles.cardUrl, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                        ⏱ {formatDuration(item.duration)}
                    </Text>
                ) : null}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => deleteAudio(item)} style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]}>
                        <Text style={[styles.actionText, { color: colors.error, fontFamily: Typography.bodyMedium }]}>🗑️ Hapus</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AnimatedView>
    );

    const renderContent = () => {
        if (loading) return <LoadingState />;
        const dataMap: Record<Tab, { data: any[]; render: any; empty: string }> = {
            education: { data: eduContents, render: renderEduItem, empty: 'Belum ada konten edukasi.' },
            breathing: { data: techniques, render: renderBreathItem, empty: 'Belum ada teknik pernapasan.' },
            meditation: { data: meditationSessions, render: renderMeditationItem, empty: 'Belum ada sesi meditasi.' },
            audio: { data: audios, render: renderAudioItem, empty: 'Belum ada audio.' },
        };
        const { data, render, empty } = dataMap[tab];
        if (data.length === 0) return <EmptyState message={empty} />;
        return (
            <FlatList
                data={data}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={render}
            />
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>Admin Dashboard</Text>

                {/* Tab bar */}
                <View style={styles.tabs}>
                    {TABS.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            onPress={() => setTab(t.key)}
                            style={[
                                styles.tabBtn,
                                { backgroundColor: tab === t.key ? colors.softBlue : colors.lightGray },
                            ]}
                        >
                            <Text style={styles.tabEmoji}>{t.emoji}</Text>
                            <Text style={[styles.tabText, { color: tab === t.key ? colors.white : colors.darkGray, fontFamily: Typography.bodyMedium }]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {renderAddButton()}
            </View>

            {renderContent()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
    title: { fontSize: Typography.sizes['2xl'], marginBottom: Spacing.md },
    tabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm, flexWrap: 'wrap' },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
    },
    tabEmoji: { fontSize: 14 },
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs, gap: Spacing.xs },
    categoryEmoji: { fontSize: 18 },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    sourceLabel: { fontSize: Typography.sizes.xs },
    statusText: { fontSize: Typography.sizes.xs },
    badge: { paddingHorizontal: Spacing.xs + 2, paddingVertical: 2, borderRadius: BorderRadius.sm },
    badgeText: { fontSize: Typography.sizes.xs },
    cardTitle: { fontSize: Typography.sizes.base, marginBottom: 4 },
    cardUrl: { fontSize: Typography.sizes.xs, marginBottom: Spacing.sm },
    actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    actionBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
    actionText: { fontSize: Typography.sizes.sm },
    // Breathing
    phaseRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm, flexWrap: 'wrap' },
    phasePill: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm, alignItems: 'center' },
    phasePillText: { fontSize: Typography.sizes.sm },
    phasePillLabel: { fontSize: Typography.sizes.xs },
    // Meditation
    durationsRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm, flexWrap: 'wrap' },
    durationPill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
    durationPillText: { fontSize: Typography.sizes.xs },
});
