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

    // Despesas compartilhadas (em parcelas) - VALORES CORRIGIDOS DA PLANILHA
    sharedExpenses: [
        {
            name: "Empréstimo 3 mil",
            monthlyValue: 374,
            totalInstallments: 10,
            startMonth: 3, // Março
            startYear: 2026,
            category: "Empréstimo",
            installmentValue: 187 // Valor por pessoa
        },
        {
            name: "Televisão e Geladeira",
            monthlyValue: 778,
            totalInstallments: 10,
            startMonth: 2, // Fevereiro
            startYear: 2026,
            category: "Eletrônicos",
            installmentValue: 389 // Valor por pessoa
        },
        {
            name: "Empréstimo 10.800",
            monthlyValue: 813,
            totalInstallments: 18,
            startMonth: 4, // Abril
            startYear: 2026,
            category: "Empréstimo",
            installmentValue: 406.5 // Valor por pessoa
        },
        {
            name: "Financiamento da casa",
            monthlyValue: 1280,
            totalInstallments: 420,
            startMonth: 4, // Abril
            startYear: 2026,
            category: "Moradia",
            installmentValue: 640 // Valor por pessoa
        },
        {
            name: "Seguro geladeira",
            monthlyValue: 104,
            totalInstallments: 12,
            startMonth: 4, // Abril
            startYear: 2026,
            category: "Seguro",
            installmentValue: 52 // Valor por pessoa
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
            name: "Air fryer",
            monthlyValue: 37.77,
            totalInstallments: 18,
            startMonth: 1, // Janeiro
            startYear: 2026,
            category: "Eletrônicos"
        },
        {
            name: "Televisão",
            monthlyValue: 72.23,
            totalInstallments: 10,
            startMonth: 3, // Março
            startYear: 2026,
            category: "Eletrônicos"
        }
    ],

    // Despesas recorrentes que aparecem em Visão Geral (sem parcelas fixas)
    recurringExpenseTypes: [
        { name: "Cartão de Crédito", icon: "💳", user: "both" },
        { name: "Plano de Saúde", icon: "🏥", user: "both" },
        { name: "Fatura Bradesco", icon: "🏦", user: "Felipe" },
        { name: "Fatura Nubank", icon: "🏦", user: "Felipe" },
        { name: "Fatura Brasil", icon: "🏦", user: "Felipe" }
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
    recurringExpenses: {}, // Armazena valores de despesas recorrentes
    editingExpenseId: null,
    calendarFilters: {} // Armazena filtros selecionados do calendário
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
    
    // Calendar Filters
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('calendar-filter-checkbox')) {
            updateCalendarSummary();
        }
    });

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

    document.getElementById('closeInstallmentModalBtn').addEventListener('click', closeInstallmentModal);

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
        appState.recurringExpenses = data.recurringExpenses || {};
    } else {
        appState.salary = 0;
        appState.customExpenses = [];
        appState.recurringExpenses = {};
    }
}

