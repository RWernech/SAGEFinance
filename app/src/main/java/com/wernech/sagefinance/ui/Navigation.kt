package com.wernech.sagefinance.ui

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Main : Screen("main_container")
    object List : Screen("transaction_list") // Agora parte do Pager
    object Charts : Screen("charts") // Agora parte do Pager
    object Form : Screen("transaction_form/{transactionId}") {
        fun createRoute(transactionId: String) = "transaction_form/$transactionId"
    }
}
