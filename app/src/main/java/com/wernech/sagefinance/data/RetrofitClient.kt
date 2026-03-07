package com.wernech.sagefinance.data

import com.wernech.sagefinance.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private const val BASE_URL = "https://uqnedctqy444gt6kwb6a2cwahy0dlofz.lambda-url.sa-east-1.on.aws/"
    private val API_KEY = BuildConfig.API_KEY
    
    // Variável para armazenar o token JWT em memória após o login
    private var authToken: String? = null

    fun setToken(token: String?) {
        authToken = token
    }

    private val logging = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
                .header("x-api-key", API_KEY)
            
            // Se tivermos um token, adicionamos no cabeçalho Authorization
            authToken?.let {
                requestBuilder.header("Authorization", "Bearer $it")
            }
            
            chain.proceed(requestBuilder.build())
        }
        .addInterceptor(logging)
        .build()

    val api: TransactionApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(client)
            .build()
            .create(TransactionApi::class.java)
    }
}
