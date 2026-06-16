package com.example.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GamesScreen(viewModel: GamificationViewModel) {
    var showWordPuzzle by remember { mutableStateOf(false) }
    var showBlockPuzzle by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Mini Games") }) }
    ) { padding ->
        if (showWordPuzzle) {
            WordPuzzleGame(
                onBack = { showWordPuzzle = false },
                onWin = { viewModel.playGame() }
            )
        } else if (showBlockPuzzle) {
            BlockPuzzleGame(
                onBack = { showBlockPuzzle = false },
                onWin = { viewModel.playGame() }
            )
        } else {
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Word Puzzle", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Susun huruf menjadi kata bermakna positif.",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { showWordPuzzle = true }) {
                            Text("Mainkan Word Puzzle")
                        }
                    }
                }

                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Tetris", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Susun blok jatuh untuk menghapus baris.",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { showBlockPuzzle = true }) {
                            Text("Mainkan Tetris")
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text("Deteksi Anomali", style = MaterialTheme.typography.titleMedium)
                Button(
                    onClick = { /* trigger webhook simulation */ },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Simulasi Main > 60 Menit")
                }
                Text(
                    "Simulasi memicu event Webhook ke Chatbot saat sesi lebih dari 60 menit.",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
fun WordPuzzleGame(onBack: () -> Unit, onWin: () -> Unit) {
    val wordPairs = listOf(
        "DAMAI" to "AMIDA",
        "TENANG" to "NAGNET",
        "FOKUS" to "SUKOF",
        "SABAR" to "RABAS",
        "SEHAT" to "TAHES"
    )
    
    var currentPairIndex by remember { mutableStateOf(0) }
    var guess by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    val currentPair = wordPairs[currentPairIndex]
    val correctWord = currentPair.first
    val scrambledWord = currentPair.second

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .padding(top = 80.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Tebak Kata Positif", style = MaterialTheme.typography.headlineMedium)
        
        Card(
            modifier = Modifier.padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Text(
                text = scrambledWord,
                style = MaterialTheme.typography.displayMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(32.dp),
                letterSpacing = 8.sp
            )
        }

        OutlinedTextField(
            value = guess,
            onValueChange = { guess = it.uppercase() },
            label = { Text("Jawaban kamu") },
            singleLine = true
        )

        Button(onClick = {
            if (guess == correctWord) {
                message = "Benar! (+ XP)"
                onWin()
                if (currentPairIndex < wordPairs.size - 1) {
                    currentPairIndex++
                    guess = ""
                } else {
                    message = "Kamu menyelesaikan semua kata!"
                }
            } else {
                message = "Coba lagi ya!"
            }
        }) {
            Text("Cek Jawaban")
        }

        Text(text = message, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)

        Spacer(modifier = Modifier.weight(1f))
        
        OutlinedButton(onClick = onBack) {
            Text("Kembali ke Menu Game")
        }
    }
}

val TETROMINOS = listOf(
    listOf(Pair(0,0), Pair(1,0), Pair(2,0), Pair(3,0)), // I
    listOf(Pair(0,0), Pair(1,0), Pair(0,1), Pair(1,1)), // O
    listOf(Pair(0,0), Pair(1,0), Pair(2,0), Pair(1,1)), // T
    listOf(Pair(0,0), Pair(1,0), Pair(2,0), Pair(0,1)), // J
    listOf(Pair(0,0), Pair(1,0), Pair(2,0), Pair(2,1)), // L
    listOf(Pair(1,0), Pair(2,0), Pair(0,1), Pair(1,1)), // S
    listOf(Pair(0,0), Pair(1,0), Pair(1,1), Pair(2,1)), // Z
)

fun rotateShape(shape: List<Pair<Int, Int>>): List<Pair<Int, Int>> {
    if (shape == TETROMINOS[1]) return shape // O shape
    val rotated = shape.map { Pair(-it.second, it.first) }
    val minX = rotated.minOf { it.first }
    val minY = rotated.minOf { it.second }
    return rotated.map { Pair(it.first - minX, it.second - minY) }
}

fun isValidMove(board: List<List<Boolean>>, shape: List<Pair<Int, Int>>, x: Int, y: Int): Boolean {
    return shape.all { cell ->
        val c = x + cell.first
        val r = y + cell.second
        c in 0..9 && r in 0..19 && (r < 0 || !board[r][c])
    }
}

@Composable
fun BlockPuzzleGame(onBack: () -> Unit, onWin: () -> Unit) {
    var board by remember { mutableStateOf(List(20) { BooleanArray(10) { false }.toList() }) }
    var currentShape by remember { mutableStateOf(TETROMINOS.random()) }
    var currentX by remember { mutableStateOf(3) }
    var currentY by remember { mutableStateOf(0) }
    var nextShape by remember { mutableStateOf(TETROMINOS.random()) }
    var score by remember { mutableStateOf(0) }
    var isGameOver by remember { mutableStateOf(false) }

    LaunchedEffect(isGameOver, currentShape, currentX, currentY) {
        if (isGameOver) return@LaunchedEffect
        delay(500)
        if (isValidMove(board, currentShape, currentX, currentY + 1)) {
            currentY += 1
        } else {
            var newBoard = board.map { it.toMutableList() }.toMutableList()
            currentShape.forEach { cell ->
                val r = currentY + cell.second
                val c = currentX + cell.first
                if (r in 0..19 && c in 0..9) {
                    newBoard[r][c] = true
                }
            }
            
            var linesCleared = 0
            val rowToKeep = mutableListOf<List<Boolean>>()
            for (r in 0..19) {
                if (!newBoard[r].all { it }) {
                    rowToKeep.add(newBoard[r].toList())
                } else {
                    linesCleared++
                }
            }
            while(rowToKeep.size < 20) {
                rowToKeep.add(0, List(10) { false })
            }
            board = rowToKeep
            score += linesCleared * 100
            if (linesCleared > 0) onWin()
            
            currentShape = nextShape
            nextShape = TETROMINOS.random()
            currentX = 3
            currentY = 0
            
            if (!isValidMove(board, currentShape, currentX, currentY)) {
                isGameOver = true
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .padding(top = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Tetris", style = MaterialTheme.typography.headlineMedium)
        Text("Skor: $score", style = MaterialTheme.typography.titleLarge)
        
        Spacer(modifier = Modifier.height(8.dp))

        if (isGameOver) {
            Text("Game Over!", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = {
                board = List(20) { BooleanArray(10) { false }.toList() }
                score = 0
                isGameOver = false
                currentShape = TETROMINOS.random()
                nextShape = TETROMINOS.random()
                currentX = 3
                currentY = 0
            }) {
                Text("Restart")
            }
        }

        Row(modifier = Modifier.weight(1f).padding(vertical = 16.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .aspectRatio(0.5f)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(2.dp)
            ) {
                Column(modifier = Modifier.fillMaxSize()) {
                    for (r in 0..19) {
                        Row(modifier = Modifier.weight(1f)) {
                            for (c in 0..9) {
                                val isFilled = board[r][c] || currentShape.any { it.first + currentX == c && it.second + currentY == r }
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight()
                                        .padding(1.dp)
                                        .background(if (isFilled) MaterialTheme.colorScheme.primary else androidx.compose.ui.graphics.Color.Transparent)
                                )
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Next:", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(4.dp)
                ) {
                    Column {
                        val maxR = (nextShape.maxOfOrNull { it.second } ?: 1).coerceAtLeast(1)
                        val maxC = (nextShape.maxOfOrNull { it.first } ?: 1).coerceAtLeast(1)
                        for (r in 0..maxR) {
                            Row(modifier = Modifier.height(20.dp)) {
                                for (c in 0..maxC) {
                                    val isFilled = nextShape.any { it.first == c && it.second == r }
                                    Box(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .padding(1.dp)
                                            .background(if (isFilled) MaterialTheme.colorScheme.primary else androidx.compose.ui.graphics.Color.Transparent)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(onClick = { if (!isGameOver && isValidMove(board, currentShape, currentX - 1, currentY)) currentX-- }) { Text("◀") }
            Button(onClick = { 
                if (!isGameOver) {
                    val rotated = rotateShape(currentShape)
                    if (isValidMove(board, rotated, currentX, currentY)) currentShape = rotated
                }
            }) { Text("↻") }
            Button(onClick = { if (!isGameOver && isValidMove(board, currentShape, currentX + 1, currentY)) currentX++ }) { Text("▶") }
            Button(onClick = { 
                if (!isGameOver) {
                    var dropY = currentY
                    while(isValidMove(board, currentShape, currentX, dropY + 1)) { dropY++ }
                    currentY = dropY
                }
            }) { Text("▼") }
        }
        
        OutlinedButton(onClick = onBack) { Text("Kembali ke Menu Game") }
    }
}
