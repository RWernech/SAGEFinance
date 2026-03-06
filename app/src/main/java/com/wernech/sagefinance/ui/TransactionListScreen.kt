package com.wernech.sagefinance.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wernech.sagefinance.model.Transaction
import com.wernech.sagefinance.model.TransactionType
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun TransactionListScreen(
    transactions: List<Transaction>,
    selectedMonth: Int,
    selectedYear: Int,
    onAddTransactionClick: () -> Unit,
    onTransactionClick: (Transaction) -> Unit,
    onDeleteTransaction: (String) -> Unit
) {
    val filteredTransactions = transactions.filter {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        cal.timeInMillis = it.date
        val monthMatch = if (selectedMonth == -1) true else cal.get(Calendar.MONTH) == selectedMonth
        monthMatch && cal.get(Calendar.YEAR) == selectedYear
    }

    val totalIncome = filteredTransactions.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
    val totalExpense = filteredTransactions.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
    val totalInvested = filteredTransactions.filter { it.type == TransactionType.INVESTMENT }.sumOf { it.amount }
    val balance = totalIncome - totalExpense - totalInvested

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = onAddTransactionClick) {
                Icon(Icons.Default.Add, contentDescription = "Adicionar Operação")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            SummaryHeader(
                income = totalIncome,
                expense = totalExpense,
                invested = totalInvested,
                balance = balance
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val sortedTransactions = filteredTransactions.sortedByDescending { it.date }
                items(sortedTransactions) { transaction ->
                    TransactionItem(
                        transaction = transaction,
                        onClick = { onTransactionClick(transaction) },
                        onDelete = { onDeleteTransaction(transaction.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun TransactionItem(
    transaction: Transaction,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    val amountColor = when (transaction.type) {
        TransactionType.INCOME -> Color(0xFF4CAF50)
        TransactionType.EXPENSE -> Color(0xFFF44336)
        TransactionType.INVESTMENT -> Color(0xFF2196F3)
    }

    val amountPrefix = when (transaction.type) {
        TransactionType.INCOME -> "+"
        TransactionType.EXPENSE -> "-"
        TransactionType.INVESTMENT -> ""
    }

    val dateFormatter = remember {
        SimpleDateFormat("dd/MM/yyyy", Locale("pt", "BR")).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
    }
    val formattedDate = dateFormatter.format(Date(transaction.date))

    var showDeleteDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = transaction.description,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Text(
                    text = "${transaction.category.label} • ${transaction.paymentMethod.label} • $formattedDate",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "$amountPrefix ${NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(transaction.amount)}",
                    fontWeight = FontWeight.Bold,
                    color = amountColor
                )
                IconButton(onClick = { showDeleteDialog = true }) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Excluir",
                        tint = MaterialTheme.colorScheme.error.copy(alpha = 0.6f),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Excluir Operação") },
            text = { Text("Tem certeza que deseja apagar este registro?") },
            confirmButton = {
                TextButton(onClick = { 
                    onDelete()
                    showDeleteDialog = false 
                }) {
                    Text("Excluir", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun SummaryHeader(
    income: Double,
    expense: Double,
    invested: Double,
    balance: Double
) {
    Surface(
        tonalElevation = 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                SummaryItem("Entradas", income, Color(0xFF4CAF50), Modifier.weight(1f))
                SummaryItem("Saídas", expense, Color(0xFFF44336), Modifier.weight(1f))
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                SummaryItem("Investido", invested, Color(0xFF2196F3), Modifier.weight(1f))
                SummaryItem("Saldo", balance, if (balance >= 0) Color(0xFF4CAF50) else Color(0xFFF44336), Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun SummaryItem(label: String, value: Double, color: Color, modifier: Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelMedium)
        Text(
            text = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(value),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = color,
            fontSize = 14.sp
        )
    }
}
