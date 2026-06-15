import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedView from '../../components/AnimatedView';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, Easing, interpolate, useDerivedValue,
} from 'react-native-reanimated';
import { meditationAPI } from '../../api';
import TimerDisplay from '../../components/TimerDisplay';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');

const DURATION_OPTIONS = [5, 10, 15, 20];

const AUDIO_FILES = [
  require('../../../assets/audio/meditations/Guided Meditation1.mp3'),
  require('../../../assets/audio/meditations/Guided Meditation2.mp3'),
  require('../../../assets/audio/meditations/Guided Meditation3.mp3'),
  require('../../../assets/audio/meditations/Guided Meditation4.wav'),
];

const CATEGORY_THEMES = {
  sleep:   { color: '#A78BFA', glow: '#7C3AED', bg: '#0F0A1E', emoji: '🌙' },
  focus:   { color: '#60A5FA', glow: '#2563EB', bg: '#0A0F1E', emoji: '🎯' },
  anxiety: { color: '#34D399', glow: '#059669', bg: '#0A1A14', emoji: '💚' },
  morning: { color: '#FBBF24', glow: '#D97706', bg: '#1A100A', emoji: '🌅' },
  general: { color: '#818CF8', glow: '#4338CA', bg: '#0D0A1E', emoji: '🧘' },
};

// ── Floating Orb: softer, randomised ambient particles ──────────────────────
const FloatingOrb = ({ delay, color, glow, running }) => {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const size = useRef(10 + Math.random() * 14).current;
  const left = useRef(20 + Math.random() * (W - 80)).current;
  const baseY = useRef(H * 0.35 + Math.random() * H * 0.25).current;
  const drift = useRef((Math.random() - 0.5) * 40).current;
  const floatDur = useRef(3500 + Math.random() * 2000).current;

  useEffect(() => {
    if (!running) {
      opacity.value = withTiming(0, { duration: 600 });
      return;
    }
    const loop = () => {
      opacity.value = withSequence(
        withTiming(0.55, { duration: 800 }),
        withTiming(0.15, { duration: floatDur }),
        withTiming(0, { duration: 400 })
      );
      y.value = withTiming(-80 - Math.random() * 60, { duration: floatDur + 800, easing: Easing.out(Easing.quad) });
      x.value = withTiming(drift, { duration: floatDur + 800, easing: Easing.inOut(Easing.sin) });
      scale.value = withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.6, { duration: floatDur })
      );
      setTimeout(() => {
        y.value = 0;
        x.value = 0;
        scale.value = 0.5;
        loop();
      }, floatDur + 1200 + delay);
    };
    setTimeout(loop, delay);
  }, [running]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: y.value },
      { translateX: x.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          top: baseY,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: size,
        },
      ]}
    />
  );
};

// ── Aurora Layer: large blurry glow blobs in background ──────────────────────
const AuroraLayer = ({ color, duration, delay, startX, startY }) => {
  const x = useSharedValue(startX);
  const y = useSharedValue(startY);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration }),
          withTiming(0.08, { duration })
        ),
        -1, true
      );
      x.value = withRepeat(
        withSequence(
          withTiming(startX + 30, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
          withTiming(startX - 20, { duration: duration * 0.9, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      );
      y.value = withRepeat(
        withSequence(
          withTiming(startY - 25, { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) }),
          withTiming(startY + 20, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: duration * 0.9 }),
          withTiming(0.85, { duration: duration * 1.1 })
        ),
        -1, true
      );
    }, delay);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          width: W * 0.85,
          height: W * 0.85,
          borderRadius: W * 0.425,
          backgroundColor: color,
        },
      ]}
    />
  );
};

