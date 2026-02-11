import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Switch, Image } from 'react-native';
import { getProfile, updateProfile, UserProfile } from './profileService';
import { useAuthContext } from '../auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
    const { logout } = useAuthContext();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [language, setLanguage] = useState('Bahasa Indonesia (ID)');
    const [bio, setBio] = useState('');

    // Preferences (Mock state for UI demo)
    const [conciseAnswers, setConciseAnswers] = useState(true);
    const [reflectiveAnswers, setReflectiveAnswers] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
            setDisplayName(data.displayName);
            setAge(data.age?.toString() || '');
            setGender(data.gender || '');
            setLanguage(data.language === 'id' ? 'Bahasa Indonesia (ID)' : data.language);
            setBio(data.bio || '');
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updatedProfile = await updateProfile({
                displayName,
                age: age ? parseInt(age) : undefined,
                gender,
                language: language.includes('Indonesia') ? 'id' : language, // Simple mapping
                bio
            });
            setProfile(updatedProfile);
            Alert.alert('Success', 'Perubahan berhasil disimpan');
        } catch (error) {
            Alert.alert('Error', 'Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#48B096" /></View>;
    }

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        {/* Placeholder Avatar */}
                        <Image
                            source={{ uri: 'https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light' }}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineIndicator} />
                    </View>
                    <View style={styles.headerText}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.greetingTitle}>Halo, {displayName.split(' ')[0] || 'Teman'} 👋</Text>
                        </View>
                        <Text style={styles.greetingSubtitle}>Atur preferensi ruangmu</Text>
                    </View>
                    <TouchableOpacity style={styles.settingsIcon}>
                        <Ionicons name="settings-sharp" size={24} color="#7F8C8D" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Basic Info Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={20} color="#48B096" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Informasi Dasar</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nama Tampilan</Text>
                    <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Nama Tampilan" />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 15 }]}>
                        <Text style={styles.label}>Usia</Text>
                        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="24" />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Gender</Text>
                        {/* Ideally a picker/dropdown, simplified here */}
                        <View style={styles.dropdownInput}>
                            <TextInput
                                style={{ flex: 1, color: '#333' }}
                                value={gender}
                                onChangeText={setGender}
                                placeholder="L/P"
                            />
                            <Ionicons name="chevron-down" size={16} color="#999" />
                        </View>
                    </View>
                </View>
            </View>

            {/* Preferences Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="options-outline" size={20} color="#48B096" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Preferensi</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Bahasa</Text>
                    <View style={styles.dropdownInput}>
                        <TextInput
                            style={{ flex: 1, color: '#333' }}
                            value={language}
                            onChangeText={setLanguage}
                            editable={false} // Read-only look for now
                        />
                        <Ionicons name="chevron-down" size={16} color="#999" />
                    </View>
                </View>

                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>Jawaban lebih ringkas</Text>
                        <Text style={styles.toggleSubLabel}>Respon chat yang to-the-point</Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#E0E0E0", true: "#48B096" }}
                        thumbColor={"#fff"}
                        ios_backgroundColor="#E0E0E0"
                        onValueChange={setConciseAnswers}
                        value={conciseAnswers}
                    />
                </View>

                <View style={styles.toggleRowBorder}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>Jawaban lebih reflektif</Text>
                        <Text style={styles.toggleSubLabel}>Mendorong pemikiran mendalam</Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#E0E0E0", true: "#48B096" }}
                        thumbColor={"#fff"}
                        ios_backgroundColor="#E0E0E0"
                        onValueChange={setReflectiveAnswers}
                        value={reflectiveAnswers}
                    />
                </View>
            </View>

            {/* About Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="heart-outline" size={20} color="#48B096" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Tentang Kamu</Text>
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={4}
                        placeholder="Ceritakan sedikit tentang dirimu..."
                        placeholderTextColor="#aaa"
                    />
                </View>
                <Text style={styles.infoText}>Informasi ini membantu kami mempersonalisasi saran.</Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                <LinearGradient
                    colors={['#5CC2A8', '#48B096']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Simpan Perubahan</Text>}
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Keluar</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 25, marginTop: 10 },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { position: 'relative', marginRight: 15 },
    avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#fff' },
    onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#48B096', borderWidth: 2, borderColor: '#fff' },
    headerText: { flex: 1 },
    greetingTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
    greetingSubtitle: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
    settingsIcon: { padding: 5 },

    section: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    formGroup: { marginBottom: 15 },
    label: { marginBottom: 8, color: '#7F8C8D', fontSize: 12, fontWeight: '600' },
    input: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, fontSize: 14, color: '#333' },
    dropdownInput: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    textArea: { height: 100, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },

    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    toggleRowBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 5 },
    toggleLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
    toggleSubLabel: { fontSize: 11, color: '#999', marginTop: 2 },

    infoText: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 5 },

    saveButton: { marginTop: 10, borderRadius: 15, overflow: 'hidden', shadowColor: '#48B096', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    gradientButton: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    logoutButton: { marginTop: 20, padding: 10, alignItems: 'center' },
    logoutText: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' },
});
