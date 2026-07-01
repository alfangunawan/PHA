import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from './AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#1A59A1';
const BG = '#ebedf3';
const TEXT_DARK = '#353b4a';
const TEXT_MID = '#3b4150';
const INPUT_BG = '#ffffff';
const INPUT_BORDER = '#e8eaf2';
const ICON_COLOR = '#aeb4c6';
const PLACEHOLDER = '#aab0c0';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);
    const { register } = useAuthContext();
    const navigation = useNavigation<any>();

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Harap isi semua kolom');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Password tidak cocok');
            return;
        }
        try {
            setLoading(true);
            await register(email, password, name);
            Alert.alert('Pendaftaran Berhasil', 'Selamat bergabung! 🌿');
        } catch (error: any) {
            let errorMsg = error.response?.data?.details
                ? error.response.data.details.map((d: any) => d.message).join('\n')
                : error.response?.data?.error || error.message;
            if (errorMsg === 'User already exists') errorMsg = 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
            Alert.alert('Pendaftaran Gagal', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const iw = (field: string) => [styles.inputWrap, focused === field && styles.inputFocused];

    return (
        <View style={styles.container}>
            <View style={styles.blobTopRight} />
            <LinearGradient
                colors={['rgba(238,242,251,0)', '#eef2fb']}
                style={styles.bottomFade}
                pointerEvents="none"
            />

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.mascotWrap}>
                        <Image
                            source={require('../../assets/sibiru-mascot.png')}
                            style={styles.mascotImg}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Buat Akun Baru</Text>
                    <Text style={styles.subtitle}>Bergabung dengan SiBiru, ruang yang lebih tenang</Text>
                </View>

                <View style={styles.form}>
                    <View style={iw('name')}>
                        <Ionicons name="person-outline" size={19} color={ICON_COLOR} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nama"
                            placeholderTextColor={PLACEHOLDER}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            onFocus={() => setFocused('name')}
                            onBlur={() => setFocused(null)}
                        />
                    </View>

                    <View style={iw('email')}>
                        <Ionicons name="mail-outline" size={19} color={ICON_COLOR} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={PLACEHOLDER}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onFocus={() => setFocused('email')}
                            onBlur={() => setFocused(null)}
                        />
                    </View>

                    <View style={iw('password')}>
                        <Ionicons name="lock-closed-outline" size={19} color={ICON_COLOR} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={PLACEHOLDER}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            onFocus={() => setFocused('password')}
                            onBlur={() => setFocused(null)}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={19}
                                color={ICON_COLOR}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={iw('confirm')}>
                        <Ionicons name="shield-checkmark-outline" size={19} color={ICON_COLOR} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Konfirmasi Password"
                            placeholderTextColor={PLACEHOLDER}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            onFocus={() => setFocused('confirm')}
                            onBlur={() => setFocused(null)}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={styles.eyeBtn}>
                            <Ionicons
                                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={19}
                                color={ICON_COLOR}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.9}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.btnText}>Daftar</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Sudah punya akun? </Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.footerLink}>Masuk</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    blobTopRight: {
        position: 'absolute',
        top: -70,
        right: -60,
        width: 230,
        height: 230,
        borderRadius: 115,
        backgroundColor: '#eef2fb',
        opacity: 0.9,
    },
    bottomFade: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: 170,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 48,
    },
    header: { alignItems: 'center', marginBottom: 26 },
    mascotWrap: {
        width: 104,
        height: 104,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mascotImg: {
        width: 104,
        height: 104,
        shadowColor: '#3a52a0',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.26,
        shadowRadius: 18,
    },
    title: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 26,
        color: TEXT_DARK,
        letterSpacing: -0.2,
        marginTop: 12,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 13.5,
        color: '#8990a4',
        marginTop: 8,
        textAlign: 'center',
        fontFamily: 'HankenGrotesk_400Regular',
        lineHeight: 20,
    },
    form: { width: '100%' },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: INPUT_BG,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
        marginBottom: 13,
        paddingHorizontal: 18,
        height: 56,
        shadowColor: '#383f5c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputFocused: {
        borderColor: '#b6c1e2',
        shadowColor: '#8a9ccc',
        shadowOpacity: 0.16,
        shadowRadius: 10,
        elevation: 3,
    },
    inputIcon: { marginRight: 12 },
    input: {
        flex: 1,
        fontSize: 15,
        color: TEXT_MID,
        fontFamily: 'HankenGrotesk_400Regular',
        height: '100%',
    },
    eyeBtn: { padding: 4 },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ACCENT,
        borderRadius: 18,
        paddingVertical: 18,
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#8a9ccc',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 8,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'HankenGrotesk_600SemiBold',
    },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: 13.5, color: '#9197aa', fontFamily: 'HankenGrotesk_400Regular' },
    footerLink: { fontSize: 13.5, fontWeight: '700', color: ACCENT, fontFamily: 'HankenGrotesk_700Bold' },
});
