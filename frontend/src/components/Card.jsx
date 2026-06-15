import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../theme';

const Card = ({
  title,
  subtitle,
  description,
  color = Colors.softBlue,
  icon,
  onPress,
  style,
  children,
  compact = false,
}) => {
  const content = (
    <View style={[styles.card, { borderLeftColor: color }, compact && styles.compact, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '30' }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
            {title}
          </Text>
        )}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {description && (
          <Text style={styles.description} numberOfLines={compact ? 2 : 3}>
            {description}
          </Text>
        )}
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  compact: {
    padding: Spacing.sm + 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.md,
    color: Colors.charcoal,
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: Typography.sizes.base,
  },
  subtitle: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.softBlue,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  description: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: Typography.sizes.sm * 1.6,
  },
});

export default Card;
