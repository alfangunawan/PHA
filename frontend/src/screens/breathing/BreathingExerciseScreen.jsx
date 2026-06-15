import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
  Easing, interpolateColor, useDerivedValue,
} from 'react-native-reanimated';
import AnimatedView from '../../components/AnimatedView';
import { breathingAPI } from '../../api';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_W * 0.62;
const MIN_SIZE = CIRCLE_SIZE * 0.55;

// Phase definitions
const getPhases = (t) => {
  const phases = [
    { key: 'inhale', label: 'Tarik Napas', duration: t.inhale_duration * 1000, instruction: 'Hirup perlahan...' },
  ];
  if (t.hold_duration > 0) {
    phases.push({ key: 'hold', label: 'Tahan', duration: t.hold_duration * 1000, instruction: 'Tahan napas...' });
  }
  phases.push({ key: 'exhale', label: 'Hembus', duration: t.exhale_duration * 1000, instruction: 'Lepaskan perlahan...' });
  if (t.hold_after_exhale > 0) {
    phases.push({ key: 'hold2', label: 'Jeda', duration: t.hold_after_exhale * 1000, instruction: 'Istirahat sejenak...' });
  }
  return phases;
};

const PHASE_COLORS = {
  inhale: Colors.softBlue,
  hold: Colors.lavender,
  exhale: Colors.sageGreen,
  hold2: Colors.peach,
};

const SOUNDS = {
  inhale: require('../../../assets/audio/breathing/breath_in.mp3'),
  exhale: require('../../../assets/audio/breathing/breath_out.mp3'),
};

