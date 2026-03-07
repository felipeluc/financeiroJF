/* ============================================
   SISTEMA FINANCEIRO PESSOAL - LÓGICA PRINCIPAL
   ============================================ */

// ============================================
// CONFIGURAÇÕES PREFIXADAS (Fácil Manutenção)
// ============================================

const CONFIG = {
    // Credenciais de usuários
    users: {
        Felipe: { password: "Lucas1515" },
        João: { password: "João123" }
    },

    // Despesas compartilhadas (em parcelas)
    sharedExpenses: [
        {
            name: "Empréstimo 3 mil",
            monthlyValue: 374,
            totalInstallments: 10,
            startMonth: 3, // Março
            startYear: 2025,
            category: "Empréstimo"
        },
        {
            name: "Televisão e Geladeira",
            monthlyValue: 778,
            totalInstallments: 10,
            startMonth: 2, // Fevereiro
            startYear: 2025,
            category: "Eletrônicos"
        },
        {
            name: "Empréstimo 10.800",
            monthlyValue: 813,
            totalInstallments: 18,
            startMonth: 4, // Abril
            startYear: 2025,
            category: "Empréstimo"
        },
        {
            name: "Financiamento da casa",
            monthlyValue: 1280,
            totalInstallments: 420,
            startMonth: 4, // Abril
            startYear: 2025,
            category: "Moradia"
        },
        {
            name: "Seguro geladeira",
            monthlyValue: 104,
            totalInstallments: 12,
            startMonth: 4, // Abril
            startYear: 2025,
            category: "Seguro"
        }
    ],

    // Despesas específicas de Felipe
    felipeExpenses: [
        {
            name: "Casa",
            monthlyValue: 300,
            totalInstallments: 24,
            category: "Moradia"
        },
        {
            name: "TV Mãe",
            monthlyValue: 45.50,
            totalInstallments: 18,
            category: "Eletrônicos"
        }
    ],

    // Despesas específicas de João
    joaoExpenses: [
        {
            name: "Air frier",
            monthlyValue: 37.77,
            totalInstallments: 18,
            startMonth: 1, // Janeiro
            startYear: 2025,
            category: "Eletrônicos"
        },
        {
            name: "Televisão",
            monthlyValue: 72.23,
            totalInstallments: 10,
            startMonth: 3, // Março
            startYear: 2025,
            category: "Eletrônicos"
        }
    ]
};

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================

let appState = {
    currentUser: null,
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
    salary: 0,
    customExpenses: [],
    editingExpenseId: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadUserData();
    updateCurrentDate();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Login
    document.querySelectorAll('.user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => selectUser(e.target.closest('.user-btn').dataset.user));
    });

    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('backBtn').addEventListener('click', backToUserSelection);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.closest('.tab-btn').dataset.tab));
    });

    // Calendar
    document.getElementById('prevMonthBtn').addEventListener('click', previousMonth);
    document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);

    // Expenses
    document.getElementById('addExpenseBtn').addEventListener('click', openAddExpenseModal);
    document.getElementById('editSalaryBtn').addEventListener('click', openSalaryModal);

    // Modals
    document.getElementById('closeModalBtn').addEventListener('click', closeExpenseModal);
    document.getElementById('cancelBtn').addEventListener('click', closeExpenseModal);
    document.getElementById('expenseForm').addEventListener('submit', saveExpense);

    document.getElementById('closeSalaryModalBtn').addEventListener('click', closeSalaryModal);
    document.getElementById('cancelSalaryBtn').addEventListener('click', closeSalaryModal);
    document.getElementById('salaryForm').addEventListener('submit', saveSalary);

    // Password input
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
}

// ============================================
// LOGIN LOGIC
// ============================================

function selectUser(username) {
    appState.currentUser = username;
    document.getElementById('passwordForm').style.display = 'flex';
    document.getElementById('passwordInput').focus();
}

function backToUserSelection() {
    appState.currentUser = null;
    document.getElementById('passwordForm').style.display = 'none';
    document.getElementById('passwordInput').value = '';
}

function login() {
    const password = document.getElementById('passwordInput').value;
    const correctPassword = CONFIG.users[appState.currentUser]?.password;

    if (password === correctPassword) {
        showScreen('dashboardScreen');
        loadUserData();
        updateDashboard();
        document.getElementById('passwordInput').value = '';
    } else {
        alert('Senha incorreta!');
        document.getElementById('passwordInput').value = '';
    }
}

function logout() {
    appState.currentUser = null;
    appState.salary = 0;
    showScreen('loginScreen');
    backToUserSelection();
}

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ============================================
// DATA MANAGEMENT
// ============================================

function loadUserData() {
    const storageKey = `financeiro_${appState.currentUser}`;
    const userData = localStorage.getItem(storageKey);

    if (userData) {
        const data = JSON.parse(userData);
        appState.salary = data.salary || 0;
        appState.customExpenses = data.customExpenses || [];
    } else {
        appState.salary = 0;
        appState.customExpenses = [];
    }
}

