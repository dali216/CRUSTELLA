package tn.crustella.manager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Orange = Color(0xFFFF6A00)
private val Ink = Color(0xFF151515)
private val Panel = Color(0xFF242424)
private val Muted = Color(0xFFAAAAAA)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { CrustellaApp() }
    }
}

@Composable
fun CrustellaApp() {
    var selected by remember { mutableStateOf("Accueil") }
    var role by remember { mutableStateOf("Admin") }
    MaterialTheme(colorScheme = darkColorScheme(primary = Orange, background = Ink, surface = Panel)) {
        Scaffold(
            containerColor = Ink,
            bottomBar = {
                NavigationBar(containerColor = Panel, contentColor = Color.White) {
                    listOf("Accueil", "Commandes", "Équipe", "Plus").forEach { item ->
                        NavigationBarItem(
                            selected = selected == item,
                            onClick = { selected = item },
                            icon = {
                                Icon(
                                    when (item) {
                                        "Accueil" -> Icons.Default.Home
                                        "Commandes" -> Icons.Default.ReceiptLong
                                        "Équipe" -> Icons.Default.Groups
                                        else -> Icons.Default.GridView
                                    }, contentDescription = item
                                )
                            },
                            label = { Text(item) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Orange,
                                selectedTextColor = Orange,
                                indicatorColor = Orange.copy(alpha = .15f),
                                unselectedIconColor = Muted,
                                unselectedTextColor = Muted
                            )
                        )
                    }
                }
            }
        ) { padding ->
            Column(Modifier.fillMaxSize().padding(padding)) {
                Header(role) { role = it }
                when (selected) {
                    "Accueil" -> Dashboard()
                    "Commandes" -> ModulePage("Commandes", "Les commandes enregistrées dans votre espace apparaîtront ici.", Icons.Default.ReceiptLong)
                    "Équipe" -> ModulePage("Gestion de l’équipe", "Employés, présences, horaires, congés et fiches de paie.", Icons.Default.Groups)
                    else -> MoreModules()
                }
            }
        }
    }
}

@Composable
private fun Header(role: String, onRole: (String) -> Unit) {
    Row(
        Modifier.fillMaxWidth().background(Panel).padding(horizontal = 18.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text("CRUSTELLA", color = Orange, fontSize = 21.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
            Text("MANAGER  •  BUSINESS CONTROL", color = Muted, fontSize = 9.sp, letterSpacing = 1.sp)
        }
        var expanded by remember { mutableStateOf(false) }
        Box {
            Text(role.uppercase(), color = Orange, fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable { expanded = true }.background(Orange.copy(alpha = .12f), RoundedCornerShape(20.dp)).padding(horizontal = 14.dp, vertical = 9.dp))
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                listOf("Admin", "Manager", "Employé").forEach {
                    DropdownMenuItem(text = { Text(it) }, onClick = { onRole(it); expanded = false })
                }
            }
        }
    }
}

@Composable
private fun Dashboard() {
    LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Text("Tableau de bord", color = Color.White, fontSize = 25.sp, fontWeight = FontWeight.Bold)
            Text("Vue générale de votre activité", color = Muted, fontSize = 13.sp)
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) {
                Column(Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CloudOff, null, tint = Orange)
                        Spacer(Modifier.width(8.dp))
                        Text("Connexion à la base de données", color = Color.White, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(Modifier.height(7.dp))
                    Text(
                        if (BuildConfig.SUPABASE_URL.isBlank() || BuildConfig.SUPABASE_ANON_KEY.isBlank())
                            "Configuration requise : ajoutez les clés Supabase pour activer les données réelles."
                        else "Identifiants détectés. La connexion sécurisée sera activée après configuration du projet Supabase.",
                        color = Muted, fontSize = 12.sp
                    )
                }
            }
        }
        item { Text("INDICATEURS", color = Orange, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp) }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricCard("Chiffre d'affaires", "—", "TND", Modifier.weight(1f))
                    MetricCard("Commandes", "—", "aujourd'hui", Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricCard("Dépenses", "—", "TND", Modifier.weight(1f))
                    MetricCard("Bénéfice net", "—", "TND", Modifier.weight(1f))
                }
            }
        }
        item { Text("ACCÈS RAPIDE", color = Orange, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp) }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                QuickLink("Fiches techniques & marges", Icons.Default.Restaurant)
                QuickLink("Présences & heures travaillées", Icons.Default.Schedule)
                QuickLink("Stock & approvisionnement", Icons.Default.Inventory2)
                QuickLink("Caisse, dépenses & rapports", Icons.Default.AccountBalanceWallet)
                QuickLink("Annonces & demandes de congé", Icons.Default.Campaign)
            }
        }
    }
}

@Composable
private fun MetricCard(title: String, value: String, unit: String, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(14.dp)) {
            Text(title, color = Muted, fontSize = 11.sp)
            Spacer(Modifier.height(9.dp))
            Text(value, color = Color.White, fontSize = 25.sp, fontWeight = FontWeight.Bold)
            Text(unit, color = Orange, fontSize = 10.sp)
        }
    }
}

@Composable
private fun QuickLink(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Row(
        Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(13.dp)).padding(15.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = Orange)
        Spacer(Modifier.width(12.dp))
        Text(label, color = Color.White, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Icon(Icons.Default.ChevronRight, null, tint = Muted)
    }
}

@Composable
private fun ModulePage(title: String, description: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Column(Modifier.fillMaxSize().padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Icon(icon, null, tint = Orange, modifier = Modifier.size(36.dp))
        Text(title, color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text(description, color = Muted)
        Spacer(Modifier.height(8.dp))
        Text("Aucune donnée affichée tant que votre base Crustella n’est pas connectée.", color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun MoreModules() {
    val modules = listOf(
        "Fiches techniques & coûts", "Planning & jours de travail", "Fiches de paie",
        "Stock & inventaire", "Revenus & dépenses", "Bénéfices & rapports",
        "Congés & absences", "Annonces & notifications", "Paramètres Supabase"
    )
    LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Text("Tous les modules", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold) }
        items(modules.size) { index -> QuickLink(modules[index], Icons.Default.ChevronRight) }
    }
}
