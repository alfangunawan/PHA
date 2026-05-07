import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useAuthContext } from './AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuthContext();
    const navigation = useNavigation<any>();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        try {
            setLoading(true);
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.error || error.message);
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
                <Text style={styles.title}>PHA</Text>
                <Text style={styles.subtitle}>Ruang aman untuk berbagi dan refleksi</Text>
            </View>

            <View style={styles.form}>
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

                <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>Lupa password?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.buttonWrapper}>
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
                                <Text style={styles.buttonText}>Masuk</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Belum punya akun? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Daftar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Background decoration (optional/simple approach) */}
            <View style={styles.bgDecoration} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', padding: 25 },
    header: { alignItems: 'center', marginBottom: 40 },
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
    title: { fontSize: 32, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#7F8C8D', textAlign: 'center' },
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
        // Shadow for input
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
        elevation: 1,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
    eyeIcon: { padding: 5 },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: 25 },
    forgotPasswordText: { color: '#7F8C8D', fontSize: 13 },
    buttonWrapper: {
        width: '100%',
        borderRadius: 15,
        overflow: 'hidden', // Ensure gradient respects border radius
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
        backgroundColor: '#E8F6F3', // Light green tint at bottom
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
        opacity: 0.5,
        zIndex: -1,
        transform: [{ scaleX: 1.5 }], // Make it span wider
    }
});
