import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuthContext } from './AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // Added confirm password field for UX
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useAuthContext();
    const navigation = useNavigation<any>();

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Harap isi semua kolom');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Password tidak cocok');
            return;
        }

        try {
            setLoading(true);
            await register(email, password);
            Alert.alert('Sukses', 'Akun berhasil dibuat! Silakan login.');
            navigation.goBack();
        } catch (error: any) {
            const errorMsg = error.response?.data?.details
                ? error.response.data.details.map((d: any) => d.message).join('\n')
                : error.response?.data?.error || error.message;
            Alert.alert('Registrasi Gagal', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Ionicons name="leaf" size={40} color="#48B096" />
                </View>
                <Text style={styles.title}>Buat Akun Baru</Text>
                <Text style={styles.subtitle}>Langkah kecil menuju ruang yang lebih tenang</Text>
            </View>

            <View style={styles.form}>
                {/* Name field could be added here later */}

                <View style={styles.inputContainer}>
                    <Ionicons name="mail" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#aaa"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="shield-checkmark" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Konfirmasi Password"
                        placeholderTextColor="#aaa"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                    />
                </View>

                <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.buttonWrapper}>
                    <LinearGradient
                        colors={['#5CC2A8', '#48B096']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.buttonText}>Daftar</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Sudah punya akun? </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.linkText}>Masuk</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.bgDecoration} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', padding: 25 },
    header: { alignItems: 'center', marginBottom: 30 },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
    subtitle: { fontSize: 13, color: '#7F8C8D', textAlign: 'center' },
    form: { w: '100%' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
        elevation: 1,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
    eyeIcon: { padding: 5 },
    buttonWrapper: {
        width: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 30,
        shadowColor: '#48B096',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    button: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: { flexDirection: 'row', alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', marginRight: 8 },
    buttonIcon: { marginTop: 2 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: '#7F8C8D', fontSize: 14 },
    linkText: { color: '#48B096', fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
    bgDecoration: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        backgroundColor: '#E8F6F3',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
        opacity: 0.5,
        zIndex: -1,
        transform: [{ scaleX: 1.5 }],
    }
});
