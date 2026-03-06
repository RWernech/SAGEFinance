package com.wernech.sagefinance.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wernech.sagefinance.model.Transaction
import com.wernech.sagefinance.model.TransactionType
import java.text.NumberFormat
import java.util.*

@Composable
fun ChartsScreen(
    transactions: List<Transaction>,
    selectedMonth: Int,
    selectedYear: Int
) {
    val filteredTransactions = transactions.filter {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        cal.timeInMillis = it.date
        val monthMatch = if (selectedMonth == -1) true else cal.get(Calendar.MONTH) == selectedMonth
        monthMatch && cal.get(Calendar.YEAR) == selectedYear
    }

    // Dados para o comparativo (Mês Anterior ou Ano Anterior)
    val prevTotals = rememberPrevPeriodTotals(transactions, selectedMonth, selectedYear)
    val currentTotals = calculateTotals(filteredTransactions)

    val expensesByCategory = filteredTransactions
        .filter { it.type == TransactionType.EXPENSE }
        .groupBy { it.category }
        .mapValues { it.value.sumOf { t -> t.amount } }

    val expensesByMethod = filteredTransactions
        .filter { it.type == TransactionType.EXPENSE }
        .groupBy { it.paymentMethod }
        .mapValues { it.value.sumOf { t -> t.amount } }

    val totalExpense = expensesByCategory.values.sum()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // --- GRÁFICO 1: POR CATEGORIA ---
        item {
            Text(
                text = "Gastos por Categoria",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        if (expensesByCategory.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                    Text("Nenhum gasto neste período")
                }
            }
        } else {
            item { PieChart(expensesByCategory.mapKeys { it.key.label }) }
            item { LegendList(expensesByCategory.mapKeys { it.key.label }) }
        }

        item { HorizontalDivider() }

        // --- GRÁFICO 2: POR MÉTODO DE OPERAÇÃO ---
        item {
            Text(
                text = "Gastos por Operação",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        if (expensesByMethod.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                    Text("Nenhum gasto neste período")
                }
            }
        } else {
            item { PieChart(expensesByMethod.mapKeys { it.key.label }) }
            item { LegendList(expensesByMethod.mapKeys { it.key.label }) }
        }

        item { HorizontalDivider() }

        // --- GRÁFICO 3: COMPARATIVO PERÍODO ANTERIOR ---
        item {
            Text(
                text = if (selectedMonth == -1) "Comparativo Ano Anterior" else "Comparativo Mês Anterior",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            ComparisonChart(currentTotals, prevTotals)
        }
        
        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

@Composable
fun ComparisonChart(current: Map<TransactionType, Double>, prev: Map<TransactionType, Double>) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        ComparisonBar("Entradas", current[TransactionType.INCOME] ?: 0.0, prev[TransactionType.INCOME] ?: 0.0, Color(0xFF4CAF50), TransactionType.INCOME)
        ComparisonBar("Saídas", current[TransactionType.EXPENSE] ?: 0.0, prev[TransactionType.EXPENSE] ?: 0.0, Color(0xFFF44336), TransactionType.EXPENSE)
        ComparisonBar("Investido", current[TransactionType.INVESTMENT] ?: 0.0, prev[TransactionType.INVESTMENT] ?: 0.0, Color(0xFF2196F3), TransactionType.INVESTMENT)
    }
}

