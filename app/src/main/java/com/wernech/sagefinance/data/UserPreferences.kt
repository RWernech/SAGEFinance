package com.wernech.sagefinance.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class UserPreferences(context: Context) {
    
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_user_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    // Usamos StateFlow para manter a compatibilidade com a UI que espera um Flow
    private val _userEmail = MutableStateFlow(sharedPreferences.getString(KEY_USER_EMAIL, null))
    val userEmail: Flow<String?> = _userEmail.asStateFlow()

    private val _userName = MutableStateFlow(sharedPreferences.getString(KEY_USER_NAME, null))
    val userName: Flow<String?> = _userName.asStateFlow()

    private val _userToken = MutableStateFlow(sharedPreferences.getString(KEY_USER_TOKEN, null))
    val userToken: Flow<String?> = _userToken.asStateFlow()

    fun saveSession(email: String, name: String, token: String = "") {
        sharedPreferences.edit().apply {
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_NAME, name)
            putString(KEY_USER_TOKEN, token)
            apply()
        }
        // Notifica os flows
        _userEmail.value = email
        _userName.value = name
        _userToken.value = token
    }

    fun clear() {
        sharedPreferences.edit().clear().apply()
        _userEmail.value = null
        _userName.value = null
        _userToken.value = null
    }

    companion object {
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_TOKEN = "user_token"
    }
}
