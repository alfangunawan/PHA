package com.example.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreScreen(viewModel: GamificationViewModel) {
    val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Tukar Poin") }) }
    ) { padding ->
        Column(
            modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            userProfile?.let { user ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Poin Kamu", style = MaterialTheme.typography.titleMedium)
                        Text("${user.rewardPoints} points", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }

            Text("Item Tersedia", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            StoreItem(name = "Tema Dark Mode Ceria", cost = 50) { viewModel.redeemReward(50) }
            StoreItem(name = "Avatar Kucing Oyen", cost = 100) { viewModel.redeemReward(100) }
            StoreItem(name = "Skin Puzzle Spesial", cost = 150) { viewModel.redeemReward(150) }
        }
    }
}

@Composable
fun StoreItem(name: String, cost: Int, onRedeem: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(name, style = MaterialTheme.typography.bodyLarge)
                Text("Harga: $cost Poin", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
            }
            Button(onClick = onRedeem) {
                Text("Tukar")
            }
        }
    }
}
