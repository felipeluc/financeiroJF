// Professional Dev AI - Gestão de Projetos SaaS - app.js

// --- MODELO DE DADOS ---
// Projeto: { id, titulo, descricao, responsavel, prioridade, dataCriacao, etapas: [ { id, titulo, responsavel, prazo, concluida } ] }

const PRIORIDADES = [
  { value: 'alta', label: 'Alta', class: 'priority-alta' },
  { value: 'media', label: 'Média', class: 'priority-media' },
  { value: 'leve', label: 'Leve', class: 'priority-leve' },
];

const LS_KEY = 'gestao_projetos_v1';

function getProjetos() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}
function setProjetos(projetos) {
  localStorage.setItem(LS_KEY, JSON.stringify(projetos));
}
function gerarId() {
  return '_' + Math.random().toString(36).slice(2, 10) + Date.now();
}

// --- UI HELPERS ---
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c => {
    if (c == null) return;
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (Array.isArray(c)) c.forEach(cc => e.appendChild(cc));
    else e.appendChild(c);
  });
  return e;
}
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}
function openModal(content) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal-content');
  modal.innerHTML = '';
  modal.appendChild(content);
  overlay.style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}
document.getElementById('modal-overlay').onclick = e => {
  if (e.target === e.currentTarget) closeModal();
};

// --- NAVEGAÇÃO ---
const sections = {
  dashboard: renderDashboard,
  adicionar: renderAdicionarProjeto,
  acompanhar: renderAcompanhamento,
};
let currentSection = 'dashboard';

function setSection(sec) {
  currentSection = sec;
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('menu-' + sec).classList.add('active');
  sections[sec]();
}

// --- DASHBOARD ---
function renderDashboard() {
  const projetos = getProjetos();
  const total = projetos.length;
  const concluidos = projetos.filter(p => p.etapas.length && p.etapas.every(e => e.concluida)).length;
  const emAndamento = total - concluidos;
  const porPrioridade = PRIORIDADES.map(pri => ({
    ...pri,
    count: projetos.filter(p => p.prioridade === pri.value).length,
  }));

  const main = document.getElementById('main-content');
  main.innerHTML = '';
  main.appendChild(
    el('div', {},
      el('h2', {}, 'Dashboard'),
      el('div', { class: 'card-list' },
        el('div', { class: 'project-card' },
          el('h3', {}, 'Projetos em Andamento'),
          el('div', { class: 'meta' }, `Total: ${total}`),
          el('div', { class: 'meta' }, `Concluídos: ${concluidos}`),
          el('div', { class: 'meta' }, `Em andamento: ${emAndamento}`)
        ),
        el('div', { class: 'project-card' },
          el('h3', {}, 'Prioridades'),
          el('div', {},
            porPrioridade.map(pri =>
              el('span', { class: 'priority-badge ' + pri.class, style: 'margin-right:14px;' }, `${pri.label}: ${pri.count}`)
            )
          )
        )
      )
    )
  );
}

// --- NOVO PROJETO ---
function renderAdicionarProjeto() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  main.appendChild(
    el('div', {},
      el('h2', {}, 'Novo Projeto'),
      el('form', { id: 'form-projeto' },
        el('label', { for: 'titulo' }, 'Título'),
        el('input', { id: 'titulo', name: 'titulo', required: true, maxlength: 64, autocomplete: 'off' }),
        el('label', { for: 'descricao' }, 'Descrição'),
        el('textarea', { id: 'descricao', name: 'descricao', rows: 3, maxlength: 240 }),
        el('label', { for: 'responsavel' }, 'Responsável'),
        el('input', { id: 'responsavel', name: 'responsavel', maxlength: 48 }),
        el('label', { for: 'prioridade' }, 'Prioridade'),
        el('select', { id: 'prioridade', name: 'prioridade', required: true },
          PRIORIDADES.map(pri => el('option', { value: pri.value }, pri.label))
        ),
        el('div', { class: 'button-row' },
          el('button', { class: 'btn', type: 'submit' }, 'Criar Projeto')
        )
      )
    )
  );
  document.getElementById('form-projeto').onsubmit = e => {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const responsavel = document.getElementById('responsavel').value.trim();
    const prioridade = document.getElementById('prioridade').value;
    if (!titulo) return showToast('Título é obrigatório');
    const projetos = getProjetos();
    projetos.push({
      id: gerarId(),
      titulo,
      descricao,
      responsavel,
      prioridade,
      dataCriacao: Date.now(),
      etapas: [],
    });
    setProjetos(projetos);
    showToast('Projeto criado!');
    setSection('acompanhar');
  };
}

