package com.wernech.sagefinance

import android.os.Bundle
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.wernech.sagefinance.data.BiometricHelper
import com.wernech.sagefinance.data.RetrofitClient
import com.wernech.sagefinance.data.SyncWorker
import com.wernech.sagefinance.data.TransactionRepository
import com.wernech.sagefinance.data.UserPreferences
import com.wernech.sagefinance.data.database.AppDatabase
import com.wernech.sagefinance.ui.*
import com.wernech.sagefinance.ui.theme.SAGEFinanceTheme
import kotlinx.coroutines.flow.first

class MainActivity : FragmentActivity() {
    private lateinit var userPreferences: UserPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        userPreferences = UserPreferences(this)
        
        val database = AppDatabase.getDatabase(this)
        val repository = TransactionRepository(RetrofitClient.api, database.transactionDao())

        val syncConstraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(syncConstraints)
            .build()
        WorkManager.getInstance(this).enqueue(syncRequest)

        enableEdgeToEdge()
        setContent {
            val viewModel: MainViewModel = viewModel(
                factory = MainViewModelFactory(userPreferences, repository)
            )
            
            val uiState by viewModel.uiState.collectAsState()
            val isAuthenticated by viewModel.isAuthenticated.collectAsState()
            val currentUserName by viewModel.currentUserName.collectAsState()
            
            var isCheckingAuth by remember { mutableStateOf(true) }

            LaunchedEffect(Unit) {
                val savedEmail = userPreferences.userEmail.first()
                val savedName = userPreferences.userName.first()
                val savedToken = userPreferences.userToken.first() // Recupera o Token salvo
                
                if (savedEmail != null && savedName != null) {
                    if (BiometricHelper.isBiometricAvailable(this@MainActivity)) {
                        BiometricHelper.showBiometricPrompt(
                            activity = this@MainActivity,
                            onSuccess = {
                                viewModel.setAuthenticated(savedEmail, savedName, savedToken)
                                isCheckingAuth = false
                            },
                            onError = { error ->
                                Toast.makeText(this@MainActivity, "Erro na biometria: $error", Toast.LENGTH_SHORT).show()
                                isCheckingAuth = false
                            }
                        )
                    } else {
                        viewModel.setAuthenticated(savedEmail, savedName, savedToken)
                        isCheckingAuth = false
                    }
                } else {
                    isCheckingAuth = false
                }
            }

            SAGEFinanceTheme {
                if (isCheckingAuth) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else {
                    val navController = rememberNavController()
                    
                    NavHost(
                        navController = navController,
                        startDestination = if (isAuthenticated) Screen.Main.route else Screen.Login.route
                    ) {
                        composable(Screen.Login.route) {
                            LoginScreen(
                                onLoginSuccess = { email, password ->
                                    viewModel.loginUser(email, password, 
                                        onSuccess = {
                                            navController.navigate(Screen.Main.route) {
                                                popUpTo(Screen.Login.route) { inclusive = true }
                                            }
                                        },
                                        onError = { Toast.makeText(this@MainActivity, it, Toast.LENGTH_SHORT).show() }
                                    )
                                },
                                onRegisterClick = { user ->
                                    viewModel.registerUser(user,
                                        onSuccess = {
                                            viewModel.loginUser(user.email, user.password,
                                                onSuccess = {
                                                    navController.navigate(Screen.Main.route) {
                                                        popUpTo(Screen.Login.route) { inclusive = true }
                                                    }
                                                },
                                                onError = { Toast.makeText(this@MainActivity, it, Toast.LENGTH_SHORT).show() }
                                            )
                                        },
                                        onError = { Toast.makeText(this@MainActivity, it, Toast.LENGTH_SHORT).show() }
                                    )
                                }
                            )
                        }
                        composable(Screen.Main.route) {
                            val transactions = if (uiState is MainUiState.Success) (uiState as MainUiState.Success).transactions else emptyList()
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
                                    viewModel.deleteTransaction(id) { Toast.makeText(this@MainActivity, it, Toast.LENGTH_SHORT).show() }
                                },
                                onLogoutClick = {
                                    viewModel.logout()
                                    navController.navigate(Screen.Login.route) {
                                        popUpTo(Screen.Main.route) { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable(
                            route = Screen.Form.route,
                            arguments = listOf(navArgument("transactionId") { type = NavType.StringType })
                        ) { backStackEntry ->
                            val id = backStackEntry.arguments?.getString("transactionId")
                            val transactions = if (uiState is MainUiState.Success) (uiState as MainUiState.Success).transactions else emptyList()
                            val transactionToEdit = if (id != "new") transactions.find { it.id == id } else null
                            
                            TransactionFormScreen(
                                initialTransaction = transactionToEdit,
                                onSaveClick = { newTransaction ->
                                    viewModel.saveTransaction(newTransaction,
                                        onSuccess = { navController.popBackStack() },
                                        onError = { Toast.makeText(this@MainActivity, it, Toast.LENGTH_SHORT).show() }
                                    )
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
}
