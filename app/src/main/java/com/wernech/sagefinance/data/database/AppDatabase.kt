package com.wernech.sagefinance.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.wernech.sagefinance.model.DeletedTransaction
import com.wernech.sagefinance.model.Transaction

@Database(entities = [Transaction::class, DeletedTransaction::class], version = 2, exportSchema = false)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "sage_finance_db"
                )
                .fallbackToDestructiveMigration() // Como adicionamos uma tabela, vamos resetar o banco para simplificar
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
