import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedView from '../../components/AnimatedView';
import { meditationAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../theme';

const CATEGORIES = [
  { key: 'all', label: 'Semua', emoji: '✨' },
  { key: 'anxiety', label: 'Cemas', emoji: '💚' },
  { key: 'sleep', label: 'Tidur', emoji: '🌙' },
  { key: 'focus', label: 'Fokus', emoji: '🎯' },
  { key: 'morning', label: 'Pagi', emoji: '🌅' },
  { key: 'general', label: 'Umum', emoji: '🧘' },
];

const CATEGORY_COLOR_KEYS = {
  sleep: 'lavender',
  focus: 'softBlue',
  anxiety: 'sageGreen',
  morning: 'peach',
  general: 'softBlue',
};

const SessionCard = ({ item, index, onPress, colors, shadows }) => {
  const colorKey = CATEGORY_COLOR_KEYS[item.category] || 'softBlue';
  const color = item.color_theme || colors[colorKey];

  let durations = item.duration_options;
  if (typeof durations === 'string') { try { durations = JSON.parse(durations); } catch { durations = ['5', '10', '15']; } }
  if (!Array.isArray(durations)) durations = ['5', '10', '15'];

  return (
    <AnimatedView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 80 }}
    >
      <TouchableOpacity
        style={[{
          backgroundColor: colors.bgCard,
          borderRadius: BorderRadius.xl,
          overflow: 'hidden',
          marginBottom: Spacing.md,
          borderTopWidth: 3,
          borderTopColor: color,
        }, shadows.md]}
        onPress={() => onPress(item)}
        activeOpacity={0.85}
      >
        {/* Card Top */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: color + '12' }}>
          <View style={{ width: 50, height: 50, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md, backgroundColor: color + '30' }}>
            <Text style={{ fontSize: 22 }}>{CATEGORIES.find((c) => c.key === item.category)?.emoji || '🧘'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.xs, textTransform: 'capitalize', marginBottom: 4, color, backgroundColor: color + '20' }}>
              {item.category}
            </Text>
            <Text style={{ fontFamily: Typography.heading, fontSize: Typography.sizes.md, color: colors.charcoal }}>{item.title}</Text>
          </View>
        </View>

        {/* Description */}
        {item.description && (
          <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.sm, color: colors.darkGray, lineHeight: Typography.sizes.sm * 1.6, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm }} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Footer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, gap: Spacing.sm }}>
          <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.xs, color: colors.mediumGray }}>⏱ Durasi pilihan:</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {durations.map((d) => (
              <View key={d} style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: color }}>
                <Text style={{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.xs, color }}>{d} mnt</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );
};

const MeditationListScreen = ({ navigation }) => {
  const { colors, shadows } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async (category = 'all', isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await meditationAPI.getSessions(category !== 'all' ? category : null);
      setSessions(res.data);
    } catch (e) {
      setError(e?.message || 'Gagal memuat sesi meditasi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSessions(selectedCategory); }, [selectedCategory]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.md }}>
        <Text style={{ fontSize: 44 }}>🧘</Text>
        <View>
          <Text style={{ fontFamily: Typography.headingBold, fontSize: Typography.sizes.xl, color: colors.charcoal }}>Meditasi</Text>
          <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.sm, color: colors.darkGray }}>Temukan ketenangan hari ini</Text>
        </View>
      </View>

      {/* Category Filter */}
      <View style={{ minHeight: 60, flexGrow: 0, flexShrink: 0, marginBottom: Spacing.xs }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm }}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: Spacing.md, paddingVertical: 8,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1.5, gap: 4,
                }, shadows.sm,
                isActive
                  ? { backgroundColor: colors.lavender, borderColor: colors.lavenderDark }
                  : { backgroundColor: colors.bgCard, borderColor: colors.lightGray }
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text style={[{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.sm }, isActive ? { color: '#fff' } : { color: colors.darkGray }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingState message="Memuat sesi meditasi..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <SessionCard item={item} index={index} onPress={(s) => navigation.navigate('MeditationPlayer', { session: s })} colors={colors} shadows={shadows} />
          )}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchSessions(selectedCategory, true); }}
              tintColor={colors.lavender}
            />
          }
          ListEmptyComponent={<EmptyState emoji="🧘" title="Belum ada sesi" subtitle="Coba pilih kategori lain" />}
        />
      )}
    </SafeAreaView>
  );
};

export default MeditationListScreen;
