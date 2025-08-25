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
const navIdeia = document.getElementById('nav-ideia');
const navLista = document.getElementById('nav-lista');
const toast = document.getElementById('toast');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

let ideiaTemp = null;
let currentPage = "nova";
let allIdeias = [];
let filtroBusca = "";

navIdeia.onclick = () => { setNavActive("nova"); showNovaIdeia(); };
navLista.onclick = () => { setNavActive("acompanhar"); showAcompanhamento(); };

window.onload = () => {
  setNavActive("nova");
  showNovaIdeia();
};

function setNavActive(page) {
  currentPage = page;
  navIdeia.classList.toggle("active", page === "nova");
  navLista.classList.toggle("active", page === "acompanhar");
}

// Toast
function showToast(msg, type="") {
  toast.textContent = msg;
  toast.className = "toast show" + (type ? ` ${type}` : "");
  setTimeout(() => toast.className = "toast", 2200);
}

// Nova Ideia
function showNovaIdeia() {
  ideiaTemp = null;
  main.innerHTML = `
    <h2>Nova Ideia</h2>
    <form id="form-ideia" autocomplete="off">
      <div>
        <label for="titulo">Título</label>
        <input type="text" id="titulo" name="titulo" required maxlength="60" />
      </div>
      <div>
        <label for="descricao">Descrição</label>
        <textarea id="descricao" name="descricao" required maxlength="400" rows="3"></textarea>
      </div>
      <div>
        <label for="responsavel">Responsável principal</label>
        <input type="text" id="responsavel" name="responsavel" required maxlength="40" />
      </div>
      <div class="button-row">
        <button type="submit" class="btn">Avançar para Planejamento</button>
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
    <div style="margin-bottom:10px;">
      <strong style="font-size:1.07em;">${ideiaTemp.titulo}</strong><br>
      <span style="color:var(--secondary);font-size:.98em;">${ideiaTemp.descricao}</span>
    </div>
    <form id="form-etapa" style="margin-top:18px;">
      <label>Nova Etapa</label>
      <input type="text" id="etapa-nome" placeholder="Nome da etapa" required maxlength="60" />
      <input type="text" id="etapa-quem" placeholder="Responsável" required maxlength="40" />
      <input type="date" id="etapa-prazo" required />
      <div class="button-row">
        <button type="submit" class="btn">Adicionar Etapa</button>
        <button type="button" class="btn" id="btn-finalizar">${editMode ? "Salvar Alterações" : "Finalizar Planejamento"}</button>
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
        <span style="font-size:.97em;color:var(--secondary);">Prazo: ${etapa.prazo}</span>
      </div>
      <div>
        <button class="btn danger" style="padding:6px 16px;font-size:.94em;" onclick="removerEtapa(${idx})">Remover</button>
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

// Lista/Acompanhamento
function showAcompanhamento() {
  main.innerHTML = `
    <h2>Acompanhamento de Ideias</h2>
    <div class="button-row" style="gap:8px;margin-bottom:10px;">
      <input type="search" id="busca-ideia" placeholder="Buscar ideia..." style="flex:1;max-width:68vw;">
      <select id="filtro-status">
        <option value="">Todas</option>
        <option value="planejando">Planejando</option>
        <option value="em andamento">Em andamento</option>
        <option value="concluída">Concluída</option>
      </select>
      <button onclick="carregarIdeias()" class="btn" style="padding:10px 18px;background:var(--surface-light);color:var(--primary);font-size:1.02em;">Atualizar</button>
    </div>
    <div id="ideias-list" class="card-list"></div>
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
    list.innerHTML = `<div style="color:var(--muted);margin:28px 0 0 0;text-align:center;">Nenhuma ideia encontrada.</div>`;
    return;
  }
  list.innerHTML = "";
  ideias.forEach(ideia => {
    const etapas = ideia.etapas || [];
    const feitas = etapas.filter(e => e.done).length;
    const progresso = etapas.length ? Math.round(100 * feitas / etapas.length) : 0;
    const card = document.createElement('div');
    card.className = "idea-card";
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="card-actions">
        <button class="card-action-btn" title="Detalhes" onclick="abrirDetalhe('${ideia.id}',event)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
        </button>
        <button class="card-action-btn" title="Editar" onclick="editarIdeia('${ideia.id}',event)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        </button>
        <button class="card-action-btn" title="Excluir" onclick="excluirIdeia('${ideia.id}',event)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
      <h3>${ideia.titulo}</h3>
      <div class="meta">Responsável: ${ideia.responsavel}</div>
      <div class="meta">${ideia.descricao}</div>
      <div class="progress-bar"><div class="progress-bar-inner" style="width:${progresso}%;"></div></div>
      <small style="color:${ideia.status==='concluída'? 'var(--success)': ideia.status==='em andamento'? 'var(--primary-accent)':'var(--muted)'};font-weight:600;">
        ${ideia.status.replace('em andamento', 'Em andamento').replace('planejando', 'Planejando').replace('concluída','Concluída')}
      </small>
      <ul class="etapas-lista">
        ${etapas.map((etapa, idx) => `
          <li class="${etapa.done ? 'done' : ''}">
            <span class="etapa-info">
              <b>${etapa.nome}</b> (${etapa.quem})<br>
              <span style="font-size:.97em;color:var(--muted);">Prazo: ${etapa.prazo}</span>
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
  modalContent.innerHTML = `
    <button class="modal-close" onclick="fecharModal()">×</button>
    <h2 style="margin-bottom:10px;">${ideia.titulo}</h2>
    <div style="color:var(--secondary);margin-bottom:8px;">${ideia.descricao}</div>
    <div class="meta">Responsável: ${ideia.responsavel}</div>
    <div style="margin:12px 0 12px 0;">
      <b>Status:</b> ${ideia.status.replace('em andamento', 'Em andamento').replace('planejando', 'Planejando').replace('concluída','Concluída')}
    </div>
    <div class="progress-bar"><div class="progress-bar-inner" style="width:${((ideia.etapas||[]).filter(e=>e.done).length/(ideia.etapas||[]).length||0)*100}%;"></div></div>
    <h4 style="margin:14px 0 6px 0;font-size:1.07em;">Etapas:</h4>
    <ul class="etapas-lista">
      ${(ideia.etapas||[]).map(etapa=>`
        <li class="${etapa.done ? 'done' : ''}">
          <span class="etapa-info">
            <b>${etapa.nome}</b> (${etapa.quem})<br>
            <span style="font-size:.97em;color:var(--secondary);">Prazo: ${etapa.prazo}</span>
          </span>
          <span class="etapa-status">${etapa.done ? "Feito" : "Pendente"}</span>
        </li>
      `).join("")}
    </ul>
  `;
  modalOverlay.style.display = "flex";
};
window.fecharModal = function() { modalOverlay.style.display = "none"; };

window.editarIdeia = async function(ideiaId, event) {
  event.stopPropagation();
  const doc = await db.collection('ideias').doc(ideiaId).get();
  if (!doc.exists) return;
  ideiaTemp = { id: doc.id, ...doc.data() };
  showPlanejamento(true);
};

window.excluirIdeia = function(ideiaId, event) {
  event.stopPropagation();
  modalContent.innerHTML = `
    <button class="modal-close" onclick="fecharModal()">×</button>
    <h3 style="margin-bottom:12px;">Excluir ideia?</h3>
    <div style="color:var(--secondary);margin-bottom:18px;">Essa ação é irreversível.</div>
    <div style="display:flex;gap:14px;">
      <button class="btn danger" onclick="confirmarExcluir('${ideiaId}')">Excluir</button>
      <button class="btn" onclick="fecharModal()">Cancelar</button>
    </div>
  `;
  modalOverlay.style.display = "flex";
};
window.confirmarExcluir = async function(ideiaId) {
  await db.collection('ideias').doc(ideiaId).delete();
  fecharModal();
  showToast("Ideia excluída!", "success");
  carregarIdeias();
};

modalOverlay.onclick = function(e) {
  if (e.target === modalOverlay) fecharModal();
};
document.onkeydown = function(e) {
  if (modalOverlay.style.display === "flex" && (e.key === "Escape" || e.key === "Esc")) fecharModal();
};

window.carregarIdeias = carregarIdeias;

// SPA: mantém navegação fluida
window.onpopstate = function() {
  if (currentPage === "nova") showNovaIdeia();
  else showAcompanhamento();
};
