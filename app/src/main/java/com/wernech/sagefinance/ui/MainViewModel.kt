package com.wernech.sagefinance.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wernech.sagefinance.data.RetrofitClient
import com.wernech.sagefinance.data.TransactionRepository
import com.wernech.sagefinance.data.UserPreferences
import com.wernech.sagefinance.model.Transaction
import com.wernech.sagefinance.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.util.Locale

sealed class MainUiState {
    object Idle : MainUiState()
    object Loading : MainUiState()
    data class Success(val transactions: List<Transaction>) : MainUiState()
    data class Error(val message: String) : MainUiState()
}

class MainViewModel(
    private val userPreferences: UserPreferences,
    private val repository: TransactionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<MainUiState>(MainUiState.Idle)
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private val _currentUserEmail = MutableStateFlow<String?>(null)
    val currentUserEmail: StateFlow<String?> = _currentUserEmail.asStateFlow()

    private val _currentUserName = MutableStateFlow<String?>(null)
    val currentUserName: StateFlow<String?> = _currentUserName.asStateFlow()

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    fun setAuthenticated(email: String, name: String, token: String?) {
        val cleanEmail = email.lowercase(Locale.ROOT).trim()
        _currentUserEmail.value = cleanEmail
        _currentUserName.value = name
        _isAuthenticated.value = true
        
        // Configura o token no RetrofitClient para as próximas chamadas
        RetrofitClient.setToken(token)
        
        loadTransactions(cleanEmail)
    }

    fun loadTransactions(email: String) {
        val cleanEmail = email.lowercase(Locale.ROOT).trim()
        viewModelScope.launch {
            _uiState.value = MainUiState.Loading
            repository.getTransactions(cleanEmail).collectLatest { transactions ->
                _uiState.value = MainUiState.Success(transactions)
            }
        }
    }

    fun loginUser(email: String, password: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        val cleanEmail = email.lowercase(Locale.ROOT).trim()
        viewModelScope.launch {
            try {
                val credentials = mapOf("email" to cleanEmail, "password" to password)
                val response = RetrofitClient.api.loginUser(credentials)
                
                val name = response["name"] ?: "Usuário"
                val token = response["token"] // NOVO: Pega o token da Lambda
                
                // Configura o token no RetrofitClient imediatamente
                RetrofitClient.setToken(token)
                
                userPreferences.saveSession(cleanEmail, name, token ?: "")
                _currentUserEmail.value = cleanEmail
                _currentUserName.value = name
                _isAuthenticated.value = true
                
                loadTransactions(cleanEmail)
                onSuccess()
            } catch (e: Exception) {
                onError("Erro ao realizar login")
            }
        }
    }

    fun registerUser(user: User, onSuccess: () -> Unit, onError: (String) -> Unit) {
        val cleanEmail = user.email.lowercase(Locale.ROOT).trim()
        val cleanUser = user.copy(email = cleanEmail)
        viewModelScope.launch {
            try {
                RetrofitClient.api.registerUser(cleanUser)
                onSuccess()
            } catch (e: Exception) {
                onError("Erro ao cadastrar")
            }
        }
    }

    fun saveTransaction(transaction: Transaction, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val cleanEmail = _currentUserEmail.value?.lowercase(Locale.ROOT)?.trim() ?: ""
                val transactionWithUser = transaction.copy(userEmail = cleanEmail)
                repository.saveTransaction(transactionWithUser)
                onSuccess()
            } catch (e: Exception) {
                onError("Erro ao salvar")
            }
        }
    }

    fun deleteTransaction(id: String, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.deleteTransaction(id)
            } catch (e: Exception) {
                onError("Erro ao excluir")
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.clearAll()
            userPreferences.clear()
            RetrofitClient.setToken(null) // Limpa o token ao sair
            _currentUserEmail.value = null
            _currentUserName.value = null
            _isAuthenticated.value = false
            _uiState.value = MainUiState.Idle
        }
    }
}
