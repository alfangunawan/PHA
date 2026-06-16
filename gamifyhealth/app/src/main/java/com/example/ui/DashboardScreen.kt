package com.example.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(viewModel: GamificationViewModel) {
    val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()
    val dailyQuests by viewModel.dailyQuests.collectAsStateWithLifecycle()
    val rewardHistory by viewModel.rewardHistory.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.markModuleOpened()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("GamifyHealth Dashboard") }) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                userProfile?.let { user ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Level ${user.currentLevel}", style = MaterialTheme.typography.headlineMedium)
                            Text("Total XP: ${user.totalXp} | Points: ${user.rewardPoints}")
                            Text("Streak: ${user.currentStreak} Hari", color = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.height(8.dp))
                            LinearProgressIndicator(
                                progress = { (user.totalXp % 100) / 100f },
                                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp))
                            )
                        }
                    }
                }
            }

            item {
                Text("Misi Harian", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            }

            items(dailyQuests) { quest ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (quest.isCompleted) Icons.Default.CheckCircle else Icons.Outlined.Circle,
                            contentDescription = null,
                            tint = if (quest.isCompleted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(quest.questDescription, fontWeight = FontWeight.SemiBold)
                            Text("${quest.currentAmount} / ${quest.targetAmount}", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }

            item {
                Button(
                    onClick = { viewModel.addRewardFromMindfulness() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Simulate Mindfulness Session (API Mock)")
                }
            }

            item {
                Text("Riwayat Aktivitas", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            }

            items(rewardHistory) { history ->
                ListItem(
                    headlineContent = { Text(history.activityType) },
                    supportingContent = { Text("Sumber: ${history.sourceModule}") },
                    trailingContent = { Text("+${history.xpEarned} XP", color = MaterialTheme.colorScheme.primary) }
                )
                HorizontalDivider()
            }
        }
    }
}
