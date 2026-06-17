import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, ScrollView, Switch, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateProfile, UserProfile } from './profileService';
import { useAuthContext } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { breathingAPI, meditationAPI } from '../api';
import { Typography } from '../theme';

const D = {
    bg: '#f5f6fb',
    card: '#ffffff',
    cardBorder: '#ecedf6',
    primary: '#8a9ccc',
    primaryLight: '#eef2fb',
    primaryMid: '#dde5f6',
    purpleAcc: '#a87fae',
    goldenAcc: '#c2965c',
    goldenLight: '#f6efe2',
    breathIconBg: '#eef1f9',
    textDark: '#353b4a',
    textMid: '#3b4150',
    textSub: '#9197aa',
    textMuted: '#949bae',
    badgeBg: '#eef2fb',
    badgeBorder: '#e2e8f7',
    badgeText: '#5f6b9e',
    divider: '#f0f1f7',
    inputBg: '#fbfbfe',
    inputBorder: '#e4e6ef',
    inputFocus: '#b6c1e2',
    logoutBg: '#fdf3f3',
    logoutBorder: '#f7dede',
    logoutText: '#d98a8a',
};

interface ActivityStat {
    name: string;
    type: 'breath' | 'meditation';
    cycles?: number;
    durationMin: number;
}

