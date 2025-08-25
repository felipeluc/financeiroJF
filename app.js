// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBFImw6Px0VKLiSVba8L-9PdjLPIU_HmSM",
  authDomain: "financeiro-409db.firebaseapp.com",
  projectId: "financeiro-409db",
  storageBucket: "financeiro-409db.appspot.com",
  messagingSenderId: "124692561019",
  appId: "1:124692561019:web:ceb10e49cf667d61f3b6de"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const main = document.getElementById('main-content');
const btnIdeia = document.getElementById('btn-ideia');
const btnAcompanhar = document.getElementById('btn-acompanhar');
const toast = document.getElementById('toast');
const modalBg = document.getElementById('modal-bg');
const modal = document.getElementById('modal');
const themeToggle = document.getElementById('theme-toggle');

let ideiaTemp = null;
let currentPage = "nova";
let allIdeias = [];
let filtroBusca = "";

btnIdeia.onclick = () => { setNavActive("nova"); showNovaIdeia(); };
btnAcompanhar.onclick = () => { setNavActive("acompanhar"); showAcompanhamento(); };

themeToggle.onclick = toggleTheme;
window.onload = () => { 
  autoTheme();
  setNavActive("nova");
  showNovaIdeia();
};

function setNavActive(page) {
  currentPage = page;
  btnIdeia.classList.toggle("active", page === "nova");
  btnAcompanhar.classList.toggle("active", page === "acompanhar");
}

function autoTheme() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}
function toggleTheme() {
  document.body.classList.toggle('dark');
}

function showToast(msg, type="") {
  toast.textContent = msg;
  toast.className = "toast show" + (type ? ` ${type}` : "");
  setTimeout(() => toast.className = "toast", 2200);
}

function showNovaIdeia() {
  ideiaTemp = null;
  main.innerHTML = `
    <h2>Nova Ideia</h2>
    <form id="form-ideia">
      <div>
        <label for="titulo">Título</label>
        <input type="text" id="titulo" name="titulo" required maxlength="60" autocomplete="off" />
      </div>
      <div>
        <label for="descricao">Descrição</label>
        <textarea id="descricao" name="descricao" required maxlength="400" rows="3"></textarea>
      </div>
      <div>
        <label for="responsavel">Responsável principal</label>
        <input type="text" id="responsavel" name="responsavel" required maxlength="40" autocomplete="off" />
      </div>
      <div class="button-row">
        <button type="submit">Avançar para Planejamento</button>
      </div>
    </form>
  `;
  document.getElementById('form-ideia').onsubmit = handleNovaIdeia;
}

async function handleNovaIdeia(e) {
  e.preventDefault();
  const titulo = e.target.titulo.value.trim();
  const descricao = e.target.descricao.value.trim();
  const responsavel = e.target.responsavel.value.trim();
  showToast("Salvando ideia...");
  const doc = await db.collection('ideias').add({
    titulo, descricao, responsavel,
    status: 'planejando',
    etapas: [],
    criadoEm: new Date().toISOString()
  });
  ideiaTemp = { id: doc.id, titulo, descricao, responsavel, etapas: [] };
  showPlanejamento();
}

function showPlanejamento(editMode=false) {
  main.innerHTML = `
    <h2>${editMode ? "Editar" : "Planejamento da"} Ideia</h2>
    <div>
      <strong>${ideiaTemp.titulo}</strong><br>
      <span style="color:var(--text-muted)">${ideiaTemp.descricao}</span>
    </div>
    <form id="form-etapa" style="margin-top:18px;">
      <label>Nova Etapa</label>
      <input type="text" id="etapa-nome" placeholder="Nome da etapa" required maxlength="60" />
      <input type="text" id="etapa-quem" placeholder="Responsável" required maxlength="40" />
      <input type="date" id="etapa-prazo" required />
      <div class="button-row">
        <button type="submit">Adicionar Etapa</button>
        <button type="button" id="btn-finalizar">${editMode ? "Salvar Alterações" : "Finalizar Planejamento"}</button>
      </div>
    </form>
    <ul id="lista-etapas" class="etapas-lista"></ul>
  `;
  document.getElementById('form-etapa').onsubmit = handleAddEtapa;
  document.getElementById('btn-finalizar').onclick = salvarPlanejamento;
  renderEtapas();
}

function handleAddEtapa(e) {
  e.preventDefault();
  const nome = document.getElementById('etapa-nome').value.trim();
  const quem = document.getElementById('etapa-quem').value.trim();
  const prazo = document.getElementById('etapa-prazo').value;
  if (!nome || !quem || !prazo) return;
  ideiaTemp.etapas.push({ nome, quem, prazo, done: false });
  renderEtapas();
  e.target.reset();
}