function saveUserData() {
    const storageKey = `financeiro_${appState.currentUser}`;
    const userData = {
        salary: appState.salary,
        customExpenses: appState.customExpenses,
        recurringExpenses: appState.recurringExpenses
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
                value: expense.installmentValue, // Já é o valor por pessoa
                currentInstallment: getCurrentInstallmentNumber(expense, month, year)
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
                value: expense.monthlyValue,
                currentInstallment: getCurrentInstallmentNumber(expense, month, year)
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

    // Despesas recorrentes (Cartão de Crédito, Plano de Saúde, etc)
    CONFIG.recurringExpenseTypes.forEach(expType => {
        if (expType.user === 'both' || expType.user === appState.currentUser) {
            const key = `${expType.name}_${month}_${year}`;
            if (appState.recurringExpenses[key]) {
                expenses.push({
                    name: expType.name,
                    value: appState.recurringExpenses[key],
                    category: "Recorrente",
                    isRecurring: true
                });
            }
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

function getCurrentInstallmentNumber(expense, month, year) {
    const startMonth = expense.startMonth || 1;
    const startYear = expense.startYear || 2025;

    let currentMonth = startMonth;
    let currentYear = startYear;
    let installmentCount = 1;

    while (installmentCount <= expense.totalInstallments) {
        if (currentMonth === month && currentYear === year) {
            return installmentCount;
        }

        installmentCount++;
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
    }

    return 0;
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
    const today = new Date();
    const dateString = today.toLocaleDateString('pt-BR', options);
    document.getElementById('currentDate').textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
}

function updateSummaryCards() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthExpenses = getTotalExpensesForMonth(currentMonth, currentYear);
    const balance = appState.salary - monthExpenses;

    document.getElementById('salaryValue').textContent = formatCurrency(appState.salary);
    document.getElementById('expensesValue').textContent = formatCurrency(monthExpenses);
    document.getElementById('balanceValue').textContent = formatCurrency(balance);

    if (balance < 0) {
        document.getElementById('balanceValue').classList.add('negative');
        document.getElementById('balanceValue').classList.remove('positive');
    } else if (balance > 0) {
        document.getElementById('balanceValue').classList.add('positive');
        document.getElementById('balanceValue').classList.remove('negative');
    } else {
        document.getElementById('balanceValue').classList.remove('negative', 'positive');
    }
}

function updateMonthExpenses() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const container = document.getElementById('monthExpensesList');
    container.innerHTML = '';

    // Seção de Despesas Recorrentes (Cards clicáveis)
    const recurringSection = document.createElement('div');
    recurringSection.className = 'recurring-section';
    recurringSection.innerHTML = '<h3>Despesas Recorrentes</h3>';
    
    const recurringGrid = document.createElement('div');
    recurringGrid.className = 'recurring-grid';

    CONFIG.recurringExpenseTypes.forEach(expType => {
        if (expType.user === 'both' || expType.user === appState.currentUser) {
            const card = document.createElement('div');
            card.className = 'recurring-card';
            
            const key = `${expType.name}_${currentMonth}_${currentYear}`;
            const value = appState.recurringExpenses[key] || 0;
            
            card.innerHTML = `
                <div class="recurring-card-header">
                    <span class="recurring-card-name">${expType.name}</span>
                    <button class="btn-recurring-edit" data-expense="${expType.name}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 17.25V21h3.75L17.81 9.94M20.71 7.04C20.99 6.76 20.99 6.31 20.71 6.03L18.97 4.29C18.69 4.01 18.24 4.01 17.96 4.29L16.5 5.75" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="recurring-card-value">${formatCurrency(value)}</div>
            `;
            
            card.addEventListener('click', () => openRecurringExpenseModal(expType.name));
            recurringGrid.appendChild(card);
        }
    });

    recurringSection.appendChild(recurringGrid);
    container.appendChild(recurringSection);

    // Seção de Despesas do Mês
    const monthExpenses = getExpensesForMonth(currentMonth, currentYear);
    
    if (monthExpenses.length > 0) {
        const expensesSection = document.createElement('div');
        expensesSection.className = 'expenses-section';
        expensesSection.innerHTML = '<h3>Despesas do Mês</h3>';
        
        const expensesList = document.createElement('div');
        expensesList.className = 'expenses-list';

        monthExpenses.forEach(expense => {
            const item = createExpenseItem(expense);
            expensesList.appendChild(item);
        });

        expensesSection.appendChild(expensesList);
        container.appendChild(expensesSection);
    }

    // Botão para adicionar despesa customizada
    const addCustomSection = document.createElement('div');
    addCustomSection.className = 'add-custom-section';
    addCustomSection.innerHTML = `
        <button class="btn-add-custom" id="addCustomExpenseBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Adicionar Despesa Customizada
        </button>
    `;
    container.appendChild(addCustomSection);

    document.getElementById('addCustomExpenseBtn').addEventListener('click', openAddExpenseModal);
}

function createExpenseItem(expense) {
    const item = document.createElement('div');
    item.className = 'expense-item';

    let detailText = '';
    if (expense.currentInstallment && expense.totalInstallments) {
        const remaining = expense.totalInstallments - expense.currentInstallment + 1;
        detailText = `Parcela ${expense.currentInstallment}/${expense.totalInstallments} (faltam ${remaining})`;
    } else if (expense.date) {
        const date = new Date(expense.date);
        detailText = date.toLocaleDateString('pt-BR');
    }

    item.innerHTML = `
        <div class="expense-info">
            <span class="expense-name">${expense.name}</span>
            <span class="expense-date">${detailText}</span>
        </div>
        <span class="expense-value">${formatCurrency(expense.value)}</span>
    `;

    // Adicionar evento de clique para mostrar detalhes de parcelas
    if (expense.currentInstallment && expense.totalInstallments) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => openInstallmentDetails(expense));
    }

    if (expense.isCustom) {
        const actions = document.createElement('div');
        actions.className = 'expense-actions';
        actions.innerHTML = `
            <button class="btn-delete" onclick="deleteCustomExpense('${expense.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6H5H21M8 6V4C8 2.895 8.895 2 10 2H14C15.105 2 16 2.895 16 4V6M19 6V20C19 21.105 18.105 22 17 22H7C5.895 22 5 21.105 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        item.appendChild(actions);
    }

    return item;
}

// ============================================
// CALENDAR RENDERING
// ============================================

function renderCalendar() {
    const calendar = document.getElementById('calendarGrid');
    calendar.innerHTML = '';

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    // Cabeçalho com dias da semana
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    // Atualizar título do mês
    document.getElementById('calendarMonth').textContent = 
        `${monthNames[appState.currentMonth - 1]} ${appState.currentYear}`;

    // Primeiro dia do mês
    const firstDay = new Date(appState.currentYear, appState.currentMonth - 1, 1);
    const lastDay = new Date(appState.currentYear, appState.currentMonth, 0);
    const prevLastDay = new Date(appState.currentYear, appState.currentMonth - 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const lastDateOfPrevMonth = prevLastDay.getDate();

    // Dias do mês anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = lastDateOfPrevMonth - i;
        calendar.appendChild(day);
    }

    // Dias do mês atual
    const today = new Date();
    for (let date = 1; date <= lastDateOfMonth; date++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';

        // Verificar se é hoje
        if (date === today.getDate() && 
            appState.currentMonth === today.getMonth() + 1 && 
            appState.currentYear === today.getFullYear()) {
            day.classList.add('today');
        }

        // Verificar se tem despesas
        const expenses = getExpensesForMonth(appState.currentMonth, appState.currentYear);
        if (expenses.length > 0) {
            day.classList.add('has-expenses');
        }

        day.textContent = date;
        day.addEventListener('click', () => showDayExpenses(date));
        calendar.appendChild(day);
    }

    // Dias do próximo mês
    const remainingDays = 42 - (firstDayOfWeek + lastDateOfMonth);
    for (let i = 1; i <= remainingDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        calendar.appendChild(day);
    }

    updateCalendarSummary();
}

function updateCalendarSummary() {
    const expenses = getExpensesForMonth(appState.currentMonth, appState.currentYear);
    
    // Inicializar filtros se não existirem
    if (Object.keys(appState.calendarFilters).length === 0) {
        expenses.forEach(exp => {
            const key = `${exp.name}_${exp.category}`;
            appState.calendarFilters[key] = true;
        });
    }

    // Agrupar por nome detalhado (não apenas categoria)
    const byName = {};
    expenses.forEach(exp => {
        const key = `${exp.name}_${exp.category}`;
        if (!byName[key]) {
            byName[key] = {
                name: exp.name,
                category: exp.category,
                value: 0,
                isChecked: appState.calendarFilters[key] !== false
            };
        }
        byName[key].value += exp.value;
    });

    // Calcular total filtrado
    let filteredTotal = 0;
    Object.values(byName).forEach(data => {
        if (data.isChecked) {
            filteredTotal += data.value;
        }
    });

    document.getElementById('calendarTotal').textContent = formatCurrency(filteredTotal);

    const detailsContainer = document.getElementById('calendarDetails');
    detailsContainer.innerHTML = '';

    // Criar seção de filtros
    const filterSection = document.createElement('div');
    filterSection.className = 'calendar-filters-section';
    filterSection.innerHTML = '<div class="filter-header">Filtrar por item:</div>';
    
    const filtersList = document.createElement('div');
    filtersList.className = 'calendar-filters-list';

    Object.entries(byName).forEach(([key, data]) => {
        const filterItem = document.createElement('div');
        filterItem.className = 'calendar-filter-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'calendar-filter-checkbox';
        checkbox.id = `filter_${key}`;
        checkbox.checked = data.isChecked;
        checkbox.dataset.filterKey = key;
        checkbox.addEventListener('change', (e) => {
            appState.calendarFilters[key] = e.target.checked;
            updateCalendarSummary();
        });
        
        const label = document.createElement('label');
        label.htmlFor = `filter_${key}`;
        label.className = 'calendar-filter-label';
        label.innerHTML = `
            <span class="filter-name">${data.name}</span>
            <span class="filter-category">${data.category}</span>
        `;
        
        const value = document.createElement('span');
        value.className = 'filter-value';
        value.textContent = formatCurrency(data.value);
        
        filterItem.appendChild(checkbox);
        filterItem.appendChild(label);
        filterItem.appendChild(value);
        filtersList.appendChild(filterItem);
    });

    filterSection.appendChild(filtersList);
    detailsContainer.appendChild(filterSection);
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

function openRecurringExpenseModal(expenseName) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const key = `${expenseName}_${currentMonth}_${currentYear}`;
    const currentValue = appState.recurringExpenses[key] || 0;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'recurringModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Adicionar ${expenseName}</h2>
                <button class="btn-close" onclick="document.getElementById('recurringModal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <form onsubmit="saveRecurringExpense(event, '${expenseName}')">
                <div class="form-group">
                    <label for="recurringValue">Valor</label>
                    <input type="number" id="recurringValue" step="0.01" value="${currentValue}" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Salvar</button>
                    <button type="button" class="btn-secondary" onclick="document.getElementById('recurringModal').remove()">Cancelar</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('recurringValue').focus();
}

function saveRecurringExpense(e, expenseName) {
    e.preventDefault();
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const key = `${expenseName}_${currentMonth}_${currentYear}`;
    const value = parseFloat(document.getElementById('recurringValue').value);

    appState.recurringExpenses[key] = value;
    saveUserData();
    updateDashboard();
    document.getElementById('recurringModal').remove();
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

// ============================================
// INSTALLMENT DETAILS
// ============================================

function openInstallmentDetails(expense) {
    const remaining = expense.totalInstallments - expense.currentInstallment + 1;
    const endDate = calculateEndDate(expense);
    
    document.getElementById('installmentTitle').textContent = expense.name;
    
    const detailsHTML = `
        <div class="installment-details-content">
            <div class="detail-row">
                <span class="detail-label">Parcela Atual:</span>
                <span class="detail-value">${expense.currentInstallment} de ${expense.totalInstallments}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Valor da Parcela:</span>
                <span class="detail-value">${formatCurrency(expense.value)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Parcelas Restantes:</span>
                <span class="detail-value">${remaining}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Valor Total Restante:</span>
                <span class="detail-value">${formatCurrency(expense.value * remaining)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Data de Término:</span>
                <span class="detail-value">${endDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Categoria:</span>
                <span class="detail-value">${expense.category}</span>
            </div>
        </div>
    `;
    
    document.getElementById('installmentDetails').innerHTML = detailsHTML;
    document.getElementById('installmentModal').classList.add('active');
}

function calculateEndDate(expense) {
    const startMonth = expense.startMonth || 1;
    const startYear = expense.startYear || 2025;
    
    let endMonth = startMonth + expense.totalInstallments - 1;
    let endYear = startYear;
    
    while (endMonth > 12) {
        endMonth -= 12;
        endYear++;
    }
    
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    return `${monthNames[endMonth - 1]} de ${endYear}`;
}

function closeInstallmentModal() {
    document.getElementById('installmentModal').classList.remove('active');
}
