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

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);
    const { login } = useAuthContext();
    const navigation = useNavigation<any>();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Harap isi semua kolom');
            return;
        }
        try {
            setLoading(true);
            await login(email, password);
            Alert.alert('Berhasil Masuk', 'Selamat datang kembali! 🌿');
        } catch (error: any) {
            let errorMsg = error.response?.data?.error || error.message;
            if (errorMsg === 'User not found') errorMsg = 'Email ini belum terdaftar. Silakan daftar terlebih dahulu.';
            else if (errorMsg === 'Wrong password') errorMsg = 'Password yang Anda masukkan salah.';
            Alert.alert('Login Gagal', errorMsg);
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
                <View style={styles.logoWrap}>
                    <View style={styles.mascotWrap}>
                        <Image
                            source={require('../../assets/sibiru-mascot.png')}
                            style={styles.mascotImg}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.brand}>SiBiru</Text>
                    <Text style={styles.tagline}>Ruang aman untuk berbagi dan refleksi</Text>
                </View>

                <View style={styles.form}>
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

                    <TouchableOpacity style={styles.forgotWrap}>
                        <Text style={styles.forgotText}>Lupa password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.btnText}>Masuk</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Belum punya akun? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.footerLink}>Daftar</Text>
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
        height: 200,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 60,
    },
    logoWrap: { alignItems: 'center', marginBottom: 42 },
    mascotWrap: {
        width: 152,
        height: 152,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mascotImg: {
        width: 152,
        height: 152,
        shadowColor: '#3a52a0',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.26,
        shadowRadius: 22,
    },
    brand: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 38,
        color: TEXT_DARK,
        letterSpacing: 0.4,
        marginTop: 12,
        lineHeight: 46,
    },
    tagline: {
        fontSize: 14,
        color: '#8990a4',
        marginTop: 10,
        textAlign: 'center',
        fontFamily: 'HankenGrotesk_400Regular',
    },
    form: { width: '100%' },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: INPUT_BG,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
        marginBottom: 14,
        paddingHorizontal: 18,
        height: 58,
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
    forgotWrap: { alignSelf: 'flex-end', marginBottom: 22, marginTop: -4 },
    forgotText: {
        fontSize: 13,
        fontWeight: '600',
        color: ACCENT,
        fontFamily: 'HankenGrotesk_500Medium',
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ACCENT,
        borderRadius: 18,
        paddingVertical: 18,
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
