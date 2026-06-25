import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Linking,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import YoutubeIframe from 'react-native-youtube-iframe';
import { educationAPI } from '../../api';
import { LoadingState, ErrorState } from '../../components/LoadingState';
import { Typography, Spacing, BorderRadius } from '../../theme';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = WINDOW_HEIGHT;

interface Content {
    id: string;
    title: string;
    description?: string;
    source: string;
    url: string;
    category: string;
    thumbnailUrl?: string;
    isActive: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
    youtube: '#FF0000',
    other: '#60A5FA',
};

function getYouTubeVideoId(url: string): string | null {
    const patterns = [
        /[?&]v=([^&#]+)/,
        /youtu\.be\/([^?&#]+)/,
        /\/embed\/([^?&#]+)/,
        /\/shorts\/([^?&#]+)/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

function InAppPlayer({ item, isActive, height }: {
    item: Content;
    isActive: boolean;
    height: number;
}) {
    const [ready, setReady] = useState(false);

    // Force hide loader after 3 seconds if onReady doesn't fire (common WebView bug on Android)
    useEffect(() => {
        const timer = setTimeout(() => {
            setReady(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    if (item.source === 'youtube') {
        const videoId = getYouTubeVideoId(item.url);
        const videoHeight = WINDOW_WIDTH * (9 / 16);

        if (!videoId) {
            return (
                <View style={[styles.playerFallback, { height }]}>
                    <TouchableOpacity style={styles.openBtn} onPress={() => Linking.openURL(item.url).catch(() => {})}>
                        <Text style={styles.openBtnText}>Buka YouTube</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <View style={{ height, width: WINDOW_WIDTH, backgroundColor: '#000', justifyContent: 'center' }}>
                {!ready && (
                    <View style={[styles.playerLoading, { position: 'absolute', height: videoHeight, width: WINDOW_WIDTH }]}>
                        <ActivityIndicator size="large" color="#FF4444" />
                    </View>
                )}
                <View style={{ height: videoHeight, width: WINDOW_WIDTH, opacity: 0.99 }}>
                    <YoutubeIframe
                        videoId={videoId}
                        height={videoHeight}
                        width={WINDOW_WIDTH}
                        play={isActive && ready}
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
                            loop: false,
                            rel: false,
                            modestbranding: true,
                        }}
                    />
                </View>
            </View>
        );
    }



    return (
        <View style={[styles.playerFallback, { height }]}>
            <Text style={styles.fallbackLabel}>{item.title}</Text>
            <TouchableOpacity style={styles.openBtn} onPress={() => Linking.openURL(item.url).catch(() => {})}>
                <Text style={styles.openBtnText}>Buka Link</Text>
            </TouchableOpacity>
        </View>
    );
}

function FeedCard({ item, index, total, isActive }: {
    item: Content;
    index: number;
    total: number;
    isActive: boolean;
}) {
    const sourceColor = SOURCE_COLORS[item.source] || '#FFFFFF';

    return (
        <View style={[styles.card, { height: CARD_HEIGHT }]}>
            <InAppPlayer item={item} isActive={isActive} height={CARD_HEIGHT} />

            {/* Dark overlay specifically at bottom for text readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                style={styles.gradient}
                pointerEvents="none"
            >
                <View style={styles.meta}>
                    {item.category ? (
                        <View style={styles.categoryChip}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                    ) : null}
                    <Text style={styles.videoTitle} numberOfLines={3}>{item.title}</Text>
                    {item.description ? (
                        <Text style={styles.videoDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                </View>
            </LinearGradient>

            {/* Top row: source badge + counter */}
            <View style={styles.topRow} pointerEvents="none">
                <View style={[styles.sourceBadge, { backgroundColor: sourceColor + '25', borderColor: sourceColor + '60' }]}>
                    <Text style={[styles.sourceBadgeText, { color: sourceColor }]}>
                        {item.source.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.counter}>{index + 1}/{total}</Text>
            </View>
        </View>
    );
}

export default function EducationFeedScreen() {
    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const fetchContents = useCallback(async (pageNum: number, reset = false) => {
        try {
            const res = await educationAPI.getContents({ page: pageNum, limit: 20 });
            const newItems = (res.contents || []).filter((c: Content) => c.isActive !== false);
            setContents(prev => reset ? newItems : [...prev, ...newItems]);
            setTotalPages(res.totalPages || 1);
        } catch {
            if (reset) setError('Gagal memuat konten edukasi.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchContents(1, true); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchContents(1, true);
    };

    const loadMore = () => {
        if (loadingMore || page >= totalPages) return;
        const next = page + 1;
        setPage(next);
        setLoadingMore(true);
        fetchContents(next);
    };

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 });
    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
    }).current;

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

            {contents.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Tidak ada konten edukasi.</Text>
                </View>
            ) : (
                <FlatList
                    data={contents}
                    keyExtractor={item => item.id}
                    pagingEnabled
                    snapToInterval={CARD_HEIGHT}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    showsVerticalScrollIndicator={false}
                    getItemLayout={(_, index) => ({ length: CARD_HEIGHT, offset: CARD_HEIGHT * index, index })}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig.current}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                    }
                    ListFooterComponent={loadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator color="#fff" />
                        </View>
                    ) : null}
                    renderItem={({ item, index }) => (
                        <FeedCard
                            item={item}
                            index={index}
                            total={contents.length}
                            isActive={index === activeIndex}
                        />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },

    card: { width: WINDOW_WIDTH, backgroundColor: '#000', overflow: 'hidden' },

    topRow: {
        position: 'absolute',
        top: 56,
        left: Spacing.md,
        right: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 5,
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        gap: 4,
    },
    sourceBadgeText: { fontSize: Typography.sizes.xs, fontFamily: Typography.bodySemiBold },
    counter: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.sizes.xs, fontFamily: Typography.body },

    gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 320, justifyContent: 'flex-end', zIndex: 3 },
    meta: { padding: Spacing.lg, paddingBottom: 32, gap: Spacing.xs },
    categoryChip: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
        marginBottom: 4,
    },
    categoryText: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.sizes.xs, fontFamily: Typography.bodyMedium },
    videoTitle: { color: '#FFFFFF', fontSize: Typography.sizes.lg, fontFamily: Typography.heading, lineHeight: 26 },
    videoDesc: { color: 'rgba(255,255,255,0.65)', fontSize: Typography.sizes.sm, fontFamily: Typography.body, lineHeight: 20 },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: '#000',
    },
    emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sizes.lg, fontFamily: Typography.heading },

    loadingMore: { height: CARD_HEIGHT, alignItems: 'center', justifyContent: 'center' },

    playerFallback: {
        width: WINDOW_WIDTH,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.lg,
    },
    fallbackLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: Typography.sizes.md,
        fontFamily: Typography.body,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
    openBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    openBtnText: {
        color: '#FFFFFF',
        fontSize: Typography.sizes.base,
        fontFamily: Typography.bodyMedium,
    },
    playerLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        backgroundColor: '#000',
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 2,
    },
    playIcon: {
        fontSize: 64,
        color: 'rgba(255,255,255,0.8)',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
