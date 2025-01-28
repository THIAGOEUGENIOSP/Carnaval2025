// Estado da aplicação
let state = {
    participants: [],
    expenses: [],
    activeTab: 'overview'
};

// Função para formatar valores monetários em Real brasileiro
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Carregar dados do localStorage
function loadFromStorage() {
    const savedState = localStorage.getItem('carnivalExpenses');
    if (savedState) {
        state = JSON.parse(savedState);
        updateUI();
    }
}

// Salvar dados no localStorage
function saveToStorage() {
    localStorage.setItem('carnivalExpenses', JSON.stringify(state));
}

// Gerenciamento de Tabs
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        const tabId = button.dataset.tab;
        document.getElementById(tabId).classList.add('active');
        state.activeTab = tabId;
        updateUI();
    });
});

// Gerenciamento de Participantes
document.getElementById('participantForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const type = document.getElementById('type').value;
    const children = parseInt(document.getElementById('children').value);

    state.participants.push({
        id: Date.now(),
        name,
        type,
        children
    });

    saveToStorage();
    updateUI();
    e.target.reset();
});

// Gerenciamento de Despesas
document.getElementById('expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('expenseType').value;
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);

    state.expenses.push({
        id: Date.now(),
        type,
        description,
        amount
    });

    saveToStorage();
    updateUI();
    e.target.reset();
});

// Atualização da UI
function updateUI() {
    updateParticipantsList();
    updateExpensesList();
    updateSummary();
    updateChart();
    updateReports();
}

function updateParticipantsList() {
    const list = document.getElementById('participantsList');
    list.innerHTML = state.participants.map(participant => `
        <div class="list-item">
            <div>
                <strong>${participant.name}</strong> - 
                ${participant.type} 
                ${participant.children > 0 ? `(${participant.children} crianças)` : ''}
            </div>
            <button class="delete-btn" onclick="deleteParticipant(${participant.id})">
                Remover
            </button>
        </div>
    `).join('');
}

function updateExpensesList() {
    const list = document.getElementById('expensesList');
    list.innerHTML = state.expenses.map(expense => `
        <div class="list-item">
            <div>
                <strong>${expense.description}</strong> - 
                ${expense.type} - 
                ${formatCurrency(expense.amount)}
            </div>
            <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                Remover
            </button>
        </div>
    `).join('');
}

function updateSummary() {
    const totalAdults = calculateTotalAdults();
    const totalExpenses = calculateTotalExpenses();
    const amountPerAdult = totalAdults > 0 ? totalExpenses / totalAdults : 0;
    const totalCouples = state.participants.filter(p => p.type === 'casal').length;
    const amountPerCouple = totalCouples > 0 ? amountPerAdult * 2 : 0;

    document.getElementById('totalAdults').textContent = totalAdults;
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('amountPerAdult').textContent = formatCurrency(amountPerAdult);
    document.getElementById('amountPerCouple').textContent = formatCurrency(amountPerCouple);
}

function updateChart() {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    const expensesByCategory = {
        aluguel: 0,
        comida: 0,
        essenciais: 0
    };

    state.expenses.forEach(expense => {
        expensesByCategory[expense.type] += expense.amount;
    });

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Aluguel', 'Comida', 'Itens Essenciais'],
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: ['#FF4B82', '#FFB800', '#36A2EB']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateReports() {
    const summary = document.getElementById('expenseSummary');
    const totalExpenses = calculateTotalExpenses();
    const totalAdults = calculateTotalAdults();
    const amountPerAdult = totalAdults > 0 ? totalExpenses / totalAdults : 0;

    const expensesByCategory = {
        aluguel: 0,
        comida: 0,
        essenciais: 0
    };

    state.expenses.forEach(expense => {
        expensesByCategory[expense.type] += expense.amount;
    });

    summary.innerHTML = `
        <h3>Resumo de Despesas</h3>
        <p>Total de Participantes Adultos: ${totalAdults}</p>
        <p>Total de Despesas: ${formatCurrency(totalExpenses)}</p>
        <p>Valor por Adulto: ${formatCurrency(amountPerAdult)}</p>
        <h3>Despesas por Categoria</h3>
        <p>Aluguel: ${formatCurrency(expensesByCategory.aluguel)}</p>
        <p>Comida: ${formatCurrency(expensesByCategory.comida)}</p>
        <p>Itens Essenciais: ${formatCurrency(expensesByCategory.essenciais)}</p>
    `;
}

// Funções Auxiliares
function calculateTotalAdults() {
    return state.participants.reduce((total, participant) => {
        return total + (participant.type === 'casal' ? 2 : 1);
    }, 0);
}

function calculateTotalExpenses() {
    return state.expenses.reduce((total, expense) => total + expense.amount, 0);
}

function deleteParticipant(id) {
    state.participants = state.participants.filter(p => p.id !== id);
    saveToStorage();
    updateUI();
}

function deleteExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveToStorage();
    updateUI();
}

// Exportar Relatório
document.getElementById('exportButton').addEventListener('click', () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-carnaval-2025.csv';
    a.click();
});

function generateReport() {
    let report = 'Relatório de Despesas - Carnaval 2025\n\n';
    
    report += 'Participantes:\n';
    state.participants.forEach(p => {
        report += `${p.name},${p.type},${p.children} crianças\n`;
    });
    
    report += '\nDespesas:\n';
    state.expenses.forEach(e => {
        report += `${e.type},${e.description},${formatCurrency(e.amount)}\n`;
    });
    
    const totalExpenses = calculateTotalExpenses();
    const totalAdults = calculateTotalAdults();
    report += `\nTotal de Despesas,${formatCurrency(totalExpenses)}\n`;
    report += `Valor por Adulto,${formatCurrency(totalExpenses / totalAdults)}\n`;
    
    return report;
}

// Inicialização
loadFromStorage();
updateUI();