// --- DESENHAR/EDITAR PROJETO ---
function renderEditarProjeto(id) {
  const projetos = getProjetos();
  const projeto = projetos.find(p => p.id === id);
  if (!projeto) return showToast('Projeto não encontrado');

  function salvarEAtualizar() {
    setProjetos(projetos);
    renderEditarProjeto(id);
  }

  // Modal para adicionar nova etapa
  function modalNovaEtapa() {
    openModal(
      el('div', {},
        el('button', { class: 'modal-close', onclick: closeModal }, '×'),
        el('h2', {}, 'Nova Etapa'),
        el('form', { id: 'form-etapa' },
          el('label', { for: 'etapa-titulo' }, 'Título da Etapa'),
          el('input', { id: 'etapa-titulo', required: true, maxlength: 52 }),
          el('label', { for: 'etapa-responsavel' }, 'Responsável'),
          el('input', { id: 'etapa-responsavel', maxlength: 48 }),
          el('label', { for: 'etapa-prazo' }, 'Prazo'),
          el('input', { id: 'etapa-prazo', type: 'date' }),
          el('div', { class: 'button-row' },
            el('button', { class: 'btn', type: 'submit' }, 'Adicionar')
          )
        )
      )
    );
    document.getElementById('form-etapa').onsubmit = e => {
      e.preventDefault();
      const titulo = document.getElementById('etapa-titulo').value.trim();
      if (!titulo) return showToast('Título obrigatório');
      projeto.etapas.push({
        id: gerarId(),
        titulo,
        responsavel: document.getElementById('etapa-responsavel').value.trim(),
        prazo: document.getElementById('etapa-prazo').value,
        concluida: false,
      });
      salvarEAtualizar();
      closeModal();
      showToast('Etapa adicionada');
    };
  }

  // Modal para editar etapa
  function modalEditarEtapa(etapa) {
    openModal(
      el('div', {},
        el('button', { class: 'modal-close', onclick: closeModal }, '×'),
        el('h2', {}, 'Editar Etapa'),
        el('form', { id: 'form-editar-etapa' },
          el('label', { for: 'etapa-titulo' }, 'Título da Etapa'),
          el('input', { id: 'etapa-titulo', required: true, maxlength: 52, value: etapa.titulo }),
          el('label', { for: 'etapa-responsavel' }, 'Responsável'),
          el('input', { id: 'etapa-responsavel', maxlength: 48, value: etapa.responsavel }),
          el('label', { for: 'etapa-prazo' }, 'Prazo'),
          el('input', { id: 'etapa-prazo', type: 'date', value: etapa.prazo }),
          el('div', { class: 'button-row' },
            el('button', { class: 'btn', type: 'submit' }, 'Salvar'),
            el('button', { class: 'btn danger', type: 'button', onclick: () => { 
              if (confirm('Remover esta etapa?')) {
                projeto.etapas = projeto.etapas.filter(e => e.id !== etapa.id);
                salvarEAtualizar();
                closeModal();
                showToast('Etapa removida');
              }
            } }, 'Remover')
          )
        )
      )
    );
    document.getElementById('form-editar-etapa').onsubmit = e => {
      e.preventDefault();
      etapa.titulo = document.getElementById('etapa-titulo').value.trim();
      etapa.responsavel = document.getElementById('etapa-responsavel').value.trim();
      etapa.prazo = document.getElementById('etapa-prazo').value;
      salvarEAtualizar();
      closeModal();
      showToast('Etapa atualizada');
    };
  }

  // Modal para editar dados do projeto
  function modalEditarProjeto() {
    openModal(
      el('div', {},
        el('button', { class: 'modal-close', onclick: closeModal }, '×'),
        el('h2', {}, 'Editar Projeto'),
        el('form', { id: 'form-editar-projeto' },
          el('label', { for: 'projeto-titulo' }, 'Título'),
          el('input', { id: 'projeto-titulo', required: true, maxlength: 64, value: projeto.titulo }),
          el('label', { for: 'projeto-descricao' }, 'Descrição'),
          el('textarea', { id: 'projeto-descricao', rows: 3, maxlength: 240 }, projeto.descricao),
          el('label', { for: 'projeto-responsavel' }, 'Responsável'),
          el('input', { id: 'projeto-responsavel', maxlength: 48, value: projeto.responsavel }),
          el('label', { for: 'projeto-prioridade' }, 'Prioridade'),
          el('select', { id: 'projeto-prioridade' },
            PRIORIDADES.map(pri => 
              el('option', { value: pri.value, selected: projeto.prioridade === pri.value }, pri.label)
            )
          ),
          el('div', { class: 'button-row' },
            el('button', { class: 'btn', type: 'submit' }, 'Salvar')
          )
        )
      )
    );
    document.getElementById('form-editar-projeto').onsubmit = e => {
      e.preventDefault();
      projeto.titulo = document.getElementById('projeto-titulo').value.trim();
      projeto.descricao = document.getElementById('projeto-descricao').value.trim();
      projeto.responsavel = document.getElementById('projeto-responsavel').value.trim();
      projeto.prioridade = document.getElementById('projeto-prioridade').value;
      salvarEAtualizar();
      closeModal();
      showToast('Projeto atualizado');
    };
  }

  // Modal para remover projeto
  function modalRemoverProjeto() {
    openModal(
      el('div', {},
        el('button', { class: 'modal-close', onclick: closeModal }, '×'),
        el('h2', {}, 'Remover Projeto'),
        el('p', {}, 'Tem certeza que deseja remover este projeto? Esta ação não pode ser desfeita.'),
        el('div', { class: 'button-row' },
          el('button', { class: 'btn danger', onclick: () => {
            setProjetos(projetos.filter(p => p.id !== id));
            closeModal();
            showToast('Projeto removido');
            setSection('acompanhar');
          } }, 'Remover'),
          el('button', { class: 'btn', onclick: closeModal }, 'Cancelar')
        )
      )
    );
  }

  // Progresso
  const totalEtapas = projeto.etapas.length;
  const concluido = projeto.etapas.filter(e => e.concluida).length;
  const progresso = totalEtapas ? Math.round((concluido / totalEtapas) * 100) : 0;

  // Renderização
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  main.appendChild(
    el('div', {},
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' },
        el('h2', {}, 'Projeto: ', projeto.titulo),
        el('div', {},
          el('button', { class: 'btn', onclick: modalEditarProjeto, style: 'margin-right:10px;' }, 'Editar Projeto'),
          el('button', { class: 'btn danger', onclick: modalRemoverProjeto }, 'Remover')
        )
      ),
      el('div', { class: 'project-card', style: 'margin-bottom:18px;' },
        el('div', { class: 'meta' }, 'Responsável: ', projeto.responsavel || '—'),
        el('div', { class: 'meta' }, 'Prioridade: ',
          el('span', { class: 'priority-badge ' + PRIORIDADES.find(p => p.value === projeto.prioridade).class },
            PRIORIDADES.find(p => p.value === projeto.prioridade).label
          )
        ),
        el('div', { class: 'meta' }, 'Criado em: ', (new Date(projeto.dataCriacao)).toLocaleDateString()),
        el('div', { class: 'meta' }, projeto.descricao),
        el('div', { class: 'progress-bar', title: progresso + '%' },
          el('div', { class: 'progress-bar-inner', style: `width:${progresso}%;background:${progresso===100?'var(--success)':'var(--accent)'};` })
        ),
        el('div', { style: 'margin-top:8px;font-size:.98em;color:var(--secondary);' },
          `Etapas concluídas: ${concluido} / ${totalEtapas}`
        )
      ),
      el('h3', {}, 'Etapas'),
      el('ul', { class: 'etapas-lista' },
        projeto.etapas.length ?
          projeto.etapas.map(etapa =>
            el('li', { class: etapa.concluida ? 'done' : '' },
              el('div', { class: 'etapa-info' },
                el('span', {}, etapa.titulo),
                el('span', { style: 'font-size:.97em;color:var(--secondary);' },
                  etapa.responsavel ? `Resp.: ${etapa.responsavel}` : '',
                  etapa.prazo ? ` | Prazo: ${(new Date(etapa.prazo)).toLocaleDateString()}` : ''
                )
              ),
              el('div', { class: 'etapa-status' },
                el('label', {},
                  el('input', {
                    type: 'checkbox',
                    checked: etapa.concluida,
                    onchange: () => {
                      etapa.concluida = !etapa.concluida;
                      salvarEAtualizar();
                      showToast(etapa.concluida ? 'Etapa concluída!' : 'Etapa marcada como pendente');
                    }
                  }),
                  etapa.concluida ? 'Concluída' : 'Pendente'
                ),
                el('button', {
                  class: 'card-action-btn',
                  title: 'Editar Etapa',
                  onclick: () => modalEditarEtapa(etapa)
                }, '✎')
              )
            )
          )
          :
          el('li', { style: 'color:var(--muted);' }, 'Nenhuma etapa cadastrada.')
      ),
      el('div', { style: 'margin-top:18px;' },
        el('button', { class: 'btn', onclick: modalNovaEtapa }, 'Adicionar Etapa')
      ),
      el('div', { style: 'margin-top:34px;' },
        el('button', { class: 'btn', onclick: () => setSection('acompanhar') }, 'Voltar')
      )
    )
  );
}

