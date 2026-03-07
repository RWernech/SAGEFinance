package com.wernech.sagefinance.data

import android.util.Log
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
        // Observa o banco local
        emitAll(dao.getTransactions(email))
    }.onStart {
        try {
            Log.d("SAGE_DEBUG", "Buscando transações via JWT para o email: $email")
            
            // Agora não passamos o email, o RetrofitClient injeta o Token JWT
            // e a Lambda descobre quem é o usuário.
            val networkTransactions = api.getTransactions()
            Log.d("SAGE_DEBUG", "Sucesso AWS: Recebidas ${networkTransactions.size} transações")
            
            if (networkTransactions.isNotEmpty()) {
                // FILTRAGEM DE SEGURANÇA: Removemos itens com datas inválidas
                val validTransactions = networkTransactions.filter { 
                    it.date > 0 
                }.map { 
                    it.copy(userEmail = email, isSynced = true) 
                }
                
                dao.insertTransactions(validTransactions)
                Log.d("SAGE_DEBUG", "Dados blindados inseridos no Room: ${validTransactions.size} itens")
            }
        } catch (e: Exception) {
            Log.e("SAGE_DEBUG", "Erro na sincronização: ${e.message}")
        }
    }

    suspend fun saveTransaction(transaction: Transaction) {
        val localTransaction = transaction.copy(isSynced = false)
        dao.insertTransaction(localTransaction)
        try {
            api.saveTransaction(transaction)
            dao.insertTransaction(transaction.copy(isSynced = true))
        } catch (e: Exception) {
            Log.e("SAGE_DEBUG", "Erro ao salvar na AWS: ${e.message}")
        }
    }

    suspend fun deleteTransaction(id: String) {
        dao.deleteTransaction(id)
        dao.insertDeletedTransaction(DeletedTransaction(id))
        try {
            api.deleteTransaction(id)
            dao.removePendingDeletion(id)
        } catch (e: Exception) {
            Log.e("SAGE_DEBUG", "Erro ao deletar na AWS: ${e.message}")
        }
    }

    suspend fun syncUnsyncedTransactions() {
        val unsynced = dao.getUnsyncedTransactions()
        unsynced.forEach { transaction ->
            try {
                api.saveTransaction(transaction)
                dao.insertTransaction(transaction.copy(isSynced = true))
            } catch (e: Exception) {
                Log.e("SAGE_DEBUG", "Erro na sincronização de upload: ${e.message}")
            }
        }
        
        val pendingDeletions = dao.getPendingDeletions()
        pendingDeletions.forEach { deleted ->
            try {
                api.deleteTransaction(deleted.id)
                dao.removePendingDeletion(deleted.id)
            } catch (e: Exception) {
                Log.e("SAGE_DEBUG", "Erro na sincronização de exclusão: ${e.message}")
            }
        }
    }

    suspend fun clearAll() {
        dao.clearAll()
        dao.clearAllDeleted()
    }
}
