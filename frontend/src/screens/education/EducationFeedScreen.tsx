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

const SOURCE_COLORS: Record<string, string> = {
    youtube: '#FF0000',
    tiktok: '#FFFFFF',
    other: '#60A5FA',
};

function InAppPlayer({ item, isActive, height }: {
    item: Content;
    isActive: boolean;
    height: number;
}) {
    const [ready, setReady] = useState(false);

    if (item.source === 'youtube') {
        const videoId = getYouTubeVideoId(item.url);
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
            <View style={{ height, width: WINDOW_WIDTH, backgroundColor: '#000' }}>
                {!ready && (
                    <View style={[styles.playerLoading, { height }]}>
                        <ActivityIndicator size="large" color="#FF4444" />
                    </View>
                )}
                <YoutubeIframe
                    videoId={videoId}
                    height={height}
                    width={WINDOW_WIDTH}
                    play={isActive}
                    onReady={() => setReady(true)}
                />
            </View>
        );
    }

    if (item.source === 'tiktok') {
        return (
            <WebView
                source={{ uri: item.url }}
                style={{ height, width: WINDOW_WIDTH, backgroundColor: '#000' }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
            />
        );
    }

    return (
        <View style={[styles.playerFallback, { height }]}>
            <Text style={styles.fallbackLabel}>{item.title}</Text>
            <TouchableOpacity style={styles.openBtn} onPress={() => Linking.openURL(item.url).catch(() => {})}>
                <Text style={styles.openBtnText}>Buka di Browser</Text>
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

            <View style={styles.topRight} pointerEvents="none">
                <View style={[styles.sourceBadge, { backgroundColor: sourceColor + '30', borderColor: sourceColor + '80' }]}>
                    <View style={[styles.sourceDot, { backgroundColor: sourceColor }]} />
                    <Text style={[styles.sourceBadgeText, { color: sourceColor }]}>
                        {item.source.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.counter}>{index + 1}/{total}</Text>
            </View>

            <View style={styles.scrollHint} pointerEvents="none">
                <Text style={styles.scrollHintText}>↑</Text>
                <Text style={styles.scrollHintSmall}>Geser</Text>
                <Text style={styles.scrollHintText}>↓</Text>
            </View>

            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.95)']}
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
        </View>
    );
}

export default function EducationFeedScreen() {
    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const fetchContents = useCallback(async (pageNum: number, reset = false) => {
        try {
            const res = await educationAPI.getContents({ page: pageNum, limit: 10 });
            const newItems = (res.contents || []).filter((c: Content) => c.isActive !== false);
            setContents(prev => reset ? newItems : [...prev, ...newItems]);
            setTotalPages(res.totalPages || 1);
        } catch {
            if (reset) setError('Gagal memuat konten edukasi.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => { fetchContents(1, true); }, []);

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

    if (contents.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Belum ada konten edukasi.</Text>
                <Text style={styles.emptySubtext}>Admin belum menambahkan konten.</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
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
                renderItem={({ item, index }) => (
                    <FeedCard
                        item={item}
                        index={index}
                        total={contents.length}
                        isActive={index === activeIndex}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000',
    },
    card: {
        width: WINDOW_WIDTH,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    topRight: {
        position: 'absolute',
        top: 56,
        right: Spacing.md,
        alignItems: 'flex-end',
        gap: Spacing.xs,
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        gap: 5,
    },
    sourceDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    sourceBadgeText: {
        fontSize: Typography.sizes.xs,
        fontFamily: Typography.bodySemiBold,
    },
    counter: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: Typography.sizes.xs,
        fontFamily: Typography.body,
    },
    scrollHint: {
        position: 'absolute',
        right: Spacing.md,
        top: '45%',
        alignItems: 'center',
        gap: 2,
    },
    scrollHintText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 16,
    },
    scrollHintSmall: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 9,
        fontFamily: Typography.body,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 260,
        justifyContent: 'flex-end',
    },
    meta: {
        padding: Spacing.lg,
        paddingBottom: 80,
        gap: Spacing.xs,
    },
    categoryChip: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
        marginBottom: 4,
    },
    categoryText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: Typography.sizes.xs,
        fontFamily: Typography.bodyMedium,
    },
    videoTitle: {
        color: '#FFFFFF',
        fontSize: Typography.sizes.lg,
        fontFamily: Typography.heading,
        lineHeight: 24,
    },
    videoDesc: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: Typography.sizes.sm,
        fontFamily: Typography.body,
        lineHeight: 20,
        marginTop: 4,
    },
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
    emptyContainer: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: Typography.sizes.lg,
        fontFamily: Typography.heading,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: Typography.sizes.sm,
        fontFamily: Typography.body,
    },
});
