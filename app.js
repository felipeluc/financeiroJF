// Gestão de Projetos - app.js

// ---- MODELO DE DADOS E UTILITÁRIOS ----
const PRIORIDADES = [
  { value: 'alta', label: 'Alta', class: 'priority-alta', color: '#e74c3c', text: '#fff' },
  { value: 'media', label: 'Média', class: 'priority-media', color: '#f4d03f', text: '#232427' },
  { value: 'leve', label: 'Leve', class: 'priority-leve', color: '#2980b9', text: '#fff' },
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

// ---- UI HELPERS ----
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

// ---- NAVEGAÇÃO ----
const sections = {
  dashboard: renderDashboard,
  adicionar: renderAdicionarProjeto,
  acompanhar: renderAcompanhamento,
  calendario: renderCalendario,
};
let currentSection = 'dashboard';

function setSection(sec) {
  currentSection = sec;
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('menu-' + sec).classList.add('active');
  sections[sec]();
}

// ---- DASHBOARD ----
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
      ),
      el('div', { style: 'margin:32px 0 0 0;text-align:right;' },
        el('button', {
          class: 'btn',
          onclick: () => openModal(renderModalPDF(projetos))
        }, 'Gerar PDF')
      )
    )
  );
}

// ---- MODAL PDF ----
function renderModalPDF(projetos) {
  return el('div', {},
    el('button', { class: 'modal-close', onclick: closeModal }, '×'),
    el('h2', {}, 'Gerar PDF'),
    el('form', { id: 'form-pdf' },
      el('label', { for: 'pdf-projeto' }, 'Selecione o projeto'),
      el('select', { id: 'pdf-projeto' },
        el('option', { value: 'all' }, 'Todos os projetos'),
        projetos.map(p => el('option', { value: p.id }, p.titulo))
      ),
      el('div', { class: 'button-row', style: 'margin-top:18px;' },
        el('button', { class: 'btn', type: 'submit' }, 'Gerar PDF')
      )
    )
  );
}

document.addEventListener('submit', function (e) {
  if (e.target && e.target.id === 'form-pdf') {
    e.preventDefault();
    const projetos = getProjetos();
    const sel = document.getElementById('pdf-projeto').value;
    let lista = projetos;
    if (sel !== 'all') lista = projetos.filter(p => p.id === sel);
    gerarPDF(lista);
    closeModal();
  }
});

function gerarPDF(projetos) {
  if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.autoTable) {
    showToast('jsPDF ou autoTable não carregados! Verifique a conexão.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt');
  let y = 36;

  // Título principal (bonito e centralizado)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Gestão de Projetos', 38, y, { baseline: 'top' });
  y += 40; // Espaço maior para layout clean

  projetos.forEach((projeto, idx) => {
    if (idx > 0) y += 24;
    // Cabeçalho do Projeto
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(projeto.titulo, 38, y);
    y += 24;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const prioridade = PRIORIDADES.find(p => p.value === projeto.prioridade);
    doc.setTextColor(50, 50, 50); // Cinza escuro para texto
    doc.text([
      `Responsável: ${projeto.responsavel || '—'}`,
      `Prioridade: ${prioridade.label}`,
      `Criado em: ${(new Date(projeto.dataCriacao)).toLocaleDateString()}`
    ], 38, y);
    y += 40;

    if (projeto.descricao) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(70, 70, 70);
      doc.text(projeto.descricao, 38, y, { maxWidth: 520 });
      y += 28;
    }

    // Badge Prioridade (visual bonito)
    doc.setFillColor(prioridade.color);
    doc.roundedRect(440, y - 36, 80, 26, 7, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(prioridade.text);
    doc.text(prioridade.label, 480, y - 18, { align: 'center' });

    // Etapas (tabela clean)
    if (projeto.etapas && projeto.etapas.length) {
      y += 12;
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Etapas:', 38, y);
      y += 12;

      const rows = projeto.etapas.map(etapa => [
        etapa.titulo,
        etapa.responsavel || '—',
        etapa.prazo ? (new Date(etapa.prazo)).toLocaleDateString() : '—',
        etapa.concluida ? 'Concluída' : 'Pendente',
        etapa.observacao || ''
      ]);
      doc.autoTable({
        startY: y,
        margin: { left: 38, right: 24 },
        head: [['Título', 'Responsável', 'Prazo', 'Status', 'Observação']],
        body: rows,
        styles: {
          font: 'helvetica',
          fontSize: 10,
          textColor: [32, 32, 32],
          halign: 'left',
          cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
          lineColor: [200, 200, 200], // Bordas cinza claro
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [240, 240, 240], // Cabeçalho cinza claro
          textColor: [50, 50, 50],
          fontStyle: 'bold',
          lineWidth: 0.5
        },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        rowPageBreak: 'avoid'
      });
      y = doc.lastAutoTable.finalY + 24;
    } else {
      y += 12;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text('Nenhuma etapa cadastrada.', 38, y);
      y += 20;
    }

    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(200, 200, 200); // Linha cinza clara
    doc.line(32, y, 570, y);
    y += 28;
    if (y > 700 && idx < projetos.length - 1) {
      doc.addPage();
      y = 36;
    }
  });

  doc.save('gestao_projetos.pdf');
  showToast('PDF gerado com sucesso!');
}

