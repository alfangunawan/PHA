import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import YoutubeIframe from 'react-native-youtube-iframe';
import { educationAPI } from '../../api';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// === Fun Blue palette ===
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
    headerSub:   '#cfddf2',
    badge: {
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

function getYouTubeVideoId(url: string): string | null {
    const patterns = [/[?&]v=([^&#+]+)/, /youtu\.be\/([^?&#]+)/, /\/embed\/([^?&#]+)/, /\/shorts\/([^?&#]+)/];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

function getCategoryTheme(cat?: string) {
    const key = (cat || '').toLowerCase() as keyof typeof E.badge;
    return E.badge[key] || E.badge.default;
}

function BackIcon({ size = 22, color = '#353b4a' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
    );
}

function ArrowLeftIcon({ size = 20, color = '#353b4a' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
    );
}

function ArrowRightIcon({ size = 20, color = '#353b4a' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
    );
}

function PlayIconSmall({ size = 16, color = '#ffffff' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M8 5v14l11-7z" fill={color} />
        </Svg>
    );
}

export default function EducationVideoDetailScreen({ route, navigation }: any) {
    const { content } = route.params;
    const insets = useSafeAreaInsets();
    const [ready, setReady] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [recommended, setRecommended] = useState<Content[]>([]);
    const [descExpanded, setDescExpanded] = useState(false);

    // Carousel state
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index || 0);
    }).current;

    const scrollToIndex = (index: number) => {
        if (index >= 0 && index < recommended.length) {
            flatListRef.current?.scrollToIndex({ index, animated: true });
        }
    };

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                // Fetch landscape videos for recommendations
                const res = await educationAPI.getContents({ page: 1, limit: 10, format: 'landscape' });
                const recs = (res.contents || []).filter((c: Content) => c.id !== content.id && c.isActive);
                setRecommended(recs.slice(0, 4)); // Show 4 recommendations
            } catch (e) {
                console.log('Failed to fetch recommendations', e);
            }
        };
        fetchRecs();
    }, [content.id]);

    const videoId = getYouTubeVideoId(content.url);
    const videoHeight = WINDOW_WIDTH * (9 / 16);
    const catTheme = getCategoryTheme(content.category);

    const markAsComplete = async () => {
        if (completing || completed) return;
        setCompleting(true);
        try {
            await Promise.all([
                educationAPI.completeContent(content.id),
                educationAPI.saveLog({ contentId: content.id, completed: true })
            ]);
            setCompleted(true);
            setTimeout(() => navigation.goBack(), 800);
        } catch (e) {
            console.error('Failed to complete content', e);
        } finally {
            setCompleting(false);
        }
    };

    return (
        <View style={[styles.screen, { backgroundColor: E.screenBg }]}>
            {/* Back button di atas video */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backBtn, { top: insets.top + 10 }]}
            >
                <BackIcon size={20} color={E.textDark} />
            </TouchableOpacity>

            {/* Video Player */}
            {content.source === 'youtube' && videoId ? (
                <View style={{ height: videoHeight, width: WINDOW_WIDTH, backgroundColor: '#000' }}>
                    {!ready && (
                        <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
                            <ActivityIndicator size="large" color={E.primary} />
                        </View>
                    )}
                    <YoutubeIframe
                        videoId={videoId}
                        height={videoHeight}
                        width={WINDOW_WIDTH}
                        play={ready}
                        onReady={() => setReady(true)}
                        onError={() => setReady(true)}
                        forceAndroidAutoplay={true}
                        webViewProps={{
                            androidLayerType: 'hardware',
                            renderToHardwareTextureAndroid: true,
                            mediaPlaybackRequiresUserAction: false,
                        }}
                        initialPlayerParams={{
                            controls: true,
                            modestbranding: true,
                            rel: false,
                        }}
                    />
                </View>
            ) : (
                <View style={[styles.fallback, { height: videoHeight }]}>
                    <Text style={styles.fallbackText}>Sumber video tidak didukung.</Text>
                    <TouchableOpacity
                        style={styles.openYtBtn}
                        onPress={() => Linking.openURL(content.url).catch(() => {})}
                    >
                        <Text style={styles.openYtBtnText}>Buka di Browser</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Info card (rounded sheet di bawah video) */}
            <ScrollView
                style={styles.infoSheet}
                contentContainerStyle={[styles.infoContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.categoryBadge, { backgroundColor: catTheme.bg }]}>
                    <Text style={[styles.categoryText, { color: catTheme.text }]}>
                        {content.category || 'Video'}
                    </Text>
                </View>
                <Text style={styles.infoTitle}>{content.title}</Text>
                
                <TouchableOpacity 
                    style={styles.expandableBox}
                    onPress={() => setDescExpanded(!descExpanded)}
                    activeOpacity={0.9}
                >
                    {content.description ? (
                        <Text style={styles.infoDesc} numberOfLines={descExpanded ? undefined : 2}>
                            {content.description}
                        </Text>
                    ) : null}

                    {/* Source Link shows only when expanded */}
                    {descExpanded && (
                        <View style={styles.sourceBox}>
                            <Text style={styles.sourceLabel}>Tautan Asli Video:</Text>
                            <TouchableOpacity onPress={() => Linking.openURL(content.url).catch(() => {})}>
                                <Text style={styles.sourceLink} numberOfLines={1} ellipsizeMode="middle">
                                    {content.url}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.expandText}>
                        {descExpanded ? 'Sembunyikan' : 'Baca selengkapnya...'}
                    </Text>
                </TouchableOpacity>

                {/* Recommendations */}
                {recommended.length > 0 && (
                    <View style={styles.recsSection}>
                        <View style={styles.recsHeader}>
                            <Text style={styles.recsTitle}>Rekomendasi Lainnya</Text>
                        </View>

                        <View style={styles.carouselWrapper}>
                            <FlatList 
                                ref={flatListRef}
                                data={recommended}
                                keyExtractor={item => item.id}
                                horizontal 
                                showsHorizontalScrollIndicator={false} 
                                snapToInterval={162} // 150 card width + 12 gap
                                decelerationRate="fast"
                                contentContainerStyle={styles.recsList}
                                onViewableItemsChanged={onViewableItemsChanged}
                                viewabilityConfig={viewConfigRef}
                                renderItem={({ item }) => {
                                    const thumbId = getYouTubeVideoId(item.url);
                                    const thumbUrl = thumbId ? `https://img.youtube.com/vi/${thumbId}/mqdefault.jpg` : null;
                                    return (
                                        <TouchableOpacity 
                                            style={styles.recCard}
                                            activeOpacity={0.7}
                                            onPress={() => navigation.replace('EducationVideoDetail', { content: item })}
                                        >
                                            <View style={styles.recThumbContainer}>
                                                {thumbUrl ? (
                                                    <Image source={{ uri: thumbUrl }} style={styles.recThumbImage} contentFit="cover" />
                                                ) : (
                                                    <View style={[styles.recThumbImage, { backgroundColor: E.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                                                        <PlayIconSmall color={E.primary} />
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.recInfo}>
                                                <Text style={styles.recItemTitle} numberOfLines={2}>{item.title}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                            
                            {/* Floating Side Arrows */}
                            {activeIndex > 0 && (
                                <TouchableOpacity 
                                    style={[styles.arrowBtnAbsolute, styles.arrowBtnLeft]}
                                    onPress={() => scrollToIndex(activeIndex - 1)}
                                    activeOpacity={0.8}
                                >
                                    <ArrowLeftIcon color={E.textDark} />
                                </TouchableOpacity>
                            )}
                            
                            {activeIndex < recommended.length - 1 && (
                                <TouchableOpacity 
                                    style={[styles.arrowBtnAbsolute, styles.arrowBtnRight]}
                                    onPress={() => scrollToIndex(activeIndex + 1)}
                                    activeOpacity={0.8}
                                >
                                    <ArrowRightIcon color={E.textDark} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Dots Indicator */}
                        <View style={styles.dotsContainer}>
                            {recommended.map((_, i) => (
                                <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Footer: Tandai Selesai */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        completed && styles.completeBtnDone,
                    ]}
                    onPress={markAsComplete}
                    disabled={completing || completed}
                    activeOpacity={0.88}
                >
                    {completing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <LinearGradient
                            colors={completed ? ['#4a8f5b', '#3a7a4a'] : [E.primary, E.primaryDeep]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.completeBtnGradient}
                        >
                            <Text style={styles.completeBtnText}>
                                {completed ? '✓ Selesai & Poin Diklaim!' : 'Tandai Selesai & Klaim Poin'}
                            </Text>
                        </LinearGradient>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },

    backBtn: {
        position: 'absolute',
        left: 16,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },

    fallback: {
        width: WINDOW_WIDTH,
        backgroundColor: '#1a1f2e',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    fallbackText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
    openYtBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    openYtBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#fff',
    },

    infoSheet: {
        flex: 1,
        backgroundColor: E.screenBg,
    },
    infoContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        gap: 12,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    categoryText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    infoTitle: {
        fontFamily: 'Lora_600SemiBold',
        fontSize: 20,
        color: E.textDark,
        lineHeight: 28,
        letterSpacing: -0.2,
    },
    infoDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14.5,
        color: E.textSub,
        lineHeight: 22,
    },

    expandableBox: {
        marginTop: 4,
        padding: 14,
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ecedf6',
    },
    expandText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: E.primary,
        marginTop: 8,
    },
    sourceBox: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e4ef',
    },
    sourceLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: E.textSub,
        marginBottom: 4,
    },
    sourceLink: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: E.primary,
        textDecorationLine: 'underline',
    },

    recsSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#ecedf6',
    },
    recsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recsTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: E.textDark,
    },
    carouselWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    arrowBtnAbsolute: {
        position: 'absolute',
        top: '50%',
        marginTop: -16, // half height
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    arrowBtnLeft: {
        left: -12,
    },
    arrowBtnRight: {
        right: -12,
    },
    recsList: {
        gap: 12,
        paddingRight: 24, // space at the end of scroll
    },
    recCard: {
        width: 150,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ecedf6',
        overflow: 'hidden',
    },
    recThumbContainer: {
        width: '100%',
        height: 84,
        backgroundColor: E.primaryLight,
    },
    recThumbImage: {
        width: '100%',
        height: '100%',
    },
    recInfo: {
        padding: 10,
        justifyContent: 'center',
    },
    recItemTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: E.textDark,
        lineHeight: 16,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#cfddf2',
    },
    dotActive: {
        width: 16,
        backgroundColor: E.primary,
    },

    footer: {
        paddingHorizontal: 24,
        paddingTop: 12,
        backgroundColor: E.screenBg,
        borderTopWidth: 1,
        borderTopColor: '#ecedf6',
    },
    completeBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    completeBtnDone: {
        opacity: 0.9,
    },
    completeBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    completeBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: '#ffffff',
    },
});
