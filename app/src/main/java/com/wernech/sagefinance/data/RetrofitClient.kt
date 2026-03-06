package com.wernech.sagefinance.data

import com.wernech.sagefinance.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private const val BASE_URL = "https://uqnedctqy444gt6kwb6a2cwahy0dlofz.lambda-url.sa-east-1.on.aws/"
    
    // Agora pegamos a chave direto do BuildConfig
    private val API_KEY = BuildConfig.API_KEY

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
                .header("x-api-key", API_KEY)
                .method(original.method, original.body)
            
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
