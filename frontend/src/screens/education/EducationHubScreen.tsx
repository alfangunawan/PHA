import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { educationAPI } from '../../api';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// === Fun Blue palette (selaras Beranda & Meditasi) ===
const E = {
    primary:     '#1A59A1',
    primaryDeep: '#14457D',
    primaryLight:'#e9f1fa',
    screenBg:    '#fcfcfe',
    card:        '#ffffff',
    cardBorder:  '#ecedf6',
    textDark:    '#353b4a',
    textSub:     '#6a7185',
    textMuted:   '#949bae',
    chipBg:      '#f1f2f8',
    chipBorder:  '#e7e9f2',
    headerSub:   '#cfddf2',
    reelsBanner: '#1250a0',
    categoryColors: {
        anxiety:    { bg: '#eaf2ec', text: '#4a8f5b' },
        mindfulness:{ bg: '#f0ebfa', text: '#7a5cb5' },
        depresi:    { bg: '#fdf0e6', text: '#c0782a' },
        edukasi:    { bg: '#e9f1fa', text: '#1A59A1' },
        default:    { bg: '#f1f2f8', text: '#6a7185' },
    },
};

interface Content {
    id: string;
    title: string;
    description?: string;
    source: string;
    url: string;
    category: string;
    thumbnailUrl?: string;
    format: 'landscape' | 'vertical';
    isActive: boolean;
}

function getYouTubeThumbnail(url: string, providedThumb?: string) {
    if (providedThumb) return providedThumb;
    const patterns = [/[?&]v=([^&#+]+)/, /youtu\.be\/([^?&#]+)/, /\/embed\/([^?&#]+)/, /\/shorts\/([^?&#]+)/];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
    }
    return null;
}

function getCategoryTheme(cat?: string) {
    const key = (cat || '').toLowerCase() as keyof typeof E.categoryColors;
    return E.categoryColors[key] || E.categoryColors.default;
}

// Icon edukasi (buku)
function EducationGlyph({ size = 24, color }: { size?: number; color: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 6.5V19" {...sp} />
            <Path d="M12 6.5C10.5 5.2 8.2 4.5 5 4.5C4.4 4.5 4 5 4 5.6V16.5C4 17 4.4 17.3 5 17.3C8.2 17.3 10.5 18 12 19" {...sp} />
            <Path d="M12 6.5C13.5 5.2 15.8 4.5 19 4.5C19.6 4.5 20 5 20 5.6V16.5C20 17 19.6 17.3 19 17.3C15.8 17.3 13.5 18 12 19" {...sp} />
        </Svg>
    );
}

// Icon play (untuk reels)
function PlayIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M6 4l14 8-14 8V4z" fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round" />
        </Svg>
    );
}

// Icon chevron right
function ChevronRight({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
    );
}

// Decoration circles for banner
function BannerDecoration() {
    return (
        <Svg style={{ position: 'absolute', right: -10, top: -10, width: 120, height: 90, opacity: 0.15 }} viewBox="0 0 120 90" fill="none">
            <Circle cx="90" cy="20" r="35" stroke="#cfddf2" strokeWidth="1.5" />
            <Circle cx="90" cy="20" r="55" stroke="#cfddf2" strokeWidth="1.5" />
        </Svg>
    );
}

