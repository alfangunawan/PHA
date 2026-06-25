import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gamesAPI } from '../../api';

const ROWS = 20;
const COLS = 10;
const C = { bg: '#fcfcfe', card: '#fff', border: '#ecedf6', primary: '#8a9ccc', text: '#353b4a', body: '#3b4150', muted: '#9197aa', soft: '#f3f4f9', avatar: '#eef1f9', board: '#202333', panel: '#2b3045', grid: '#353b54', ghost: '#596078', boardText: '#fff', boardSub: '#c6cbe2', green: '#8AAD83', greenSoft: '#f1f8ef', danger: '#c45f5f', dangerSoft: '#fdeeee' };
const PIECE_COLORS: Record<string, string> = { I: '#74d4ff', O: '#ffd66b', T: '#b38cff', S: '#8ee28e', Z: '#ff8f8f', J: '#8fb3ff', L: '#ffb46b' };

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

    const layout = useMemo(() => {
        const horizontalPadding = 24;
        const sidePanelWidth = 78;
        const sideGap = 8;
        const canUseSide = width >= 430;
        const availableWidth = canUseSide ? width - horizontalPadding - sidePanelWidth - sideGap - 12 : width - horizontalPadding - 14;
        const availableHeight = Math.max(250, height - 360);
        const raw = Math.min(availableWidth / COLS - 2, availableHeight / ROWS - 2);
        const maxCell = width < 380 ? 14 : width < 430 ? 16 : 20;
        const cell = Math.max(10, Math.min(maxCell, Math.floor(raw)));
        return { cell, canUseSide, miniCell: Math.max(8, Math.min(12, Math.floor(cell * 0.68))) };
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

    const nextPanel = (
        <View style={[styles.side, !layout.canUseSide && styles.sideCompact]}>
            <View style={styles.nextWrap}>
                <Text style={styles.sideTitle}>Next</Text>
                <MiniPiece pieceKey={nextPiece} cell={layout.miniCell} />
            </View>
            <TouchableOpacity style={styles.sideBtn} onPress={() => moveDown(true)}><Ionicons name="arrow-down-outline" size={17} color={C.primary} /><Text style={styles.sideBtnText}>Soft</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sideBtn} onPress={hardDrop}><Ionicons name="download-outline" size={17} color={C.primary} /><Text style={styles.sideBtnText}>Drop</Text></TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.appBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.appBarBtn}>
                        <Ionicons name="chevron-back" size={22} color={C.body} />
                    </TouchableOpacity>
                    <View style={styles.appBarCenter}>
                        <View style={styles.avatar}><Ionicons name="grid-outline" size={17} color={C.primary} /></View>
                        <View>
                            <Text style={styles.title}>Tetris Tenang</Text>
                            <Text style={styles.subtitle}>Susun blok dalam sesi singkat</Text>
                        </View>
                    </View>
                    <TouchableOpacity disabled={gameOver} onPress={() => setPaused(p => !p)} style={[styles.pauseBtn, gameOver && styles.disabled]}><Ionicons name={paused ? 'play-outline' : 'pause-outline'} size={17} color={C.primary} /><Text style={styles.pauseText}>{paused ? 'Lanjut' : 'Jeda'}</Text></TouchableOpacity>
                </View>

                <View style={styles.scoreBubble}>
                    <Stat label="Skor" value={score} />
                    <Stat label="Level" value={level} />
                    <Stat label="Lines" value={lines} />
                </View>

                {!layout.canUseSide && nextPanel}

                <View style={styles.gameCard}>
                    <View style={styles.gameRow}>
                        <View style={styles.board}>{displayBoard.map((row, r) => <View key={r} style={styles.row}>{row.map((cell, c) => {
                            const backgroundColor = cell === 'ghost' ? C.ghost : cell ? PIECE_COLORS[cell] : C.grid;
                            const opacity = cell === 'ghost' ? 0.45 : 1;
                            return <View key={`${r}-${c}`} style={{ width: layout.cell, height: layout.cell, margin: 1, borderRadius: Math.max(2, layout.cell * 0.16), backgroundColor, opacity }} />;
                        })}</View>)}</View>
                        {layout.canUseSide && nextPanel}
                    </View>
                </View>

                <View style={styles.controls}>
                    <IconButton icon="arrow-back-outline" label="Kiri" onPress={() => move(-1)} />
                    <IconButton icon="sync-outline" label="Putar" onPress={rotate} />
                    <IconButton icon="arrow-forward-outline" label="Kanan" onPress={() => move(1)} />
                </View>

                {paused && !gameOver && <StatusBubble icon="pause-circle-outline" text="Game dijeda. Tarik napas sebentar, lalu lanjut saat siap." color={C.primary} />}
                {gameOver && <StatusBubble icon="close-circle-outline" text="Game selesai. Reward akan dihitung dari skor sesi ini." color={C.danger} tone="danger" />}
                {reward?.event && <StatusBubble icon="ribbon-outline" text={`+${reward.event.xp} XP • +${reward.event.points} poin`} color={C.green} tone="success" />}
            </ScrollView>
        </SafeAreaView>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return <View style={styles.statItem}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function IconButton({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
    return <TouchableOpacity style={styles.btn} onPress={onPress}><Ionicons name={icon} size={22} color="#fff" /><Text style={styles.btnLabel}>{label}</Text></TouchableOpacity>;
}

function StatusBubble({ icon, text, color, tone }: { icon: any; text: string; color: string; tone?: 'success' | 'danger' }) {
    return (
        <View style={styles.assistantRow}>
            <View style={[styles.smallAvatar, tone === 'success' && styles.avatarSuccess, tone === 'danger' && styles.avatarDanger]}><Ionicons name={icon} size={18} color={color} /></View>
            <View style={[styles.statusBubble, tone === 'success' && styles.successBubble, tone === 'danger' && styles.dangerBubble]}><Text style={[styles.statusText, { color }]}>{text}</Text></View>
        </View>
    );
}

function MiniPiece({ pieceKey, cell }: { pieceKey: PieceKey; cell: number }) {
    return <View style={styles.mini}>{SHAPES[pieceKey].map((row, r) => <View key={r} style={styles.row}>{row.map((filled, c) => <View key={c} style={{ width: cell, height: cell, margin: 1, borderRadius: 3, backgroundColor: filled ? PIECE_COLORS[pieceKey] : 'transparent' }} />)}</View>)}</View>;
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scroll: { padding: 12, gap: 12, paddingBottom: 34, alignItems: 'center' },
    appBar: { width: '100%', maxWidth: 430, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 22, padding: 10 },
    appBarBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
    appBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    title: { color: C.text, fontSize: 18, fontWeight: '800' },
    subtitle: { color: C.muted, fontSize: 11, marginTop: 2 },
    pauseBtn: { backgroundColor: C.soft, borderColor: C.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
    pauseText: { color: C.primary, fontWeight: '800', fontSize: 12 },
    disabled: { opacity: 0.45 },
    scoreBubble: { width: '100%', maxWidth: 430, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 20, padding: 13, flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { color: C.text, fontSize: 18, fontWeight: '900' },
    statLabel: { color: C.muted, fontSize: 11, fontWeight: '800' },
    gameCard: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 24, padding: 8 },
    gameRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'flex-start' },
    board: { backgroundColor: C.board, padding: 5, borderRadius: 14 },
    row: { flexDirection: 'row' },
    side: { width: 86, backgroundColor: C.soft, borderColor: C.border, borderWidth: 1, borderRadius: 18, padding: 8, gap: 9, alignItems: 'center' },
    sideCompact: { width: '100%', maxWidth: 330, flexDirection: 'row', justifyContent: 'space-between' },
    nextWrap: { alignItems: 'center', gap: 4 },
    sideTitle: { color: C.text, fontWeight: '800', fontSize: 12 },
    mini: { minHeight: 42, minWidth: 42, alignItems: 'center', justifyContent: 'center' },
    sideBtn: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    sideBtnText: { color: C.primary, fontWeight: '900', fontSize: 12 },
    controls: { flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
    btn: { backgroundColor: C.primary, width: 86, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 3, shadowColor: C.primary, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
    btnLabel: { color: '#fff', fontSize: 11, fontWeight: '900' },
    assistantRow: { width: '100%', maxWidth: 430, flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
    smallAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.avatar, alignItems: 'center', justifyContent: 'center' },
    avatarSuccess: { backgroundColor: C.greenSoft },
    avatarDanger: { backgroundColor: C.dangerSoft },
    statusBubble: { flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 6, paddingVertical: 12, paddingHorizontal: 15 },
    successBubble: { backgroundColor: C.greenSoft, borderColor: '#dcefd7' },
    dangerBubble: { backgroundColor: C.dangerSoft, borderColor: '#f4caca' },
    statusText: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
});
