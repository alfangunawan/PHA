import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Linking,
  Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { educationAPI } from '../../api';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');
const CARD_HEIGHT = H;

// ── URL helpers ────────────────────────────────────────────────────────────────
const getYoutubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
};

const buildYoutubeHtml = (videoId) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body { margin: 0; padding: 0; background-color: #000; overflow: hidden; }
    iframe { width: 100vw; height: 100vh; border: 0; }
  </style>
</head>
<body>
  <iframe 
    src="https://www.youtube.com/embed/${videoId}?autoplay=0&playsinline=1&rel=0"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen>
  </iframe>
</body>
</html>
`;

const buildTiktokHtml = (url) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body { margin: 0; padding: 0; background-color: #000; overflow: hidden; }
    iframe { width: 100vw; height: 100vh; border: 0; }
  </style>
</head>
<body>
  <iframe
    src="https://www.tiktok.com/embed/v2/?url=${encodeURIComponent(url)}"
    allow="autoplay; encrypted-media"
    allowfullscreen>
  </iframe>
</body>
</html>
`;

// ── In-App Embedded Player ─────────────────────────────────────────────────────
const InAppPlayer = ({ item, isVisible }) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // TikTok embed URL
  const tiktokUrl = React.useMemo(() => {
    if (item.source === 'tiktok' && isVisible) {
      return `https://www.tiktok.com/embed/v2/?url=${encodeURIComponent(item.url)}`;
    }
    return null;
  }, [item, isVisible]);

  // Khusus untuk Web
  if (Platform.OS === 'web' && isVisible) {
    if (item.source === 'youtube') {
      const id = getYoutubeId(item.url);
      if (!id) return null;
      return (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=0&playsinline=1&rel=0`}
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }
    if (item.source === 'tiktok') {
      return (
        <iframe
          src={`https://www.tiktok.com/embed/v2/?url=${encodeURIComponent(item.url)}`}
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      );
    }
  }

  // Khusus YouTube di HP (Gunakan react-native-youtube-iframe yang stabil dan clean)
  if (item.source === 'youtube') {
    const ytid = getYoutubeId(item.url);
    if (!ytid) return null;
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center' }]}>
        <YoutubePlayer
          height={300}
          width={'100%'}
          play={isVisible}
          forceAndroidAutoplay={true}
          videoId={ytid}
          webViewStyle={{ opacity: 0.99 }}
          initialPlayerParams={{
            modestbranding: 1,
            rel: 0,
            preventFullScreen: true,
          }}
          onError={() => setHasError(true)}
          onReady={() => setLoading(false)}
        />
        {loading && !hasError && (
          <View style={styles.playerLoading}>
            <ActivityIndicator color={Colors.lavender} size="large" />
          </View>
        )}
        {hasError && (
          <View style={styles.playerBlank}>
            <Text style={styles.blankIcon}>⚠️</Text>
            <Text style={styles.blankText}>Video tidak tersedia</Text>
          </View>
        )}
      </View>
    );
  }

  // Khusus TikTok di HP
  if (!tiktokUrl) {
    return (
      <View style={styles.playerBlank}>
        <Text style={styles.blankIcon}>♪</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {loading && !hasError && (
        <View style={styles.playerLoading}>
          <ActivityIndicator color={Colors.lavender} size="large" />
        </View>
      )}
      {hasError ? (
        <View style={styles.playerBlank}>
          <Text style={styles.blankIcon}>⚠️</Text>
          <Text style={styles.blankText}>Video tidak dapat dimuat</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: tiktokUrl }}
          style={styles.webview}
          originWhitelist={['*']}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setHasError(true); }}
          onHttpError={() => { setLoading(false); setHasError(true); }}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

// ── Card: Full-screen Reels/TikTok style ──────────────────────────────────────
const SOURCE_COLORS = {
  youtube: '#FF0000',
  tiktok: '#69C9D0',
  other: Colors.softBlue,
};

