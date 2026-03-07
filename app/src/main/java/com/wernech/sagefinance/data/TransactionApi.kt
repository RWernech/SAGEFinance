package com.wernech.sagefinance.data

import com.wernech.sagefinance.model.Transaction
import com.wernech.sagefinance.model.User
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface TransactionApi {
    // Com JWT, não precisamos mais passar o email na URL para GET e POST
    @GET("/")
    suspend fun getTransactions(): List<Transaction>

    @POST("/")
    suspend fun saveTransaction(@Body transaction: Transaction)

    @DELETE("/")
    suspend fun deleteTransaction(@Query("id") id: String)

    @POST("/")
    suspend fun registerUser(@Body user: User)
    
    @POST("/")
    suspend fun loginUser(@Body credentials: Map<String, String>): Map<String, String>
}
