package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.BuildConfig
import com.example.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class GamificationViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: GamificationRepository

    init {
        val dao = AppDatabase.getDatabase(application).gamificationDao()
        repository = GamificationRepository(dao)
        
        viewModelScope.launch {
            repository.initializeUserIfNeeded()
            repository.dailyQuests.firstOrNull()?.let {
                if (it.isEmpty()) {
                    repository.generateDailyQuests("Moderate")
                }
            }
        }
    }

    val userProfile: StateFlow<UserGamification?> = repository.userProfile
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val dailyQuests: StateFlow<List<DailyQuest>> = repository.dailyQuests
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val rewardHistory: StateFlow<List<RewardHistory>> = repository.rewardHistory
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val journals: StateFlow<List<Journal>> = repository.journals
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun completeQuest(quest: DailyQuest) {
        viewModelScope.launch {
            val updatedQuest = quest.copy(currentAmount = quest.targetAmount, isCompleted = true)
            repository.updateQuest(updatedQuest)
            
            // Add Reward
            addReward(RewardHistory(
                sourceModule = "gamification",
                activityType = quest.questDescription,
                xpEarned = 50,
                pointsEarned = 10
            ))
        }
    }

    fun addRewardFromMindfulness() {
        viewModelScope.launch {
            addReward(RewardHistory(
                sourceModule = "mindfulness",
                activityType = "Selesai Audio Relaksasi",
                xpEarned = 20,
                pointsEarned = 3
            ))
        }
    }
    
    private suspend fun addReward(history: RewardHistory) {
        repository.addReward(history)
        
        val user = userProfile.value ?: return
        var newXp = user.totalXp + history.xpEarned
        var newLevel = user.currentLevel
        if (newXp >= newLevel * 100) {
            newLevel++
            newXp -= (newLevel-1) * 100
        }
        val newPoints = user.rewardPoints + history.pointsEarned
        
        repository.updateUser(user.copy(
            totalXp = newXp,
            currentLevel = newLevel,
            rewardPoints = newPoints
        ))
    }

    fun submitJournal(text: String) {
        viewModelScope.launch {
            // Mock AI behavior for sentiment and reflection prompt
            val sentiment = if (text.contains("cemas", ignoreCase = true)) "Negative" else "Neutral"
            val prompt = if (sentiment == "Negative") {
                "Tampaknya kamu sedikit cemas. Apa yang paling kamu khawatirkan hari ini?"
            } else {
                "Terima kasih sudah berbagi! Pertahankan pikiran positifmu."
            }
            
            repository.addJournal(Journal(
                journalContent = text,
                aiSentiment = sentiment,
                aiReflectionPrompt = prompt
            ))
            
            // Complete journaling quest
            dailyQuests.value.find { it.questDescription.contains("Jurnal") && !it.isCompleted }?.let {
                completeQuest(it)
            }
        }
    }

    fun updateJournal(journal: Journal, newText: String) {
        viewModelScope.launch {
            val sentiment = if (newText.contains("cemas", ignoreCase = true)) "Negative" else "Neutral"
            val prompt = if (sentiment == "Negative") {
                "Tampaknya kamu sedikit cemas. Apa yang paling kamu khawatirkan hari ini?"
            } else {
                "Terima kasih sudah berbagi! Pertahankan pikiran positifmu."
            }
            
            val updated = journal.copy(
                journalContent = newText,
                aiSentiment = sentiment,
                aiReflectionPrompt = prompt,
                updatedAt = System.currentTimeMillis(),
                isEdited = true
            )
            repository.updateJournal(updated)
        }
    }
    
    fun playGame() {
        viewModelScope.launch {
            dailyQuests.value.find { it.questDescription.contains("Puzzle") && !it.isCompleted }?.let {
                completeQuest(it)
            }
        }
    }
    
    fun markModuleOpened() {
        viewModelScope.launch {
            dailyQuests.value.find { it.questDescription.contains("Buka Modul Gamifikasi") && !it.isCompleted }?.let {
                completeQuest(it)
            }
        }
    }
    
    fun redeemReward(cost: Int) {
        viewModelScope.launch {
            val user = userProfile.value ?: return@launch
            if (user.rewardPoints >= cost) {
                repository.updateUser(user.copy(rewardPoints = user.rewardPoints - cost))
            }
        }
    }
}
