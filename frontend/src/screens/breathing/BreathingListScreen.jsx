import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedView from '../../components/AnimatedView';
import { breathingAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../theme';

const PhaseBadge = ({ label, value, color, textColor }) => (
  <View style={{ alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm, backgroundColor: color + '25' }}>
    <Text style={{ fontFamily: Typography.headingBold, fontSize: Typography.sizes.sm, color }}>{value}s</Text>
    <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.xs, color: textColor }}>{label}</Text>
  </View>
);

const TechniqueCard = ({ item, index, onPress, colors, shadows }) => (
  <AnimatedView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'spring', delay: index * 80 }}
  >
    <TouchableOpacity
      style={[{
        backgroundColor: colors.bgCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderTopWidth: 3,
        borderTopColor: item.color_theme || colors.softBlue,
      }, shadows.md]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={{ width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md, backgroundColor: (item.color_theme || colors.softBlue) + '20' }}>
        <Text style={{ fontSize: 22 }}>🌬️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Typography.heading, fontSize: Typography.sizes.md, color: colors.charcoal, marginBottom: 4 }}>{item.name}</Text>
        <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.sm, color: colors.darkGray, lineHeight: Typography.sizes.sm * 1.6, marginBottom: Spacing.sm }} numberOfLines={2}>{item.description}</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <PhaseBadge label="Tarik" value={item.inhale_duration} color={colors.softBlue} textColor={colors.darkGray} />
          {item.hold_duration > 0 && <PhaseBadge label="Tahan" value={item.hold_duration} color={colors.lavender} textColor={colors.darkGray} />}
          <PhaseBadge label="Hembus" value={item.exhale_duration} color={colors.sageGreen} textColor={colors.darkGray} />
          {item.hold_after_exhale > 0 && <PhaseBadge label="Jeda" value={item.hold_after_exhale} color={colors.peach} textColor={colors.darkGray} />}
        </View>
      </View>
      <Text style={{ fontFamily: Typography.headingBold, fontSize: Typography.sizes.sm, color: colors.mediumGray, marginLeft: Spacing.sm }}>{item.cycles}x</Text>
    </TouchableOpacity>
  </AnimatedView>
);

const BreathingListScreen = ({ navigation }) => {
  const { colors, shadows } = useTheme();
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTechniques = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await breathingAPI.getTechniques();
      setTechniques(res.data);
    } catch (e) {
      setError(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTechniques(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md }}>
        <Text style={{ fontSize: 44 }}>🫁</Text>
        <View>
          <Text style={{ fontFamily: Typography.headingBold, fontSize: Typography.sizes.xl, color: colors.charcoal }}>Latihan Pernapasan</Text>
          <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.sm, color: colors.darkGray }}>Pilih teknik yang kamu suka</Text>
        </View>
      </View>

      {loading ? (
        <LoadingState message="Memuat teknik pernapasan..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <FlatList
          data={techniques}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <TechniqueCard item={item} index={index} onPress={(t) => navigation.navigate('BreathingExercise', { technique: t })} colors={colors} shadows={shadows} />
          )}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTechniques(true); }}
              tintColor={colors.softBlue}
            />
          }
          ListEmptyComponent={<EmptyState emoji="🌬️" title="Belum ada teknik" subtitle="Data akan segera tersedia" />}
        />
      )}
    </SafeAreaView>
  );
};

export default BreathingListScreen;
