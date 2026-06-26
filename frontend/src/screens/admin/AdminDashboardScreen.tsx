import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    Alert, Switch, TextInput, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../../auth/AuthContext';
import { educationAPI, audioAPI, breathingAPI, meditationAPI, gamificationAPI } from '../../api';
import AnimatedView from '../../components/AnimatedView';
import { LoadingState } from '../../components/LoadingState';
import { Typography, Spacing } from '../../theme';

type Tab = 'education' | 'audio' | 'breathing' | 'meditation' | 'gamification';

const BLUE = '#1A59A1';
const BLUE_DARK = '#14457D';
const BG = '#f4f7fb';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#e7eef7';
const TEXT_DARK = '#243a5c';
const TEXT_MUTED = '#9aa7bd';
const BADGE_BG = '#eaf1fa';
const DELETE_BG = '#fdeef0';
const DELETE_TEXT = '#c2566b';

const CATEGORY_ICONS: Record<string, string> = {
    sleep: 'moon-outline', focus: 'scan-circle-outline',
    anxiety: 'heart-outline', morning: 'sunny-outline', general: 'leaf-outline',
};

const GAMI_LABELS: Record<string, string> = {
    BREATHING: 'Pernapasan', MEDITATION: 'Meditasi', EDUCATION_CONTENT: 'Konten Edukasi',
    AUDIO_CONTENT: 'Audio', JOURNAL_ENTRY: 'Jurnal', WORD_PUZZLE: 'Tebak Kata', TETRIS: 'Tetris',
};
const GAMI_ICONS: Record<string, string> = {
    BREATHING: 'leaf-outline', MEDITATION: 'planet-outline', EDUCATION_CONTENT: 'book-outline',
    AUDIO_CONTENT: 'musical-notes-outline', JOURNAL_ENTRY: 'journal-outline',
    WORD_PUZZLE: 'text-outline', TETRIS: 'grid-outline',
};

const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'education', label: 'Edukasi', icon: 'book-outline' },
    { key: 'audio', label: 'Audio', icon: 'musical-notes-outline' },
    { key: 'breathing', label: 'Napas', icon: 'leaf-outline' },
    { key: 'meditation', label: 'Meditasi', icon: 'planet-outline' },
    { key: 'gamification', label: 'Reward', icon: 'ribbon-outline' },
];

const TAB_META: Record<Tab, { title: string; sub: string }> = {
    education:    { title: 'Konten Edukasi',     sub: 'Kelola artikel & panduan' },
    audio:        { title: 'Audio Relaksasi',     sub: 'Kelola berkas audio' },
    breathing:    { title: 'Teknik Pernapasan',   sub: 'Kelola teknik pernapasan' },
    meditation:   { title: 'Sesi Meditasi',       sub: 'Kelola sesi meditasi' },
    gamification: { title: 'Aturan XP & Poin',   sub: 'Atur reward gamifikasi' },
};

