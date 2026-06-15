import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { educationAPI, audioAPI } from '../../api';
import Card from '../../components/Card';
import { LoadingState, EmptyState } from '../../components/LoadingState';
import { Typography, Spacing, BorderRadius } from '../../theme';

type Tab = 'education' | 'audio';

export default function AdminDashboardScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [tab, setTab] = useState<Tab>('education');
    const [eduContents, setEduContents] = useState<any[]>([]);
    const [audios, setAudios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eduRes, audioRes] = await Promise.all([educationAPI.getContents({ limit: 50 }), audioAPI.getAudios()]);
            setEduContents(eduRes.contents || []);
            setAudios(audioRes.audios || []);
        } catch (e) {
            console.warn('Fetch admin data failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const deleteEdu = (id: string) => {
        Alert.alert('Hapus Konten', 'Yakin ingin menghapus?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => {
                await educationAPI.deleteContent(id);
                fetchData();
            }},
        ]);
    };

    const deleteAudio = (id: string) => {
        Alert.alert('Hapus Audio', 'Yakin ingin menghapus?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => {
                await audioAPI.deleteAudio(id);
                fetchData();
            }},
        ]);
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    Admin Dashboard
                </Text>
                <View style={styles.tabs}>
                    {(['education', 'audio'] as Tab[]).map(t => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            style={[styles.tabBtn, { backgroundColor: tab === t ? colors.softBlue : colors.lightGray }]}
                        >
                            <Text style={[styles.tabText, { color: tab === t ? colors.white : colors.darkGray, fontFamily: Typography.bodyMedium }]}>
                                {t === 'education' ? 'Konten' : 'Audio'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate(tab === 'education' ? 'ContentForm' : 'AudioForm')}
                    style={[styles.addBtn, { backgroundColor: colors.sageGreen }]}
                >
                    <Text style={[styles.addBtnText, { color: colors.white, fontFamily: Typography.headingMedium }]}>+ Tambah</Text>
                </TouchableOpacity>
            </View>

            {loading
                ? <LoadingState />
                : tab === 'education'
                ? (
                    eduContents.length === 0
                        ? <EmptyState message="Belum ada konten edukasi." />
                        : (
                            <FlatList
                                data={eduContents}
                                keyExtractor={item => item.id}
                                contentContainerStyle={styles.list}
                                renderItem={({ item }) => (
                                    <Card style={[styles.item, { opacity: item.isActive ? 1 : 0.5 }]}>
                                        <Text style={[styles.itemTitle, { color: colors.charcoal, fontFamily: Typography.heading }]} numberOfLines={2}>
                                            {item.title}
                                        </Text>
                                        <Text style={[styles.itemMeta, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                                            {item.source} · {item.category} {!item.isActive ? '(nonaktif)' : ''}
                                        </Text>
                                        <View style={styles.actions}>
                                            <TouchableOpacity onPress={() => navigation.navigate('ContentForm', { content: item })} style={[styles.actionBtn, { backgroundColor: colors.softBlue + '22' }]}>
                                                <Text style={[styles.actionText, { color: colors.softBlue, fontFamily: Typography.bodyMedium }]}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => deleteEdu(item.id)} style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]}>
                                                <Text style={[styles.actionText, { color: colors.error, fontFamily: Typography.bodyMedium }]}>Hapus</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Card>
                                )}
                            />
                        )
                ) : (
                    audios.length === 0
                        ? <EmptyState message="Belum ada audio." />
                        : (
                            <FlatList
                                data={audios}
                                keyExtractor={item => item.id}
                                contentContainerStyle={styles.list}
                                renderItem={({ item }) => (
                                    <Card style={styles.item}>
                                        <Text style={[styles.itemTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                                            {item.title}
                                        </Text>
                                        <Text style={[styles.itemMeta, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                                            {item.category} {item.duration ? `· ${item.duration}s` : ''}
                                        </Text>
                                        <View style={styles.actions}>
                                            <TouchableOpacity onPress={() => deleteAudio(item.id)} style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]}>
                                                <Text style={[styles.actionText, { color: colors.error, fontFamily: Typography.bodyMedium }]}>Hapus</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Card>
                                )}
                            />
                        )
                )
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
    title: { fontSize: Typography.sizes['2xl'], marginBottom: Spacing.md },
    tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
    tabBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
    tabText: { fontSize: Typography.sizes.sm },
    addBtn: { paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.xs },
    addBtnText: { fontSize: Typography.sizes.base },
    list: { padding: Spacing.md, gap: Spacing.sm },
    item: { marginBottom: 0 },
    itemTitle: { fontSize: Typography.sizes.base, marginBottom: 4 },
    itemMeta: { fontSize: Typography.sizes.xs, marginBottom: Spacing.sm },
    actions: { flexDirection: 'row', gap: Spacing.sm },
    actionBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
    actionText: { fontSize: Typography.sizes.sm },
});
