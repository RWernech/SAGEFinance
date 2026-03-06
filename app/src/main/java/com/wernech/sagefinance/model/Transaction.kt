package com.wernech.sagefinance.model

import java.util.UUID

enum class TransactionType(val label: String) {
    INCOME("Entrada"),
    EXPENSE("Gasto/Saída"),
    INVESTMENT("Investimento")
}

enum class TransactionCategory(val label: String) {
    BILL("Conta"),
    MARKET("Mercado"),
    STREAMING("Streaming"),
    LEISURE("Lazer"),
    OTHERS("Outros")
}

enum class PaymentMethod(val label: String) {
    PIX("Pix"),
    CREDIT("Crédito"),
    DEBIT("Débito")
}

data class Transaction(
    val id: String = UUID.randomUUID().toString(),
    val description: String,
    val amount: Double,
    val date: Long = System.currentTimeMillis(),
    val type: TransactionType,
    val category: TransactionCategory,
    val paymentMethod: PaymentMethod,
    val userEmail: String? = null // Para vincular o gasto a um usuário
)
