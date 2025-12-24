import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getProfile, updateProfile, UserProfile } from './profileService';
import { useAuthContext } from '../auth/AuthContext';

export default function ProfileScreen() {
    const { logout } = useAuthContext();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [language, setLanguage] = useState('id');
    const [bio, setBio] = useState('');

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
            setLanguage(data.language);
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
                language,
                bio
            });
            setProfile(updatedProfile);
            Alert.alert('Success', 'Profile updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>My Profile</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Gender</Text>
                    <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="L/P" />
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Language Pref</Text>
                <TextInput style={styles.input} value={language} onChangeText={setLanguage} />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} multiline numberOfLines={3} />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f9f9f9', flexGrow: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    formGroup: { marginBottom: 15 },
    label: { marginBottom: 5, color: '#666', fontWeight: '600' },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    saveButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    logoutButton: { marginTop: 20, padding: 15, alignItems: 'center' },
    logoutText: { color: '#dc3545', fontSize: 16 },
});
