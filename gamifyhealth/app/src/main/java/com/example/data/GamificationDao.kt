package com.example.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface GamificationDao {
    @Query("SELECT * FROM users_gamification WHERE id = 1 LIMIT 1")
    fun getUserGamification(): Flow<UserGamification?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserGamification(user: UserGamification)

    @Update
    suspend fun updateUserGamification(user: UserGamification)

    @Query("SELECT * FROM daily_quests ORDER BY date DESC LIMIT 3")
    fun getDailyQuests(): Flow<List<DailyQuest>>

    @Insert
    suspend fun insertDailyQuests(quests: List<DailyQuest>)
    
    @Update
    suspend fun updateDailyQuest(quest: DailyQuest)

    @Query("SELECT * FROM reward_history ORDER BY createdAt DESC")
    fun getRewardHistory(): Flow<List<RewardHistory>>

    @Insert
    suspend fun insertRewardHistory(history: RewardHistory)

    @Query("SELECT * FROM journals ORDER BY createdAt DESC")
    fun getJournals(): Flow<List<Journal>>

    @Insert
    suspend fun insertJournal(journal: Journal)

    @Update
    suspend fun updateJournal(journal: Journal)
}