function formatDuration(seconds: number): string {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s > 0 ? s + 's' : ''}`.trim() : `${s}s`;
}

function TagBadge({ label }: { label: string }) {
    const draftLabels = ['Draf', 'Nonaktif'];
    const isDraft = draftLabels.some(d => label.toLowerCase().includes(d.toLowerCase()));
    return (
        <View style={[styles.tagBadge, isDraft ? styles.tagBadgeDraft : styles.tagBadgeBlue]}>
            <Text style={[styles.tagBadgeText, isDraft ? styles.tagBadgeTextDraft : styles.tagBadgeTextBlue]}>
                {label}
            </Text>
        </View>
    );
}

export default function AdminDashboardScreen({ navigation }: any) {
    const { canAccessAdminPanel } = useAuthContext();
    const insets = useSafeAreaInsets();

    const [tab, setTab] = useState<Tab>('education');
    const [eduContents, setEduContents] = useState<any[]>([]);
    const [audios, setAudios] = useState<any[]>([]);
    const [techniques, setTechniques] = useState<any[]>([]);
    const [meditationSessions, setMeditationSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [gamiRules, setGamiRules] = useState<any[]>([]);
    const [gamiLoading, setGamiLoading] = useState(false);
    const [gamiSaving, setGamiSaving] = useState<string | null>(null);

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

    const fetchGami = async () => {
        setGamiLoading(true);
        try {
            const res = await gamificationAPI.getRules();
            setGamiRules(res.rules || []);
        } catch (error: any) {
            Alert.alert('Gagal memuat aturan', error?.response?.data?.error || 'Coba lagi nanti.');
        } finally {
            setGamiLoading(false);
        }
    };

    useEffect(() => {
        if (canAccessAdminPanel) {
            fetchData();
            fetchGami();
        }
    }, [canAccessAdminPanel]);

    const updateGamiLocal = (activityType: string, patch: any) =>
        setGamiRules(prev => prev.map(r => r.activityType === activityType ? { ...r, ...patch } : r));

    const saveGamiRule = async (rule: any) => {
        setGamiSaving(rule.activityType);
        try {
            const payload = { xp: Number(rule.xp) || 0, points: Number(rule.points) || 0, isActive: !!rule.isActive };
            const res = await gamificationAPI.updateRule(rule.activityType, payload);
            updateGamiLocal(rule.activityType, res.rule);
            Alert.alert('Tersimpan', `Aturan ${GAMI_LABELS[rule.activityType] || rule.activityType} diperbarui.`);
        } catch (error: any) {
            Alert.alert('Gagal menyimpan', error?.response?.data?.error || 'Coba lagi nanti.');
        } finally {
            setGamiSaving(null);
        }
    };

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

    const handleAdd = () => {
        const routes: Record<Tab, string> = {
            education: 'ContentForm', audio: 'AudioForm',
            breathing: 'BreathingForm', meditation: 'MeditationForm',
            gamification: '',
        };
        if (routes[tab]) navigation.navigate(routes[tab]);
    };

    if (!canAccessAdminPanel) {
        return (
            <View style={[styles.denied, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
                <Ionicons name="lock-closed-outline" size={34} color={TEXT_MUTED} />
                <Text style={styles.deniedTitle}>Akses Admin</Text>
                <Text style={styles.deniedSub}>Akun ini tidak memiliki izin akses admin.</Text>
            </View>
        );
    }

    const renderEduItem = ({ item, index }: any) => (
        <AnimatedView delay={index * 40}>
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                        <Ionicons name="book-outline" size={22} color={BLUE} />
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <View style={styles.catBadge}>
                                <Text style={styles.catBadgeText}>{(item.source || '').toUpperCase()}</Text>
                            </View>
                        </View>
                        <Text style={styles.cardMeta}>{item.category}</Text>
                        <View style={styles.tagRow}>
                            <TagBadge label={item.isActive ? 'Terbit' : 'Nonaktif'} />
                            <TagBadge label={item.category} />
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => navigation.navigate('ContentForm', { content: item })} style={styles.editBtn}>
                                <Ionicons name="pencil-outline" size={14} color={BLUE} />
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteEdu(item)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={14} color={DELETE_TEXT} />
                                <Text style={styles.deleteBtnText}>Hapus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </AnimatedView>
    );

    const renderBreathItem = ({ item, index }: any) => (
        <AnimatedView delay={index * 40}>
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.colorTheme || BLUE }]}>
                <View style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                        <Ionicons name="leaf-outline" size={22} color={BLUE} />
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.icon ? `${item.icon} ` : ''}{item.name}</Text>
                            <View style={styles.catBadge}><Text style={styles.catBadgeText}>{item.cycles}x</Text></View>
                        </View>
                        <View style={styles.pillRow}>
                            {[
                                { label: 'Tarik', val: item.inhaleDuration },
                                { label: 'Tahan', val: item.holdDuration },
                                { label: 'Hembus', val: item.exhaleDuration },
                            ].filter(p => p.val > 0).map(p => (
                                <View key={p.label} style={styles.pill}>
                                    <Text style={styles.pillVal}>{p.val}s</Text>
                                    <Text style={styles.pillLabel}>{p.label}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => navigation.navigate('BreathingForm', { technique: item })} style={styles.editBtn}>
                                <Ionicons name="pencil-outline" size={14} color={BLUE} />
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteTechnique(item)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={14} color={DELETE_TEXT} />
                                <Text style={styles.deleteBtnText}>Hapus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </AnimatedView>
    );

    const renderMeditationItem = ({ item, index }: any) => (
        <AnimatedView delay={index * 40}>
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.colorTheme || '#8a5cf6' }]}>
                <View style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                        <Ionicons name={(CATEGORY_ICONS[item.category] || 'planet-outline') as any} size={22} color={BLUE} />
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <View style={styles.catBadge}><Text style={styles.catBadgeText}>{item.category}</Text></View>
                        </View>
                        <View style={styles.pillRow}>
                            {(item.durationOptions || []).map((d: number) => (
                                <View key={d} style={styles.pill}>
                                    <Text style={styles.pillVal}>{d}m</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => navigation.navigate('MeditationForm', { session: item })} style={styles.editBtn}>
                                <Ionicons name="pencil-outline" size={14} color={BLUE} />
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteMeditation(item)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={14} color={DELETE_TEXT} />
                                <Text style={styles.deleteBtnText}>Hapus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </AnimatedView>
    );

    const renderAudioItem = ({ item, index }: any) => (
        <AnimatedView delay={index * 40}>
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                        <Ionicons name="musical-notes-outline" size={22} color={BLUE} />
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            {item.category ? <View style={styles.catBadge}><Text style={styles.catBadgeText}>{item.category}</Text></View> : null}
                        </View>
                        {item.duration ? (
                            <Text style={styles.cardMeta}>{formatDuration(item.duration)}</Text>
                        ) : null}
                        <View style={styles.tagRow}>
                            <TagBadge label="Audio" />
                            {item.category ? <TagBadge label={item.category} /> : null}
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => deleteAudio(item)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={14} color={DELETE_TEXT} />
                                <Text style={styles.deleteBtnText}>Hapus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </AnimatedView>
    );

    const renderGamification = () => {
        if (gamiLoading) return <LoadingState />;
        return (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
                <LinearGradient
                    colors={[BLUE, BLUE_DARK]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.gamiHeader}
                >
                    <View style={styles.gamiHeaderIcon}>
                        <Ionicons name="ribbon-outline" size={24} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.gamiHeaderTitle}>Aturan XP & Poin</Text>
                        <Text style={styles.gamiHeaderSub}>Atur reward yang didapat user untuk tiap aktivitas.</Text>
                    </View>
                </LinearGradient>

                {gamiRules.map(rule => (
                    <View key={rule.activityType} style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={styles.cardIcon}>
                                <Ionicons name={(GAMI_ICONS[rule.activityType] || 'options-outline') as any} size={22} color={BLUE} />
                            </View>
                            <View style={[styles.cardBody, { gap: 0 }]}>
                                <View style={styles.cardTitleRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle}>{GAMI_LABELS[rule.activityType] || rule.activityType}</Text>
                                        <Text style={styles.cardMeta}>{rule.activityType}</Text>
                                    </View>
                                    <Switch
                                        value={!!rule.isActive}
                                        onValueChange={val => updateGamiLocal(rule.activityType, { isActive: val })}
                                        trackColor={{ false: '#cdd9e8', true: BADGE_BG }}
                                        thumbColor={rule.isActive ? BLUE : '#fff'}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.gamiInputRow}>
                            <View style={styles.gamiInputGroup}>
                                <Text style={styles.gamiInputLabel}>XP</Text>
                                <View style={styles.gamiInputBox}>
                                    <TextInput
                                        keyboardType="number-pad"
                                        value={String(rule.xp)}
                                        onChangeText={t => updateGamiLocal(rule.activityType, { xp: t })}
                                        style={styles.gamiInput}
                                    />
                                    <Text style={styles.gamiInputUnit}>XP</Text>
                                </View>
                            </View>
                            <View style={styles.gamiInputGroup}>
                                <Text style={styles.gamiInputLabel}>POIN</Text>
                                <View style={styles.gamiInputBox}>
                                    <TextInput
                                        keyboardType="number-pad"
                                        value={String(rule.points)}
                                        onChangeText={t => updateGamiLocal(rule.activityType, { points: t })}
                                        style={styles.gamiInput}
                                    />
                                    <Text style={styles.gamiInputUnit}>poin</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => saveGamiRule(rule)}
                            disabled={gamiSaving === rule.activityType}
                            style={[styles.gamiSaveBtn, gamiSaving === rule.activityType && { opacity: 0.6 }]}
                        >
                            <LinearGradient colors={[BLUE, BLUE_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gamiSaveBtnInner}>
                                <Ionicons name="save-outline" size={16} color="#fff" />
                                <Text style={styles.gamiSaveBtnText}>
                                    {gamiSaving === rule.activityType ? 'Menyimpan...' : 'Simpan'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderContent = () => {
        if (tab === 'gamification') return renderGamification();
        if (loading) return <LoadingState />;

        const dataMap: Record<Exclude<Tab, 'gamification'>, { data: any[]; render: any; empty: string }> = {
            education: { data: eduContents, render: renderEduItem, empty: 'Belum ada konten edukasi.' },
            audio:      { data: audios, render: renderAudioItem, empty: 'Belum ada audio.' },
            breathing:  { data: techniques, render: renderBreathItem, empty: 'Belum ada teknik pernapasan.' },
            meditation: { data: meditationSessions, render: renderMeditationItem, empty: 'Belum ada sesi meditasi.' },
        };
        const entry = dataMap[tab as Exclude<Tab, 'gamification'>];
        if (entry.data.length === 0) {
            return (
                <View style={styles.emptyWrap}>
                    <Ionicons name="file-tray-outline" size={40} color={TEXT_MUTED} />
                    <Text style={styles.emptyText}>{entry.empty}</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={entry.data}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 160 }}
                renderItem={entry.render}
            />
        );
    };

    const tabBarHeight = 74 + insets.bottom;

    return (
        <View style={{ flex: 1, backgroundColor: BLUE }}>
            <StatusBar barStyle="light-content" backgroundColor={BLUE} />

            {/* Header */}
            <LinearGradient
                colors={[BLUE, BLUE_DARK]}
                start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                {/* Decorative SVG bg element rendered via View overlay */}
                <View style={styles.headerDecor} pointerEvents="none" />
                <View style={styles.headerContent}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.headerLabel}>ADMIN KONTEN</Text>
                        <Text style={styles.headerTitle}>{TAB_META[tab].title}</Text>
                        <Text style={styles.headerSub}>{TAB_META[tab].sub}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAvatar}>
                        <Ionicons name="chevron-back-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Content */}
            <View style={[styles.content, { paddingBottom: tabBarHeight }]}>
                {renderContent()}
            </View>

            {/* FAB */}
            {tab !== 'gamification' && (
                <TouchableOpacity onPress={handleAdd} style={[styles.fab, { bottom: tabBarHeight + 16 }]}>
                    <LinearGradient colors={[BLUE, BLUE_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
                        <Ionicons name="add" size={28} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Bottom tab bar */}
            <LinearGradient
                colors={['#1A59A1', '#123F73']}
                start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }]}
            >
                {TABS.map(t => {
                    const active = t.key === tab;
                    return (
                        <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={styles.tabItem}>
                            <View style={[styles.tabIconWrap, active && styles.tabIconActive]}>
                                <Ionicons name={t.icon as any} size={20} color={active ? '#fff' : '#7ba0d6'} />
                            </View>
                            <Text style={[styles.tabLabel, active ? styles.tabLabelActive : styles.tabLabelInactive]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.lg, backgroundColor: BG },
    deniedTitle: { fontSize: 20, fontFamily: Typography.headingBold, color: TEXT_DARK, textAlign: 'center' },
    deniedSub: { color: TEXT_MUTED, textAlign: 'center', lineHeight: 20 },

    header: { paddingHorizontal: 22, paddingBottom: 20, overflow: 'hidden' },
    headerDecor: {
        position: 'absolute', right: -10, top: 14,
        width: 170, height: 124, opacity: 0.28,
        borderRadius: 999,
        backgroundColor: 'transparent',
    },
    headerContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    headerLabel: { fontSize: 10.5, fontWeight: '700', color: '#bcd2ee', letterSpacing: 1.2 },
    headerTitle: { fontFamily: 'Lora_500Medium', fontSize: 24, color: '#fff', marginTop: 5, lineHeight: 27 },
    headerSub: { fontSize: 13, color: '#cfddf2', marginTop: 6 },
    headerAvatar: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
    },

    content: { flex: 1, backgroundColor: BG },

    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
    emptyText: { fontSize: 14, color: TEXT_MUTED },

    card: {
        backgroundColor: CARD_BG, borderRadius: 20,
        padding: 15, borderWidth: 1, borderColor: CARD_BORDER,
        shadowColor: BLUE, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.10, shadowRadius: 30, elevation: 3,
        gap: 13,
    },
    cardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    cardIcon: {
        width: 46, height: 46, borderRadius: 14,
        backgroundColor: BADGE_BG, alignItems: 'center', justifyContent: 'center',
    },
    cardBody: { flex: 1, gap: 4 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
    cardTitle: { flex: 1, fontSize: 15, fontFamily: Typography.headingBold, color: TEXT_DARK, lineHeight: 1.2 * 15 },
    cardMeta: { fontSize: 12, color: '#8493ab', lineHeight: 18 },
    catBadge: { backgroundColor: BADGE_BG, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, flexShrink: 0 },
    catBadgeText: { fontSize: 10, fontFamily: Typography.bodySemiBold, color: BLUE, letterSpacing: 0.3, textTransform: 'uppercase' },

    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    tagBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
    tagBadgeBlue: { backgroundColor: BADGE_BG },
    tagBadgeDraft: { backgroundColor: '#fbeedd' },
    tagBadgeText: { fontSize: 10.5, fontFamily: Typography.bodySemiBold, borderRadius: 8 },
    tagBadgeTextBlue: { color: BLUE },
    tagBadgeTextDraft: { color: '#c5872a' },

    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    pill: { backgroundColor: BADGE_BG, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
    pillVal: { fontSize: 13, fontFamily: Typography.headingBold, color: BLUE },
    pillLabel: { fontSize: 10, color: TEXT_MUTED },

    actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BADGE_BG, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 8 },
    editBtnText: { fontSize: 13, fontFamily: Typography.bodySemiBold, color: BLUE },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: DELETE_BG, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 8 },
    deleteBtnText: { fontSize: 13, fontFamily: Typography.bodySemiBold, color: DELETE_TEXT },

    // Gamification
    gamiHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18 },
    gamiHeaderIcon: {
        width: 48, height: 48, borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center', justifyContent: 'center',
    },
    gamiHeaderTitle: { fontFamily: 'Lora_500Medium', fontSize: 18, color: '#fff', lineHeight: 22 },
    gamiHeaderSub: { fontSize: 12.5, color: '#cfddf2', marginTop: 4, lineHeight: 18 },

    gamiInputRow: { flexDirection: 'row', gap: 10 },
    gamiInputGroup: { flex: 1, gap: 6 },
    gamiInputLabel: { fontSize: 10, fontFamily: Typography.bodySemiBold, color: '#7689a6', letterSpacing: 0.7 },
    gamiInputBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: BG, borderWidth: 1, borderColor: '#e1e8f3',
        borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9,
    },
    gamiInput: { fontSize: 16, fontFamily: Typography.headingBold, color: TEXT_DARK, flex: 1 },
    gamiInputUnit: { fontSize: 11, color: TEXT_MUTED },
    gamiSaveBtn: { overflow: 'hidden', borderRadius: 16 },
    gamiSaveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
    gamiSaveBtnText: { color: '#fff', fontFamily: Typography.headingBold, fontSize: 14 },

    // FAB
    fab: { position: 'absolute', right: 18, zIndex: 30 },
    fabInner: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    // Tab bar
    tabBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 14 },
    tabItem: { flex: 1, alignItems: 'center', gap: 4 },
    tabIconWrap: { width: 46, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    tabIconActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
    tabLabel: { fontSize: 10 },
    tabLabelActive: { fontFamily: Typography.headingBold, color: '#ffffff' },
    tabLabelInactive: { fontFamily: Typography.bodyMedium, color: '#7ba0d6' },
});
