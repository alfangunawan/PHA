import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Switch, SafeAreaView } from 'react-native';
import { getProfile, updateProfile, UserProfile } from './profileService';
import { useAuthContext } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { breathingAPI, meditationAPI } from '../api';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '../theme';

export default function ProfileScreen({ navigation }: any) {
    const { logout, user, isAdmin } = useAuthContext();
    const { colors, isDark, toggleTheme } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [breathLogs, setBreathLogs] = useState<any[]>([]);
    const [meditationLogs, setMeditationLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchAll();
    }, []);

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
            const [bRes, mRes] = await Promise.all([breathingAPI.getLogs(), meditationAPI.getLogs()]);
            setBreathLogs(bRes.logs || []);
            setMeditationLogs(mRes.logs || []);
        } catch {
            // non-critical
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updated = await updateProfile({ displayName, age: age ? parseInt(age) : undefined, gender, bio });
            setProfile(updated);
            Alert.alert('Sukses', 'Perubahan berhasil disimpan');
        } catch {
            Alert.alert('Error', 'Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}><ActivityIndicator size="large" color={colors.softBlue} /></View>;
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.softBlueLight }]}>
                        <Ionicons name="person" size={32} color={colors.softBlue} />
                    </View>
                    <Text style={[styles.name, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                        {displayName || user?.name || 'Teman'}
                    </Text>
                    <Text style={[styles.email, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                        {user?.email}
                    </Text>
                    {user?.role && (
                        <View style={[styles.roleBadge, { backgroundColor: isAdmin ? colors.peachLight : colors.softBlueLight }]}>
                            <Text style={[styles.roleText, { color: isAdmin ? colors.peachDark : colors.softBlueDark, fontFamily: Typography.bodySemiBold }]}>
                                {user.role}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Activity Stats */}
                <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                    <Text style={[styles.sectionTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>Aktivitas Saya</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNum, { color: colors.softBlue, fontFamily: Typography.headingBold }]}>{breathLogs.length}</Text>
                            <Text style={[styles.statLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>Sesi Napas</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statNum, { color: colors.lavender, fontFamily: Typography.headingBold }]}>{meditationLogs.length}</Text>
                            <Text style={[styles.statLabel, { color: colors.mediumGray, fontFamily: Typography.body }]}>Sesi Meditasi</Text>
                        </View>
                    </View>
                    {breathLogs.slice(0, 3).map((log: any) => (
                        <View key={log.id} style={[styles.logItem, { borderBottomColor: colors.divider }]}>
                            <Text style={[styles.logText, { color: colors.charcoal, fontFamily: Typography.body }]}>
                                🌬️ {log.technique?.name || 'Latihan napas'}
                            </Text>
                            <Text style={[styles.logMeta, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                                {log.cyclesCompleted} siklus · {Math.round(log.duration / 60)} mnt
                            </Text>
                        </View>
                    ))}
                    {meditationLogs.slice(0, 3).map((log: any) => (
                        <View key={log.id} style={[styles.logItem, { borderBottomColor: colors.divider }]}>
                            <Text style={[styles.logText, { color: colors.charcoal, fontFamily: Typography.body }]}>
                                🧘 {log.session?.title || 'Sesi meditasi'}
                            </Text>
                            <Text style={[styles.logMeta, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                                {Math.round(log.duration / 60)} mnt {log.completed ? '✅' : ''}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Profile Edit */}
                <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                    <Text style={[styles.sectionTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>Informasi Profil</Text>
                    {[
                        { label: 'Nama Tampilan', value: displayName, setter: setDisplayName, placeholder: 'Nama' },
                        { label: 'Usia', value: age, setter: setAge, placeholder: '24', keyboard: 'numeric' as const },
                        { label: 'Gender', value: gender, setter: setGender, placeholder: 'L/P' },
                        { label: 'Bio', value: bio, setter: setBio, placeholder: 'Ceritakan tentang dirimu...', multiline: true },
                    ].map(({ label, value, setter, placeholder, keyboard, multiline }) => (
                        <View key={label} style={styles.field}>
                            <Text style={[styles.fieldLabel, { color: colors.darkGray, fontFamily: Typography.bodyMedium }]}>{label}</Text>
                            <TextInput
                                value={value}
                                onChangeText={setter}
                                placeholder={placeholder}
                                placeholderTextColor={colors.mediumGray}
                                keyboardType={keyboard}
                                multiline={multiline}
                                style={[styles.input, { color: colors.charcoal, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: Typography.body, height: multiline ? 80 : undefined }]}
                            />
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.softBlue }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={[styles.saveBtnText, { fontFamily: Typography.headingMedium }]}>Simpan Perubahan</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* Settings */}
                <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                    <Text style={[styles.sectionTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>Pengaturan</Text>
                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={[styles.toggleLabel, { color: colors.charcoal, fontFamily: Typography.bodyMedium }]}>Mode Gelap</Text>
                            <Text style={[styles.toggleSub, { color: colors.mediumGray, fontFamily: Typography.body }]}>Ganti tema tampilan</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.lightGray, true: colors.softBlue }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Admin Nav */}
                {isAdmin && (
                    <TouchableOpacity
                        style={[styles.section, styles.adminBtn, { backgroundColor: colors.peachLight }]}
                        onPress={() => navigation.navigate('AdminDashboard')}
                    >
                        <Ionicons name="shield-checkmark" size={20} color={colors.peachDark} />
                        <Text style={[styles.adminText, { color: colors.peachDark, fontFamily: Typography.headingMedium }]}>
                            Admin Dashboard
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.peachDark} />
                    </TouchableOpacity>
                )}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={[styles.logoutText, { color: colors.error, fontFamily: Typography.bodySemiBold }]}>Keluar</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: Spacing.md },
    header: { alignItems: 'center', padding: Spacing.lg, marginBottom: Spacing.md },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    name: { fontSize: Typography.sizes.xl },
    email: { fontSize: Typography.sizes.sm, marginTop: 4 },
    roleBadge: { marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
    roleText: { fontSize: Typography.sizes.xs },
    section: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
    sectionTitle: { fontSize: Typography.sizes.md, marginBottom: Spacing.md },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: Typography.sizes['2xl'] },
    statLabel: { fontSize: Typography.sizes.xs, marginTop: 4 },
    statDivider: { width: 1, height: 40 },
    logItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1 },
    logText: { fontSize: Typography.sizes.sm },
    logMeta: { fontSize: Typography.sizes.xs },
    field: { marginBottom: Spacing.md },
    fieldLabel: { fontSize: Typography.sizes.sm, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.sizes.base },
    saveBtn: { paddingVertical: Spacing.md, borderRadius: BorderRadius.full, alignItems: 'center', marginTop: Spacing.sm },
    saveBtnText: { color: '#fff', fontSize: Typography.sizes.base },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleLabel: { fontSize: Typography.sizes.base },
    toggleSub: { fontSize: Typography.sizes.xs, marginTop: 2 },
    adminBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    adminText: { flex: 1, fontSize: Typography.sizes.base },
    logoutBtn: { alignItems: 'center', padding: Spacing.md },
    logoutText: { fontSize: Typography.sizes.base },
});
