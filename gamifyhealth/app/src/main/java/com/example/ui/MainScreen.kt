package com.example.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GamificationApp(viewModel: GamificationViewModel) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: "dashboard"

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                    label = { Text("Dashboard") },
                    selected = currentRoute == "dashboard",
                    onClick = { navController.navigate("dashboard") { launchSingleTop = true } }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.VideogameAsset, contentDescription = "Games") },
                    label = { Text("Games") },
                    selected = currentRoute == "games",
                    onClick = { navController.navigate("games") { launchSingleTop = true } }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Book, contentDescription = "Journal") },
                    label = { Text("Journal") },
                    selected = currentRoute == "journal",
                    onClick = { navController.navigate("journal") { launchSingleTop = true } }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Storefront, contentDescription = "Store") },
                    label = { Text("Store") },
                    selected = currentRoute == "store",
                    onClick = { navController.navigate("store") { launchSingleTop = true } }
                )
            }
        }
    ) { innerPadding ->
        NavHost(navController = navController, startDestination = "dashboard", modifier = Modifier.padding(innerPadding)) {
            composable("dashboard") { DashboardScreen(viewModel) }
            composable("games") { GamesScreen(viewModel) }
            composable("journal") { JournalScreen(viewModel) }
            composable("store") { StoreScreen(viewModel) }
        }
    }
}