// ── SVG-like circular progress ring drawn with View trick ─────────────────────
const CircularProgressRing = ({ progress, color, size }) => {
  const rotation = useDerivedValue(() =>
    interpolate(progress.value, [0, 1], [0, 360])
  );

  const halfStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Simple approximation: animated border on a segmented arc view
  const arcRotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: color + '22',
        }}
      />
      {/* Progress ring: clip left then right halves */}
      <View style={{ position: 'absolute', width: size, height: size, overflow: 'hidden' }}>
        {/* Right half (0–180°) */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size / 2,
              height: size,
              right: 0,
              overflow: 'hidden',
            },
          ]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 3,
                borderColor: color,
                borderLeftColor: 'transparent',
                borderBottomColor: 'transparent',
                left: -size / 2,
              },
              arcRotation,
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const MeditationPlayerScreen = ({ route, navigation }) => {
  const { session } = route.params;
  const theme = CATEGORY_THEMES[session.category] || CATEGORY_THEMES.general;

  let parsedDurations = session.duration_options;
  if (typeof parsedDurations === 'string') {
    try { parsedDurations = JSON.parse(parsedDurations); } catch(e) { parsedDurations = null; }
  }
  const availableDurations = Array.isArray(parsedDurations) ? parsedDurations.map(Number) : DURATION_OPTIONS;
  const [selectedDuration, setSelectedDuration] = useState(availableDurations[0]);
  const [status, setStatus] = useState('ready');
  const [timeRemaining, setTimeRemaining] = useState(selectedDuration * 60);
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef(null);
  const statusRef = useRef('ready');
  const soundRef = useRef(null);

  const loadAndPlaySound = async () => {
    try {
      const index = (session.id || 1) % 4;
      const { sound } = await Audio.Sound.createAsync(AUDIO_FILES[index]);
      soundRef.current = sound;
      await sound.playAsync();
      sound.setIsLoopingAsync(true);
    } catch (e) {
      console.log('Error playing meditation audio', e);
    }
  };

  const pauseSound = async () => { if (soundRef.current) await soundRef.current.pauseAsync(); };
  const resumeSound = async () => { if (soundRef.current) await soundRef.current.playAsync(); };
  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  // ── Core breathing pulse (main orb) ───────────────────────────────────────
  const mainScale = useSharedValue(1);
  const mainOpacity = useSharedValue(0.7);
  const mainGlow = useSharedValue(0.3);

  // ── Ripple rings scale out ─────────────────────────────────────────────────
  const ripple1 = useSharedValue(0.5);
  const ripple2 = useSharedValue(0.5);
  const ripple3 = useSharedValue(0.5);
  const rippleOp1 = useSharedValue(0);
  const rippleOp2 = useSharedValue(0);
  const rippleOp3 = useSharedValue(0);

  const ORB_SIZE = W * 0.52;

  useEffect(() => {
    // Continuous subtle pulse even on ready
    mainScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.96, { duration: 3200, easing: Easing.inOut(Easing.sin) })
      ), -1, false
    );
    mainOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 3000 }),
        withTiming(0.55, { duration: 3000 })
      ), -1, false
    );
    mainGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0.3, { duration: 3000 })
      ), -1, false
    );
  }, []);

  // Ripples only when running
  const startRipples = () => {
    const doRipple = (scale, op, delay) => {
      setTimeout(() => {
        scale.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1.7, { duration: 2400, easing: Easing.out(Easing.quad) })
          ), -1, false
        );
        op.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 200 }),
            withTiming(0, { duration: 2200, easing: Easing.out(Easing.quad) })
          ), -1, false
        );
      }, delay);
    };
    doRipple(ripple1, rippleOp1, 0);
    doRipple(ripple2, rippleOp2, 800);
    doRipple(ripple3, rippleOp3, 1600);
  };

  const stopRipples = () => {
    [rippleOp1, rippleOp2, rippleOp3].forEach(op => {
      op.value = withTiming(0, { duration: 400 });
    });
    [ripple1, ripple2, ripple3].forEach(r => {
      r.value = withTiming(0.5, { duration: 400 });
    });
  };

  useEffect(() => {
    if (status === 'running') startRipples();
    else stopRipples();
  }, [status]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mainScale.value }],
    opacity: mainOpacity.value,
    shadowOpacity: mainGlow.value,
  }));

  const rippleStyle = (scale, op) => useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: op.value,
  }));

  const r1Style = rippleStyle(ripple1, rippleOp1);
  const r2Style = rippleStyle(ripple2, rippleOp2);
  const r3Style = rippleStyle(ripple3, rippleOp3);

  // ── Progress ───────────────────────────────────────────────────────────────
  const progressAnim = useSharedValue(0);
  useEffect(() => {
    progressAnim.value = withTiming(1 - timeRemaining / (selectedDuration * 60), { duration: 900 });
  }, [timeRemaining, selectedDuration]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  // ── Timer logic ────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    statusRef.current = 'running';
    setStatus('running');
    if (!soundRef.current) loadAndPlaySound();
    timerRef.current = setInterval(() => {
      setTimeRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          statusRef.current = 'done';
          setStatus('done');
          return 0;
        }
        return r - 1;
      });
      setElapsed((e) => e + 1);
    }, 1000);
  }, []);

  const pauseTimer = () => {
    if (statusRef.current === 'running') {
      clearInterval(timerRef.current);
      statusRef.current = 'paused';
      setStatus('paused');
      pauseSound();
    } else if (statusRef.current === 'paused') {
      resumeSound();
      startTimer();
    }
  };

  const stopSession = () => {
    Alert.alert('Hentikan Sesi?', 'Sesi akan disimpan sesuai durasi yang sudah berjalan 🌿', [
      { text: 'Lanjutkan', style: 'cancel' },
      {
        text: 'Hentikan',
        onPress: async () => {
          clearInterval(timerRef.current);
          stopSound();
          await saveLog(false);
          navigation.goBack();
        },
      },
    ]);
  };

  const saveLog = async (completed) => {
    try {
      await meditationAPI.saveLog({ session_id: session.id, duration: elapsed, completed });
    } catch (e) { console.log('Failed to save meditation log:', e); }
  };

  useEffect(() => {
    if (status === 'done') { stopSound(); saveLog(true); }
  }, [status]);

  useEffect(() => {
    return () => { clearInterval(timerRef.current); stopSound(); };
  }, []);

  const ORB_PARTICLES = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={styles.safe}>

        {/* ── Aurora Background ──────────────────────────────────────────── */}
        <AuroraLayer color={theme.color} duration={5000} delay={0} startX={-W * 0.1} startY={H * 0.05} />
        <AuroraLayer color={theme.glow} duration={6500} delay={1500} startX={W * 0.1} startY={H * 0.5} />
        <AuroraLayer color={theme.color + '80'} duration={4500} delay={800} startX={W * 0.2} startY={H * 0.2} />

        {/* ── Floating Orbs ──────────────────────────────────────────────── */}
        {ORB_PARTICLES.map((delay, i) => (
          <FloatingOrb key={i} delay={delay} color={theme.color + '80'} glow={theme.glow} running={status === 'running'} />
        ))}

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeWrapper}
            onPress={status === 'ready' ? () => navigation.goBack() : stopSession}
          >
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.categoryTag, { color: theme.color }]}>{session.category}</Text>
            <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Main Visual Area ────────────────────────────────────────────── */}
        <View style={styles.visualContainer}>

          {/* Ripple rings */}
          {[r1Style, r2Style, r3Style].map((rStyle, i) => (
            <Animated.View
              key={i}
              style={[
                styles.rippleRing,
                { width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2, borderColor: theme.color },
                rStyle,
              ]}
            />
          ))}

          {/* Outer decorative rings (static-ish) */}
          <Animated.View
            style={[
              styles.outerRing,
              { borderColor: theme.color + '25', width: ORB_SIZE * 1.35, height: ORB_SIZE * 1.35, borderRadius: ORB_SIZE * 0.675 },
            ]}
          />
          <Animated.View
            style={[
              styles.outerRing,
              { borderColor: theme.color + '15', width: ORB_SIZE * 1.6, height: ORB_SIZE * 1.6, borderRadius: ORB_SIZE * 0.8 },
            ]}
          />

          {/* Main glowing orb */}
          <Animated.View
            style={[
              styles.mainOrb,
              {
                width: ORB_SIZE,
                height: ORB_SIZE,
                borderRadius: ORB_SIZE / 2,
                backgroundColor: theme.color + '22',
                borderColor: theme.color + '70',
                shadowColor: theme.glow,
              },
              orbStyle,
            ]}
          >
            {/* Inner glow core */}
            <View
              style={{
                width: ORB_SIZE * 0.55,
                height: ORB_SIZE * 0.55,
                borderRadius: ORB_SIZE * 0.275,
                backgroundColor: theme.color + '35',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={styles.centerEmoji}>{theme.emoji}</Text>
            </View>
          </Animated.View>

          {/* Center status label */}
          <View style={styles.centerLabel}>
            {status === 'ready' && (
              <AnimatedView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 2, translateY: 0 }} style={styles.readyBadge}>
                <Text style={[styles.readyBadgeText, { color: theme.color }]}>Siap memulai</Text>
              </AnimatedView>
            )}
            {status === 'paused' && (
              <AnimatedView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.readyBadge}>
                <Text style={[styles.readyBadgeText, { color: theme.color }]}>⏸ Dijeda</Text>
              </AnimatedView>
            )}
            {status === 'done' && (
              <AnimatedView from={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
                <Text style={styles.doneEmoji}>✨</Text>
                <Text style={[styles.doneLabel, { color: theme.color }]}>Luar biasa!</Text>
              </AnimatedView>
            )}
          </View>
        </View>

        {/* ── Timer ──────────────────────────────────────────────────────── */}
        <View style={styles.timerSection}>
          <TimerDisplay
            seconds={status === 'ready' ? selectedDuration * 60 : timeRemaining}
            size="xl"
            label={status === 'ready' ? 'pilih durasi' : status === 'done' ? 'selesai!' : 'tersisa'}
          />
          {status !== 'ready' && (
            <View style={styles.progressBg}>
              <Animated.View style={[styles.progressFill, { backgroundColor: theme.color }, progressStyle]} />
            </View>
          )}
        </View>

        {/* ── Duration Selector ───────────────────────────────────────────── */}
        {status === 'ready' && (
          <AnimatedView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.durationSelector}>
            <Text style={styles.durationLabel}>Pilih durasi:</Text>
            <View style={styles.durationRow}>
              {availableDurations.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durBtn,
                    { borderColor: theme.color + '80' },
                    selectedDuration === d && { backgroundColor: theme.color },
                  ]}
                  onPress={() => { setSelectedDuration(d); setTimeRemaining(d * 60); }}
                >
                  <Text style={[styles.durText, { color: selectedDuration === d ? '#fff' : theme.color }]}>
                    {d} mnt
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedView>
        )}

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <View style={styles.controls}>
          {status === 'ready' && (
            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: theme.color }]} onPress={startTimer}>
              <Text style={styles.mainBtnText}>✦ Mulai Meditasi</Text>
            </TouchableOpacity>
          )}

          {(status === 'running' || status === 'paused') && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={stopSession}>
                <Text style={[styles.secondaryBtnText, { color: theme.color }]}>⬛ Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainBtn, { backgroundColor: status === 'paused' ? theme.color : theme.glow + 'CC', flex: 1 }]}
                onPress={pauseTimer}
              >
                <Text style={styles.mainBtnText}>{status === 'paused' ? '▶ Lanjutkan' : '⏸ Jeda'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'done' && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
                <Text style={[styles.secondaryBtnText, { color: theme.color }]}>← Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainBtn, { backgroundColor: theme.color, flex: 1 }]}
                onPress={() => {
                  setStatus('ready');
                  setElapsed(0);
                  setTimeRemaining(selectedDuration * 60);
                  soundRef.current = null;
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  closeWrapper: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  headerCenter: { alignItems: 'center', flex: 1, paddingHorizontal: Spacing.sm },
  categoryTag: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  sessionTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.85)',
  },

  visualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  rippleRing: {
    position: 'absolute',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  mainOrb: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
    shadowOpacity: 0.9,
    elevation: 20,
  },
  centerEmoji: { fontSize: 48 },
  centerLabel: {
    position: 'absolute',
    bottom: -36,
    alignItems: 'center',
  },
  readyBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  readyBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    letterSpacing: 0.5,
  },
  doneEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 4 },
  doneLabel: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.xl,
    textAlign: 'center',
  },

  timerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    zIndex: 10,
  },
  progressBg: {
    marginTop: Spacing.md,
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  durationSelector: { alignItems: 'center', paddingBottom: Spacing.md, zIndex: 10 },
  durationLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: Spacing.sm,
  },
  durationRow: { flexDirection: 'row', gap: Spacing.sm },
  durBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  durText: { fontFamily: Typography.bodyMedium, fontSize: Typography.sizes.sm },

  controls: { padding: Spacing.lg, paddingBottom: Spacing.xl, zIndex: 10 },
  btnRow: { flexDirection: 'row', gap: Spacing.sm },
  mainBtn: {
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  mainBtnText: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.md,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
  },
});

export default MeditationPlayerScreen;
