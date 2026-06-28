import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { getSessions, ChatSession } from './chatService';

// Fun Blue palette (shared with ChatScreen)
const PRIMARY = '#1A59A1';
const PRIMARY_DEEP = '#14457D';

const FB = {
    sheetBg: '#ffffff',
    headerEyebrow: '#bcd2ee',
    searchText: '#cdddf3',
    tileBg: '#eaf1fa',
    cardBorder: '#e3ebf6',
    textDark: '#243a5c',
    textSub: '#7689a6',
    textMuted: '#9aa9c0',
};

function ChevronLeftIcon() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SearchIcon() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={11} cy={11} r={7} stroke={FB.searchText} strokeWidth={1.9} />
            <Path d="M21 21l-4-4" stroke={FB.searchText} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ChatIcon({ color = PRIMARY, size = 22 }: { color?: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 6.5C5 5.7 5.7 5 6.5 5h11C18.3 5 19 5.7 19 6.5v8C19 15.3 18.3 16 17.5 16H9l-4 3.5z"
                stroke={color}
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function PlusIcon() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Decorative wave lines in the header (matches design accent)
function HeaderWaves() {
    return (
        <Svg viewBox="0 0 160 120" style={styles.waves} fill="none">
            <Path d="M14 64 q22 -22 44 0 t44 0 t44 0" stroke="#7ba0d6" strokeWidth={2} strokeLinecap="round" />
            <Path d="M14 78 q22 -18 44 0 t44 0 t44 0" stroke="#5d86c6" strokeWidth={2} strokeLinecap="round" />
            <Path d="M14 92 q22 -20 44 0 t44 0 t44 0" stroke="#4f7bc0" strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

interface Props {
    navigation: any;
}

interface Group {
    label: string;
    sessions: ChatSession[];
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function groupSessions(sessions: ChatSession[]): Group[] {
    const today0 = startOfDay(new Date()).getTime();
    const dayMs = 86400000;
    const order = ['Hari ini', 'Kemarin', 'Minggu ini', 'Lebih lama'];
    const buckets: Record<string, ChatSession[]> = {
        'Hari ini': [], 'Kemarin': [], 'Minggu ini': [], 'Lebih lama': [],
    };

    const sorted = [...sessions].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    for (const s of sorted) {
        const d0 = startOfDay(new Date(s.startedAt)).getTime();
        const diffDays = Math.round((today0 - d0) / dayMs);
        if (diffDays <= 0) buckets['Hari ini'].push(s);
        else if (diffDays === 1) buckets['Kemarin'].push(s);
        else if (diffDays <= 7) buckets['Minggu ini'].push(s);
        else buckets['Lebih lama'].push(s);
    }

    return order
        .filter(label => buckets[label].length > 0)
        .map(label => ({ label, sessions: buckets[label] }));
}

function formatTime(startedAt: string, label: string): string {
    const d = new Date(startedAt);
    const hm = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (label === 'Hari ini' || label === 'Kemarin') return hm;
    if (label === 'Minggu ini') {
        const wd = d.toLocaleDateString('id-ID', { weekday: 'short' });
        return `${wd}, ${hm}`;
    }
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function HistoryScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => { loadSessions(); }, []);

    const loadSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? sessions.filter(s => (s.preview || '').toLowerCase().includes(q))
            : sessions;
        return groupSessions(filtered);
    }, [sessions, query]);

    const header = (
        <LinearGradient
            colors={[PRIMARY, PRIMARY_DEEP]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
            <HeaderWaves />
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeftIcon />
                </TouchableOpacity>
                <View style={{ flexShrink: 1 }}>
                    <Text style={styles.eyebrow}>Cerita ke SiBiru</Text>
                    <Text style={styles.title}>Riwayat Percakapan</Text>
                </View>
            </View>

            <View style={styles.searchField}>
                <SearchIcon />
                <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Cari percakapan…"
                    placeholderTextColor={FB.searchText}
                    returnKeyType="search"
                />
            </View>
        </LinearGradient>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={['left', 'right']}>
                <StatusBar barStyle="light-content" />
                {header}
                <View style={styles.sheet}>
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={PRIMARY} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
            <StatusBar barStyle="light-content" />
            {header}

            <ScrollView
                style={styles.sheet}
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
            >
                {groups.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <ChatIcon size={30} />
                        </View>
                        <Text style={styles.emptyText}>
                            {query.trim()
                                ? 'Tidak ada percakapan yang cocok'
                                : 'Belum ada riwayat cerita'}
                        </Text>
                    </View>
                ) : (
                    groups.map(group => (
                        <View key={group.label} style={styles.group}>
                            <View style={styles.groupHead}>
                                <Text style={styles.groupLabel}>{group.label}</Text>
                                <Text style={styles.groupCount}>
                                    {group.sessions.length} percakapan
                                </Text>
                            </View>

                            {group.sessions.map(s => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={styles.card}
                                    activeOpacity={0.85}
                                    onPress={() => navigation.navigate('ChatHistory', { sessionId: s.id, title: s.preview, startedAt: s.startedAt })}
                                >
                                    <View style={styles.cardIcon}>
                                        <ChatIcon size={22} />
                                    </View>
                                    <View style={styles.cardBody}>
                                        <View style={styles.cardTopRow}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                                {s.preview || 'Percakapan'}
                                            </Text>
                                            <Text style={styles.cardTime}>
                                                {formatTime(s.startedAt, group.label)}
                                            </Text>
                                        </View>
                                        <View style={styles.cardMeta}>
                                            <ChatIcon color={FB.textMuted} size={13} />
                                            <Text style={styles.cardMetaText}>{s.messageCount}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))
                )}

                <View style={{ height: 78 }} />
            </ScrollView>

            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 12 }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Chat')}
            >
                <PlusIcon />
                <Text style={styles.fabText}>Cerita Baru</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: PRIMARY },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: {
        paddingHorizontal: 24,
        paddingBottom: 30,
        overflow: 'hidden',
    },
    waves: {
        position: 'absolute',
        right: -8,
        top: 14,
        width: 180,
        height: 130,
        opacity: 0.32,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    eyebrow: { fontSize: 12.5, color: FB.headerEyebrow, letterSpacing: 0.2 },
    title: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 25,
        lineHeight: 28,
        color: '#ffffff',
        letterSpacing: -0.2,
        marginTop: 3,
    },
    searchField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 12 : 6,
        marginTop: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 13.5,
        color: '#ffffff',
        padding: 0,
    },

    // White sheet
    sheet: {
        flex: 1,
        backgroundColor: FB.sheetBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -14,
    },
    sheetContent: { padding: 22, paddingTop: 18 },

    // Group
    group: { marginBottom: 18 },
    groupHead: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        marginBottom: 11,
    },
    groupLabel: {
        fontSize: 12,
        letterSpacing: 0.6,
        color: FB.textSub,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    groupCount: { fontSize: 11.5, color: FB.textMuted },

    // Card
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 13,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: FB.cardBorder,
        borderRadius: 20,
        padding: 14,
        marginBottom: 11,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 2,
    },
    cardIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: FB.tileBg,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    cardBody: { flex: 1, minWidth: 0 },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    cardTitle: {
        flex: 1,
        fontSize: 14.5,
        fontWeight: '600',
        color: FB.textDark,
        lineHeight: 18,
    },
    cardTime: { fontSize: 11.5, color: FB.textMuted, flexShrink: 0 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
    cardMetaText: { fontSize: 11.5, color: FB.textMuted },

    // Empty
    emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 16 },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: FB.tileBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: { fontSize: 14, color: FB.textSub },

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        paddingVertical: 14,
        paddingLeft: 17,
        paddingRight: 20,
        borderRadius: 30,
        backgroundColor: PRIMARY,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
    },
    fabText: { fontSize: 14, fontWeight: '600', color: '#ffffff', letterSpacing: 0.1 },
});
