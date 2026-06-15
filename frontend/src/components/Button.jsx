import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.softBlue} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },

  // Variants
  variant_primary: {
    backgroundColor: Colors.softBlue,
    ...Shadows.md,
  },
  variant_secondary: {
    backgroundColor: Colors.lavender,
    ...Shadows.sm,
  },
  variant_success: {
    backgroundColor: Colors.sageGreen,
    ...Shadows.sm,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.softBlue,
  },
  variant_ghost: {
    backgroundColor: Colors.softBlueLight,
  },
  variant_danger: {
    backgroundColor: Colors.error,
  },

  // Sizes
  size_sm: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
  },
  size_md: {
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.xl,
  },
  size_lg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  size_full: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },

  // Text
  text: {
    fontFamily: Typography.heading,
    textAlign: 'center',
  },
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.white },
  text_success: { color: Colors.white },
  text_outline: { color: Colors.softBlue },
  text_ghost: { color: Colors.softBlueDark },
  text_danger: { color: Colors.white },

  textSize_sm: { fontSize: Typography.sizes.sm },
  textSize_md: { fontSize: Typography.sizes.base },
  textSize_lg: { fontSize: Typography.sizes.md },
  textSize_full: { fontSize: Typography.sizes.md },

  disabled: {
    opacity: 0.55,
  },
});

export default Button;
