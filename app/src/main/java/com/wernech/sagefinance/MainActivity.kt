package com.wernech.sagefinance

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.wernech.sagefinance.data.BiometricHelper
import com.wernech.sagefinance.data.RetrofitClient
import com.wernech.sagefinance.data.UserPreferences
import com.wernech.sagefinance.model.Transaction
import com.wernech.sagefinance.ui.LoginScreen
import com.wernech.sagefinance.ui.MainContainerScreen
import com.wernech.sagefinance.ui.Screen
import com.wernech.sagefinance.ui.TransactionFormScreen
import com.wernech.sagefinance.ui.theme.SAGEFinanceTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : FragmentActivity() {
    private lateinit var userPreferences: UserPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        userPreferences = UserPreferences(this)
        
        enableEdgeToEdge()
        setContent {
            SAGEFinanceTheme {
                val navController = rememberNavController()
                var transactions by remember { mutableStateOf(listOf<Transaction>()) }
                var currentUserEmail by remember { mutableStateOf<String?>(null) }
                var currentUserName by remember { mutableStateOf<String?>(null) }
                var isCheckingAuth by remember { mutableStateOf(true) }
                var isAuthenticated by remember { mutableStateOf(false) }

                LaunchedEffect(Unit) {
                    val savedEmail = userPreferences.userEmail.first()
                    val savedName = userPreferences.userName.first()
                    
                    if (savedEmail != null) {
                        // Se já tem login, pede biometria
                        if (BiometricHelper.isBiometricAvailable(this@MainActivity)) {
                            BiometricHelper.showBiometricPrompt(
                                activity = this@MainActivity,
                                onSuccess = {
                                    currentUserEmail = savedEmail
                                    currentUserName = savedName
                                    loadTransactions(savedEmail) { transactions = it }
                                    isAuthenticated = true
                                    isCheckingAuth = false
                                },
                                onError = { error ->
                                    Toast.makeText(this@MainActivity, "Erro na biometria: $error", Toast.LENGTH_SHORT).show()
                                    isCheckingAuth = false
                                    // Se der erro, ele fica na tela de login por segurança
                                }
                            )
                        } else {
                            // Se não tem biometria no celular, entra direto (ou poderia pedir senha)
                            currentUserEmail = savedEmail
                            currentUserName = savedName
                            loadTransactions(savedEmail) { transactions = it }
                            isAuthenticated = true
                            isCheckingAuth = false
                        }
                    } else {
                        isCheckingAuth = false
                    }
                }

                if (isCheckingAuth) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else {
                    NavHost(
                        navController = navController,
                        startDestination = if (currentUserEmail != null && isAuthenticated) Screen.Main.route else Screen.Login.route
                    ) {
                        composable(Screen.Login.route) {
                            LoginScreen(
                                onLoginSuccess = { email, password ->
                                    loginUser(email, password, navController) { emailRes, nameRes ->
                                        currentUserEmail = emailRes
                                        currentUserName = nameRes
                                        isAuthenticated = true
                                        loadTransactions(emailRes) { transactions = it }
                                    }
                                },
                                onRegisterClick = { user ->
                                    registerUser(user) {
                                        loginUser(user.email, user.password, navController) { emailRes, nameRes ->
                                            currentUserEmail = emailRes
                                            currentUserName = nameRes
                                            isAuthenticated = true
                                            loadTransactions(emailRes) { transactions = it }
                                        }
                                    }
                                }
                            )
                        }
                        composable(Screen.Main.route) {
                            MainContainerScreen(
                                userName = currentUserName ?: "Usuário",
                                transactions = transactions,
                                onAddTransactionClick = {
                                    navController.navigate(Screen.Form.createRoute("new"))
                                },
                                onTransactionClick = { transaction ->
                                    navController.navigate(Screen.Form.createRoute(transaction.id))
                                },
                                onDeleteTransaction = { id ->
                                    deleteTransaction(id) {
                                        loadTransactions(currentUserEmail!!) { transactions = it }
                                    }
                                }
                            )
                        }
                        composable(
                            route = Screen.Form.route,
                            arguments = listOf(navArgument("transactionId") { type = NavType.StringType })
                        ) { backStackEntry ->
                            val id = backStackEntry.arguments?.getString("transactionId")
                            val transactionToEdit = if (id != "new") transactions.find { it.id == id } else null
                            
                            TransactionFormScreen(
                                initialTransaction = transactionToEdit,
                                onSaveClick = { newTransaction ->
                                    val transactionWithUser = newTransaction.copy(userEmail = currentUserEmail)
                                    saveTransaction(transactionWithUser) {
                                        loadTransactions(currentUserEmail!!) { transactions = it }
                                        navController.popBackStack()
                                    }
                                },
                                onBackClick = {
                                    navController.popBackStack()
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun loginUser(email: String, password: String, navController: androidx.navigation.NavController, onDone: (String, String) -> Unit) {
        lifecycleScope.launch {
            try {
                val credentials = mapOf("email" to email, "password" to password)
                val response = RetrofitClient.api.loginUser(credentials)
                val name = response["name"] ?: "Usuário"
                
                userPreferences.saveSession(email, name)
                onDone(email, name)
                navController.navigate(Screen.Main.route) {
                    popUpTo(Screen.Login.route) { inclusive = true }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(this@MainActivity, "Erro ao realizar login", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun registerUser(user: com.wernech.sagefinance.model.User, onSuccess: () -> Unit) {
        lifecycleScope.launch {
            try {
                RetrofitClient.api.registerUser(user)
                onSuccess()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Erro ao cadastrar", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun loadTransactions(email: String, onSuccess: (List<Transaction>) -> Unit) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getTransactions(email)
                onSuccess(response)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun saveTransaction(transaction: Transaction, onSuccess: () -> Unit) {
        lifecycleScope.launch {
            try {
                RetrofitClient.api.saveTransaction(transaction)
                onSuccess()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Erro ao salvar", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun deleteTransaction(id: String, onSuccess: () -> Unit) {
        lifecycleScope.launch {
            try {
                RetrofitClient.api.deleteTransaction(id)
                onSuccess()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Erro ao excluir", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
