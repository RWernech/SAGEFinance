package com.wernech.sagefinance.data

import com.wernech.sagefinance.data.database.TransactionDao
import com.wernech.sagefinance.model.DeletedTransaction
import com.wernech.sagefinance.model.Transaction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.onStart

class TransactionRepository(
    private val api: TransactionApi,
    private val dao: TransactionDao
) {
    fun getTransactions(email: String): Flow<List<Transaction>> = flow {
        emitAll(dao.getTransactions(email))
    }.onStart {
        try {
            val networkTransactions = api.getTransactions(email)
            dao.insertTransactions(networkTransactions.map { it.copy(isSynced = true) })
        } catch (e: Exception) {
        }
    }

    suspend fun saveTransaction(transaction: Transaction) {
        val localTransaction = transaction.copy(isSynced = false)
        dao.insertTransaction(localTransaction)

        try {
            api.saveTransaction(transaction)
            dao.insertTransaction(transaction.copy(isSynced = true))
        } catch (e: Exception) {
        }
    }

    suspend fun deleteTransaction(id: String) {
        // Remove localmente
        dao.deleteTransaction(id)
        
        // Registra que este ID deve ser deletado na nuvem
        dao.insertDeletedTransaction(DeletedTransaction(id))

        // Tenta deletar na rede agora
        try {
            api.deleteTransaction(id)
            // Se sucesso, remove da fila de exclusão
            dao.removePendingDeletion(id)
        } catch (e: Exception) {
            // Se falhar, ficará na fila para o Worker tentar depois
        }
    }

    suspend fun syncUnsyncedTransactions() {
        // 1. Sincroniza inserções/edições
        val unsynced = dao.getUnsyncedTransactions()
        unsynced.forEach { transaction ->
            try {
                api.saveTransaction(transaction)
                dao.insertTransaction(transaction.copy(isSynced = true))
            } catch (e: Exception) {
            }
        }

        // 2. Sincroniza exclusões
        val pendingDeletions = dao.getPendingDeletions()
        pendingDeletions.forEach { deleted ->
            try {
                api.deleteTransaction(deleted.id)
                dao.removePendingDeletion(deleted.id)
            } catch (e: Exception) {
            }
        }
    }

    suspend fun clearAll() {
        dao.clearAll()
        dao.clearAllDeleted()
    }
}
