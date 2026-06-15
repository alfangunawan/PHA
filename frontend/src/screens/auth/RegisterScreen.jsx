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

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Ups!', 'Semua kolom wajib diisi 🌸');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Kata Sandi Terlalu Pendek', 'Kata sandi minimal 6 karakter ya 🔐');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Registrasi Gagal', err?.message || 'Terjadi kesalahan. Coba lagi ya 🌿');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AnimatedView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 100 }}
            style={styles.header}
          >
            <Text style={styles.emoji}>🌸</Text>
            <Text style={styles.title}>Mulai perjalananmu</Text>
            <Text style={styles.subtitle}>Buat akun untuk memulai latihan mindfulness harianmu</Text>
          </AnimatedView>

          <AnimatedView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.card}
          >
            {[
              { label: 'Nama Lengkap', value: name, setter: setName, placeholder: 'Nama kamu', type: 'default' },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'nama@email.com', type: 'email-address' },
              { label: 'Kata Sandi', value: password, setter: setPassword, placeholder: 'Minimal 6 karakter', type: 'default', secure: true },
            ].map(({ label, value, setter, placeholder, type, secure }) => (
              <View key={label} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.mediumGray}
                  value={value}
                  onChangeText={setter}
                  keyboardType={type}
                  autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                  secureTextEntry={!!secure}
                />
              </View>
            ))}

            <Button title="Buat Akun" onPress={handleRegister} loading={loading} size="full" style={styles.btn} />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Masuk di sini</Text>
              </TouchableOpacity>
            </View>
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
  emoji: { fontSize: 56, marginBottom: Spacing.sm },
  title: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes['2xl'],
    color: Colors.charcoal,
  },
  subtitle: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.base,
    color: Colors.darkGray,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: Typography.sizes.base * 1.6,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
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
  btn: { marginTop: Spacing.sm },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  loginText: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  loginLink: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.softBlueDark,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;


