package com.wernech.sagefinance.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

enum class TransactionType(val label: String) {
    INCOME("Entrada"),
    EXPENSE("Gasto/Saída"),
    INVESTMENT("Investimento")
}

enum class TransactionCategory(val label: String) {
    BILL("Conta"),
    PHARMACY("Farmácia"),
    FINANCING("Financiamento"),
    LEISURE("Lazer"),
    TRANSPORT("Locomoção"),
    MAINTENANCE("Manutenção"),
    MARKET("Mercado"),
    OTHERS("Outros"),
    STREAMING("Streaming"),
    VETERINARY("Veterinário")
}

enum class PaymentMethod(val label: String) {
    CREDIT("Crédito"),
    DEBIT("Débito"),
    PIX("Pix"),
    RECEIVED("Recebido"),
    TRANSFER("Transferência"),
    VR("VR")
}

@Entity(tableName = "transactions")
data class Transaction(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val description: String,
    val amount: Double,
    val date: Long = System.currentTimeMillis(),
    val type: TransactionType,
    val category: TransactionCategory,
    val paymentMethod: PaymentMethod,
    val userEmail: String? = null,
    val isSynced: Boolean = true // Flag para controle de sincronização
)