function saveUserData() {
    const storageKey = `financeiro_${appState.currentUser}`;
    const userData = {
        salary: appState.salary,
        customExpenses: appState.customExpenses
    };
    localStorage.setItem(storageKey, JSON.stringify(userData));
}

// ============================================
// EXPENSE CALCULATIONS
// ============================================

function getExpensesForMonth(month, year) {
    const expenses = [];

    // Despesas compartilhadas
    CONFIG.sharedExpenses.forEach(expense => {
        if (isExpenseActiveInMonth(expense, month, year)) {
            expenses.push({
                ...expense,
                isShared: true,
                value: expense.monthlyValue / 2 // Dividido entre Felipe e João
            });
        }
    });

    // Despesas específicas do usuário
    const userExpenses = appState.currentUser === 'Felipe' ? CONFIG.felipeExpenses : CONFIG.joaoExpenses;
    userExpenses.forEach(expense => {
        if (isExpenseActiveInMonth(expense, month, year)) {
            expenses.push({
                ...expense,
                isShared: false,
                value: expense.monthlyValue
            });
        }
    });

    // Despesas customizadas do usuário
    appState.customExpenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year) {
            expenses.push({
                ...expense,
                isCustom: true,
                value: expense.value
            });
        }
    });

    return expenses;
}

function isExpenseActiveInMonth(expense, month, year) {
    const startMonth = expense.startMonth || 1;
    const startYear = expense.startYear || 2025;

    // Calcular mês e ano de início
    let currentMonth = startMonth;
    let currentYear = startYear;
    let installmentCount = 0;

    while (installmentCount < expense.totalInstallments) {
        if (currentMonth === month && currentYear === year) {
            return true;
        }

        installmentCount++;
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
    }

    return false;
}

function getTotalExpensesForMonth(month, year) {
    const expenses = getExpensesForMonth(month, year);
    return expenses.reduce((total, exp) => total + exp.value, 0);
}

function getBalance() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthExpenses = getTotalExpensesForMonth(currentMonth, currentYear);
    return appState.salary - monthExpenses;
}

// ============================================
// DASHBOARD UPDATES
// ============================================

function updateDashboard() {
    updateHeader();
    updateSummaryCards();
    updateMonthExpenses();
    renderCalendar();
}

function updateHeader() {
    document.getElementById('userName').textContent = `Olá, ${appState.currentUser}!`;
}

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('pt-BR', options);
    document.getElementById('currentDate').textContent = today;
}

function updateSummaryCards() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthExpenses = getTotalExpensesForMonth(currentMonth, currentYear);
    const balance = appState.salary - monthExpenses;

    document.getElementById('salaryValue').textContent = formatCurrency(appState.salary);
    document.getElementById('expensesValue').textContent = formatCurrency(monthExpenses);
    document.getElementById('balanceValue').textContent = formatCurrency(balance);

    // Mudar cor do saldo
    const balanceCard = document.getElementById('balanceValue');
    if (balance >= 0) {
        balanceCard.classList.remove('negative');
        balanceCard.classList.add('positive');
    } else {
        balanceCard.classList.remove('positive');
        balanceCard.classList.add('negative');
    }
}

function updateMonthExpenses() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const expenses = getExpensesForMonth(currentMonth, currentYear);

    const container = document.getElementById('monthExpensesList');
    container.innerHTML = '';

    if (expenses.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhuma despesa este mês</p>';
        return;
    }

    expenses.forEach(expense => {
        const item = createExpenseItem(expense);
        container.appendChild(item);
    });
}

function createExpenseItem(expense) {
    const div = document.createElement('div');
    div.className = 'expense-item';

    let categoryLabel = '';
    if (expense.isShared) {
        categoryLabel = ' (Compartilhada)';
    } else if (expense.isCustom) {
        categoryLabel = ` (${expense.category})`;
    }

    const html = `
        <div class="expense-info">
            <div class="expense-name">${expense.name}${categoryLabel}</div>
            <div class="expense-date">${expense.isCustom ? new Date(expense.date).toLocaleDateString('pt-BR') : 'Recorrente'}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
            <div class="expense-value">-${formatCurrency(expense.value)}</div>
            ${expense.isCustom ? `
                <div class="expense-actions">
                    <button class="btn-delete" onclick="deleteCustomExpense('${expense.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6H5H21M8 6V4C8 2.895 8.895 2 10 2H14C15.105 2 16 2.895 16 4V6M19 6V20C19 21.105 18.105 22 17 22H7C5.895 22 5 21.105 5 20V6H19ZM10 11V17M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    div.innerHTML = html;
    return div;
}

// ============================================
// CALENDAR
// ============================================

