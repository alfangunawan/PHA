/**
 * AnimatedView — Drop-in replacement untuk MotiView
 * Menggunakan React Native Animated API (bukan Reanimated/Moti)
 * agar 100% kompatibel dengan Expo Go tanpa development build.
 *
 * Props yang didukung (mirip Moti):
 *   from: { opacity, translateY, translateX, scale }
 *   animate: { opacity, translateY, translateX, scale }
 *   transition: { type, delay, duration }
 *   style, children
 */

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const AnimatedView = ({
  from = {},
  animate = {},
  transition = {},
  style,
  children,
  ...rest
}) => {
  const opacity = useRef(new Animated.Value(from.opacity ?? 1)).current;
  const translateY = useRef(new Animated.Value(from.translateY ?? 0)).current;
  const translateX = useRef(new Animated.Value(from.translateX ?? 0)).current;
  const scale = useRef(new Animated.Value(from.scale ?? 1)).current;

  useEffect(() => {
    const delay = transition.delay ?? 0;
    const duration = transition.duration ?? 400;

    const animations = [];

    if (animate.opacity !== undefined) {
      animations.push(
        Animated.timing(opacity, {
          toValue: animate.opacity,
          duration,
          delay,
          useNativeDriver: false,
        })
      );
    }
    if (animate.translateY !== undefined) {
      animations.push(
        Animated.timing(translateY, {
          toValue: animate.translateY,
          duration,
          delay,
          useNativeDriver: false,
        })
      );
    }
    if (animate.translateX !== undefined) {
      animations.push(
        Animated.timing(translateX, {
          toValue: animate.translateX,
          duration,
          delay,
          useNativeDriver: false,
        })
      );
    }
    if (animate.scale !== undefined) {
      animations.push(
        Animated.timing(scale, {
          toValue: animate.scale,
          duration,
          delay,
          useNativeDriver: false,
        })
      );
    }

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [animate.opacity, animate.translateY, animate.translateX, animate.scale]);

  const transformParts = [];
  if (from.translateY !== undefined || animate.translateY !== undefined) {
    transformParts.push({ translateY });
  }
  if (from.translateX !== undefined || animate.translateX !== undefined) {
    transformParts.push({ translateX });
  }
  if (from.scale !== undefined || animate.scale !== undefined) {
    transformParts.push({ scale });
  }

  const animatedStyle = {
    opacity: from.opacity !== undefined || animate.opacity !== undefined ? opacity : undefined,
    transform: transformParts.length > 0 ? transformParts : undefined,
  };

  // Clean up undefined values
  if (animatedStyle.opacity === undefined) delete animatedStyle.opacity;
  if (animatedStyle.transform === undefined) delete animatedStyle.transform;

  return (
    <Animated.View style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
};

export default AnimatedView;
