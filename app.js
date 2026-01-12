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
let currentUser = null;
let allItems = [];
let itemToBuy = null;

// Elementos do DOM
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const userBtns = document.querySelectorAll('.user-btn');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentUserDisplay = document.getElementById('current-user-display');
const categoriesContainer = document.getElementById('categories-container');
const totalSpentDisplay = document.getElementById('total-spent');

// Modais
const addModal = document.getElementById('add-modal');
const priceModal = document.getElementById('price-modal');
const openAddModalBtn = document.getElementById('open-add-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const saveItemBtn = document.getElementById('save-item-btn');
const confirmPurchaseBtn = document.getElementById('confirm-purchase-btn');

// --- LÓGICA DE LOGIN ---

userBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        userBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentUser = btn.dataset.user;
    });
});

loginBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('Por favor, selecione um usuário.');
        return;
    }
    if (passwordInput.value === '1234') {
        showApp();
    } else {
        alert('Senha incorreta.');
    }
});

function showApp() {
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    currentUserDisplay.textContent = `Olá, ${currentUser}`;
    loadItems();
}

logoutBtn.addEventListener('click', () => {
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    passwordInput.value = '';
});

// --- LÓGICA DO FIRESTORE ---

function loadItems() {
    db.collection('enxoval').onSnapshot((snapshot) => {
        allItems = [];
        snapshot.forEach((doc) => {
            allItems.push({ id: doc.id, ...doc.data() });
        });
        renderCategories();
        calculateTotal();
    });
}

