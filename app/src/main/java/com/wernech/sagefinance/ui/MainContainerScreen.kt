package com.wernech.sagefinance.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wernech.sagefinance.model.Transaction
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MainContainerScreen(
    userName: String,
    transactions: List<Transaction>,
    onAddTransactionClick: () -> Unit,
    onTransactionClick: (Transaction) -> Unit,
    onDeleteTransaction: (String) -> Unit
) {
    var selectedMonth by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.MONTH)) }
    var selectedYear by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.YEAR)) }
    var showMonthPicker by remember { mutableStateOf(false) }

    val pagerState = rememberPagerState(pageCount = { 2 })

    Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
        Surface(tonalElevation = 2.dp) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Olá, $userName",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val monthName = if (selectedMonth == -1) {
                        "Ano Todo"
                    } else {
                        SimpleDateFormat("MMMM", Locale("pt", "BR"))
                            .format(Calendar.getInstance().apply { set(Calendar.MONTH, selectedMonth) }.time)
                            .replaceFirstChar { it.uppercase() }
                    }
                    
                    Text(
                        text = "$monthName $selectedYear",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                    
                    TextButton(onClick = { showMonthPicker = true }) {
                        Text("Mudar Período")
                    }
                }

                TabRow(selectedPageIndex = pagerState.currentPage)
            }
        }

        HorizontalPager(
            state = pagerState,
            modifier = Modifier.weight(1f)
        ) { page ->
            when (page) {
                0 -> TransactionListScreen(
                    transactions = transactions,
                    selectedMonth = selectedMonth,
                    selectedYear = selectedYear,
                    onAddTransactionClick = onAddTransactionClick,
                    onTransactionClick = onTransactionClick,
                    onDeleteTransaction = onDeleteTransaction
                )
                1 -> ChartsScreen(
                    transactions = transactions,
                    selectedMonth = selectedMonth,
                    selectedYear = selectedYear
                )
            }
        }
    }

    if (showMonthPicker) {
        MonthYearPickerDialog(
            initialMonth = selectedMonth,
            initialYear = selectedYear,
            onDismiss = { showMonthPicker = false },
            onConfirm = { m, y ->
                selectedMonth = m
                selectedYear = y
                showMonthPicker = false
            }
        )
    }
}

@Composable
fun TabRow(selectedPageIndex: Int) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        horizontalArrangement = Arrangement.Center
    ) {
        Indicator(isSelected = selectedPageIndex == 0)
        Spacer(modifier = Modifier.width(8.dp))
        Indicator(isSelected = selectedPageIndex == 1)
    }
}

@Composable
fun Indicator(isSelected: Boolean) {
    Box(
        modifier = Modifier
            .size(width = 32.dp, height = 4.dp)
            .background(
                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.LightGray,
                shape = MaterialTheme.shapes.small
            )
    )
}

@Composable
fun MonthYearPickerDialog(
    initialMonth: Int,
    initialYear: Int,
    onDismiss: () -> Unit,
    onConfirm: (Int, Int) -> Unit
) {
    var tempMonth by remember { mutableIntStateOf(initialMonth) }
    var tempYear by remember { mutableIntStateOf(initialYear) }
    val months = listOf("Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Selecionar Período") },
        text = {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { tempYear-- }) { Text("-") }
                    Text(text = tempYear.toString(), fontWeight = FontWeight.Bold)
                    IconButton(onClick = { tempYear++ }) { Text("+") }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Surface(
                    onClick = { tempMonth = -1 },
                    color = if (tempMonth == -1) MaterialTheme.colorScheme.primaryContainer else Color.Transparent,
                    shape = MaterialTheme.shapes.small,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Ano Todo",
                        modifier = Modifier.padding(8.dp),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                for (row in 0..3) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        for (col in 0..2) {
                            val monthIdx = row * 3 + col
                            val isSelected = tempMonth == monthIdx
                            Box(
                                modifier = Modifier
                                    .padding(4.dp)
                                    .background(
                                        if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent,
                                        shape = MaterialTheme.shapes.small
                                    )
                                    .clickable { tempMonth = monthIdx }
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = months[monthIdx],
                                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(tempMonth, tempYear) }) { Text("OK") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}