export default function ProfileScreen({ navigation }: any) {
    const { logout, user, isAdmin } = useAuthContext();
    const { isDark, toggleTheme, colors } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [breathTotal, setBreathTotal] = useState(0);
    const [meditationTotal, setMeditationTotal] = useState(0);
    const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
            setDisplayName(data.displayName);
            setAge(data.age?.toString() || '');
            setGender(data.gender || '');
            setBio(data.bio || '');
        } catch {
            Alert.alert('Error', 'Gagal memuat profil');
        } finally {
            setLoading(false);
        }
        try {
            const [bRes, mRes] = await Promise.all([
                breathingAPI.getLogs(),
                meditationAPI.getLogs(),
            ]);
            const bLogs: any[] = bRes.logs || [];
            const mLogs: any[] = mRes.logs || [];
            setBreathTotal(bLogs.length);
            setMeditationTotal(mLogs.length);

            // aggregate breathing by technique
            const bMap: Record<string, { cycles: number; duration: number }> = {};
            bLogs.forEach((log: any) => {
                const name = log.technique?.name || 'Latihan Napas';
                if (!bMap[name]) bMap[name] = { cycles: 0, duration: 0 };
                bMap[name].cycles += log.cyclesCompleted || 0;
                bMap[name].duration += log.duration || 0;
            });

            // aggregate meditation by session
            const mMap: Record<string, { duration: number }> = {};
            mLogs.forEach((log: any) => {
                const name = log.session?.title || 'Sesi Meditasi';
                if (!mMap[name]) mMap[name] = { duration: 0 };
                mMap[name].duration += log.duration || 0;
            });

            const stats: ActivityStat[] = [
                ...Object.entries(bMap).map(([name, v]) => ({
                    name,
                    type: 'breath' as const,
                    cycles: v.cycles,
                    durationMin: Math.round(v.duration / 60),
                })),
                ...Object.entries(mMap).map(([name, v]) => ({
                    name,
                    type: 'meditation' as const,
                    durationMin: Math.round(v.duration / 60),
                })),
            ];
            setActivityStats(stats);
        } catch {
            // non-critical
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updated = await updateProfile({
                displayName,
                age: age ? parseInt(age) : undefined,
                gender,
                bio,
            });
            setProfile(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 1600);
        } catch {
            Alert.alert('Error', 'Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    const bgColor = isDark ? colors.bgPrimary : D.bg;

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: bgColor }]}>
                <ActivityIndicator size="large" color={D.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Profile Header ── */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarWrap}>
                        <LinearGradient
                            colors={['#eef2fb', '#dde5f6']}
                            start={{ x: 0.2, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarCircle}
                        >
                            <Ionicons name="person-outline" size={44} color={D.primary} />
                        </LinearGradient>
                        <TouchableOpacity style={[styles.editBadge, { backgroundColor: isDark ? colors.bgCard : '#fcfcfe' }]}>
                            <Ionicons name="pencil" size={13} color={D.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.profileName, { color: isDark ? colors.charcoal : D.textDark, fontFamily: Typography.headingBold }]}>
                        {displayName || user?.name || 'Teman'}
                    </Text>
                    <Text style={[styles.profileEmail, { color: isDark ? colors.mediumGray : D.textSub, fontFamily: Typography.body }]}>
                        {user?.email}
                    </Text>
                    <View style={styles.rolePill}>
                        <Ionicons name="person-circle-outline" size={12} color={D.badgeText} />
                        <Text style={[styles.roleText, { fontFamily: Typography.bodySemiBold }]}>
                            {user?.role?.toUpperCase() || 'USER'}
                        </Text>
                    </View>
                </View>

                {/* ── Aktivitas Saya ── */}
                <View style={[styles.card, { backgroundColor: isDark ? colors.bgCard : D.card, borderColor: isDark ? colors.divider : D.cardBorder }]}>
                    <Text style={[styles.cardTitle, { color: isDark ? colors.charcoal : D.textMid, fontFamily: Typography.heading }]}>
                        Aktivitas Saya
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={[styles.statNum, { color: D.primary, fontFamily: Typography.headingBold }]}>
                                {breathTotal}
                            </Text>
                            <Text style={[styles.statLabel, { color: isDark ? colors.mediumGray : D.textMuted, fontFamily: Typography.body }]}>
                                Sesi Napas
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: isDark ? colors.divider : D.cardBorder }]} />
                        <View style={styles.statCol}>
                            <Text style={[styles.statNum, { color: D.purpleAcc, fontFamily: Typography.headingBold }]}>
                                {meditationTotal}
                            </Text>
                            <Text style={[styles.statLabel, { color: isDark ? colors.mediumGray : D.textMuted, fontFamily: Typography.body }]}>
                                Sesi Meditasi
                            </Text>
                        </View>
                    </View>

                    {activityStats.length > 0 && (
                        <>
                            <View style={[styles.hDivider, { backgroundColor: isDark ? colors.divider : D.divider }]} />
                            {activityStats.map((item, i) => (
                                <View
                                    key={item.name}
                                    style={[
                                        styles.actRow,
                                        i > 0 && { borderTopWidth: 1, borderTopColor: isDark ? colors.divider : D.divider },
                                    ]}
                                >
                                    <View style={[
                                        styles.actIcon,
                                        {
                                            backgroundColor: item.type === 'breath'
                                                ? (isDark ? '#1a2640' : D.breathIconBg)
                                                : (isDark ? '#2d1f12' : D.goldenLight),
                                        },
                                    ]}>
                                        <Ionicons
                                            name={item.type === 'breath' ? 'leaf-outline' : 'body-outline'}
                                            size={20}
                                            color={item.type === 'breath' ? D.primary : D.goldenAcc}
                                        />
                                    </View>
                                    <Text style={[styles.actName, { color: isDark ? colors.charcoal : D.textMid, fontFamily: Typography.bodyMedium, flex: 1 }]}
                                        numberOfLines={1}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.actMeta, { color: isDark ? colors.mediumGray : '#a4aabc', fontFamily: Typography.body }]}>
                                        {item.type === 'breath'
                                            ? `${item.cycles} siklus · ${item.durationMin} mnt`
                                            : `${item.durationMin} mnt`
                                        }
                                    </Text>
                                </View>
                            ))}
                        </>
                    )}
                </View>

                {/* ── Informasi Profil ── */}
                <View style={[styles.card, { backgroundColor: isDark ? colors.bgCard : D.card, borderColor: isDark ? colors.divider : D.cardBorder }]}>
                    <Text style={[styles.cardTitle, { color: isDark ? colors.charcoal : D.textMid, fontFamily: Typography.heading }]}>
                        Informasi Profil
                    </Text>

                    {[
                        { label: 'Nama Tampilan', value: displayName, setter: setDisplayName, placeholder: 'Nama kamu', keyboard: undefined, multiline: false },
                        { label: 'Usia', value: age, setter: setAge, placeholder: '24', keyboard: 'numeric' as const, multiline: false },
                        { label: 'Gender', value: gender, setter: setGender, placeholder: 'Laki-laki / Perempuan', keyboard: undefined, multiline: false },
                        { label: 'Bio', value: bio, setter: setBio, placeholder: 'Ceritakan tentang dirimu...', keyboard: undefined, multiline: true },
                    ].map(({ label, value, setter, placeholder, keyboard, multiline }) => (
                        <View key={label} style={styles.field}>
                            <Text style={[styles.fieldLabel, { color: isDark ? colors.darkGray : '#6a7185', fontFamily: Typography.bodyMedium }]}>
                                {label}
                            </Text>
                            <TextInput
                                value={value}
                                onChangeText={setter}
                                placeholder={placeholder}
                                placeholderTextColor={isDark ? colors.mediumGray : '#aab0c0'}
                                keyboardType={keyboard}
                                multiline={multiline}
                                numberOfLines={multiline ? 3 : 1}
                                style={[
                                    styles.input,
                                    {
                                        color: isDark ? colors.charcoal : D.textMid,
                                        backgroundColor: isDark ? colors.inputBg : D.inputBg,
                                        borderColor: isDark ? colors.inputBorder : D.inputBorder,
                                        fontFamily: Typography.body,
                                        height: multiline ? 76 : undefined,
                                        textAlignVertical: multiline ? 'top' : 'center',
                                    },
                                ]}
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: D.primary }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={18} color="#fff" />
                                <Text style={[styles.saveBtnText, { fontFamily: Typography.heading }]}>
                                    {saved ? 'Tersimpan' : 'Simpan Perubahan'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── Pengaturan ── */}
                <View style={[styles.card, { backgroundColor: isDark ? colors.bgCard : D.card, borderColor: isDark ? colors.divider : D.cardBorder }]}>
                    <Text style={[styles.cardTitle, { color: isDark ? colors.charcoal : D.textMid, fontFamily: Typography.heading }]}>
                        Pengaturan
                    </Text>
                    <View style={styles.toggleRow}>
                        <View style={[styles.toggleIcon, { backgroundColor: isDark ? '#1e2230' : D.primaryLight }]}>
                            <Ionicons name="moon-outline" size={20} color={D.badgeText} />
                        </View>
                        <View style={styles.toggleMeta}>
                            <Text style={[styles.toggleLabel, { color: isDark ? colors.charcoal : D.textMid, fontFamily: Typography.bodyMedium }]}>
                                Mode Gelap
                            </Text>
                            <Text style={[styles.toggleSub, { color: isDark ? colors.mediumGray : D.textMuted, fontFamily: Typography.body }]}>
                                Ganti tema tampilan
                            </Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#e2e4ee', true: D.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Riwayat */}
                <View style={[styles.card, { backgroundColor: isDark ? colors.bgCard : D.card, borderColor: isDark ? colors.divider : D.cardBorder }]}>
                    <Text style={[styles.cardTitle, { color: isDark ? colors.charcoal : D.textMid, fontFamily: Typography.heading }]}>
                        Riwayat Saya
                    </Text>

                    <TouchableOpacity
                        style={[styles.historyBtn, { backgroundColor: isDark ? '#1a2640' : D.primaryLight }]}
                        onPress={() => navigation.navigate('ActivityHistory')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="fitness-outline" size={20} color={D.primary} />
                        <View style={styles.historyMeta}>
                            <Text style={[styles.historyTitle, { color: isDark ? colors.charcoal : D.badgeText, fontFamily: Typography.bodyMedium }]}>
                                Riwayat Latihan
                            </Text>
                            <Text style={[styles.historySub, { color: isDark ? colors.mediumGray : D.textMuted, fontFamily: Typography.body }]}>
                                Napas dan meditasi
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={D.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.historyBtn, { backgroundColor: isDark ? '#281f34' : '#f3eef6', marginTop: 8 }]}
                        onPress={() => navigation.navigate('History')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="chatbubbles-outline" size={20} color={D.purpleAcc} />
                        <View style={styles.historyMeta}>
                            <Text style={[styles.historyTitle, { color: isDark ? colors.charcoal : D.purpleAcc, fontFamily: Typography.bodyMedium }]}>
                                Riwayat Chat
                            </Text>
                            <Text style={[styles.historySub, { color: isDark ? colors.mediumGray : D.textMuted, fontFamily: Typography.body }]}>
                                Percakapan dengan PHA
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={D.purpleAcc} />
                    </TouchableOpacity>
                </View>

                {/* ── Admin ── */}
                {isAdmin && (
                    <TouchableOpacity
                        style={[styles.card, styles.adminRow, {
                            backgroundColor: isDark ? colors.bgCard : '#fff9f2',
                            borderColor: isDark ? colors.divider : '#f5e8d5',
                        }]}
                        onPress={() => navigation.navigate('AdminDashboard')}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.toggleIcon, { backgroundColor: isDark ? '#2d1f12' : '#fdebd0' }]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={D.goldenAcc} />
                        </View>
                        <Text style={[styles.toggleLabel, { flex: 1, color: isDark ? colors.charcoal : D.goldenAcc, fontFamily: Typography.bodyMedium }]}>
                            Admin Dashboard
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={isDark ? colors.mediumGray : D.goldenAcc} />
                    </TouchableOpacity>
                )}

                {/* ── Keluar ── */}
                <TouchableOpacity
                    style={[styles.logoutBtn, {
                        backgroundColor: isDark ? '#2d1212' : D.logoutBg,
                        borderColor: isDark ? '#5a2020' : D.logoutBorder,
                    }]}
                    onPress={logout}
                    activeOpacity={0.85}
                >
                    <Ionicons name="log-out-outline" size={19} color={D.logoutText} />
                    <Text style={[styles.logoutText, { fontFamily: Typography.bodySemiBold }]}>
                        Keluar
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },

    // Profile header
    profileHeader: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
    avatarWrap: { position: 'relative', marginBottom: 14 },
    avatarCircle: {
        width: 96, height: 96, borderRadius: 48,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#8a9ccc', shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.5, shadowRadius: 28, elevation: 8,
    },
    editBadge: {
        position: 'absolute', right: -2, bottom: 2,
        width: 30, height: 30, borderRadius: 15,
        borderWidth: 1, borderColor: '#e7e9f2',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#383f5c', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
    },
    profileName: { fontSize: 24, color: '#353b4a', letterSpacing: -0.3, lineHeight: 30 },
    profileEmail: { fontSize: 13.5, marginTop: 6 },
    rolePill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        marginTop: 10, paddingHorizontal: 13, paddingVertical: 5,
        backgroundColor: '#eef2fb', borderWidth: 1, borderColor: '#e2e8f7',
        borderRadius: 20,
    },
    roleText: { fontSize: 11, letterSpacing: 1, color: '#5f6b9e' },

    // Cards
    card: {
        borderRadius: 24, padding: 20, marginBottom: 16,
        borderWidth: 1,
    },
    cardTitle: { fontSize: 18, marginBottom: 16 },

    // Stats
    statsRow: { flexDirection: 'row', alignItems: 'center' },
    statCol: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 38, lineHeight: 42 },
    statLabel: { fontSize: 12.5, marginTop: 9 },
    statDivider: { width: 1, height: 44 },
    hDivider: { height: 1, marginVertical: 16 },

    // Activity rows
    actRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11 },
    actIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actName: { fontSize: 14.5 },
    actMeta: { fontSize: 12.5 },

    // Form
    field: { marginBottom: 15 },
    fieldLabel: { fontSize: 13, marginBottom: 8 },
    input: {
        borderWidth: 1, borderRadius: 15, padding: 15,
        fontSize: 15,
    },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 9, borderRadius: 16, paddingVertical: 16, marginTop: 4,
        shadowColor: '#8a9ccc', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 20, elevation: 6,
    },
    saveBtnText: { color: '#fff', fontSize: 15.5 },

    // Settings
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    toggleIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    toggleMeta: { flex: 1 },
    toggleLabel: { fontSize: 15 },
    toggleSub: { fontSize: 12.5, marginTop: 2 },

    // History
    historyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        borderRadius: 15,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    historyMeta: { flex: 1 },
    historyTitle: { fontSize: 14.5 },
    historySub: { fontSize: 12.5, marginTop: 2 },

    // Admin
    adminRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },

    // Logout
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 9, borderRadius: 16, paddingVertical: 15, marginBottom: 8,
        borderWidth: 1,
    },
    logoutText: { fontSize: 15, color: '#d98a8a' },
});
