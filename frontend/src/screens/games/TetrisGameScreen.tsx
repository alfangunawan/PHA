import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gamesAPI } from '../../api';

const ROWS = 20;
const COLS = 10;
// Fun Blue palette (selaras Beranda)
const FB = {
    bg: '#fcfcfe', card: '#ffffff', border: '#ecedf6', borderSoft: '#e1e5ee',
    primary: '#1A59A1', primaryDeep: '#14457D',
    text: '#353b4a', body: '#3b4150', muted: '#9197aa', sub: '#5a6f8c',
    tile: '#f1f2f8', tint: '#e9f1fa',
    arcade: '#4571b0', arcadeSoft: '#eef2fb', arcadeBorder: '#e0e8f5',
    board: '#1a2340', cellEmpty: '#28335a', ghost: '#3a466e',
    green: '#3f8f63', greenSoft: '#eaf6ef', greenBorder: '#cfe8da',
    danger: '#c45f5f', dangerSoft: '#fdeeee', dangerBorder: '#f4caca',
};
const PIECE_COLORS: Record<string, string> = { I: '#74c7f2', O: '#ffd66b', T: '#b38cff', S: '#8ee28e', Z: '#ff8f8f', J: '#5a8bcb', L: '#ffb46b' };

type Board = (string | null)[][];
type PieceKey = keyof typeof SHAPES;
type Piece = { key: PieceKey; shape: number[][]; row: number; col: number };

const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
};

const KEYS = Object.keys(SHAPES) as PieceKey[];
const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const randomPieceKey = (): PieceKey => KEYS[Math.floor(Math.random() * KEYS.length)];
const createPiece = (key: PieceKey): Piece => ({ key, shape: SHAPES[key], row: 0, col: key === 'I' ? 3 : 4 });
const rotateShape = (shape: number[][]) => shape[0].map((_, i) => shape.map(row => row[i]).reverse());

