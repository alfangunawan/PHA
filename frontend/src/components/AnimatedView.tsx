import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    delay?: number;
    duration?: number;
    fromY?: number;
}

const AnimatedView: React.FC<Props> = ({ children, style, delay = 0, duration = 400, fromY = 20 }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(fromY)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
};

export default AnimatedView;
