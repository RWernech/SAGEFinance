package com.wernech.sagefinance.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.wernech.sagefinance.data.TransactionRepository
import com.wernech.sagefinance.data.UserPreferences

class MainViewModelFactory(
    private val userPreferences: UserPreferences,
    private val repository: TransactionRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MainViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return MainViewModel(userPreferences, repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
