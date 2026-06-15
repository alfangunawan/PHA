import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedView from '../components/AnimatedView';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { breathingAPI, meditationAPI } from '../api';
import { Typography, Spacing, BorderRadius } from '../theme';

const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const ProfileScreen = ({ navigation }) => {
  const { user, logout, isAdmin } = useAuth();
  const { colors, shadows, isDark, toggleTheme } = useTheme();
  const [breathingLogs, setBreathingLogs] = useState([]);
  const [meditationLogs, setMeditationLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
          const [bLogs, mLogs] = await Promise.all([
            breathingAPI.getHistory(),
            meditationAPI.getHistory(),
          ]);
          setBreathingLogs(bLogs.data || []);
          setMeditationLogs(mLogs.data || []);
        } catch (e) {
          console.log('Error fetching logs:', e);
        } finally {
          setLoadingLogs(false);
        }
      };
      fetchLogs();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Keluar?', 'Kamu yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  const totalBreathingTime = breathingLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const totalMeditationTime = meditationLogs.reduce((acc, log) => acc + (log.duration || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg }} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <AnimatedView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={[{
            alignItems: 'center',
            marginBottom: Spacing.lg,
            paddingVertical: Spacing.lg,
            backgroundColor: colors.bgCard,
            borderRadius: BorderRadius.xl,
          }, shadows.md]}
        >
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.softBlueLight,
            justifyContent: 'center', alignItems: 'center',
            marginBottom: Spacing.md,
          }}>
            <Text style={{ fontSize: 40 }}>{user?.role === 'admin' ? '👑' : '🌸'}</Text>
          </View>
          <Text style={{ fontFamily: Typography.headingBold, fontSize: Typography.sizes.xl, color: colors.charcoal }}>{user?.name}</Text>
          <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.sm, color: colors.darkGray, marginTop: 4 }}>{user?.email}</Text>
          {isAdmin && (
            <View style={{ marginTop: Spacing.sm, backgroundColor: colors.lavenderLight, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full }}>
              <Text style={{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.xs, color: colors.lavenderDark }}>⚙️ Administrator</Text>
            </View>
          )}
        </AnimatedView>

        {/* Stats Row */}
        <AnimatedView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 100 }}
          style={[{
            backgroundColor: colors.bgCard,
            borderRadius: BorderRadius.xl,
            padding: Spacing.md,
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: Spacing.lg,
          }, shadows.md]}
        >
          {[
            { num: breathingLogs.length, label: 'Sesi Napas' },
            { num: formatDuration(totalBreathingTime), label: 'Total Napas' },
            { num: meditationLogs.length, label: 'Sesi Meditasi' },
            { num: formatDuration(totalMeditationTime), label: 'Total Meditasi' },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontFamily: Typography.headingBold, fontSize: Typography.sizes.md, color: colors.charcoal }}>{s.num}</Text>
                <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.xs, color: colors.mediumGray, textAlign: 'center', marginTop: 2 }}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ width: 1, backgroundColor: colors.divider, alignSelf: 'stretch', marginVertical: 4 }} />}
            </React.Fragment>
          ))}
        </AnimatedView>

        {/* History Tabs */}
        <Text style={{ fontFamily: Typography.heading, fontSize: Typography.sizes.lg, color: colors.charcoal, marginBottom: Spacing.sm }}>
          Riwayat Aktivitas
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          {['🫁 Pernapasan', '🧘 Meditasi'].map((tab, i) => (
            <TouchableOpacity
              key={i}
              style={[{
                paddingHorizontal: Spacing.md,
                paddingVertical: 8,
                borderRadius: BorderRadius.full,
                borderWidth: 1.5,
              },
              activeTab === i
                ? { backgroundColor: colors.softBlue, borderColor: colors.softBlueDark }
                : { backgroundColor: colors.bgCard, borderColor: colors.lightGray }
              ]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.sm }, activeTab === i ? { color: '#fff' } : { color: colors.darkGray }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingLogs ? (
          <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.sm, color: colors.mediumGray, textAlign: 'center', padding: Spacing.md }}>
            Memuat riwayat...
          </Text>
        ) : (
          <View>
            {(activeTab === 0 ? breathingLogs : meditationLogs).length === 0 ? (
              <View style={{ alignItems: 'center', padding: Spacing.xl }}>
                <Text style={{ fontSize: 40, marginBottom: Spacing.sm }}>{activeTab === 0 ? '🌬️' : '🧘'}</Text>
                <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.base, color: colors.mediumGray }}>Belum ada riwayat</Text>
              </View>
            ) : (
              (activeTab === 0 ? breathingLogs : meditationLogs).map((log, i) => (
                <AnimatedView
                  key={log.id}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: i * 50 }}
                  style={[{
                    backgroundColor: colors.bgCard,
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.md,
                    marginBottom: Spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.sm,
                  }, shadows.sm]}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: activeTab === 0 ? colors.softBlue : colors.lavender }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.sm, color: colors.charcoal, marginBottom: 2 }}>
                      {activeTab === 0 ? log.technique_name : log.session_title}
                    </Text>
                    <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.xs, color: colors.mediumGray }}>
                      ⏱ {formatDuration(log.duration)}
                      {activeTab === 0 ? `  •  🔄 ${log.cycles_completed} siklus` : ''}
                      {activeTab === 1 && log.completed ? '  •  ✅ Selesai' : ''}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.xs, color: colors.mediumGray }}>{formatDate(log.completed_at)}</Text>
                </AnimatedView>
              ))
            )}
          </View>
        )}

        {/* ── Settings Section ────────────────────────────────────────── */}
        <Text style={{ fontFamily: Typography.heading, fontSize: Typography.sizes.lg, color: colors.charcoal, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
          Pengaturan
        </Text>

        {/* Dark Mode Toggle */}
        <View style={[{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bgCard,
          borderRadius: BorderRadius.lg,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
          gap: Spacing.sm,
        }, shadows.sm]}>
          <Text style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.base, color: colors.charcoal }}>
              {isDark ? 'Mode Gelap' : 'Mode Terang'}
            </Text>
            <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.xs, color: colors.mediumGray }}>
              {isDark ? 'Tampilan gelap aktif' : 'Tampilan terang aktif'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.lightGray, true: colors.lavender }}
            thumbColor={isDark ? colors.lavenderDark : '#fff'}
          />
        </View>

        {/* Admin Panel */}
        {isAdmin && (
          <TouchableOpacity
            style={[{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.bgCard,
              borderRadius: BorderRadius.lg,
              padding: Spacing.md, marginBottom: Spacing.sm,
              gap: Spacing.sm,
            }, shadows.sm]}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
            <Text style={{ flex: 1, fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.base, color: colors.charcoal }}>Panel Admin</Text>
            <Text style={{ fontSize: 20, color: colors.mediumGray }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={[{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.bgCard,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md, marginTop: Spacing.sm,
            gap: Spacing.sm,
            borderWidth: 1, borderColor: colors.error + '40',
          }, shadows.sm]}
          onPress={handleLogout}
        >
          <Text style={{ fontSize: 20 }}>🚪</Text>
          <Text style={{ flex: 1, fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.base, color: '#DC2626' }}>Keluar</Text>
          <Text style={{ fontSize: 20, color: colors.mediumGray }}>›</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.xs, color: colors.mediumGray, textAlign: 'center', marginTop: Spacing.xl }}>
          Mindfulness App • Iterasi 1
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
