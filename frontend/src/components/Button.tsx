import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../theme';

interface Props {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

const Button: React.FC<Props> = ({
    title, onPress, variant = 'primary', loading = false, disabled = false, style, textStyle
}) => {
    const { colors } = useTheme();

    const bgColor = variant === 'primary'
        ? colors.softBlue
        : variant === 'secondary'
        ? colors.lavender
        : 'transparent';

    const borderColor = variant === 'outline' ? colors.softBlue : 'transparent';
    const textColor = variant === 'outline' ? colors.softBlue : colors.white;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.btn,
                { backgroundColor: bgColor, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0, opacity: disabled ? 0.6 : 1 },
                style,
            ]}
            activeOpacity={0.8}
        >
            {loading
                ? <ActivityIndicator color={textColor} size="small" />
                : <Text style={[styles.text, { color: textColor, fontFamily: Typography.headingMedium }, textStyle]}>{title}</Text>
            }
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    btn: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    text: { fontSize: Typography.sizes.base },
});

export default Button;
