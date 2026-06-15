import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedView from '../components/AnimatedView';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../theme';

const FEATURE_CARDS = [
  {
    key: 'breathing',
    emoji: '🫁',
    title: 'Latihan Pernapasan',
    subtitle: '4 teknik tersedia',
    description: 'Tenangkan pikiran dengan latihan napas yang terbukti efektif',
    colorKey: 'softBlue',
    bgKey: 'softBlueLight',
    screen: 'Breathing',
  },
  {
    key: 'meditation',
    emoji: '🧘',
    title: 'Meditasi',
    subtitle: '5 sesi tersedia',
    description: 'Temukan ketenangan dalam sesi meditasi terpandu',
    colorKey: 'lavender',
    bgKey: 'lavenderLight',
    screen: 'Meditation',
  },
  {
    key: 'education',
    emoji: '📚',
    title: 'Edukasi',
    subtitle: 'Konten pilihan',
    description: 'Pelajari lebih dalam tentang kesehatan mental & mindfulness',
    colorKey: 'sageGreen',
    bgKey: 'sageGreenLight',
    screen: 'Education',
  },
];

const GREETINGS = {
  morning: 'Selamat pagi',
  afternoon: 'Selamat siang',
  evening: 'Selamat sore',
  night: 'Selamat malam',
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return GREETINGS.morning;
  if (hour < 15) return GREETINGS.afternoon;
  if (hour < 18) return GREETINGS.evening;
  return GREETINGS.night;
};

const DAILY_TIPS = [
  'Ambil satu momen hari ini untuk bernapas perlahan 🌬️',
  'Ingat: perasaanmu valid. Kamu tidak sendirian 💙',
  'Lima menit meditasi sehari bisa membuat perbedaan besar 🌿',
  'Bersikap lembut pada dirimu sendiri — kamu sudah berusaha keras 🌸',
];

const HomeScreen = ({ navigation }) => {
  const { user, isAdmin } = useAuth();
  const { colors, shadows } = useTheme();
  const greeting = getGreeting();
  const [tip] = useState(DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <AnimatedView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring' }}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg }}
        >
          <View>
            <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.base, color: colors.darkGray }}>
              {greeting},
            </Text>
            <Text style={{ fontFamily: Typography.headingBold, fontSize: Typography.sizes['2xl'], color: colors.charcoal }}>
              {user?.name?.split(' ')[0] || 'Pengguna'} 👋
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={{ backgroundColor: colors.lavenderLight, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full }}
              onPress={() => navigation.navigate('AdminDashboard')}
            >
              <Text style={{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.sm, color: colors.lavenderDark }}>
                ⚙️ Admin
              </Text>
            </TouchableOpacity>
          )}
        </AnimatedView>

        {/* Daily Tip Card */}
        <AnimatedView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 150 }}
          style={{
            backgroundColor: colors.peachLight,
            borderRadius: BorderRadius.xl,
            padding: Spacing.md,
            marginBottom: Spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: colors.peach,
          }}
        >
          <Text style={{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.xs, color: colors.peachDark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
            💡 Pengingat Harian
          </Text>
          <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.base, color: colors.charcoal, lineHeight: Typography.sizes.base * 1.6 }}>
            {tip}
          </Text>
        </AnimatedView>

        {/* Section Title */}
        <Text style={{ fontFamily: Typography.heading, fontSize: Typography.sizes.lg, color: colors.charcoal, marginBottom: Spacing.md }}>
          Apa yang ingin kamu lakukan?
        </Text>

        {/* Feature Cards */}
        {FEATURE_CARDS.map((feature, index) => {
          const color = colors[feature.colorKey];
          const bg = colors[feature.bgKey];
          return (
            <AnimatedView
              key={feature.key}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: 200 + index * 100 }}
            >
              <TouchableOpacity
                style={[{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: BorderRadius.xl,
                  padding: Spacing.md,
                  marginBottom: Spacing.md,
                  borderWidth: 1.5,
                  backgroundColor: bg,
                  borderColor: color + '40',
                }, shadows.sm]}
                onPress={() => navigation.navigate(feature.screen)}
                activeOpacity={0.85}
              >
                <View style={{ width: 60, height: 60, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md, backgroundColor: color + '25' }}>
                  <Text style={{ fontSize: 28 }}>{feature.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Typography.heading, fontSize: Typography.sizes.md, color: colors.charcoal }}>{feature.title}</Text>
                  <Text style={{ fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.sm, color, marginBottom: 2 }}>{feature.subtitle}</Text>
                  <Text style={{ fontFamily: Typography.body, fontSize: Typography.sizes.xs, color: colors.darkGray, lineHeight: Typography.sizes.xs * 1.6 }}>{feature.description}</Text>
                </View>
                <Text style={{ fontSize: 28, fontWeight: '300', marginLeft: Spacing.sm, color }}>›</Text>
              </TouchableOpacity>
            </AnimatedView>
          );
        })}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
