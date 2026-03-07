package com.wernech.sagefinance.data

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.wernech.sagefinance.data.database.AppDatabase
import kotlinx.coroutines.flow.first

class SyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val database = AppDatabase.getDatabase(applicationContext)
        val userPreferences = UserPreferences(applicationContext)
        val repository = TransactionRepository(RetrofitClient.api, database.transactionDao())

        return try {
            // BUSCA O TOKEN SALVO: Essencial para o Worker ter permissão na AWS
            val token = userPreferences.userToken.first()
            if (!token.isNullOrEmpty()) {
                RetrofitClient.setToken(token)
                Log.d("SAGE_SYNC", "Worker: Token configurado, iniciando sincronia")
                repository.syncUnsyncedTransactions()
                Result.success()
            } else {
                Log.w("SAGE_SYNC", "Worker: Nenhum token encontrado, cancelando")
                Result.failure()
            }
        } catch (e: Exception) {
            Log.e("SAGE_SYNC", "Worker: Erro na sincronia: ${e.message}")
            Result.retry()
        }
    }
}
