package com.wernech.sagefinance.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "deleted_transactions")
data class DeletedTransaction(
    @PrimaryKey
    val id: String,
    val userEmail: String? = null
)
