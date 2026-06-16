package com.example.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.Journal
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JournalScreen(viewModel: GamificationViewModel) {
    var journalText by remember { mutableStateOf("") }
    var editingJournal by remember { mutableStateOf<Journal?>(null) }
    val journals by viewModel.journals.collectAsStateWithLifecycle()

    val sdf = remember { SimpleDateFormat("dd MMM yyyy, HH:mm", Locale("id", "ID")) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Jurnal Refleksi") }) }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            OutlinedTextField(
                value = journalText,
                onValueChange = { journalText = it },
                modifier = Modifier.fillMaxWidth().height(150.dp),
                placeholder = { Text("Tuliskan perasaanmu hari ini...") },
                maxLines = 5
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (editingJournal != null) {
                    Button(
                        onClick = {
                            editingJournal = null
                            journalText = ""
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Batal")
                    }
                }
                
                Button(
                    onClick = { 
                        if (journalText.isNotBlank()) {
                            if (editingJournal != null) {
                                viewModel.updateJournal(editingJournal!!, journalText)
                                editingJournal = null
                            } else {
                                viewModel.submitJournal(journalText)
                            }
                            journalText = ""
                        }
                    },
                    modifier = Modifier.weight(2f)
                ) {
                    Text(if (editingJournal != null) "Update Jurnal" else "Simpan dan Analisis dengan AI")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("Riwayat Jurnal", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(journals) { journal ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column {
                                    Text(
                                        text = sdf.format(Date(journal.createdAt)),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (journal.isEdited) {
                                        Text(
                                            text = "(Diedit pada ${sdf.format(Date(journal.updatedAt))})",
                                            style = MaterialTheme.typography.labelSmall,
                                            fontStyle = FontStyle.Italic,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                IconButton(onClick = {
                                    editingJournal = journal
                                    journalText = journal.journalContent
                                }) {
                                    Icon(Icons.Default.Edit, contentDescription = "Edit Jurnal")
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(journal.journalContent, style = MaterialTheme.typography.bodyMedium)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Sentimen AI: ${journal.aiSentiment}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                            journal.aiReflectionPrompt?.let { prompt ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(prompt, style = MaterialTheme.typography.bodySmall, fontStyle = FontStyle.Italic, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }
}
