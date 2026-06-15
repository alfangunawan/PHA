import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedView from '../../components/AnimatedView';
import { useFocusEffect } from '@react-navigation/native';
import { educationAPI, audioAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState, ErrorState } from '../../components/LoadingState';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const TABS = ['Konten Edukasi', 'Audio (Iterasi 2)'];

const AdminDashboardScreen = ({ navigation }) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [contents, setContents] = useState([]);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eduRes, audioRes] = await Promise.all([
        educationAPI.getContents({ limit: 50 }),
        audioAPI.getAudios(),
      ]);
      setContents(eduRes.data || []);
      setAudios(audioRes.data || []);
    } catch (e) {
      setError(e?.message || 'Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleDeleteContent = (id) => {
    Alert.alert(
      'Hapus Konten?',
      'Konten ini akan dihapus dari daftar.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await educationAPI.deleteContent(id);
              setContents((prev) => prev.filter((c) => c.id !== id));
            } catch (e) {
              Alert.alert('Gagal', 'Tidak dapat menghapus konten');
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.lockTitle}>Akses Terbatas</Text>
          <Text style={styles.lockDesc}>Halaman ini hanya untuk admin.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚙️ Admin Panel</Text>
          <Text style={styles.headerSub}>Kelola konten aplikasi</Text>
        </View>
        <TouchableOpacity onPress={fetchData}>
          <Text style={styles.refreshBtn}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingState message="Memuat data..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 0 && (
            <>
              <Button
                title="+ Tambah Konten"
                onPress={() => navigation.navigate('ContentForm', { mode: 'create' })}
                variant="primary"
                size="full"
                style={styles.addBtn}
              />
              <Text style={styles.countText}>{contents.length} konten</Text>
              {contents.map((item) => (
                <AnimatedView
                  key={item.id}
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={styles.itemCard}
                >
                  <View style={styles.itemHeader}>
                    <View style={[styles.sourceDot, {
                      backgroundColor: item.source === 'youtube' ? '#FF0000' :
                        item.source === 'tiktok' ? '#010101' : Colors.softBlue
                    }]} />
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    <View style={[styles.statusDot, { backgroundColor: item.is_active ? Colors.sageGreen : Colors.error }]} />
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.itemUrl} numberOfLines={1}>{item.url}</Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => navigation.navigate('ContentForm', { mode: 'edit', content: item })}
                    >
                      <Text style={styles.editBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteContent(item.id)}
                    >
                      <Text style={styles.deleteBtnText}>🗑 Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </AnimatedView>
              ))}
            </>
          )}

          {activeTab === 1 && (
            <>
              <View style={styles.iterationNote}>
                <Text style={styles.noteEmoji}>🚧</Text>
                <Text style={styles.noteText}>
                  Fitur Audio tersedia di Iterasi 2. Struktur database & endpoint sudah siap.
                </Text>
              </View>
              <Button
                title="+ Upload Audio"
                onPress={() => navigation.navigate('AudioForm')}
                variant="secondary"
                size="full"
                style={styles.addBtn}
              />
              <Text style={styles.countText}>{audios.length} audio</Text>
              {audios.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <Text style={styles.audioTitle}>🎵 {item.title}</Text>
                  <Text style={styles.itemCategory}>{item.category} • {item.duration ? `${item.duration}s` : 'N/A'}</Text>
                </View>
              ))}
              {audios.length === 0 && (
                <Text style={styles.emptyNote}>Belum ada audio yang diunggah.</Text>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes.xl,
    color: Colors.charcoal,
  },
  headerSub: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  refreshBtn: { fontSize: 24 },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
  },
  tabActive: {
    backgroundColor: Colors.lavender,
    borderColor: Colors.lavenderDark,
  },
  tabText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  tabTextActive: { color: Colors.white },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  addBtn: { marginBottom: Spacing.md },
  countText: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.mediumGray,
    marginBottom: Spacing.sm,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sourceDot: { width: 8, height: 8, borderRadius: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 'auto' },
  itemCategory: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.xs,
    color: Colors.mediumGray,
    textTransform: 'capitalize',
  },
  itemTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.base,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  itemUrl: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.xs,
    color: Colors.mediumGray,
    marginBottom: Spacing.sm,
  },
  itemActions: { flexDirection: 'row', gap: Spacing.sm },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.softBlueLight,
  },
  editBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.xs,
    color: Colors.softBlueDark,
  },
  deleteBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.xs,
    color: '#DC2626',
  },
  audioTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.base,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  lockEmoji: { fontSize: 56, marginBottom: Spacing.md },
  lockTitle: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes.xl,
    color: Colors.charcoal,
    marginBottom: 6,
  },
  lockDesc: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.base,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  iterationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.peachLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  noteEmoji: { fontSize: 20 },
  noteText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.charcoal,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  emptyNote: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.base,
    color: Colors.mediumGray,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});

export default AdminDashboardScreen;


