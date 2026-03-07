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
        emitAll(dao.getTransactions(email))
    }.onStart {
        try {
            Log.d("SAGE_DEBUG", "Buscando transações para o email: $email")
            val networkTransactions = api.getTransactions(email)
            Log.d("SAGE_DEBUG", "Sucesso AWS: Recebidas ${networkTransactions.size} transações")
            
            if (networkTransactions.isNotEmpty()) {
                // FILTRAGEM DE SEGURANÇA: Removemos itens com datas inválidas (String em vez de Long)
                // O Logcat mostrou um item com date="2026-03-07" que quebrava o GSON/Room
                val validTransactions = networkTransactions.filter { 
                    // Se o campo date não for um número válido, o it.date virá como 0 ou dará erro antes
                    it.date > 0 
                }.map { 
                    it.copy(userEmail = email, isSynced = true) 
                }
                
                dao.insertTransactions(validTransactions)
                Log.d("SAGE_DEBUG", "Dados blindados inseridos no Room: ${validTransactions.size} itens")
            }
        } catch (e: Exception) {
            Log.e("SAGE_DEBUG", "Erro FATAL na sincronização: ${e.message}")
            // Aqui evitamos que o app quebre se o JSON vier com formato inesperado
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
        } catch (e: Exception) {}
    }

    suspend fun syncUnsyncedTransactions() {
        val unsynced = dao.getUnsyncedTransactions()
        unsynced.forEach { transaction ->
            try {
                api.saveTransaction(transaction)
                dao.insertTransaction(transaction.copy(isSynced = true))
            } catch (e: Exception) {}
        }
    }

    suspend fun clearAll() {
        dao.clearAll()
        dao.clearAllDeleted()
    }
}
