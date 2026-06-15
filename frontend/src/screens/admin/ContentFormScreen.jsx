import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { educationAPI } from '../../api';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const SOURCES = ['youtube', 'tiktok', 'other'];
const CATEGORIES = ['pengetahuan-dasar', 'teknik', 'mindfulness', 'ilmu-pengetahuan', 'motivasi', 'general'];

const ContentFormScreen = ({ route, navigation }) => {
  const { mode, content } = route.params || {};
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState(content?.title || '');
  const [description, setDescription] = useState(content?.description || '');
  const [source, setSource] = useState(content?.source || 'youtube');
  const [url, setUrl] = useState(content?.url || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(content?.thumbnail_url || '');
  const [category, setCategory] = useState(content?.category || 'general');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !url.trim()) {
      Alert.alert('Ups!', 'Judul dan URL wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        source,
        url: url.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        category,
      };

      if (isEdit) {
        await educationAPI.updateContent(content.id, payload);
        Alert.alert('Berhasil!', 'Konten berhasil diperbarui', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await educationAPI.createContent(payload);
        Alert.alert('Berhasil!', 'Konten berhasil ditambahkan', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Gagal', e?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Konten' : 'Tambah Konten'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Judul *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Judul konten edukasi"
            placeholderTextColor={Colors.mediumGray}
            multiline
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Deskripsi singkat konten..."
            placeholderTextColor={Colors.mediumGray}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Source */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sumber *</Text>
          <View style={styles.optionRow}>
            {SOURCES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.option, source === s && styles.optionActive]}
                onPress={() => setSource(s)}
              >
                <Text style={[styles.optionText, source === s && styles.optionTextActive]}>
                  {s === 'youtube' ? '▶ YouTube' : s === 'tiktok' ? '♪ TikTok' : '🔗 Lainnya'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* URL */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL *</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor={Colors.mediumGray}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Thumbnail URL */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL Thumbnail</Text>
          <TextInput
            style={styles.input}
            value={thumbnailUrl}
            onChangeText={setThumbnailUrl}
            placeholder="https://img.youtube.com/vi/.../hqdefault.jpg"
            placeholderTextColor={Colors.mediumGray}
            keyboardType="url"
            autoCapitalize="none"
          />
          <Text style={styles.hint}>
            💡 YouTube: https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg
          </Text>
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.optionRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.option, category === c && styles.optionActiveGreen]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.optionText, category === c && styles.optionTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title={isEdit ? '💾 Simpan Perubahan' : '➕ Tambah Konten'}
          onPress={handleSubmit}
          loading={loading}
          size="full"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.base,
    color: Colors.softBlueDark,
  },
  headerTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.lg,
    color: Colors.charcoal,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.md },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontFamily: Typography.body,
    fontSize: Typography.sizes.base,
    color: Colors.charcoal,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    ...Shadows.sm,
  },
  multiline: { minHeight: 80 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
  },
  optionActive: {
    backgroundColor: Colors.softBlue,
    borderColor: Colors.softBlueDark,
  },
  optionActiveGreen: {
    backgroundColor: Colors.sageGreen,
    borderColor: Colors.sageGreenDark,
  },
  optionText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  optionTextActive: { color: Colors.white },
  hint: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.xs,
    color: Colors.mediumGray,
    marginTop: 4,
  },
  submitBtn: { marginTop: Spacing.md },
});

export default ContentFormScreen;