const BreathingExerciseScreen = ({ route, navigation }) => {
  const { technique } = route.params;
  const { colors } = useTheme();
  const phases = getPhases(technique);
  const totalCycles = technique.cycles;

  // State
  const [status, setStatus] = useState('ready'); // ready | running | paused | done
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [phaseCountdown, setPhaseCountdown] = useState(phases[0].duration / 1000);
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs
  const phaseIdxRef = useRef(0);
  const phaseTimer = useRef(null);
  const sessionTimer = useRef(null);
  const statusRef = useRef('ready');

  // Animation
  const progress = useSharedValue(0); // 0 = min, 1 = max

  const circleStyle = useAnimatedStyle(() => {
    const size = MIN_SIZE + (CIRCLE_SIZE - MIN_SIZE) * progress.value;
    const opacity = 0.3 + progress.value * 0.5;
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      opacity,
    };
  });

  const innerCircleStyle = useAnimatedStyle(() => {
    const size = MIN_SIZE * 0.7 + (CIRCLE_SIZE * 0.7 - MIN_SIZE * 0.7) * progress.value;
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
    };
  });

  const currentPhase = phases[currentPhaseIdx];
  const themeColor = technique.color_theme || Colors.softBlue;
  const phaseColor = PHASE_COLORS[currentPhase?.key] || themeColor;

  // Animate circle for a phase
  const animatePhase = useCallback((phaseKey, duration) => {
    const isExpand = phaseKey === 'inhale';
    const isHold = phaseKey === 'hold' || phaseKey === 'hold2';
    const toValue = isExpand ? 1 : (isHold ? progress.value : 0);

    if (!isHold) {
      progress.value = withTiming(isExpand ? 1 : 0, {
        duration,
        easing: isExpand ? Easing.inOut(Easing.quad) : Easing.inOut(Easing.quad),
      });
    }
  }, [progress]);

  // Run a single phase
  const runPhase = useCallback((idx, cyclesDone) => {
    if (statusRef.current !== 'running') return;

    const phase = phases[idx];
    setCurrentPhaseIdx(idx);
    setPhaseCountdown(phase.duration / 1000);

    // Animate circle
    animatePhase(phase.key, phase.duration);

    // Play sound if inhale or exhale
    if (phase.key === 'inhale') playSound('inhale');
    if (phase.key === 'exhale') playSound('exhale');

    // Countdown within phase
    let remaining = phase.duration / 1000;
    phaseTimer.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(phaseTimer.current);
        if (statusRef.current !== 'running') return;

        const nextIdx = idx + 1;
        if (nextIdx < phases.length) {
          runPhase(nextIdx, cyclesDone);
        } else {
          // One full cycle done
          const newCycles = cyclesDone + 1;
          setCycleCount(newCycles);

          if (newCycles >= totalCycles) {
            handleSessionComplete(newCycles);
          } else {
            runPhase(0, newCycles);
          }
        }
      } else {
        setPhaseCountdown(remaining);
      }
    }, 1000);
  }, [phases, totalCycles, animatePhase]);

  const startSession = useCallback(() => {
    statusRef.current = 'running';
    setStatus('running');
    phaseIdxRef.current = 0;
    setCycleCount(0);
    setElapsedSeconds(0);

    // Session timer
    sessionTimer.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    runPhase(0, 0);
  }, [runPhase]);

  const pauseSession = () => {
    if (statusRef.current === 'running') {
      statusRef.current = 'paused';
      setStatus('paused');
      clearInterval(phaseTimer.current);
      clearInterval(sessionTimer.current);
    } else if (statusRef.current === 'paused') {
      statusRef.current = 'running';
      setStatus('running');
      sessionTimer.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      runPhase(currentPhaseIdx, cycleCount);
    }
  };

  const stopSession = () => {
    Alert.alert(
      'Hentikan Sesi?',
      'Kemajuanmu akan tetap tersimpan 🌿',
      [
        { text: 'Lanjutkan', style: 'cancel' },
        {
          text: 'Hentikan',
          onPress: () => {
            clearInterval(phaseTimer.current);
            clearInterval(sessionTimer.current);
            saveLog(cycleCount, elapsedSeconds);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSessionComplete = async (cycles) => {
    statusRef.current = 'done';
    setStatus('done');
    clearInterval(phaseTimer.current);
    clearInterval(sessionTimer.current);
    progress.value = withTiming(0.5, { duration: 500 });
    await saveLog(cycles, elapsedSeconds);
  };

  const saveLog = async (cycles, duration) => {
    try {
      await breathingAPI.saveLog({
        technique_id: technique.id,
        duration,
        cycles_completed: cycles,
      });
    } catch (e) {
      console.log('Failed to save breathing log:', e);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(phaseTimer.current);
      clearInterval(sessionTimer.current);
    };
  }, []);

  const playSound = async (type) => {
    try {
      const file = SOUNDS[type];
      const { sound } = await Audio.Sound.createAsync(file);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch (error) {
      console.log('Error playing breathing sound:', error);
    }
  };

  const pad = (n) => String(Math.floor(n)).padStart(2, '0');

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={status === 'running' || status === 'paused' ? stopSession : () => navigation.goBack()}>
            <Text style={[styles.backBtn, { color: colors.darkGray }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.techniqueTitle, { color: colors.charcoal }]}>{technique.name}</Text>
          <Text style={[styles.cycleText, { color: colors.mediumGray }]}>
            {cycleCount}/{totalCycles} siklus
          </Text>
        </View>

        {/* Circle Animation */}
        <View style={styles.circleContainer}>
          {/* Outer glow ring */}
          <AnimatedView
            from={{ scale: 1, opacity: 0.15 }}
            animate={{ scale: status === 'running' ? 1.15 : 1, opacity: status === 'running' ? 0.08 : 0.15 }}
            transition={{ type: 'timing', duration: 2000, loop: status === 'running' }}
            style={[styles.glowRing, { borderColor: phaseColor }]}
          />

          {/* Main breathing circle */}
          <Animated.View
            style={[
              styles.breathCircle,
              { backgroundColor: phaseColor + '35', borderColor: phaseColor + '70', borderWidth: 2 },
              circleStyle,
            ]}
          />

          {/* Inner circle */}
          <Animated.View
            style={[
              styles.innerCircle,
              { backgroundColor: phaseColor + '50' },
              innerCircleStyle,
            ]}
          />

          {/* Center content */}
          <View style={styles.centerContent}>
            {status === 'ready' && (
              <AnimatedView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' }}
                style={styles.readyContent}
              >
                <Text style={styles.readyEmoji}>🌬️</Text>
                <Text style={styles.readyText}>Siap memulai?</Text>
              </AnimatedView>
            )}

            {(status === 'running' || status === 'paused') && (
              <View style={styles.phaseContent}>
                <Text style={[styles.phaseLabel, { color: phaseColor }]}>
                  {currentPhase?.label}
                </Text>
                <Text style={[styles.phaseCountdown, { color: colors.charcoal }]}>{phaseCountdown}</Text>
                <Text style={[styles.phaseInstruction, { color: colors.darkGray }]}>{currentPhase?.instruction}</Text>
              </View>
            )}

            {status === 'done' && (
              <AnimatedView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <Text style={styles.doneEmoji}>✨</Text>
                <Text style={[styles.doneText, { color: colors.charcoal }]}>Luar biasa!</Text>
              </AnimatedView>
            )}
          </View>
        </View>

        {/* Session Stats */}
        <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.charcoal }]}>{pad(Math.floor(elapsedSeconds / 60))}:{pad(elapsedSeconds % 60)}</Text>
            <Text style={[styles.statLabel, { color: colors.mediumGray }]}>Durasi</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.charcoal }]}>{cycleCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mediumGray }]}>Siklus</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.charcoal }]}>{totalCycles - cycleCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mediumGray }]}>Tersisa</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {status === 'ready' && (
            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: themeColor }]} onPress={startSession}>
              <Text style={styles.mainBtnText}>Mulai Sekarang</Text>
            </TouchableOpacity>
          )}

          {(status === 'running' || status === 'paused') && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.stopBtn, { backgroundColor: colors.lightGray }]} onPress={stopSession}>
                <Text style={[styles.stopBtnText, { color: colors.darkGray }]}>⬛ Hentikan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainBtn, { backgroundColor: status === 'paused' ? themeColor : colors.peachDark, flex: 1 }]}
                onPress={pauseSession}
              >
                <Text style={styles.mainBtnText}>{status === 'paused' ? '▶ Lanjutkan' : '⏸ Jeda'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'done' && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.stopBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.stopBtnText}>← Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainBtn, { backgroundColor: themeColor, flex: 1 }]}
                onPress={() => {
                  setStatus('ready');
                  setCycleCount(0);
                  setElapsedSeconds(0);
                  setCurrentPhaseIdx(0);
                  progress.value = 0;
                }}
              >
                <Text style={styles.mainBtnText}>🔄 Ulangi</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: { fontSize: 20, color: Colors.darkGray, padding: 4 },
  techniqueTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.base,
    color: Colors.charcoal,
  },
  cycleText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.mediumGray,
  },
  circleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 60,
    height: CIRCLE_SIZE + 60,
    borderRadius: (CIRCLE_SIZE + 60) / 2,
    borderWidth: 2,
  },
  breathCircle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    zIndex: 10,
  },
  playerBlank: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  blankIcon: { fontSize: 48 },
  innerCircle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  readyContent: { alignItems: 'center' },
  readyEmoji: { fontSize: 48, marginBottom: 8 },
  readyText: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.xl,
  },
  phaseContent: { alignItems: 'center' },
  phaseLabel: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  phaseCountdown: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes['4xl'],
    color: Colors.charcoal,
    lineHeight: Typography.sizes['4xl'],
  },
  phaseInstruction: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.base,
    color: Colors.darkGray,
    marginTop: 8,
  },
  doneEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 8 },
  doneText: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes.xl,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  stat: { alignItems: 'center' },
  statValue: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes.xl,
    color: Colors.charcoal,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.xs,
    color: Colors.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  controls: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  btnRow: { flexDirection: 'row', gap: Spacing.sm },
  mainBtn: {
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnText: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.md,
    color: Colors.white,
  },
  stopBtn: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightGray,
  },
  stopBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
});

export default BreathingExerciseScreen;


