package com.example.data

import kotlinx.coroutines.flow.Flow

class GamificationRepository(private val dao: GamificationDao) {
    val userProfile: Flow<UserGamification?> = dao.getUserGamification()
    val dailyQuests: Flow<List<DailyQuest>> = dao.getDailyQuests()
    val rewardHistory: Flow<List<RewardHistory>> = dao.getRewardHistory()
    val journals: Flow<List<Journal>> = dao.getJournals()

    suspend fun initializeUserIfNeeded() {
        // Assume user is inserted already or insert default
        dao.insertUserGamification(UserGamification(latestGad7Status = "Moderate"))
    }

    suspend fun generateDailyQuests(status: String) {
        val targetModifier = when (status) {
            "Moderate" -> 0.8
            "Severe" -> 0.5
            else -> 1.0
        }
        
        val quests = listOf(
            DailyQuest(questDescription = "Main Word Puzzle", targetAmount = (1 * targetModifier).coerceAtLeast(1.0).toInt()),
            DailyQuest(questDescription = "Buka Modul Gamifikasi", targetAmount = 1),
            DailyQuest(questDescription = "Tulis Jurnal Harian", targetAmount = 1)
        )
        dao.insertDailyQuests(quests)
    }

    suspend fun addReward(history: RewardHistory) {
        dao.insertRewardHistory(history)
    }
    
    suspend fun updateQuest(quest: DailyQuest) {
        dao.updateDailyQuest(quest)
    }
    
    suspend fun addExperience(xp: Int, points: Int) {
        // simplistic approach, ignoring race conditions for local scope
        // since we ideally would collect and update, but for now we let ViewModel handle it
    }

    suspend fun addJournal(journal: Journal) {
        dao.insertJournal(journal)
    }

    suspend fun updateJournal(journal: Journal) {
        dao.updateJournal(journal)
    }
    
    suspend fun updateUser(user: UserGamification) {
        dao.updateUserGamification(user)
    }
}