const EducationCard = React.memo(({ item, index, isVisible }) => {
  const sourceColor = SOURCE_COLORS[item.source] || Colors.softBlue;

  const openLink = useCallback(async () => {
    try {
      await Linking.openURL(item.url);
    } catch (e) {
      console.log('Cannot open URL:', e);
    }
  }, [item.url]);

  return (
    <View style={styles.card}>
      {/* Full-screen video background */}
      <InAppPlayer item={item} isVisible={isVisible} />

      {/* Gradient overlay – dark at bottom, transparent at top */}
      <View style={styles.gradientOverlay} pointerEvents="none" />

      {/* Header badge (top-right) */}
      <View style={styles.topRight}>
        <View style={[styles.sourceBadge, { backgroundColor: sourceColor }]}>
          <Text style={styles.sourceText}>
            {item.source === 'youtube' ? '▶  YOUTUBE' :
             item.source === 'tiktok' ? '♪  TIKTOK' : '🔗 KONTEN'}
          </Text>
        </View>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
      </View>

      {/* Bottom info overlay with gradient — like TikTok/Reels */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.4, 1]}
        style={styles.bottomOverlay}
        pointerEvents="box-none"
      >
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
        {item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}
        
        {/* Fallback button if embed is restricted */}
        <TouchableOpacity style={styles.ctaBtn} onPress={openLink} activeOpacity={0.8}>
          <Text style={styles.ctaBtnText}>
            {item.source === 'youtube' ? '🔗 Buka di Aplikasi YouTube' :
             item.source === 'tiktok' ? '🔗 Buka di TikTok' : '🔗 Buka Konten'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Scroll hint */}
      <View style={styles.scrollHint}>
        <Text style={styles.scrollArrow}>↑</Text>
        <Text style={styles.scrollText}>Geser</Text>
        <Text style={styles.scrollArrow}>↓</Text>
      </View>
    </View>
  );
});

// ── Main screen ────────────────────────────────────────────────────────────────
const EducationFeedScreen = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const flatListRef = useRef(null);

  const fetchContents = async (pageNum = 1, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const res = await educationAPI.getContents({ page: pageNum, limit: 5 });
      const newData = res.data || [];
      setContents((prev) => (append ? [...prev, ...newData] : newData));
      setHasMore(res.pagination?.hasMore || false);
      setPage(pageNum);
    } catch (e) {
      setError(e?.message || 'Gagal memuat konten');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContents(1, false);
    }, [])
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setVisibleIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 60 };

  const handleEndReached = () => {
    if (hasMore && !loadingMore) fetchContents(page + 1, true);
  };

  if (loading) return <LoadingState message="Memuat konten edukasi..." fullScreen />;
  if (error && contents.length === 0) return <ErrorState message={error} />;
  if (contents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          emoji="📚"
          title="Belum ada konten"
          subtitle="Admin belum menambahkan konten edukasi"
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating header */}
      <SafeAreaView style={styles.headerOverlay} pointerEvents="none">
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>📚</Text>
          <Text style={styles.headerTitle}>Edukasi</Text>
        </View>
      </SafeAreaView>

      <FlatList
        ref={flatListRef}
        data={contents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <EducationCard item={item} index={index} isVisible={index === visibleIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={CARD_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, index) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index,
          index,
        })}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <LoadingState message="Memuat lebih banyak..." />
            </View>
          ) : null
        }
      />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Floating header
  headerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  headerEmoji: { fontSize: 22 },
  headerTitle: {
    fontFamily: Typography.heading,
    fontSize: Typography.sizes.lg,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Card
  card: {
    width: W,
    height: CARD_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },

  // WebView
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Gradient overlay: transparent top → dark bottom
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Simulate gradient with layered opacity trick
    backgroundColor: 'transparent',
    // Bottom gradient via border/shadow not available in RN.
    // We use a View positioned at the bottom instead (see bottomOverlay bg).
  },

  // Player states
  playerLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    zIndex: 10,
  },
  playerBlank: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  blankIcon: { fontSize: 48, color: Colors.mediumGray },
  blankText: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.sm,
    color: Colors.mediumGray,
    marginTop: Spacing.sm,
  },

  // Top right badges row
  topRight: {
    position: 'absolute',
    top: 72,
    right: Spacing.md,
    alignItems: 'flex-end',
    gap: Spacing.sm,
    zIndex: 100,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  sourceText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    letterSpacing: 0.8,
  },
  indexBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  indexText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.white,
  },

  // Bottom info overlay — transparent background over video
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 90, // leave room for tab bar
    paddingTop: Spacing['2xl'],
    // Simulated gradient: dark at bottom, fades up
    backgroundColor: 'transparent',
    // Inner shadow effect using a dark semi-transparent background
    borderBottomWidth: 0,
    // We use a wrapping shadow div approach below
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  categoryText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  cardTitle: {
    fontFamily: Typography.headingBold,
    fontSize: Typography.sizes.xl,
    color: Colors.white,
    lineHeight: Typography.sizes.xl * 1.3,
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardDesc: {
    fontFamily: Typography.body,
    fontSize: Typography.sizes.base,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: Typography.sizes.base * 1.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ctaBtn: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.sizes.sm,
    color: Colors.white,
  },

  // Scroll hint
  scrollHint: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.md,
    alignItems: 'center',
    opacity: 0.45,
    zIndex: 100,
  },
  scrollArrow: { color: Colors.white, fontSize: 13 },
  scrollText: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Colors.white,
    marginVertical: 1,
  },

  loadMoreContainer: { height: CARD_HEIGHT / 2, justifyContent: 'center' },
});

export default EducationFeedScreen;