// --- ACOMPANHAMENTO ---
function renderAcompanhamento() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  const projetos = getProjetos();

  // Filtros e ordenação
  let filtro = '';
  let ordem = 'prioridade';

  function atualizarLista() {
    let lista = [...getProjetos()];
    if (filtro) {
      const f = filtro.toLowerCase();
      lista = lista.filter(p =>
        p.titulo.toLowerCase().includes(f) ||
        (p.descricao && p.descricao.toLowerCase().includes(f)) ||
        (p.responsavel && p.responsavel.toLowerCase().includes(f))
      );
    }
    if (ordem === 'prioridade') {
      const prioridadeOrder = { alta: 0, media: 1, leve: 2 };
      lista.sort((a, b) => {
        if (prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade])
          return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
        return b.dataCriacao - a.dataCriacao;
      });
    } else if (ordem === 'data') {
      lista.sort((a, b) => b.dataCriacao - a.dataCriacao);
    }
    renderLista(lista);
  }

  function renderLista(lista) {
    const cards = lista.length ?
      lista.map(projeto => {
        const totalEtapas = projeto.etapas.length;
        const concluidas = projeto.etapas.filter(e => e.concluida).length;
        const progresso = totalEtapas ? Math.round((concluidas / totalEtapas) * 100) : 0;
        const prioridade = PRIORIDADES.find(p => p.value === projeto.prioridade);
        return el('div', { class: 'project-card' },
          el('div', { class: 'card-actions' },
            el('button', {
              class: 'card-action-btn',
              title: 'Editar Projeto',
              onclick: () => renderEditarProjeto(projeto.id)
            }, '✎')
          ),
          el('h3', {}, projeto.titulo),
          el('div', { class: 'meta' }, 'Responsável: ', projeto.responsavel || '—'),
          el('div', { class: 'meta' }, 'Criado em: ', (new Date(projeto.dataCriacao)).toLocaleDateString()),
          el('div', { class: 'meta' }, el('span', { class: 'priority-badge ' + prioridade.class }, prioridade.label)),
          el('div', { class: 'meta' }, projeto.descricao),
          el('div', { class: 'progress-bar', title: progresso + '%' },
            el('div', { class: 'progress-bar-inner', style: `width:${progresso}%;background:${progresso===100?'var(--success)':'var(--accent)'};` })
          ),
          el('div', { style: 'margin-top:8px;font-size:.98em;color:var(--secondary);' },
            `Etapas concluídas: ${concluidas} / ${totalEtapas}`
          ),
          el('ul', { class: 'etapas-lista', style: 'margin-top:12px;' },
            projeto.etapas.slice(0, 2).map(etapa =>
              el('li', { class: etapa.concluida ? 'done' : '' },
                el('div', { class: 'etapa-info' },
                  el('span', {}, etapa.titulo),
                  el('span', { style: 'font-size:.97em;color:var(--secondary);' },
                    etapa.responsavel ? `Resp.: ${etapa.responsavel}` : '',
                    etapa.prazo ? ` | Prazo: ${(new Date(etapa.prazo)).toLocaleDateString()}` : ''
                  )
                )
              )
            )
          )
        );
      })
      :
      el('div', { style: 'color:var(--muted);margin-top:26px;' }, 'Nenhum projeto encontrado.');
    const container = document.getElementById('acompanhar-lista');
    container.innerHTML = '';
    if (Array.isArray(cards)) cards.forEach(c => container.appendChild(c));
    else container.appendChild(cards);
  }

  main.appendChild(
    el('div', {},
      el('h2', {}, 'Acompanhamento de Projetos'),
      el('div', { style: 'display:flex;gap:18px;margin-bottom:18px;align-items:center;' },
        el('input', {
          type: 'search',
          placeholder: 'Buscar projeto, responsável...',
          style: 'max-width:260px;',
          oninput: e => { filtro = e.target.value; atualizarLista(); }
        }),
        el('select', {
          onchange: e => { ordem = e.target.value; atualizarLista(); }
        },
          el('option', { value: 'prioridade' }, 'Ordenar por Prioridade'),
          el('option', { value: 'data' }, 'Ordenar por Data')
        ),
        el('button', { class: 'btn', onclick: () => setSection('adicionar') }, '+ Novo Projeto')
      ),
      el('div', { id: 'acompanhar-lista', class: 'card-list' })
    )
  );
  atualizarLista();
}

// --- EVENTOS DE NAVEGAÇÃO ---
document.getElementById('menu-dashboard').onclick = () => setSection('dashboard');
document.getElementById('menu-adicionar').onclick = () => setSection('adicionar');
document.getElementById('menu-acompanhar').onclick = () => setSection('acompanhar');

// --- INICIALIZAÇÃO ---
setSection('dashboard');
