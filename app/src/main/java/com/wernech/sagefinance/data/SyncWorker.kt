package com.wernech.sagefinance.data

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.wernech.sagefinance.data.database.AppDatabase

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val database = AppDatabase.getDatabase(applicationContext)
        val repository = TransactionRepository(RetrofitClient.api, database.transactionDao())

        return try {
            repository.syncUnsyncedTransactions()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
