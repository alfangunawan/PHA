import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const AUDIO_CATEGORIES = ['relaxation', 'sleep', 'focus', 'nature', 'meditation', 'general'];

const AudioFormScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Audio</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Iteration notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeEmoji}>🚧</Text>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Fitur Iterasi 2</Text>
            <Text style={styles.noticeDesc}>
              Upload audio akan aktif di Iterasi 2. Struktur database dan endpoint sudah siap. Form ini adalah preview.
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Judul Audio *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nama file audio"
            placeholderTextColor={Colors.mediumGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Deskripsi audio..."
            placeholderTextColor={Colors.mediumGray}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.optionRow}>
            {AUDIO_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.option, category === c && styles.optionActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.optionText, category === c && styles.optionTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Durasi (detik)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="300"
            placeholderTextColor={Colors.mediumGray}
            keyboardType="number-pad"
          />
        </View>

        {/* File upload placeholder */}
        <View style={styles.uploadArea}>
          <Text style={styles.uploadEmoji}>🎵</Text>
          <Text style={styles.uploadTitle}>Pilih File Audio</Text>
          <Text style={styles.uploadDesc}>MP3, WAV, OGG, AAC • Maks 50MB{'\n'}(Aktif di Iterasi 2)</Text>
        </View>

        <Button
          title="🚧 Upload Audio (Iterasi 2)"
          onPress={() => Alert.alert('Segera Hadir', 'Fitur ini akan aktif di Iterasi 2 🌿')}
          variant="secondary"
          size="full"
          style={styles.submitBtn}
          disabled
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
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.peachLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  noticeEmoji: { fontSize: 24 },
  noticeContent: { flex: 1 },
  noticeTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.base,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  noticeDesc: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: Typography.sizes.sm * 1.6,
  },
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
    backgroundColor: Colors.lavender,
    borderColor: Colors.lavenderDark,
  },
  optionText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  optionTextActive: { color: Colors.white },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  uploadEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  uploadTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.md,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  uploadDesc: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.mediumGray,
    textAlign: 'center',
    lineHeight: Typography.sizes.sm * 1.6,
  },
  submitBtn: { marginTop: Spacing.sm },
});

export default AudioFormScreen;