// ---- NOVO PROJETO ----
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

// ---- EDITAR PROJETO E ETAPAS ----
function renderEditarProjeto(id) {
  const projetos = getProjetos();
  const projeto = projetos.find(p => p.id === id);
  if (!projeto) return showToast('Projeto não encontrado');

  function salvarEAtualizar() {
    setProjetos(projetos);
    renderEditarProjeto(id);
  }

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
          el('label', { for: 'etapa-observacao' }, 'Observação'),
          el('textarea', { id: 'etapa-observacao', rows: 2, maxlength: 160 }),
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
        observacao: document.getElementById('etapa-observacao').value.trim(),
        concluida: false,
      });
      salvarEAtualizar();
      closeModal();
      showToast('Etapa adicionada');
    };
  }

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
          el('label', { for: 'etapa-observacao' }, 'Observação'),
          el('textarea', { id: 'etapa-observacao', rows: 2, maxlength: 160 }, etapa.observacao || ''),
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
      etapa.observacao = document.getElementById('etapa-observacao').value.trim();
      salvarEAtualizar();
      closeModal();
      showToast('Etapa atualizada');
    };
  }

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
          el('button', { class: 'btn secondary', onclick: closeModal }, 'Cancelar')
        )
      )
    );
  }

  const totalEtapas = projeto.etapas.length;
  const concluido = projeto.etapas.filter(e => e.concluida).length;
  const progresso = totalEtapas ? Math.round((concluido / totalEtapas) * 100) : 0;

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
                ),
                etapa.observacao ? el('span', { style: 'font-size:.98em;color:#888;margin-top:2px;' }, `Obs: ${etapa.observacao}`) : ''
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
        el('button', { class: 'btn secondary', onclick: () => setSection('acompanhar') }, 'Voltar')
      )
    )
  );
}

// ---- ACOMPANHAMENTO ----
function renderAcompanhamento() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  const projetos = getProjetos();

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
                  ),
                  etapa.observacao ? el('span', { style: 'font-size:.98em;color:#888;margin-top:2px;' }, `Obs: ${etapa.observacao}`) : ''
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

