package com.wernech.sagefinance.data.database

import androidx.room.*
import com.wernech.sagefinance.model.DeletedTransaction
import com.wernech.sagefinance.model.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions WHERE userEmail = :email")
    fun getTransactions(email: String): Flow<List<Transaction>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: Transaction)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransactions(transactions: List<Transaction>)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteTransaction(id: String)

    @Query("SELECT * FROM transactions WHERE isSynced = 0")
    suspend fun getUnsyncedTransactions(): List<Transaction>

    @Query("DELETE FROM transactions")
    suspend fun clearAll()

    // Métodos para transações deletadas offline
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeletedTransaction(deletedTransaction: DeletedTransaction)

    @Query("SELECT * FROM deleted_transactions")
    suspend fun getPendingDeletions(): List<DeletedTransaction>

    @Query("DELETE FROM deleted_transactions WHERE id = :id")
    suspend fun removePendingDeletion(id: String)

    @Query("DELETE FROM deleted_transactions")
    suspend fun clearAllDeleted()
}