export default function EducationHubScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [landscapeContents, setLandscapeContents] = useState<Content[]>([]);
    const [verticalContents, setVerticalContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');

    const fetchAllData = useCallback(async () => {
        try {
            const [landRes, vertRes] = await Promise.all([
                educationAPI.getContents({ limit: 50, format: 'landscape' }),
                educationAPI.getContents({ limit: 50, format: 'vertical' }),
            ]);
            setLandscapeContents(landRes.contents || []);
            setVerticalContents(vertRes.contents || []);
        } catch (e) {
            console.error('Failed to fetch education hub data', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const onRefresh = () => { setRefreshing(true); fetchAllData(); };

    // Ambil kategori unik dari landscape contents
    const categories = ['all', ...Array.from(new Set(landscapeContents.map(c => c.category?.toLowerCase()).filter(Boolean)))];

    const filteredContents = activeCategory === 'all'
        ? landscapeContents
        : landscapeContents.filter(c => c.category?.toLowerCase() === activeCategory);

    const CARD_WIDTH = (WINDOW_WIDTH - 48 - 12) / 2;

    const renderCard = ({ item, index }: { item: Content; index: number }) => {
        const thumbUrl = getYouTubeThumbnail(item.url, item.thumbnailUrl);
        const catTheme = getCategoryTheme(item.category);

        return (
            <TouchableOpacity
                style={[styles.card, { width: CARD_WIDTH }]}
                onPress={() => navigation.navigate('EducationVideoDetail', { content: item })}
                activeOpacity={0.88}
            >
                {/* Thumbnail */}
                <View style={styles.cardThumbContainer}>
                    {thumbUrl ? (
                        <Image source={{ uri: thumbUrl }} style={styles.cardThumb} resizeMode="cover" />
                    ) : (
                        <View style={[styles.cardThumb, { backgroundColor: E.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                            <EducationGlyph size={32} color={E.primary} />
                        </View>
                    )}
                    <View style={styles.playOverlay}>
                        <PlayIcon size={16} color="#fff" />
                    </View>
                </View>
                {/* Body */}
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={[styles.cardBadge, { backgroundColor: catTheme.bg }]}>
                        <Text style={[styles.cardBadgeText, { color: catTheme.text }]}>{item.category || 'Video'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View>
            {/* Reels Banner — hanya tampil jika ada konten vertikal */}
            {verticalContents.length > 0 && (
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('EducationVerticalReels', { contents: verticalContents, initialIndex: 0 })}
                    style={styles.reelsBanner}
                >
                    <LinearGradient
                        colors={[E.primary, E.reelsBanner]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.reelsBannerGradient}
                    >
                        <BannerDecoration />
                        <View style={styles.reelsBannerIconWrap}>
                            <PlayIcon size={22} color={E.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.reelsBannerTitle}>Shorts Edukasi</Text>
                            <Text style={styles.reelsBannerSub}>
                                {verticalContents.length} video singkat inspiratif
                            </Text>
                        </View>
                        <ChevronRight size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Filter chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContent}
                style={styles.filtersScroll}
            >
                {categories.map(cat => {
                    const isActive = cat === activeCategory;
                    return (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setActiveCategory(cat)}
                            activeOpacity={0.85}
                            style={[styles.chip, isActive ? styles.chipActive : styles.chipIdle]}
                        >
                            <Text style={[styles.chipText, { color: isActive ? '#fff' : E.textSub }]}>
                                {cat === 'all' ? 'Semua' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {filteredContents.length === 0 && (
                <Text style={styles.emptyText}>Belum ada konten untuk kategori ini.</Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={E.primary} />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {/* Header gradient (full bleed) */}
            <LinearGradient
                colors={[E.primary, E.primaryDeep]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
            >
                <View style={styles.headerIconWrap}>
                    <EducationGlyph size={24} color={E.primary} />
                </View>
                <View>
                    <Text style={styles.headerTitle}>Pusat Edukasi</Text>
                    <Text style={styles.headerSub}>Tingkatkan pemahaman kesehatan mentalmu</Text>
                </View>
            </LinearGradient>

            {/* Content sheet */}
            <FlatList
                data={filteredContents}
                renderItem={renderCard}
                keyExtractor={item => item.id}
                numColumns={2}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={styles.flatListContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={E.primary} />}
                style={styles.contentSheet}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: E.primary },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 44,
        gap: 14,
        overflow: 'hidden',
    },
    headerIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: E.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 22,
        color: '#ffffff',
        letterSpacing: -0.2,
    },
    headerSub: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12.5,
        color: E.headerSub,
        marginTop: 3,
    },

    contentSheet: {
        backgroundColor: E.screenBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -22,
        flex: 1,
    },
    flatListContent: {
        paddingTop: 20,
        paddingBottom: 100,
    },
    columnWrapper: {
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    reelsBanner: {
        marginHorizontal: 24,
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: E.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 6,
    },
    reelsBannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 17,
        gap: 14,
        overflow: 'hidden',
    },
    reelsBannerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reelsBannerTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 16,
        color: '#ffffff',
    },
    reelsBannerSub: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: E.headerSub,
        marginTop: 3,
    },

    filtersScroll: { flexGrow: 0, marginBottom: 16 },
    filtersContent: {
        paddingHorizontal: 24,
        gap: 9,
        alignItems: 'center',
    },
    chip: {
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: E.primary,
        shadowColor: E.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 4,
    },
    chipIdle: {
        backgroundColor: E.card,
        borderWidth: 1,
        borderColor: E.chipBorder,
    },
    chipText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
    },

    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: E.textMuted,
        textAlign: 'center',
        marginTop: 40,
        paddingHorizontal: 24,
    },

    card: {
        backgroundColor: E.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: E.cardBorder,
        overflow: 'hidden',
        shadowColor: '#383f5c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    cardThumbContainer: {
        height: 110,
        position: 'relative',
    },
    cardThumb: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(26,89,161,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 2,
    },
    cardBody: {
        padding: 12,
        gap: 8,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12.5,
        color: E.textDark,
        lineHeight: 18,
    },
    cardBadge: {
        alignSelf: 'flex-start',
        borderRadius: 10,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    cardBadgeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 10.5,
        textTransform: 'capitalize',
    },
});
