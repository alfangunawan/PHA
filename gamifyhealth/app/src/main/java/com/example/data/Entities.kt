package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users_gamification")
data class UserGamification(
    @PrimaryKey val id: Int = 1,
    val userId: String = "user-123",
    val totalXp: Int = 0,
    val currentLevel: Int = 1,
    val rewardPoints: Int = 0,
    val currentStreak: Int = 0,
    val lastActiveDate: Long = System.currentTimeMillis(),
    val latestGad7Status: String = "Minimal"
)

@Entity(tableName = "daily_quests")
data class DailyQuest(
    @PrimaryKey(autoGenerate = true) val questId: Int = 0,
    val questDescription: String,
    val targetAmount: Int,
    val currentAmount: Int = 0,
    val isCompleted: Boolean = false,
    val date: Long = System.currentTimeMillis()
)

@Entity(tableName = "reward_history")
data class RewardHistory(
    @PrimaryKey(autoGenerate = true) val historyId: Int = 0,
    val sourceModule: String,
    val activityType: String,
    val xpEarned: Int,
    val pointsEarned: Int,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "journals")
data class Journal(
    @PrimaryKey(autoGenerate = true) val journalId: Int = 0,
    val journalContent: String,
    val aiSentiment: String? = null,
    val aiReflectionPrompt: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val isEdited: Boolean = false
)