function renderEtapas() {
  const lista = document.getElementById('lista-etapas');
  if (!lista) return;
  lista.innerHTML = "";
  ideiaTemp.etapas.forEach((etapa, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="etapa-info">
        <span><b>${etapa.nome}</b> (${etapa.quem})</span>
        <span style="font-size:.97em;color:var(--text-muted);">Prazo: ${etapa.prazo}</span>
      </div>
      <div>
        <button style="background:#eee;color:var(--error);font-size:.93em;padding:4px 10px;" onclick="removerEtapa(${idx})">Remover</button>
      </div>
    `;
    lista.appendChild(li);
  });
}

window.removerEtapa = function(idx) {
  ideiaTemp.etapas.splice(idx, 1);
  renderEtapas();
};

async function salvarPlanejamento() {
  if (!ideiaTemp.etapas.length) {
    showToast("Adicione pelo menos uma etapa!", "error");
    return;
  }
  showToast("Salvando planejamento...");
  await db.collection('ideias').doc(ideiaTemp.id).update({
    etapas: ideiaTemp.etapas,
    status: 'em andamento'
  });
  ideiaTemp = null;
  setNavActive("acompanhar");
  showAcompanhamento();
}

function showAcompanhamento() {
  main.innerHTML = `
    <h2>Acompanhamento de Ideias</h2>
    <div class="button-row" style="gap:8px;margin-bottom:8px;">
      <input type="search" id="busca-ideia" placeholder="Buscar ideia..." style="flex:1;max-width:70vw;">
      <select id="filtro-status">
        <option value="">Todas</option>
        <option value="planejando">Planejando</option>
        <option value="em andamento">Em andamento</option>
        <option value="concluída">Concluída</option>
      </select>
      <button onclick="carregarIdeias()" title="Atualizar" style="background:#e7f0ff;color:var(--primary);">⟳</button>
    </div>
    <div id="ideias-list"></div>
  `;
  document.getElementById('busca-ideia').oninput = function() {
    filtroBusca = this.value.toLowerCase();
    renderIdeiasList();
  };
  document.getElementById('filtro-status').onchange = function() {
    renderIdeiasList();
  };
  carregarIdeias();
}

async function carregarIdeias() {
  showToast("Carregando ideias...");
  const snap = await db.collection('ideias').orderBy('criadoEm', 'desc').get();
  allIdeias = [];
  snap.forEach(doc => {
    allIdeias.push({ id: doc.id, ...doc.data() });
  });
  renderIdeiasList();
  showToast("Ideias carregadas!", "success");
}

function renderIdeiasList() {
  const list = document.getElementById('ideias-list');
  if (!list) return;
  let ideias = allIdeias;
  const filtro = document.getElementById('filtro-status').value;
  if (filtro) ideias = ideias.filter(i => i.status === filtro);
  if (filtroBusca) ideias = ideias.filter(i => i.titulo.toLowerCase().includes(filtroBusca) || i.descricao.toLowerCase().includes(filtroBusca));
  if (ideias.length === 0) {
    list.innerHTML = `<div style="color:var(--text-muted);margin:28px 0 0 0;text-align:center;">Nenhuma ideia encontrada.</div>`;
    return;
  }
  list.innerHTML = "";
  ideias.forEach(ideia => {
    const etapas = ideia.etapas || [];
    const feitas = etapas.filter(e => e.done).length;
    const progresso = etapas.length ? Math.round(100 * feitas / etapas.length) : 0;
    const card = document.createElement('div');
    card.className = "idea-card";
    card.innerHTML = `
      <div class="card-actions">
        <button title="Ver detalhes" onclick="abrirDetalhe('${ideia.id}',event)">🔍</button>
        <button title="Editar" onclick="editarIdeia('${ideia.id}',event)">✏️</button>
        <button title="Excluir" onclick="excluirIdeia('${ideia.id}',event)">🗑️</button>
      </div>
      <h3>${ideia.titulo}</h3>
      <div class="meta">Responsável: ${ideia.responsavel}</div>
      <div class="meta" style="margin-bottom:8px;">${ideia.descricao}</div>
      <div class="progress-bar"><div class="progress-bar-inner" style="width:${progresso}%;"></div></div>
      <small>Status: ${ideia.status.replace('em andamento', 'Em andamento').replace('planejando', 'Planejando').replace('concluída','Concluída')}</small>
      <ul class="etapas-lista">
        ${etapas.map((etapa, idx) => `
          <li>
            <span class="etapa-info">
              <b>${etapa.nome}</b> (${etapa.quem})<br>
              <span style="font-size:.97em;color:var(--text-muted);">Prazo: ${etapa.prazo}</span>
            </span>
            <span class="etapa-status">
              <input type="checkbox" ${etapa.done ? "checked" : ""} onchange="toggleEtapa('${ideia.id}',${idx},this.checked,event)" />
              ${etapa.done ? "Feito" : "Pendente"}
            </span>
          </li>
        `).join('')}
      </ul>
    `;
    list.appendChild(card);
  });
}

window.toggleEtapa = async function(ideiaId, etapaIdx, checked, event) {
  event.stopPropagation();
  const docRef = db.collection('ideias').doc(ideiaId);
  const doc = await docRef.get();
  if (!doc.exists) return;
  const ideia = doc.data();
  ideia.etapas[etapaIdx].done = checked;
  // Se todas etapas feitas, marcar como concluída
  let status = ideia.status;
  if (ideia.etapas.length && ideia.etapas.every(e => e.done)) status = 'concluída';
  else if (ideia.etapas.some(e => e.done)) status = 'em andamento';
  else status = 'planejando';
  await docRef.update({ etapas: ideia.etapas, status });
  carregarIdeias();
};

window.abrirDetalhe = function(ideiaId, event) {
  event.stopPropagation();
  const ideia = allIdeias.find(i => i.id === ideiaId);
  if (!ideia) return;
  modal.innerHTML = `
    <button class="modal-close" onclick="fecharModal()">×</button>
    <h2>${ideia.titulo}</h2>
    <div style="color:var(--text-muted);margin-bottom:8px;">${ideia.descricao}</div>
    <div class="meta">Responsável: ${ideia.responsavel}</div>
    <div style="margin:12px 0 12px 0;">
      <b>Status:</b> ${ideia.status.replace('em andamento', 'Em andamento').replace('planejando', 'Planejando').replace('concluída','Concluída')}
    </div>
    <div class="progress-bar"><div class="progress-bar-inner" style="width:${((ideia.etapas||[]).filter(e=>e.done).length/(ideia.etapas||[]).length||0)*100}%;"></div></div>
    <h4 style="margin:14px 0 6px 0;">Etapas:</h4>
    <ul class="etapas-lista">
      ${(ideia.etapas||[]).map(etapa=>`
        <li>
          <span class="etapa-info">
            <b>${etapa.nome}</b> (${etapa.quem})<br>
            <span style="font-size:.97em;color:var(--text-muted);">Prazo: ${etapa.prazo}</span>
          </span>
          <span class="etapa-status">${etapa.done ? "✅" : "⏳"}</span>
        </li>
      `).join("")}
    </ul>
  `;
  modalBg.style.display = "flex";
};
window.fecharModal = function() { modalBg.style.display = "none"; };

window.editarIdeia = async function(ideiaId, event) {
  event.stopPropagation();
  const doc = await db.collection('ideias').doc(ideiaId).get();
  if (!doc.exists) return;
  ideiaTemp = { id: doc.id, ...doc.data() };
  showPlanejamento(true);
};

window.excluirIdeia = function(ideiaId, event) {
  event.stopPropagation();
  modal.innerHTML = `
    <button class="modal-close" onclick="fecharModal()">×</button>
    <h3 style="margin-bottom:12px;">Excluir ideia?</h3>
    <div style="color:var(--text-muted);margin-bottom:18px;">Essa ação é irreversível.</div>
    <div style="display:flex;gap:14px;">
      <button class="modal-btn danger" onclick="confirmarExcluir('${ideiaId}')">Excluir</button>
      <button class="modal-btn" onclick="fecharModal()">Cancelar</button>
    </div>
  `;
  modalBg.style.display = "flex";
};
window.confirmarExcluir = async function(ideiaId) {
  await db.collection('ideias').doc(ideiaId).delete();
  fecharModal();
  showToast("Ideia excluída!", "success");
  carregarIdeias();
};

modalBg.onclick = function(e) {
  if (e.target === modalBg) fecharModal();
};
document.onkeydown = function(e) {
  if (modalBg.style.display === "flex" && (e.key === "Escape" || e.key === "Esc")) fecharModal();
};

window.carregarIdeias = carregarIdeias;

// SPA: mantém navegação fluida
window.onpopstate = function() {
  if (currentPage === "nova") showNovaIdeia();
  else showAcompanhamento();
};
