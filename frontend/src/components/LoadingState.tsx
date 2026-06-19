import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing } from '../theme';

interface Props {
    message?: string;
}

export const LoadingState: React.FC<Props> = ({ message = 'Memuat...' }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.softBlue} />
            <Text style={[styles.text, { color: colors.mediumGray, fontFamily: Typography.body }]}>{message}</Text>
        </View>
    );
};

export const EmptyState: React.FC<{ message?: string }> = ({ message = 'Belum ada data.' }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.center}>
            <Text style={[styles.text, { color: colors.mediumGray, fontFamily: Typography.body }]}>{message}</Text>
        </View>
    );
};

export const ErrorState: React.FC<{ message?: string }> = ({ message = 'Terjadi kesalahan.' }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.center}>
            <Text style={[styles.text, { color: colors.error, fontFamily: Typography.body }]}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    text: { marginTop: Spacing.sm, fontSize: Typography.sizes.base, textAlign: 'center' },
});
