import React from 'react';
import { Text, View } from 'react-native';
import { Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

const pad = (n) => String(n).padStart(2, '0');

const SIZE_MAP = {
  sm: Typography.sizes.xl,
  md: Typography.sizes['2xl'],
  lg: Typography.sizes['3xl'],
  xl: Typography.sizes['4xl'],
};

const TimerDisplay = ({ seconds, size = 'md', label, style, colorOverride }) => {
  const { colors } = useTheme();
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const fontSize = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Text style={{
        fontFamily: Typography.headingBold,
        color: colorOverride || colors.charcoal,
        letterSpacing: 2,
        fontSize,
      }}>
        {pad(mins)}:{pad(secs)}
      </Text>
      {label && (
        <Text style={{
          fontFamily: Typography.body,
          fontSize: Typography.sizes.sm,
          color: colorOverride ? colorOverride + '99' : colors.mediumGray,
          marginTop: 4,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          {label}
        </Text>
      )}
    </View>
  );
};

export default TimerDisplay;