// ---- CALENDÁRIO (com select por projetos ou tarefas) ----
function renderCalendario() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  let hoje = new Date();
  let mes = hoje.getMonth();
  let ano = hoje.getFullYear();
  let modo = 'tarefas'; // Padrão: por tarefas

  function renderMes() {
    main.innerHTML = '';
    main.appendChild(
      el('h2', {}, 'Calendário de Projetos e Tarefas'),
      el('div', { style: 'display:flex;align-items:center;gap:18px;margin-bottom:16px;' },
        el('button', { class: 'btn secondary', onclick: () => { mes--; if (mes < 0) { mes = 11; ano--; } renderMes(); } }, '‹'),
        el('span', { style: 'font-size:1.12em;font-weight:600;' }, `${mesNome(mes)} / ${ano}`),
        el('button', { class: 'btn secondary', onclick: () => { mes++; if (mes > 11) { mes = 0; ano++; } renderMes(); } }, '›'),
        el('select', {
          style: 'margin-left:32px;max-width:160px;',
          onchange: (e) => { modo = e.target.value; renderMes(); }
        },
          el('option', { value: 'tarefas', selected: modo === 'tarefas' }, 'Por Tarefas'),
          el('option', { value: 'projetos', selected: modo === 'projetos' }, 'Por Projetos')
        )
      )
    );

    const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const table = el('table', { class: 'calendar-table' });
    const head = el('tr', {}, diasSemana.map(dia => el('th', {}, dia)));
    table.appendChild(el('thead', {}, head));
    const firstDay = new Date(ano, mes, 1).getDay();
    const lastDate = new Date(ano, mes + 1, 0).getDate();
    let tr = el('tr', {});
    let dia = 1;
    for (let i = 0; i < 42; i++) {
      if (i % 7 === 0 && i > 0) {
        table.appendChild(tr);
        tr = el('tr', {});
      }
      if (i < firstDay || dia > lastDate) {
        tr.appendChild(el('td', {}, ''));
      } else {
        const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        tr.appendChild(el('td', {
          class: 'calendar-day' + (isHoje(ano, mes, dia) ? ' today' : ''),
          onclick: () => mostrarAgendaDia(dataStr)
        }, dia));
        dia++;
      }
    }
    table.appendChild(tr);
    main.appendChild(table);
    main.appendChild(el('div', { id: 'calendar-agenda', style: 'margin-top:28px;' }));
  }

  function mostrarAgendaDia(dataStr) {
    const projetos = getProjetos();
    let agenda = document.getElementById('calendar-agenda');
    agenda.innerHTML = '';
    agenda.appendChild(el('h3', {}, `Itens para ${dataStr.split('-').reverse().join('/')}`));
    if (modo === 'tarefas') {
      let etapasDoDia = [];
      projetos.forEach(proj => {
        proj.etapas.forEach(etapa => {
          if (etapa.prazo === dataStr) etapasDoDia.push({ ...etapa, projeto: proj });
        });
      });
      if (!etapasDoDia.length) {
        agenda.appendChild(el('div', { style: 'color:var(--muted);margin-top:14px;' }, 'Nenhuma tarefa agendada.'));
      } else {
        agenda.appendChild(
          el('ul', { class: 'etapas-lista' },
            etapasDoDia.map(etapa =>
              el('li', { class: etapa.concluida ? 'done' : '' },
                el('div', { class: 'etapa-info' },
                  el('span', {}, etapa.titulo),
                  el('span', { style: 'font-size:.97em;color:var(--secondary);' },
                    `Projeto: ${etapa.projeto.titulo}`,
                    etapa.responsavel ? ` | Resp.: ${etapa.responsavel}` : ''
                  ),
                  etapa.observacao ? el('span', { style: 'font-size:.98em;color:#888;margin-top:2px;' }, `Obs: ${etapa.observacao}`) : ''
                ),
                el('div', { class: 'etapa-status' },
                  el('span', {}, etapa.concluida ? 'Concluída' : 'Pendente')
                )
              )
            )
          )
        );
      }
    } else if (modo === 'projetos') {
      let projetosDoDia = projetos.filter(proj =>
        proj.etapas.some(et => et.prazo === dataStr)
      );
      if (!projetosDoDia.length) {
        agenda.appendChild(el('div', { style: 'color:var(--muted);margin-top:14px;' }, 'Nenhum projeto com tarefas neste dia.'));
      } else {
        projetosDoDia.forEach(proj => {
          agenda.appendChild(
            el('div', { class: 'project-card', style: 'margin-bottom:14px;' },
              el('h3', {}, proj.titulo),
              el('div', { class: 'meta' }, 'Responsável: ', proj.responsavel || '—'),
              el('div', { class: 'meta' }, 'Prioridade: ',
                el('span', { class: 'priority-badge ' + PRIORIDADES.find(p => p.value === proj.prioridade).class },
                  PRIORIDADES.find(p => p.value === proj.prioridade).label
                )
              ),
              el('div', { class: 'meta' }, 'Criado em: ', (new Date(proj.dataCriacao)).toLocaleDateString()),
              el('div', { class: 'meta' }, proj.descricao),
              el('ul', { class: 'etapas-lista', style: 'margin-top:10px;' },
                proj.etapas
                  .filter(et => et.prazo === dataStr)
                  .map(etapa =>
                    el('li', { class: etapa.concluida ? 'done' : '' },
                      el('div', { class: 'etapa-info' },
                        el('span', {}, etapa.titulo),
                        el('span', { style: 'font-size:.97em;color:var(--secondary);' },
                          etapa.responsavel ? `Resp.: ${etapa.responsavel}` : ''
                        ),
                        etapa.observacao ? el('span', { style: 'font-size:.98em;color:#888;margin-top:2px;' }, `Obs: ${etapa.observacao}`) : ''
                      ),
                      el('div', { class: 'etapa-status' },
                        el('span', {}, etapa.concluida ? 'Concluída' : 'Pendente')
                      )
                    )
                  )
              )
            )
          );
        });
      }
    }
  }

  function mesNome(m) {
    return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m];
  }
  function isHoje(y, m, d) {
    const now = new Date();
    return y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
  }
  renderMes();
}

// ---- EVENTOS DE NAVEGAÇÃO ----
document.getElementById('menu-dashboard').onclick = () => setSection('dashboard');
document.getElementById('menu-adicionar').onclick = () => setSection('adicionar');
document.getElementById('menu-acompanhar').onclick = () => setSection('acompanhar');
document.getElementById('menu-calendario').onclick = () => setSection('calendario');

// ---- INICIALIZAÇÃO ----
setSection('dashboard');
