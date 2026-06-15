import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AnimatedView from './AnimatedView';
import { Typography, Spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

const LoadingState = ({ message = 'Memuat...', fullScreen = false, size = 'large' }) => {
  const { colors } = useTheme();
  return (
    <View style={[
      { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
      fullScreen && { flex: 1, backgroundColor: colors.bgPrimary },
    ]}>
      <AnimatedView
        from={{ opacity: 0.4, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 600 }}
      >
        <ActivityIndicator size={size} color={colors.softBlue} />
      </AnimatedView>
      {message && (
        <Text style={{
          fontFamily: Typography.body,
          fontSize: Typography.sizes.base,
          color: colors.darkGray,
          marginTop: Spacing.md,
        }}>
          {message}
        </Text>
      )}
    </View>
  );
};

const EmptyState = ({ emoji = '🌿', title = 'Belum ada data', subtitle, style }) => {
  const { colors } = useTheme();
  return (
    <AnimatedView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 400 }}
      style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm }, style]}
    >
      <Text style={{ fontSize: 52, marginBottom: Spacing.sm }}>{emoji}</Text>
      <Text style={{
        fontFamily: Typography.heading,
        fontSize: Typography.sizes.lg,
        color: colors.charcoal,
        textAlign: 'center',
      }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{
          fontFamily: Typography.body,
          fontSize: Typography.sizes.base,
          color: colors.darkGray,
          textAlign: 'center',
          lineHeight: Typography.sizes.base * 1.6,
        }}>
          {subtitle}
        </Text>
      )}
    </AnimatedView>
  );
};

const ErrorState = ({ message, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }, style]}>
      <Text style={{ fontSize: 52, marginBottom: Spacing.sm }}>😔</Text>
      <Text style={{
        fontFamily: Typography.heading,
        fontSize: Typography.sizes.lg,
        color: colors.charcoal,
        textAlign: 'center',
      }}>
        Oops, terjadi kesalahan
      </Text>
      <Text style={{
        fontFamily: Typography.body,
        fontSize: Typography.sizes.base,
        color: colors.darkGray,
        textAlign: 'center',
        marginTop: Spacing.sm,
      }}>
        {message}
      </Text>
    </View>
  );
};

export { LoadingState, EmptyState, ErrorState };
export default LoadingState;
