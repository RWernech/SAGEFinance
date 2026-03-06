package com.wernech.sagefinance.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.wernech.sagefinance.model.PaymentMethod
import com.wernech.sagefinance.model.Transaction
import com.wernech.sagefinance.model.TransactionCategory
import com.wernech.sagefinance.model.TransactionType
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionFormScreen(
    initialTransaction: Transaction? = null,
    onSaveClick: (Transaction) -> Unit,
    onBackClick: () -> Unit
) {
    var description by remember { mutableStateOf(initialTransaction?.description ?: "") }
    var amount by remember { mutableStateOf(initialTransaction?.amount?.toString() ?: "") }
    var selectedType by remember { mutableStateOf(initialTransaction?.type ?: TransactionType.EXPENSE) }
    var selectedCategory by remember { mutableStateOf(initialTransaction?.category ?: TransactionCategory.OTHERS) }
    var selectedMethod by remember { mutableStateOf(initialTransaction?.paymentMethod ?: PaymentMethod.DEBIT) }
    
    // Estado da Data
    val initialDate = initialTransaction?.date ?: System.currentTimeMillis()
    val datePickerState = rememberDatePickerState(initialSelectedDateMillis = initialDate)
    var showDatePicker by remember { mutableStateOf(false) }
    
    val dateFormatter = remember {
        SimpleDateFormat("dd/MM/yyyy", Locale("pt", "BR")).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
    }
    
    val formattedDate = remember(datePickerState.selectedDateMillis) {
        val dateMillis = datePickerState.selectedDateMillis ?: System.currentTimeMillis()
        dateFormatter.format(Date(dateMillis))
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (initialTransaction == null) "Nova Operação" else "Editar Operação") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Descrição") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Valor") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Box {
                OutlinedTextField(
                    value = formattedDate,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Data") },
                    trailingIcon = {
                        IconButton(onClick = { showDatePicker = true }) {
                            Icon(Icons.Default.DateRange, contentDescription = "Selecionar Data")
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .clickable { showDatePicker = true }
                )
            }

            ExposedDropdownMenuBox(
                label = "Tipo",
                options = TransactionType.values(),
                selectedOption = selectedType,
                onOptionSelected = { selectedType = it },
                labelProvider = { it.label }
            )

            ExposedDropdownMenuBox(
                label = "Categoria",
                options = TransactionCategory.values(),
                selectedOption = selectedCategory,
                onOptionSelected = { selectedCategory = it },
                labelProvider = { it.label }
            )

            ExposedDropdownMenuBox(
                label = "Operação/Método",
                options = PaymentMethod.values(),
                selectedOption = selectedMethod,
                onOptionSelected = { selectedMethod = it },
                labelProvider = { it.label }
            )

            Button(
                onClick = {
                    val amountValue = amount.toDoubleOrNull() ?: 0.0
                    onSaveClick(
                        Transaction(
                            id = initialTransaction?.id ?: java.util.UUID.randomUUID().toString(),
                            description = description,
                            amount = amountValue,
                            date = datePickerState.selectedDateMillis ?: System.currentTimeMillis(),
                            type = selectedType,
                            category = selectedCategory,
                            paymentMethod = selectedMethod,
                            userEmail = initialTransaction?.userEmail
                        )
                    )
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = description.isNotBlank() && amount.isNotBlank()
            ) {
                Text(if (initialTransaction == null) "Salvar" else "Atualizar")
            }
        }
    }

    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancelar")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun <T> ExposedDropdownMenuBox(
    label: String,
    options: Array<T>,
    selectedOption: T,
    onOptionSelected: (T) -> Unit,
    labelProvider: (T) -> String
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded },
        modifier = Modifier.fillMaxWidth()
    ) {
        OutlinedTextField(
            value = labelProvider(selectedOption),
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
            modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable).fillMaxWidth()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(labelProvider(option)) },
                    onClick = {
                        onOptionSelected(option)
                        expanded = false
                    },
                    contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding
                )
            }
        }
    }
}