@Composable
fun ComparisonBar(label: String, currentValue: Double, prevValue: Double, color: Color, type: TransactionType) {
    val maxVal = maxOf(currentValue, prevValue, 1.0)
    
    // Cálculo da porcentagem
    val percentDiff = if (prevValue > 0) {
        ((currentValue - prevValue) / prevValue) * 100
    } else if (currentValue > 0) {
        100.0
    } else {
        0.0
    }

    // Lógica de cor e sinal baseada na saúde financeira
    // Para Saída (Gasto), se currentValue < prevValue é positivo (+)
    val isGoodChange = when(type) {
        TransactionType.EXPENSE -> currentValue <= prevValue
        else -> currentValue >= prevValue
    }
    
    val displayPercent = if (type == TransactionType.EXPENSE) -percentDiff else percentDiff
    val percentColor = if (isGoodChange) Color(0xFF4CAF50) else Color(0xFFF44336)
    val percentSign = if (displayPercent >= 0) "+" else ""

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(text = label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(4.dp))
        
        // Barra Atual
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.6f)
                    .height(12.dp)
                    .background(Color.LightGray.copy(alpha = 0.3f), shape = MaterialTheme.shapes.small)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth((currentValue / maxVal).toFloat().coerceIn(0f, 1f))
                        .fillMaxHeight()
                        .background(color, shape = MaterialTheme.shapes.small)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(currentValue),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
            
            if (prevValue > 0 || currentValue > 0) {
                Text(
                    text = " ($percentSign${String.format("%.1f", displayPercent)}%)",
                    fontSize = 11.sp,
                    color = percentColor,
                    fontWeight = FontWeight.Medium
                )
            }
        }
        
        Spacer(modifier = Modifier.height(2.dp))
        
        // Barra Anterior
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.6f)
                    .height(8.dp)
                    .background(Color.LightGray.copy(alpha = 0.3f), shape = MaterialTheme.shapes.small)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth((prevValue / maxVal).toFloat().coerceIn(0f, 1f))
                        .fillMaxHeight()
                        .background(color.copy(alpha = 0.4f), shape = MaterialTheme.shapes.small)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Anterior: ${NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(prevValue)}",
                fontSize = 10.sp,
                color = Color.Gray
            )
        }
    }
}

@Composable
fun rememberPrevPeriodTotals(transactions: List<Transaction>, month: Int, year: Int): Map<TransactionType, Double> {
    return androidx.compose.runtime.remember(transactions, month, year) {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        val prevTransactions = if (month == -1) {
            // Comparar com o ano anterior
            transactions.filter {
                cal.timeInMillis = it.date
                cal.get(Calendar.YEAR) == year - 1
            }
        } else {
            // Comparar com o mês anterior
            val targetMonth = if (month == 0) 11 else month - 1
            val targetYear = if (month == 0) year - 1 else year
            transactions.filter {
                cal.timeInMillis = it.date
                cal.get(Calendar.MONTH) == targetMonth && cal.get(Calendar.YEAR) == targetYear
            }
        }
        calculateTotals(prevTransactions)
    }
}

fun calculateTotals(transactions: List<Transaction>): Map<TransactionType, Double> {
    return transactions.groupBy { it.type }
        .mapValues { entry -> entry.value.sumOf { it.amount } }
}

@Composable
fun PieChart(data: Map<String, Double>) {
    val colors = listOf(
        Color(0xFFF44336), Color(0xFFE91E63), Color(0xFF9C27B0),
        Color(0xFF673AB7), Color(0xFF3F51B5), Color(0xFF2196F3),
        Color(0xFF00BCD4), Color(0xFF009688), Color(0xFF4CAF50)
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(160.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(140.dp)) {
            var startAngle = -90f
            val total = data.values.sum().toFloat()
            if (total == 0f) return@Canvas
            
            data.values.forEachIndexed { index, value ->
                val sweepAngle = (value.toFloat() / total) * 360f
                drawArc(
                    color = colors[index % colors.size],
                    startAngle = startAngle,
                    sweepAngle = sweepAngle,
                    useCenter = false,
                    style = Stroke(width = 30.dp.toPx())
                )
                startAngle += sweepAngle
            }
        }
    }
}

@Composable
fun LegendList(data: Map<String, Double>) {
    val colors = listOf(
        Color(0xFFF44336), Color(0xFFE91E63), Color(0xFF9C27B0),
        Color(0xFF673AB7), Color(0xFF3F51B5), Color(0xFF2196F3),
        Color(0xFF00BCD4), Color(0xFF009688), Color(0xFF4CAF50)
    )

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        data.entries.forEachIndexed { index, entry ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        modifier = Modifier.size(12.dp),
                        color = colors[index % colors.size],
                        shape = MaterialTheme.shapes.small
                    ) {}
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = entry.key, fontSize = 14.sp)
                }
                Text(
                    text = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(entry.value),
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}