function renderCategories() {
    const categories = [
        "ITENS CAROS", "COZINHA", "SALA DE ESTAR", "SALA DE JANTAR", 
        "QUARTO", "BANHEIRO", "LAVANDEIRA / LIMPEZA", "FERRAMENTAS"
    ];

    categoriesContainer.innerHTML = '';

    categories.forEach(cat => {
        const catItems = allItems.filter(item => item.categoria === cat);
        
        // Ordenar: comprados no topo
        catItems.sort((a, b) => (b.comprado === a.comprado) ? 0 : b.comprado ? 1 : -1);

        const group = document.createElement('div');
        group.className = 'category-group';
        
        const boughtCount = catItems.filter(i => i.comprado).length;

        group.innerHTML = `
            <div class="category-header" onclick="this.parentElement.classList.toggle('open')">
                <h2>${cat}</h2>
                <span class="count">${boughtCount}/${catItems.length}</span>
            </div>
            <div class="category-items">
                ${catItems.map(item => `
                    <div class="item-row ${item.comprado ? 'bought' : ''}">
                        <div class="item-checkbox" onclick="toggleItem('${item.id}', ${item.comprado})"></div>
                        <div class="item-info">
                            <div class="item-name">${item.nome}</div>
                            ${item.comprado ? `
                                <div class="item-meta">
                                    Comprado por <span class="buyer">${item.usuario}</span> • 
                                    <span class="item-price-tag">R$ ${parseFloat(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        categoriesContainer.appendChild(group);
    });
}

function calculateTotal() {
    const total = allItems.reduce((acc, item) => acc + (item.valor || 0), 0);
    totalSpentDisplay.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

// --- AÇÕES DE ITENS ---

async function toggleItem(id, isBought) {
    if (isBought) {
        // Se já está comprado, desmarcar
        if(confirm("Deseja desmarcar este item como comprado?")) {
            await db.collection('enxoval').doc(id).update({
                comprado: false,
                valor: 0,
                usuario: ""
            });
        }
    } else {
        // Se não está comprado, abrir modal de preço
        const item = allItems.find(i => i.id === id);
        itemToBuy = item;
        document.getElementById('price-modal-item-name').textContent = item.nome;
        document.getElementById('item-price').value = '';
        priceModal.classList.remove('hidden');
    }
}

confirmPurchaseBtn.addEventListener('click', async () => {
    const price = parseFloat(document.getElementById('item-price').value);
    if (isNaN(price) || price < 0) {
        alert('Por favor, insira um valor válido.');
        return;
    }

    await db.collection('enxoval').doc(itemToBuy.id).update({
        comprado: true,
        valor: price,
        usuario: currentUser
    });

    priceModal.classList.add('hidden');
    itemToBuy = null;
});

saveItemBtn.addEventListener('click', async () => {
    const nome = document.getElementById('item-name').value;
    const categoria = document.getElementById('item-category').value;

    if (!nome) {
        alert('Por favor, digite o nome do item.');
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
    addModal.classList.add('hidden');
});

// --- MODAIS E UI ---

openAddModalBtn.addEventListener('click', () => addModal.classList.remove('hidden'));

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        addModal.classList.add('hidden');
        priceModal.classList.add('hidden');
    });
});

// Fechar modal ao clicar fora
window.onclick = (event) => {
    if (event.target == addModal) addModal.classList.add('hidden');
    if (event.target == priceModal) priceModal.classList.add('hidden');
};

// --- POPULAR DADOS INICIAIS (Opcional/Primeira vez) ---
// Esta função pode ser chamada uma vez no console para carregar a lista inicial do prompt
async function seedDatabase() {
    const initialData = [
        { nome: "Geladeira", categoria: "ITENS CAROS" },
        { nome: "Maquina de lavar", categoria: "ITENS CAROS" },
        { nome: "Televisão 75 polegadas", categoria: "ITENS CAROS", comprado: true, valor: 3500, usuario: "Felipe" },
        { nome: "Forno eletrico bom", categoria: "ITENS CAROS" },
        { nome: "Microondas", categoria: "ITENS CAROS" },
        { nome: "Panificadora", categoria: "ITENS CAROS" },
        { nome: "Lava louça", categoria: "ITENS CAROS" },
        { nome: "Mesa e cadeiras", categoria: "ITENS CAROS" },
        { nome: "Sofá", categoria: "ITENS CAROS" },
        { nome: "Fogão indução", categoria: "ITENS CAROS" },
        { nome: "Panelas indução", categoria: "ITENS CAROS" },
        { nome: "Aparador sala", categoria: "ITENS CAROS" },
        
        { nome: "Tábua de corte de vidro", categoria: "COZINHA" },
        { nome: "Jogo de facas com cepo", categoria: "COZINHA" },
        { nome: "Conjunto de talheres", categoria: "COZINHA" },
        { nome: "Copos para água/suco", categoria: "COZINHA" },
        { nome: "Xícaras para café/chá", categoria: "COZINHA" },
        { nome: "Potes para armazenamento - Tupperware (12 potes)", categoria: "COZINHA" },
        { nome: "Potes para armazenamento - Tupperware (8 potes)", categoria: "COZINHA" },
        { nome: "Escorredor de louça", categoria: "COZINHA" },
        { nome: "Escorredor de macarrão", categoria: "COZINHA" },
        { nome: "Lixeira", categoria: "COZINHA" },
        { nome: "Abridor de latas/garrafas", categoria: "COZINHA" },
        { nome: "Espremedor de limão/laranja", categoria: "COZINHA" },
        { nome: "Ralador", categoria: "COZINHA" },
        { nome: "Colher de pau", categoria: "COZINHA" },
        { nome: "Pegador de macarrão", categoria: "COZINHA" },
        { nome: "Espátula", categoria: "COZINHA" },
        { nome: "Concha", categoria: "COZINHA" },
        { nome: "Escumadeira", categoria: "COZINHA" },
        { nome: "Descascador de legumes", categoria: "COZINHA" },
        { nome: "Forma para bolo", categoria: "COZINHA" },
        { nome: "Pano de prato", categoria: "COZINHA" },
        { nome: "Jarra para água/suco", categoria: "COZINHA" },
        { nome: "Filtro de água", categoria: "COZINHA" },
        { nome: "Garrafa térmica", categoria: "COZINHA" },
        { nome: "Esponja", categoria: "COZINHA" },
        { nome: "forma para fazer hamburguer", categoria: "COZINHA" },
        { nome: "seladora", categoria: "COZINHA" },
        { nome: "amassador de batata", categoria: "COZINHA" },
        { nome: "Frigideiras (diferentes tamanhos)", categoria: "COZINHA" },
        { nome: "Pratos (rasos e fundos)", categoria: "COZINHA" },
        { nome: "Chaleira Eletrica", categoria: "COZINHA" },
        { nome: "Sanduicheira", categoria: "COZINHA" },
        { nome: "Liquidificador", categoria: "COZINHA" },
        { nome: "Mixer", categoria: "COZINHA" },
        { nome: "Cafeteira", categoria: "COZINHA" },

        { nome: "Tapete", categoria: "SALA DE ESTAR" },
        { nome: "Almofadas", categoria: "SALA DE ESTAR" },
        { nome: "Cortinas", categoria: "SALA DE ESTAR" },
        { nome: "Luminárias", categoria: "SALA DE ESTAR" },
        { nome: "Porta-controle", categoria: "SALA DE ESTAR" },
        { nome: "Manta para sofá", categoria: "SALA DE ESTAR" },

        { nome: "Toalha de mesa", categoria: "SALA DE JANTAR" },
        { nome: "Jogo americano", categoria: "SALA DE JANTAR" },
        { nome: "Guardanapos de tecido", categoria: "SALA DE JANTAR" },
        { nome: "Porta-guardanapos", categoria: "SALA DE JANTAR" },
        { nome: "Fruteira", categoria: "SALA DE JANTAR" },
        { nome: "Jogos de taças (vinho, champagne)", categoria: "SALA DE JANTAR" },
        { nome: "Pratos de sobremesa", categoria: "SALA DE JANTAR" },
        { nome: "Travessas para servir", categoria: "SALA DE JANTAR" },
        { nome: "Jogo de jantar para ocasiões especiais", categoria: "SALA DE JANTAR" },

        { nome: "Jogo de lençóis (pelo menos 2)", categoria: "QUARTO" },
        { nome: "Espelho", categoria: "QUARTO" },
        { nome: "Abajur", categoria: "QUARTO" },
        { nome: "Cortinas", categoria: "QUARTO" },
        { nome: "Tapete", categoria: "QUARTO" },
        { nome: "Cabide", categoria: "QUARTO" },
        { nome: "Guarda-roupa", categoria: "QUARTO" },
        { nome: "Criado-mudo", categoria: "QUARTO" },
        { nome: "Edredom/cobertor", categoria: "QUARTO" },

        { nome: "Jogo de toalhas (banho, rosto e mão)", categoria: "BANHEIRO" },
        { nome: "Tapete", categoria: "BANHEIRO" },
        { nome: "Lixeira", categoria: "BANHEIRO" },
        { nome: "Porta-escova de dentes", categoria: "BANHEIRO" },
        { nome: "Saboneteira", categoria: "BANHEIRO" },
        { nome: "Porta papel higiênico", categoria: "BANHEIRO" },
        { nome: "Escova sanitária", categoria: "BANHEIRO" },
        { nome: "Cesto para roupa suja", categoria: "BANHEIRO" },
        { nome: "Espelho", categoria: "BANHEIRO" },
        { nome: "Chuveiro", categoria: "BANHEIRO" },

        { nome: "Varal", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Tábua de passar", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Cesto para roupas", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Pregadores", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Escova para lavar roupas", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Cabideiro para secagem", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Vassoura", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Rodo", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Pá de lixo", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Balde", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Esfregão", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Flanelas", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Luvas", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Aspirador de pó", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Escada pequena", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Organizador de produtos de limpeza", categoria: "LAVANDEIRA / LIMPEZA" },
        { nome: "Ferro de passar", categoria: "LAVANDEIRA / LIMPEZA" },

        { nome: "Kit de ferramentas básicas", categoria: "FERRAMENTAS" },
        { nome: "Extintor de incêndio", categoria: "FERRAMENTAS" },
        { nome: "Kit de primeiros socorros", categoria: "FERRAMENTAS" },
        { nome: "Lanterna", categoria: "FERRAMENTAS" },
        { nome: "Alarme/câmera de segurança", categoria: "FERRAMENTAS" }
    ];

    // Para não duplicar, só rodar se estiver vazio
    const snapshot = await db.collection('enxoval').get();
    if (snapshot.empty) {
        for (const item of initialData) {
            await db.collection('enxoval').add({
                comprado: false,
                valor: 0,
                usuario: "",
                ...item
            });
        }
        console.log("Banco de dados populado!");
    }
}

// Descomente a linha abaixo se quiser que o sistema tente popular itens básicos na primeira execução
seedDatabase();
