// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC39MUGnt8gBtK9GEmUdrlGNCe7R9rDq08",
  authDomain: "casajoaoefelipe.firebaseapp.com",
  projectId: "casajoaoefelipe",
  storageBucket: "casajoaoefelipe.firebasestorage.app",
  messagingSenderId: "1025146434390",
  appId: "1:1025146434390:web:19a9c92bed60d6a83cdcf7"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Estado da Aplicação
let currentUser = localStorage.getItem('enxoval_user') || null;
let items = [];

// Elementos DOM
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const userSelect = document.getElementById('user-select');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentUserDisplay = document.getElementById('current-user-display');
const categoriesContainer = document.getElementById('categories-container');
const itemModal = document.getElementById('item-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveItemBtn = document.getElementById('save-item-btn');

// --- LÓGICA DE LOGIN ---

function checkLogin() {
    if (currentUser) {
        showApp();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
}

function showApp() {
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    currentUserDisplay.textContent = `Olá, ${currentUser}`;
    loadItems();
}

loginBtn.addEventListener('click', () => {
    const user = userSelect.value;
    const pass = passwordInput.value;

    if (!user) {
        alert('Por favor, selecione um usuário.');
        return;
    }

    if (pass === '1234') {
        currentUser = user;
        localStorage.setItem('enxoval_user', user);
        showApp();
    } else {
        alert('Senha incorreta!');
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('enxoval_user');
    showLogin();
});

// --- LÓGICA DO FIRESTORE ---

function loadItems() {
    db.collection('enxoval').onSnapshot((snapshot) => {
        items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderItems();
    });
}

function renderItems() {
    categoriesContainer.innerHTML = '';
    
    // Agrupar itens por categoria
    const categories = [...new Set(items.map(item => item.categoria))].sort();
    
    if (categories.length === 0) {
        categoriesContainer.innerHTML = '<div class="loading">Nenhum item cadastrado.</div>';
        return;
    }

    categories.forEach(cat => {
        const catSection = document.createElement('div');
        catSection.className = 'category-section';
        
        const catItems = items.filter(item => item.categoria === cat);
        
        // Ordenar: Comprados no topo
        catItems.sort((a, b) => (b.comprado === a.comprado) ? 0 : b.comprado ? 1 : -1);

        catSection.innerHTML = `
            <div class="category-header" onclick="this.parentElement.classList.toggle('open')">
                <h2>${cat} (${catItems.length})</h2>
                <span class="arrow">▶</span>
            </div>
            <div class="category-items">
                ${catItems.map(item => `
                    <div class="item-row ${item.comprado ? 'bought' : ''}" onclick="toggleItem('${item.id}', ${item.comprado})">
                        <div class="checkbox-container"></div>
                        <div class="item-info">
                            <div class="item-name">${item.nome}</div>
                            ${item.comprado ? `
                                <div class="item-meta">
                                    Comprado por ${item.usuario} • R$ ${parseFloat(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        categoriesContainer.appendChild(catSection);
    });
}

async function toggleItem(id, currentStatus) {
    if (!currentStatus) {
        // Marcar como comprado
        const valor = prompt('Qual o valor pago por este item?');
        if (valor !== null && !isNaN(parseFloat(valor))) {
            await db.collection('enxoval').doc(id).update({
                comprado: true,
                valor: parseFloat(valor),
                usuario: currentUser
            });
        }
    } else {
        // Desmarcar (opcional, mas útil para correções)
        if (confirm('Deseja desmarcar este item como comprado?')) {
            await db.collection('enxoval').doc(id).update({
                comprado: false,
                valor: 0,
                usuario: ""
            });
        }
    }
}

// --- MODAL E CADASTRO ---

openModalBtn.addEventListener('click', () => itemModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => itemModal.classList.add('hidden'));

saveItemBtn.addEventListener('click', async () => {
    const nome = document.getElementById('item-name').value;
    const categoria = document.getElementById('item-category').value;

    if (!nome) {
        alert('Digite o nome do item.');
        return;
    }

    await db.collection('enxoval').add({
        nome: nome,
        categoria: categoria,
        comprado: false,
        valor: 0,
        usuario: ""
    });

    document.getElementById('item-name').value = '';
    itemModal.classList.add('hidden');
});

// Inicialização
checkLogin();
