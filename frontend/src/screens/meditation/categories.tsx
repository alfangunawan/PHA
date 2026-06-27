import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

// === Palet "Fun Blue" — selaras Beranda & design system Meditasi ===
export const M = {
    primary:     '#1A59A1',
    primaryDeep: '#14457D',
    primaryLight:'#e9f1fa',
    screenBg:    '#fcfcfe',
    card:        '#ffffff',
    cardBorder:  '#ecedf6',
    phoneBorder: '#e4e6ef',
    textDark:    '#353b4a',
    textSub:     '#6a7185',
    textMuted:   '#949bae',
    chipBg:      '#f1f2f8',
    chipBorder:  '#e7e9f2',
    favBg:       '#f7eef3',
    favColor:    '#c489a6',
};

export type IconKind = 'morning' | 'general' | 'sleep' | 'focus' | 'anxiety';

export interface CatTheme {
    key: string;       // kategori internal
    label: string;     // label filter (Indonesia)
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeColor: string;
    icon: IconKind;
}

// Tema per kategori — warna lembut, ikon garis sesuai referensi
export const CATEGORY_THEMES: Record<string, CatTheme> = {
    morning: { key: 'morning', label: 'Pagi',  iconBg: '#f6efe2', iconColor: '#8aa0c0', badgeBg: '#f6efe2', badgeColor: '#8aa0c0', icon: 'morning' },
    general: { key: 'general', label: 'Umum',  iconBg: '#eaf2ec', iconColor: '#8aa0c0', badgeBg: '#eaf2ec', badgeColor: '#8aa0c0', icon: 'general' },
    sleep:   { key: 'sleep',   label: 'Tidur', iconBg: '#eef2fb', iconColor: '#8aa0c0', badgeBg: '#eef2fb', badgeColor: '#8aa0c0', icon: 'sleep' },
    focus:   { key: 'focus',   label: 'Fokus', iconBg: '#f3eef6', iconColor: '#8aa0c0', badgeBg: '#f3eef6', badgeColor: '#8aa0c0', icon: 'focus' },
    anxiety: { key: 'anxiety', label: 'Cemas', iconBg: '#eaf2ec', iconColor: '#8aa0c0', badgeBg: '#eaf2ec', badgeColor: '#8aa0c0', icon: 'general' },
};

export const DEFAULT_THEME: CatTheme = {
    key: 'general', label: 'Umum', iconBg: '#e9f1fa', iconColor: M.primary, badgeBg: '#e9f1fa', badgeColor: M.primary, icon: 'general',
};

export function getCatTheme(category?: string): CatTheme {
    return CATEGORY_THEMES[(category || '').toLowerCase()] || DEFAULT_THEME;
}

// === Ikon kategori (garis, viewBox 24) ===
export function CategoryIcon({ kind, size = 23, color }: { kind: IconKind; size?: number; color: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    switch (kind) {
        case 'morning':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24">
                    <Path d="M12 3v3M5.5 8 7.6 10M18.5 8 16.4 10M3 15h18M5 15a7 7 0 0 1 14 0" {...sp} />
                    <Path d="M3 19h18" {...sp} />
                </Svg>
            );
        case 'sleep':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24">
                    <Path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" {...sp} />
                </Svg>
            );
        case 'focus':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24">
                    <Circle cx="12" cy="12" r="8.2" {...sp} />
                    <Circle cx="12" cy="12" r="4.6" {...sp} />
                    <Circle cx="12" cy="12" r="1.2" fill={color} stroke="none" />
                </Svg>
            );
        case 'general':
        case 'anxiety':
        default:
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24">
                    <Path d="M11 20C6 20 4 16 4 11c5 0 7 2 7 6" {...sp} />
                    <Path d="M13 20c5 0 7-4 7-9-5 0-7 2-7 6" {...sp} />
                    <Path d="M11 20v-3M13 20v-5" {...sp} />
                </Svg>
            );
    }
}

// Ikon person/meditasi — header & timer
export function MeditationGlyph({ size = 25, color }: { size?: number; color: string }) {
    const sp = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="5.5" r="2.3" {...sp} />
            <Path d="M12 8.5c-3 0-5 2-5.5 5" {...sp} />
            <Path d="M12 8.5c3 0 5 2 5.5 5" {...sp} />
            <Path d="M5 17.5h14" {...sp} />
        </Svg>
    );
}

// Ikon untuk chip filter
export function FilterIcon({ keyName, size = 15, color }: { keyName: string; size?: number; color: string }) {
    const sp = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
    if (keyName === 'all') {
        return (
            <Svg width={size} height={size} viewBox="0 0 24 24">
                <Circle cx="12" cy="12" r="3.2" {...sp} />
                <Path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" {...sp} />
            </Svg>
        );
    }
    if (keyName === 'sleep') {
        return (
            <Svg width={size} height={size} viewBox="0 0 24 24">
                <Path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" {...sp} />
            </Svg>
        );
    }
    if (keyName === 'focus') {
        return (
            <Svg width={size} height={size} viewBox="0 0 24 24">
                <Circle cx="12" cy="12" r="8.2" {...sp} />
                <Circle cx="12" cy="12" r="3.1" {...sp} />
            </Svg>
        );
    }
    if (keyName === 'morning') {
        return (
            <Svg width={size} height={size} viewBox="0 0 24 24">
                <Path d="M12 3v3M5.5 8 7.6 10M18.5 8 16.4 10M3 15h18M5 15a7 7 0 0 1 14 0M3 19h18" {...sp} />
            </Svg>
        );
    }
    // general / anxiety
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M11 20C6 20 4 16 4 11c5 0 7 2 7 6" {...sp} />
            <Path d="M13 20c5 0 7-4 7-9-5 0-7 2-7 6" {...sp} />
        </Svg>
    );
}
