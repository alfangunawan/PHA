import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../auth/AuthContext';
import { getProfile } from '../profile/profileService'; // Assuming we have this or need to create it

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthContext();
    const [profile, setProfile] = useState<any>(null);

    // Mock data for UI
    const moodOptions = [
        { label: 'Buruk', icon: '😫', color: '#FFEBEE' },
        { label: 'Kurang', icon: '😕', color: '#FFF3E0' },
        { label: 'Biasa', icon: '😐', color: '#FFFDE7' },
        { label: 'Baik', icon: '🙂', color: '#E8F5E9' },
        { label: 'Hebat', icon: '🤩', color: '#E3F2FD' },
    ];

    const quickTools = [
        { title: 'Latihan Pernapasan', duration: '3 menit', icon: 'leaf', color: '#E3F2FD', iconColor: '#42A5F5' },
        { title: 'Refleksi Pikiran', duration: '5 menit', icon: 'infinite', color: '#F3E5F5', iconColor: '#AB47BC' },
        { title: 'Jurnal Singkat', duration: 'Harian', icon: 'journal', color: '#FFF3E0', iconColor: '#FFA726' },
    ];

    // Fetch profile on mount
    useEffect(() => {
        // Placeholder for profile fetch logic
        // In a real app, we'd fetch this.  For now, use mock/auth data.
    }, []);


    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greetingTitle}>
                            Halo, {profile?.displayName || 'Teman'} 👋
                        </Text>
                        <Text style={styles.greetingSubtitle}>Bagaimana perasaanmu hari ini?</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={20} color="#48B096" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Mood Check-in */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Check-in singkat</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Baru</Text>
                        </View>
                    </View>
                    <View style={styles.moodContainer}>
                        {moodOptions.map((mood, index) => (
                            <TouchableOpacity key={index} style={styles.moodItem}>
                                <View style={[styles.moodIconContainer, { backgroundColor: mood.color }]}>
                                    <Text style={styles.moodEmoji}>{mood.icon}</Text>
                                </View>
                                <Text style={styles.moodLabel}>{mood.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Tools */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tools Cepat</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolsScroll}>
                        {quickTools.map((tool, index) => (
                            <TouchableOpacity key={index} style={styles.toolCard}>
                                <View style={[styles.toolIconContainer, { backgroundColor: tool.color }]}>
                                    <Ionicons name={tool.icon as any} size={24} color={tool.iconColor} />
                                </View>
                                <Text style={styles.toolTitle}>{tool.title}</Text>
                                <Text style={styles.toolDuration}>{tool.duration}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Continue Chat Card */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.chatCard} onPress={() => navigation.navigate('Riwayat')}>
                        <View style={styles.chatCardIcon}>
                            <Ionicons name="chatbubbles" size={24} color="#48B096" />
                        </View>
                        <View style={styles.chatCardContent}>
                            <View style={styles.chatCardHeader}>
                                <Text style={styles.chatCardTitle}>Lanjutkan Obrolan</Text>
                                <Text style={styles.chatCardTime}>2j yang lalu</Text>
                            </View>
                            <Text style={styles.chatCardPreview} numberOfLines={2}>
                                "Kita sedang membicarakan tentang teknik grounding untuk..."
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Spacing for floating button */}
                <View style={{ height: 100 }} />

            </ScrollView>

            {/* Floating Action Button for New Chat */}
            <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                style={styles.fabContainer}
                pointerEvents="box-none"
            >
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Chat')}>
                    <LinearGradient
                        colors={['#5CC2A8', '#48B096']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.fabGradient}
                    >
                        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" style={{ marginRight: 10 }} />
                        <Text style={styles.fabText}>Mulai Cerita</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { padding: 20, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    greetingTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
    greetingSubtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 5 },
    avatarPlaceholder: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1',
        justifyContent: 'center', alignItems: 'center'
    },
    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
    badge: { backgroundColor: '#E0F2F1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    badgeText: { color: '#48B096', fontSize: 10, fontWeight: 'bold' },
    seeAllText: { color: '#48B096', fontSize: 14, fontWeight: '600' },

    moodContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    moodItem: { alignItems: 'center' },
    moodIconContainer: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    moodEmoji: { fontSize: 20 },
    moodLabel: { fontSize: 10, color: '#7F8C8D' },

    toolsScroll: {},
    toolCard: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginRight: 15, width: 140, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    toolIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    toolTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    toolDuration: { fontSize: 12, color: '#999' },

    chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    chatCardIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    chatCardContent: { flex: 1 },
    chatCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    chatCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    chatCardTime: { fontSize: 10, color: '#999' },
    chatCardPreview: { fontSize: 13, color: '#666', lineHeight: 18 },

    fabContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
    fab: { width: '90%', height: 55, borderRadius: 27.5, elevation: 5, shadowColor: '#48B096', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    fabGradient: { flex: 1, borderRadius: 27.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    fabText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
