import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedView from '../../components/AnimatedView';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Ups!', 'Email dan kata sandi wajib diisi 🌸');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Login Gagal', err?.message || 'Terjadi kesalahan. Coba lagi ya 🌿');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <AnimatedView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 100 }}
            style={styles.header}
          >
            <Text style={styles.emoji}>🌿</Text>
            <Text style={styles.appName}>Mindfulness</Text>
            <Text style={styles.tagline}>Ruang tenang untuk pikiran & hatimu</Text>
          </AnimatedView>

          {/* Form */}
          <AnimatedView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Selamat datang kembali 👋</Text>
            <Text style={styles.cardSubtitle}>Masuk untuk melanjutkan perjalanan mindfulness-mu</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                placeholderTextColor={Colors.mediumGray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={Colors.mediumGray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Masuk"
              onPress={handleLogin}
              loading={loading}
              size="full"
              style={styles.loginBtn}
            />

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Belum punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Daftar di sini</Text>
              </TouchableOpacity>
            </View>
          </AnimatedView>

          {/* Demo hint */}
          <AnimatedView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 600 }}
            style={styles.demoHint}
          >
            <Text style={styles.demoText}>
              🔑 Demo: user@mindfulness.app / password{'\n'}
              👑 Admin: admin@mindfulness.app / password
            </Text>
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  emoji: { fontSize: 64, marginBottom: Spacing.sm },
  appName: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes['3xl'],
    color: Colors.charcoal,
  },
  tagline: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.base,
    color: Colors.darkGray,
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  cardTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.xl,
    color: Colors.charcoal,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginBottom: Spacing.lg,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  inputGroup: { marginBottom: Spacing.md },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontFamily: Typography.body,
    fontSize: Typography.sizes.base,
    color: Colors.charcoal,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
  },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: 14, top: 10 },
  eyeIcon: { fontSize: 18 },
  loginBtn: { marginTop: Spacing.sm },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  registerText: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  registerLink: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.softBlueDark,
    textDecorationLine: 'underline',
  },
  demoHint: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.softBlueLight,
    borderRadius: BorderRadius.md,
  },
  demoText: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.xs,
    color: Colors.softBlueDark,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;