function renderCalendar() {
    const container = document.getElementById('calendarGrid');
    container.innerHTML = '';

    // Cabeçalho com dias da semana
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        container.appendChild(header);
    });

    const firstDay = new Date(appState.currentYear, appState.currentMonth - 1, 1);
    const lastDay = new Date(appState.currentYear, appState.currentMonth, 0);
    const prevLastDay = new Date(appState.currentYear, appState.currentMonth - 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    // Dias do mês anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevLastDate - i;
        container.appendChild(day);
    }

    // Dias do mês atual
    const today = new Date();
    const expenses = getExpensesForMonth(appState.currentMonth, appState.currentYear);

    for (let date = 1; date <= lastDateOfMonth; date++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';

        // Verificar se tem despesas neste dia
        const hasExpenses = expenses.length > 0;
        if (hasExpenses) {
            day.classList.add('has-expenses');
        }

        // Marcar hoje
        if (
            date === today.getDate() &&
            appState.currentMonth === today.getMonth() + 1 &&
            appState.currentYear === today.getFullYear()
        ) {
            day.classList.add('today');
        }

        day.textContent = date;
        day.addEventListener('click', () => showDayExpenses(date));
        container.appendChild(day);
    }

    // Dias do próximo mês
    const totalCells = container.children.length - 7; // Subtrair cabeçalho
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        container.appendChild(day);
    }

    updateCalendarSummary();
    updateCalendarMonth();
}

function updateCalendarMonth() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthName = months[appState.currentMonth - 1];
    document.getElementById('calendarMonth').textContent = `${monthName} ${appState.currentYear}`;
}

function updateCalendarSummary() {
    const expenses = getExpensesForMonth(appState.currentMonth, appState.currentYear);
    const total = expenses.reduce((sum, exp) => sum + exp.value, 0);

    document.getElementById('calendarTotal').textContent = formatCurrency(total);

    // Agrupar por categoria
    const byCategory = {};
    expenses.forEach(exp => {
        const category = exp.category || 'Outro';
        if (!byCategory[category]) {
            byCategory[category] = 0;
        }
        byCategory[category] += exp.value;
    });

    const detailsContainer = document.getElementById('calendarDetails');
    detailsContainer.innerHTML = '';

    Object.entries(byCategory).forEach(([category, value]) => {
        const item = document.createElement('div');
        item.className = 'summary-detail-item';
        item.innerHTML = `
            <span class="summary-detail-name">${category}</span>
            <span class="summary-detail-value">${formatCurrency(value)}</span>
        `;
        detailsContainer.appendChild(item);
    });
}

function previousMonth() {
    appState.currentMonth--;
    if (appState.currentMonth < 1) {
        appState.currentMonth = 12;
        appState.currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    appState.currentMonth++;
    if (appState.currentMonth > 12) {
        appState.currentMonth = 1;
        appState.currentYear++;
    }
    renderCalendar();
}

function showDayExpenses(date) {
    // Implementar visualização de despesas do dia
    console.log(`Despesas do dia ${date}`);
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function openAddExpenseModal() {
    document.getElementById('modalTitle').textContent = 'Adicionar Despesa';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseForm').dataset.mode = 'add';
    appState.editingExpenseId = null;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;

    document.getElementById('expenseModal').classList.add('active');
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('active');
    document.getElementById('expenseForm').reset();
}

function openSalaryModal() {
    document.getElementById('salaryInput').value = appState.salary;
    document.getElementById('salaryModal').classList.add('active');
}

function closeSalaryModal() {
    document.getElementById('salaryModal').classList.remove('active');
}

function saveExpense(e) {
    e.preventDefault();

    const expense = {
        id: appState.editingExpenseId || generateId(),
        name: document.getElementById('expenseName').value,
        value: parseFloat(document.getElementById('expenseValue').value),
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value
    };

    const existingIndex = appState.customExpenses.findIndex(exp => exp.id === expense.id);
    if (existingIndex >= 0) {
        appState.customExpenses[existingIndex] = expense;
    } else {
        appState.customExpenses.push(expense);
    }

    saveUserData();
    updateDashboard();
    closeExpenseModal();
}

function saveSalary(e) {
    e.preventDefault();

    appState.salary = parseFloat(document.getElementById('salaryInput').value);
    saveUserData();
    updateDashboard();
    closeSalaryModal();
}

function deleteCustomExpense(id) {
    if (confirm('Tem certeza que deseja deletar esta despesa?')) {
        appState.customExpenses = appState.customExpenses.filter(exp => exp.id !== id);
        saveUserData();
        updateDashboard();
    }
}

// ============================================
// TAB MANAGEMENT
// ============================================

function switchTab(tabName) {
    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Atualizar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Renderizar calendário se necessário
    if (tabName === 'calendar') {
        renderCalendar();
    }

    // Atualizar lista de despesas
    if (tabName === 'expenses') {
        updateAllExpensesList();
    }
}

function updateAllExpensesList() {
    const container = document.getElementById('allExpensesList');
    container.innerHTML = '';

    if (appState.customExpenses.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhuma despesa customizada</p>';
        return;
    }

    // Ordenar por data (mais recentes primeiro)
    const sorted = [...appState.customExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(expense => {
        const item = createExpenseItem(expense);
        container.appendChild(item);
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function generateId() {
    return 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// INICIAR APLICAÇÃO
// ============================================

window.addEventListener('load', () => {
    updateCurrentDate();
    setInterval(updateCurrentDate, 60000); // Atualizar data a cada minuto
});
