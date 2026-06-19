import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography } from '../theme';

interface Props {
    seconds: number;
    size?: 'sm' | 'lg';
}

const TimerDisplay: React.FC<Props> = ({ seconds, size = 'lg' }) => {
    const { colors } = useTheme();
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');

    return (
        <Text style={[
            styles.timer,
            {
                color: colors.charcoal,
                fontFamily: Typography.headingBold,
                fontSize: size === 'lg' ? Typography.sizes['3xl'] : Typography.sizes.xl,
            }
        ]}>
            {mins}:{secs}
        </Text>
    );
};

const styles = StyleSheet.create({
    timer: { letterSpacing: 2 },
});

export default TimerDisplay;