export default function TetrisGameScreen({ navigation }: any) {
    const { width, height } = useWindowDimensions();
    const firstKey = useRef(randomPieceKey()).current;
    const [board, setBoard] = useState<Board>(emptyBoard());
    const [piece, setPiece] = useState<Piece>(createPiece(firstKey));
    const [nextPiece, setNextPiece] = useState<PieceKey>(randomPieceKey());
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [paused, setPaused] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [reward, setReward] = useState<any>(null);
    const startedAt = useRef(Date.now()).current;
    const intervalRef = useRef<any>(null);
    const endingRef = useRef(false);

    const cell = useMemo(() => {
        const availableWidth = width - 36 - 18 - (COLS - 1) * 4 - 18;
        const availableHeight = Math.max(250, height - 420);
        const raw = Math.min(availableWidth / COLS, availableHeight / ROWS);
        const maxCell = width < 380 ? 16 : 20;
        return Math.max(11, Math.min(maxCell, Math.floor(raw)));
    }, [width, height]);

    const collides = (shape = piece.shape, row = piece.row, col = piece.col, targetBoard = board) => {
        for (let r = 0; r < shape.length; r += 1) for (let c = 0; c < shape[r].length; c += 1) {
            if (!shape[r][c]) continue;
            const nr = row + r;
            const nc = col + c;
            if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
            if (nr >= 0 && targetBoard[nr][nc]) return true;
        }
        return false;
    };

    const endGame = async () => {
        if (endingRef.current) return;
        endingRef.current = true;
        setGameOver(true);
        setPaused(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!sessionId) return;
        try {
            const durationSec = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
            const res = await gamesAPI.completeTetris(sessionId, { score, lines, level, durationSec });
            setReward(res.reward);
            Alert.alert('Game Over', `Skor ${score}. XP: ${res.reward?.event?.xp || 0}, Poin: ${res.reward?.event?.points || 0}`);
        } catch (error) {
            console.warn('Complete tetris failed', error);
        }
    };

    const spawn = (targetBoard: Board) => {
        const key = nextPiece;
        const newPiece = createPiece(key);
        setNextPiece(randomPieceKey());
        if (collides(newPiece.shape, newPiece.row, newPiece.col, targetBoard)) endGame();
        else setPiece(newPiece);
    };

    const mergeAndClear = (activePiece = piece) => {
        const merged = board.map(row => [...row]);
        activePiece.shape.forEach((row, r) => row.forEach((cell, c) => {
            if (cell && activePiece.row + r >= 0) merged[activePiece.row + r][activePiece.col + c] = activePiece.key;
        }));
        const remaining = merged.filter(row => row.some(cell => !cell));
        const cleared = ROWS - remaining.length;
        const newBoard = [...Array.from({ length: cleared }, () => Array(COLS).fill(null)), ...remaining];
        if (cleared) {
            setLines(prev => {
                const total = prev + cleared;
                setLevel(Math.floor(total / 10) + 1);
                return total;
            });
            setScore(prev => prev + [0, 100, 300, 500, 800][cleared] * level);
        }
        setBoard(newBoard);
        spawn(newBoard);
    };

    const moveDown = (soft = false) => {
        if (gameOver || paused) return;
        if (!collides(piece.shape, piece.row + 1, piece.col)) {
            setPiece(p => ({ ...p, row: p.row + 1 }));
            if (soft) setScore(s => s + 1);
        } else mergeAndClear();
    };

    const move = (dc: number) => {
        if (gameOver || paused) return;
        if (!collides(piece.shape, piece.row, piece.col + dc)) setPiece(p => ({ ...p, col: p.col + dc }));
    };

    const rotate = () => {
        if (gameOver || paused) return;
        const rotated = rotateShape(piece.shape);
        if (!collides(rotated, piece.row, piece.col)) setPiece(p => ({ ...p, shape: rotated }));
    };

    const getDropRow = () => {
        let row = piece.row;
        while (!collides(piece.shape, row + 1, piece.col)) row += 1;
        return row;
    };

    const hardDrop = () => {
        if (gameOver || paused) return;
        const dropRow = getDropRow();
        const droppedPiece = { ...piece, row: dropRow };
        setScore(s => s + Math.max(0, dropRow - piece.row) * 2);
        setPiece(droppedPiece);
        mergeAndClear(droppedPiece);
    };

    useEffect(() => {
        gamesAPI.startTetris().then(res => setSessionId(res.sessionId)).catch(console.warn);
    }, []);

    useEffect(() => () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        if (gameOver || paused) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        const speed = Math.max(120, 900 - (level - 1) * 85 - Math.floor((Date.now() - startedAt) / 60000) * 80);
        intervalRef.current = setInterval(() => moveDown(false), speed);
        return () => intervalRef.current && clearInterval(intervalRef.current);
    }, [piece, level, gameOver, paused]);

    const ghostRow = getDropRow();
    const displayBoard = board.map(row => [...row]);
    piece.shape.forEach((row, r) => row.forEach((cell, c) => {
        const nr = ghostRow + r; const nc = piece.col + c;
        if (cell && nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !displayBoard[nr][nc]) displayBoard[nr][nc] = 'ghost';
    }));
    piece.shape.forEach((row, r) => row.forEach((cell, c) => {
        const nr = piece.row + r; const nc = piece.col + c;
        if (cell && nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) displayBoard[nr][nc] = piece.key;
    }));

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.appBar}>
                    <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={20} color="#5a6173" />
                    </TouchableOpacity>
                    <View style={styles.appBarIcon}><Ionicons name="grid" size={20} color={FB.arcade} /></View>
                    <View style={styles.flex}>
                        <Text style={styles.title}>Tetris Tenang</Text>
                        <Text style={styles.subtitle}>Susun blok dalam sesi singkat</Text>
                    </View>
                    <TouchableOpacity disabled={gameOver} onPress={() => setPaused(p => !p)} style={[styles.pausePill, gameOver && styles.disabled]}>
                        <Ionicons name={paused ? 'play' : 'pause'} size={13} color={FB.primary} />
                        <Text style={styles.pauseText}>{paused ? 'Lanjut' : 'Jeda'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsCard}>
                    <Stat label="Skor" value={score} />
                    <View style={styles.statDivider} />
                    <Stat label="Level" value={level} />
                    <View style={styles.statDivider} />
                    <Stat label="Lines" value={lines} />
                </View>

                <View style={styles.nextStrip}>
                    <Text style={styles.nextLabel}>Next</Text>
                    <MiniPiece pieceKey={nextPiece} />
                    <Text style={styles.nextHint}>Blok berikutnya</Text>
                </View>

                <View style={[styles.board, { padding: 9 }]}>
                    {displayBoard.map((row, r) => (
                        <View key={r} style={styles.row}>
                            {row.map((c, ci) => {
                                const isGhost = c === 'ghost';
                                const backgroundColor = isGhost ? FB.ghost : c ? PIECE_COLORS[c] : FB.cellEmpty;
                                return <View key={`${r}-${ci}`} style={{ width: cell, height: cell, margin: 2, borderRadius: 4, backgroundColor, opacity: isGhost ? 0.5 : 1, borderBottomWidth: c && !isGhost ? Math.max(2, cell * 0.16) : 0, borderBottomColor: 'rgba(0,0,0,0.16)' }} />;
                            })}
                        </View>
                    ))}
                </View>

                <View style={styles.dropRow}>
                    <TouchableOpacity style={styles.flatBtn} onPress={() => moveDown(true)}>
                        <Ionicons name="chevron-down" size={16} color={FB.primary} />
                        <Text style={styles.flatBtnText}>Soft</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.flatBtn} onPress={hardDrop}>
                        <Ionicons name="download-outline" size={16} color={FB.primary} />
                        <Text style={styles.flatBtnText}>Drop</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.controls}>
                    <Pad icon="arrow-back" label="Kiri" onPress={() => move(-1)} />
                    <Pad icon="refresh" label="Putar" onPress={rotate} />
                    <Pad icon="arrow-forward" label="Kanan" onPress={() => move(1)} />
                </View>

                {paused && !gameOver && <StatusCard icon="pause-circle" text="Game dijeda. Tarik napas sebentar, lalu lanjut saat siap." tone="info" />}
                {gameOver && <StatusCard icon="close-circle" text="Game selesai. Reward akan dihitung dari skor sesi ini." tone="danger" />}
                {reward?.event && <StatusCard icon="ribbon" text={`+${reward.event.xp} XP • +${reward.event.points} poin`} tone="success" />}
            </ScrollView>
        </SafeAreaView>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return <View style={styles.statItem}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Pad({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.pad} onPress={onPress} activeOpacity={0.85}>
            <Ionicons name={icon} size={22} color="#fff" />
            <Text style={styles.padLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

function StatusCard({ icon, text, tone }: { icon: any; text: string; tone: 'info' | 'success' | 'danger' }) {
    const color = tone === 'danger' ? FB.danger : tone === 'success' ? FB.green : FB.primary;
    const card = tone === 'danger' ? styles.dangerCard : tone === 'success' ? styles.successCard : styles.infoCard;
    return (
        <View style={[styles.statusCard, card]}>
            <Ionicons name={icon} size={18} color={color} />
            <Text style={[styles.statusText, { color }]}>{text}</Text>
        </View>
    );
}

function MiniPiece({ pieceKey }: { pieceKey: PieceKey }) {
    return (
        <View style={styles.mini}>
            {SHAPES[pieceKey].map((row, r) => (
                <View key={r} style={styles.row}>
                    {row.map((filled, c) => <View key={c} style={{ width: 11, height: 11, margin: 1.5, borderRadius: 3, backgroundColor: filled ? PIECE_COLORS[pieceKey] : 'transparent' }} />)}
                </View>
            ))}
        </View>
    );
}

const CARD_SHADOW = { shadowColor: FB.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2 };

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: FB.bg },
    scroll: { padding: 18, gap: 12, paddingBottom: 36, alignItems: 'stretch' },
    flex: { flex: 1, minWidth: 0 },

    appBar: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: FB.tile, alignItems: 'center', justifyContent: 'center' },
    appBarIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: FB.arcadeSoft, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Lora_500Medium', fontSize: 19, color: FB.text, letterSpacing: -0.2 },
    subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: FB.muted, marginTop: 2 },
    pausePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: FB.card, borderColor: FB.borderSoft, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 8 },
    pauseText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: FB.primary },
    disabled: { opacity: 0.45 },

    statsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: FB.card, borderColor: FB.border, borderWidth: 1, borderRadius: 20, paddingVertical: 15, paddingHorizontal: 8, ...CARD_SHADOW },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontFamily: 'Lora_500Medium', fontSize: 26, color: FB.primary, lineHeight: 28 },
    statLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: FB.muted, marginTop: 5 },
    statDivider: { width: 1, height: 34, backgroundColor: FB.border },

    nextStrip: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: FB.arcadeSoft, borderColor: FB.arcadeBorder, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    nextLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: FB.sub, letterSpacing: 0.4 },
    nextHint: { marginLeft: 'auto', fontFamily: 'Inter_400Regular', fontSize: 12, color: FB.muted },
    mini: { alignItems: 'center', justifyContent: 'center' },

    board: { alignSelf: 'center', backgroundColor: FB.board, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 10 },
    row: { flexDirection: 'row' },

    dropRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
    flatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: FB.card, borderColor: FB.borderSoft, borderWidth: 1, borderRadius: 14, paddingVertical: 12 },
    flatBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5, color: FB.sub },

    controls: { flexDirection: 'row', gap: 10 },
    pad: { flex: 1, alignItems: 'center', gap: 5, backgroundColor: FB.primary, borderRadius: 18, paddingVertical: 14, borderBottomWidth: 5, borderBottomColor: FB.primaryDeep, shadowColor: FB.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 4 },
    padLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },

    statusCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 13 },
    infoCard: { backgroundColor: FB.tint, borderColor: '#d9e6f6' },
    successCard: { backgroundColor: FB.greenSoft, borderColor: FB.greenBorder },
    dangerCard: { backgroundColor: FB.dangerSoft, borderColor: FB.dangerBorder },
    statusText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13.5, lineHeight: 19 },
});
