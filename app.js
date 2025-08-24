// Firebase confi
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

btnIdeia.onclick = showNovaIdeia;
btnAcompanhar.onclick = showAcompanhamento;

function showNovaIdeia() {
  main.innerHTML = `
    <h2>Nova Ideia</h2>
    <form id="form-ideia">
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
        <button type="submit">Avançar para Planejamento</button>
      </div>
    </form>
  `;
  document.getElementById('form-ideia').onsubmit = handleNovaIdeia;
}

let ideiaTemp = null;

async function handleNovaIdeia(e) {
  e.preventDefault();
  const titulo = e.target.titulo.value.trim();
  const descricao = e.target.descricao.value.trim();
  const responsavel = e.target.responsavel.value.trim();
  const doc = await db.collection('ideias').add({
    titulo,
    descricao,
    responsavel,
    status: 'planejando',
    etapas: [],
    criadoEm: new Date().toISOString()
  });
  ideiaTemp = { id: doc.id, titulo, descricao, responsavel, etapas: [] };
  showPlanejamento();
}

function showPlanejamento() {
  main.innerHTML = `
    <h2>Planejamento da Ideia</h2>
    <div>
      <strong>${ideiaTemp.titulo}</strong><br>
      <span style="color:#555">${ideiaTemp.descricao}</span>
    </div>
    <form id="form-etapa" style="margin-top:18px;">
      <label>Nova Etapa</label>
      <input type="text" id="etapa-nome" placeholder="Nome da etapa" required maxlength="60" />
      <input type="text" id="etapa-quem" placeholder="Responsável" required maxlength="40" />
      <input type="date" id="etapa-prazo" required />
      <div class="button-row">
        <button type="submit">Adicionar Etapa</button>
        <button type="button" id="btn-finalizar">Finalizar Planejamento</button>
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
        <span style="font-size:.97em;color:#666;">Prazo: ${etapa.prazo}</span>
      </div>
      <button style="background:#eee;color:#c00;font-size:.93em;padding:4px 10px;" onclick="removerEtapa(${idx})">Remover</button>
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
    alert("Adicione pelo menos uma etapa!");
    return;
  }
  await db.collection('ideias').doc(ideiaTemp.id).update({
    etapas: ideiaTemp.etapas,
    status: 'em andamento'
  });
  ideiaTemp = null;
  showAcompanhamento();
}

function showAcompanhamento() {
  main.innerHTML = `<h2>Acompanhamento de Ideias</h2><div id="ideias-list"></div>`;
  carregarIdeias();
}

async function carregarIdeias() {
  const snap = await db.collection('ideias').orderBy('criadoEm', 'desc').get();
  const list = document.getElementById('ideias-list');
  list.innerHTML = "";
  snap.forEach(doc => {
    const ideia = doc.data();
    const etapas = ideia.etapas || [];
    const feitas = etapas.filter(e => e.done).length;
    const progresso = etapas.length ? Math.round(100 * feitas / etapas.length) : 0;
    const card = document.createElement('div');
    card.className = "idea-card";
    card.innerHTML = `
      <h3>${ideia.titulo}</h3>
      <div class="meta">Responsável: ${ideia.responsavel}</div>
      <div class="meta" style="margin-bottom:8px;">${ideia.descricao}</div>
      <div class="progress-bar"><div class="progress-bar-inner" style="width:${progresso}%;"></div></div>
      <small>Status: ${ideia.status.replace('em andamento', 'Em andamento').replace('planejando', 'Planejando')}</small>
      <ul class="etapas-lista">
        ${etapas.map((etapa, idx) => `
          <li>
            <span class="etapa-info">
              <b>${etapa.nome}</b> (${etapa.quem})<br>
              <span style="font-size:.97em;color:#666;">Prazo: ${etapa.prazo}</span>
            </span>
            <span class="etapa-status">
              <input type="checkbox" ${etapa.done ? "
