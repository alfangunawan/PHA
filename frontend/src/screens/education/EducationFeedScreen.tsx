import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { educationAPI } from '../../api';
import Card from '../../components/Card';
import { LoadingState, EmptyState, ErrorState } from '../../components/LoadingState';
import AnimatedView from '../../components/AnimatedView';
import { Typography, Spacing, BorderRadius } from '../../theme';

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

export default function EducationFeedScreen() {
    const { colors } = useTheme();
    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchContents = useCallback(async (pageNum: number, reset = false) => {
        try {
            const res = await educationAPI.getContents({ page: pageNum, limit: 10 });
            const newItems = res.contents || [];
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

    const openLink = (url: string) => Linking.openURL(url).catch(() => {});

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.charcoal, fontFamily: Typography.headingBold }]}>
                    Edukasi
                </Text>
                <Text style={[styles.subtitle, { color: colors.mediumGray, fontFamily: Typography.body }]}>
                    Artikel & video kesehatan mental
                </Text>
            </View>

            {contents.length === 0
                ? <EmptyState message="Belum ada konten." />
                : (
                    <FlatList
                        data={contents}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={loadingMore ? <LoadingState message="Memuat lebih banyak..." /> : null}
                        renderItem={({ item, index }) => (
                            <AnimatedView delay={index * 60}>
                                <Card onPress={() => openLink(item.url)}>
                                    <View style={styles.sourceRow}>
                                        <View style={[styles.sourceBadge, { backgroundColor: item.source === 'youtube' ? '#FF0000' + '22' : colors.lightGray }]}>
                                            <Text style={[styles.sourceText, { color: item.source === 'youtube' ? '#FF0000' : colors.darkGray, fontFamily: Typography.bodySemiBold }]}>
                                                {item.source.toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={[styles.category, { color: colors.sageGreen, fontFamily: Typography.bodyMedium }]}>
                                            {item.category}
                                        </Text>
                                    </View>
                                    <Text style={[styles.contentTitle, { color: colors.charcoal, fontFamily: Typography.heading }]}>
                                        {item.title}
                                    </Text>
                                    {item.description && (
                                        <Text style={[styles.desc, { color: colors.mediumGray, fontFamily: Typography.body }]} numberOfLines={3}>
                                            {item.description}
                                        </Text>
                                    )}
                                    <Text style={[styles.link, { color: colors.softBlue, fontFamily: Typography.bodyMedium }]}>
                                        Buka →
                                    </Text>
                                </Card>
                            </AnimatedView>
                        )}
                    />
                )
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
    title: { fontSize: Typography.sizes['2xl'] },
    subtitle: { fontSize: Typography.sizes.sm, marginTop: 4 },
    list: { padding: Spacing.md, gap: Spacing.sm },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
    sourceBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
    sourceText: { fontSize: Typography.sizes.xs },
    category: { fontSize: Typography.sizes.xs },
    contentTitle: { fontSize: Typography.sizes.md, marginBottom: 4 },
    desc: { fontSize: Typography.sizes.sm, lineHeight: 20, marginBottom: Spacing.sm },
    link: { fontSize: Typography.sizes.sm },
});
