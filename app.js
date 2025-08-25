// Sistema de Gestão de Projetos - JavaScript
class ProjectManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentProject = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.dailyTasks = this.loadDailyTasks(); // Nova propriedade para tarefas diárias
        
        // Novas propriedades para filtros e paginação
        this.filters = {
            text: '',
            priority: '',
            status: '',
            responsible: ''
        };
        this.sorting = {
            field: 'prioridade',
            direction: 'desc'
        };
        this.pagination = {
            currentPage: 1,
            pageSize: 10,
            totalPages: 1
        };
        this.currentView = 'cards'; // 'cards' ou 'table'
        this.filteredProjects = [];
        
        this.init();
    }

    // Inicialização
    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.updateDashboard();
        this.renderProjects();
        this.renderCalendar();
        this.showSection('dashboard');
    }

    // Event Listeners
    setupEventListeners() {
        // Navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.showSection(section);
                this.setActiveNav(e.target);
            });
        });

        // Menu toggle para mobile
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Formulário adicionar projeto
        document.getElementById('adicionarProjetoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProject();
        });

        // Modal PDF
        document.getElementById('gerarPdfBtn').addEventListener('click', () => {
            this.showPdfModal();
        });

        document.getElementById('closePdfModal').addEventListener('click', () => {
            this.hidePdfModal();
        });

        document.getElementById('cancelarPdf').addEventListener('click', () => {
            this.hidePdfModal();
        });

        document.getElementById('confirmarPdf').addEventListener('click', () => {
            this.generatePDF();
        });

        // Radio buttons do PDF
        document.querySelectorAll('input[name="pdfOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const select = document.getElementById('projetoEspecifico');
                select.disabled = e.target.value === 'todos';
            });
        });

        // Modal editar projeto
        document.getElementById('closeEditarModal').addEventListener('click', () => {
            this.hideEditModal();
        });

        document.getElementById('cancelarEdicao').addEventListener('click', () => {
            this.hideEditModal();
        });

        document.getElementById('salvarEdicao').addEventListener('click', () => {
            this.saveProjectEdit();
        });

        // Modal etapa
        document.getElementById('closeEtapaModal').addEventListener('click', () => {
            this.hideStepModal();
        });

        document.getElementById('cancelarEtapa').addEventListener('click', () => {
            this.hideStepModal();
        });

        document.getElementById('salvarEtapa').addEventListener('click', () => {
            this.saveStep();
        });

        // Detalhes do projeto
        document.getElementById('voltarAcompanhar').addEventListener('click', () => {
            this.showSection('acompanhar');
            this.setActiveNav(document.querySelector('[data-section="acompanhar"]'));
        });

        document.getElementById('editarProjetoBtn').addEventListener('click', () => {
            this.showEditModal();
        });

        document.getElementById('removerProjetoBtn').addEventListener('click', () => {
            this.removeProject();
        });

        document.getElementById('adicionarEtapaBtn').addEventListener('click', () => {
            this.showStepModal();
        });

        // Filtros básicos
        document.getElementById('filtroTexto').addEventListener('input', (e) => {
            this.filters.text = e.target.value;
            this.applyFilters();
        });

        // Filtros avançados
        document.getElementById('toggleAdvancedFilters').addEventListener('click', () => {
            this.toggleAdvancedFilters();
        });

        document.getElementById('filtroPrioridade').addEventListener('change', (e) => {
            this.filters.priority = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filtroStatus').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filtroResponsavel').addEventListener('change', (e) => {
            this.filters.responsible = e.target.value;
            this.applyFilters();
        });

        document.getElementById('ordenarPor').addEventListener('change', (e) => {
            this.sorting.field = e.target.value;
            this.applyFilters();
        });

        document.getElementById('direcaoOrdem').addEventListener('change', (e) => {
            this.sorting.direction = e.target.value;
            this.applyFilters();
        });

        document.getElementById('limparFiltros').addEventListener('click', () => {
            this.clearFilters();
        });

        // Visualização
        document.getElementById('viewCards').addEventListener('click', () => {
            this.setView('cards');
        });

        document.getElementById('viewTable').addEventListener('click', () => {
            this.setView('table');
        });

        // Paginação
        document.getElementById('prevPage').addEventListener('click', () => {
            this.changePage(this.pagination.currentPage - 1);
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.changePage(this.pagination.currentPage + 1);
        });

        document.getElementById('pageSize').addEventListener('change', (e) => {
            this.pagination.pageSize = parseInt(e.target.value);
            this.pagination.currentPage = 1;
            this.applyFilters();
        });

        // Ordenação por cabeçalhos da tabela
        document.querySelectorAll('.table th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (this.sorting.field === field) {
                    this.sorting.direction = this.sorting.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sorting.field = field;
                    this.sorting.direction = 'asc';
                }
                this.applyFilters();
                this.updateTableHeaders();
            });
        });

        // Calendário
        document.getElementById('mesAnterior').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('proximoMes').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Tarefas diárias
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.addDailyTask();
        });

        document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addDailyTask();
            }
        });

        // Fechar modais clicando fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });

        // Fechar toast
        document.getElementById('toastClose').addEventListener('click', () => {
            this.hideToast();
        });

        // Acessibilidade - fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Fechar toast
                if (document.getElementById('toast').classList.contains('show')) {
                    this.hideToast();
                }
                
                // Fechar modais
                document.querySelectorAll('.modal.show').forEach(modal => {
                    modal.classList.remove('show');
                });
            }
        });
    }

    // Navegação SPA
    setupNavigation() {
        // Configuração inicial da navegação
    }

    showSection(sectionName) {
        // Esconder todas as seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar seção selecionada
        document.getElementById(sectionName).classList.add('active');

        // Atualizar dados se necessário
        if (sectionName === 'dashboard') {
            this.updateDashboard();
        } else if (sectionName === 'acompanhar') {
            this.renderProjects();
        } else if (sectionName === 'calendario') {
            this.renderCalendar();
        }
    }

    setActiveNav(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    // Filtros e Ordenação
    toggleAdvancedFilters() {
        const filtersDiv = document.getElementById('advancedFilters');
        const toggleBtn = document.getElementById('toggleAdvancedFilters');
        
        filtersDiv.classList.toggle('show');
        toggleBtn.classList.toggle('active');
        
        if (filtersDiv.classList.contains('show')) {
            this.populateResponsibleFilter();
        }
    }

    populateResponsibleFilter() {
        const select = document.getElementById('filtroResponsavel');
        const responsibles = [...new Set(this.projects
            .map(p => p.responsavel)
            .filter(r => r && r.trim())
        )].sort();

        select.innerHTML = '<option value="">' + 'Todos' + '</option>' +
            responsibles.map(r => `<option value="${r}">${r}</option>`).join('');
    }

    applyFilters() {
        let filtered = [...this.projects];

        // Filtro de texto
        if (this.filters.text) {
            const searchTerm = this.filters.text.toLowerCase();
            filtered = filtered.filter(project => 
                project.titulo.toLowerCase().includes(searchTerm) ||
                (project.descricao && project.descricao.toLowerCase().includes(searchTerm)) ||
                (project.responsavel && project.responsavel.toLowerCase().includes(searchTerm))
            );
        }

        // Filtro de prioridade
        if (this.filters.priority) {
            filtered = filtered.filter(project => project.prioridade === this.filters.priority);
        }

        // Filtro de status
        if (this.filters.status) {
            filtered = filtered.filter(project => {
                const progress = this.calculateProgress(project);
                if (this.filters.status === 'concluido') {
                    return progress === 100;
                } else if (this.filters.status === 'andamento') {
                    return progress < 100;
                }
                return true;
            });
        }

        // Filtro de responsável
        if (this.filters.responsible) {
            filtered = filtered.filter(project => project.responsavel === this.filters.responsible);
        }

        // Ordenação
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (this.sorting.field) {
                case 'titulo':
                    valueA = a.titulo.toLowerCase();
                    valueB = b.titulo.toLowerCase();
                    break;
                case 'responsavel':
                    valueA = (a.responsavel || '').toLowerCase();
                    valueB = (b.responsavel || '').toLowerCase();
                    break;
                case 'data':
                    valueA = new Date(a.dataCriacao);
                    valueB = new Date(b.dataCriacao);
                    break;
                case 'progresso':
                    valueA = this.calculateProgress(a);
                    valueB = this.calculateProgress(b);
                    break;
                case 'prioridade':
                default:
                    const priorityOrder = { alta: 3, media: 2, leve: 1 };
                    valueA = priorityOrder[a.prioridade];
                    valueB = priorityOrder[b.prioridade];
                    break;
            }

            if (valueA < valueB) return this.sorting.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sorting.direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.filteredProjects = filtered;
        this.updatePagination();
        this.renderCurrentView();
        this.updateProjectsCount();
    }

    clearFilters() {
        this.filters = {
            text: '',
            priority: '',
            status: '',
            responsible: ''
        };

        document.getElementById('filtroTexto').value = '';
        document.getElementById('filtroPrioridade').value = '';
        document.getElementById('filtroStatus').value = '';
        document.getElementById('filtroResponsavel').value = '';

        this.applyFilters();
    }

    // Visualização
    setView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.view-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`view${view.charAt(0).toUpperCase() + view.slice(1)}`).classList.add('active');

        this.renderCurrentView();
    }

    renderCurrentView() {
        if (this.currentView === 'cards') {
            this.renderProjectCards();
        } else {
            this.renderProjectTable();
        }
    }

    // Paginação
    updatePagination() {
        this.pagination.totalPages = Math.ceil(this.filteredProjects.length / this.pagination.pageSize);
        
        if (this.pagination.currentPage > this.pagination.totalPages) {
            this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
        }

        this.updatePaginationControls();
    }

    updatePaginationControls() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const info = document.getElementById('paginationInfo');

        prevBtn.disabled = this.pagination.currentPage <= 1;
        nextBtn.disabled = this.pagination.currentPage >= this.pagination.totalPages;

        info.textContent = `Página ${this.pagination.currentPage} de ${this.pagination.totalPages}`;
    }

    changePage(page) {
        if (page >= 1 && page <= this.pagination.totalPages) {
            this.pagination.currentPage = page;
            this.renderCurrentView();
            this.updatePaginationControls();
        }
    }

    getPaginatedProjects() {
        const start = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const end = start + this.pagination.pageSize;
        return this.filteredProjects.slice(start, end);
    }

    updateProjectsCount() {
        const count = this.filteredProjects.length;
        const total = this.projects.length;
        const countText = count === total ? 
            `${count} projeto${count !== 1 ? 's' : ''}` :
            `${count} de ${total} projeto${total !== 1 ? 's' : ''}`;
        
        document.getElementById('projectsCount').textContent = countText;
    }

    // Gerenciamento de Projetos
    addProject() {
        const form = document.getElementById('adicionarProjetoForm');
        const formData = new FormData(form);
        
        const project = {
            id: this.generateId(),
            titulo: formData.get('titulo'),
            descricao: formData.get('descricao'),
            responsavel: formData.get('responsavel'),
            prioridade: formData.get('prioridade'),
            dataCriacao: new Date().toISOString(),
            dataEntrega: formData.get('dataEntrega') || null, // Novo campo
            etapas: []
        };

        this.projects.push(project);
        this.saveProjects();
        this.showToast('Projeto adicionado com sucesso!');
        
        form.reset();
        this.showSection('acompanhar');
        this.setActiveNav(document.querySelector('[data-section="acompanhar"]'));
    }

    removeProject() {
        if (!this.currentProject) return;

        if (confirm('Tem certeza que deseja remover este projeto?')) {
            this.projects = this.projects.filter(p => p.id !== this.currentProject.id);
            this.saveProjects();
            this.showToast('Projeto removido com sucesso!');
            this.showSection('acompanhar');
            this.setActiveNav(document.querySelector('[data-section="acompanhar"]'));
        }
    }

    showProjectDetails(projectId) {
        this.currentProject = this.projects.find(p => p.id === projectId);
        if (!this.currentProject) return;

        this.renderProjectDetails();
        this.renderProjectSteps();
        this.showSection('detalhes');
    }

    renderProjectDetails() {
        const container = document.getElementById('projectDetails');
        const project = this.currentProject;
        
        const progress = this.calculateProgress(project);
        const creationDate = new Date(project.dataCriacao).toLocaleDateString('pt-BR');
        const deliveryDate = project.dataEntrega ? new Date(project.dataEntrega).toLocaleDateString('pt-BR') : 'Não definida';

        container.innerHTML = `
            <div class="project-info">
                <div class="info-item">
                    <h4>Título</h4>
                    <p>${project.titulo}</p>
                </div>
                <div class="info-item">
                    <h4>Responsável</h4>
                    <p>${project.responsavel || 'Não informado'}</p>
                </div>
                <div class="info-item">
                    <h4>Data de Criação</h4>
                    <p>${creationDate}</p>
                </div>
                <div class="info-item">
                    <h4>Data de Entrega</h4>
                    <p>${deliveryDate}</p>
                </div>
                <div class="info-item">
                    <h4>Prioridade</h4>
                    <p><span class="priority-badge ${project.prioridade}">${project.prioridade.toUpperCase()}</span></p>
                </div>
            </div>
            <div class="info-item">
                <h4>Descrição</h4>
                <p>${project.descricao || 'Sem descrição'}</p>
            </div>
            <div class="info-item">
                <h4>Progresso</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${progress}% concluído</div>
            </div>
        `;
    }

    renderProjectSteps() {
        const container = document.getElementById('stepsList');
        const project = this.currentProject;

        if (project.etapas.length === 0) {
            container.innerHTML = '<p>Nenhuma etapa adicionada ainda.</p>';
            return;
        }

        container.innerHTML = project.etapas.map(step => `
            <div class="step-card ${step.concluida ? 'completed' : ''}">
                <div class="step-card-header">
                    <div>
                        <div class="step-title">${step.titulo}</div>
                        <div class="step-meta">
                            <div><strong>Responsável:</strong> ${step.responsavel || 'Não informado'}</div>
                            <div><strong>Prazo:</strong> ${step.prazo ? new Date(step.prazo).toLocaleDateString('pt-BR') : 'Não definido'}</div>
                            ${step.link ? `<div><strong>Link:</strong> <a href="${step.link}" target="_blank">${step.link}</a></div>` : ''}
                        </div>
                        ${step.observacao ? `<div class="step-observation">${step.observacao}</div>` : ''}
                    </div>
                    <div class="step-actions">
                        <button class="btn btn-secondary" onclick="projectManager.editStep('${step.id}')">Editar</button>
                        <button class="btn btn-danger" onclick="projectManager.removeStep('${step.id}')">Remover</button>
                    </div>
                </div>
                <div class="step-checkbox">
                    <input type="checkbox" ${step.concluida ? 'checked' : ''} 
                           onchange="projectManager.toggleStepCompletion('${step.id}')">
                    <label>Etapa concluída</label>
                </div>
            </div>
        `).join('');
    }

    // Gerenciamento de Etapas
    showStepModal(stepId = null) {
        const modal = document.getElementById('etapaModal');
        const title = document.getElementById('etapaModalTitle');
        
        if (stepId) {
            const step = this.currentProject.etapas.find(s => s.id === stepId);
            title.textContent = 'Editar Etapa';
            document.getElementById('etapaTitulo').value = step.titulo;
            document.getElementById('etapaResponsavel').value = step.responsavel || '';
            document.getElementById('etapaPrazo').value = step.prazo || '';
            document.getElementById('etapaLink').value = step.link || ''; // Novo campo
            document.getElementById('etapaObservacao').value = step.observacao || '';
            document.getElementById('etapaConcluida').checked = step.concluida;
            modal.dataset.stepId = stepId;
        } else {
            title.textContent = 'Adicionar Etapa';
            document.getElementById('etapaForm').reset();
            delete modal.dataset.stepId;
        }

        modal.classList.add('show');
    }

    hideStepModal() {
        document.getElementById('etapaModal').classList.remove('show');
    }

    saveStep() {
        const modal = document.getElementById('etapaModal');
        const stepId = modal.dataset.stepId;
        
        const stepData = {
            titulo: document.getElementById('etapaTitulo').value,
            responsavel: document.getElementById('etapaResponsavel').value,
            prazo: document.getElementById('etapaPrazo').value,
            link: document.getElementById('etapaLink').value, // Novo campo
            observacao: document.getElementById('etapaObservacao').value,
            concluida: document.getElementById('etapaConcluida').checked
        };

        if (!stepData.titulo.trim()) {
            this.showToast('Título da etapa é obrigatório!');
            return;
        }

        if (stepId) {
            // Editar etapa existente
            const stepIndex = this.currentProject.etapas.findIndex(s => s.id === stepId);
            this.currentProject.etapas[stepIndex] = { ...this.currentProject.etapas[stepIndex], ...stepData };
            this.showToast('Etapa atualizada com sucesso!');
        } else {
            // Adicionar nova etapa
            const newStep = {
                id: this.generateId(),
                ...stepData
            };
            this.currentProject.etapas.push(newStep);
            this.showToast('Etapa adicionada com sucesso!');
        }

        this.saveProjects();
        this.renderProjectDetails();
        this.renderProjectSteps();
        this.hideStepModal();
    }

    editStep(stepId) {
        this.showStepModal(stepId);
    }

    removeStep(stepId) {
        if (confirm('Tem certeza que deseja remover esta etapa?')) {
            this.currentProject.etapas = this.currentProject.etapas.filter(s => s.id !== stepId);
            this.saveProjects();
            this.renderProjectDetails();
            this.renderProjectSteps();
            this.showToast('Etapa removida com sucesso!');
        }
    }

    toggleStepCompletion(stepId) {
        const step = this.currentProject.etapas.find(s => s.id === stepId);
        step.concluida = !step.concluida;
        this.saveProjects();
        this.renderProjectDetails();
        this.renderProjectSteps();
    }

    // Dashboard
    updateDashboard() {
        const total = this.projects.length;
        const completed = this.projects.filter(p => this.calculateProgress(p) === 100).length;
        const inProgress = total - completed;

        const priorities = {
            alta: this.projects.filter(p => p.prioridade === 'alta').length,
            media: this.projects.filter(p => p.prioridade === 'media').length,
            leve: this.projects.filter(p => p.prioridade === 'leve').length
        };

        document.getElementById('totalProjetos').textContent = total;
        document.getElementById('projetosConcluidos').textContent = completed;
        document.getElementById('projetosAndamento').textContent = inProgress;
        document.getElementById('prioridadeAlta').textContent = priorities.alta;
        document.getElementById('prioridadeMedia').textContent = priorities.media;
        document.getElementById('prioridadeLeve').textContent = priorities.leve;
    }

    // Acompanhar Projetos
    renderProjects() {
        this.applyFilters();
    }

    renderProjectCards() {
        const container = document.getElementById('projectsList');
        const tableContainer = document.getElementById('projectsTable');
        
        container.classList.remove('hidden');
        tableContainer.classList.add('hidden');
        
        const projects = this.getPaginatedProjects();
        
        if (projects.length === 0) {
            container.innerHTML = '<p>Nenhum projeto encontrado com os filtros aplicados.</p>';
            return;
        }

        container.innerHTML = projects.map(project => {
            const progress = this.calculateProgress(project);
            const creationDate = new Date(project.dataCriacao).toLocaleDateString('pt-BR');
            const deliveryDate = project.dataEntrega ? new Date(project.dataEntrega).toLocaleDateString('pt-BR') : 'Não definida';
            const visibleSteps = project.etapas.slice(0, 2);
            const hasMoreSteps = project.etapas.length > 2;

            return `
                <div class="project-card" onclick="projectManager.showProjectDetails('${project.id}')">
                    <div class="project-card-header">
                        <div>
                            <div class="project-title">${project.titulo}</div>
                            <div class="project-description">${project.descricao || 'Sem descrição'}</div>
                        </div>
                        <span class="priority-badge ${project.prioridade}">${project.prioridade.toUpperCase()}</span>
                    </div>
                    <div class="project-meta">
                        <span>Responsável: ${project.responsavel || 'Não informado'}</span>
                        <span>Criado em: ${creationDate}</span>
                        <span>Entrega: ${deliveryDate}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${progress}% concluído</div>
                    ${visibleSteps.length > 0 ? `
                        <div class="project-steps">
                            <h4>Próximas etapas:</h4>
                            ${visibleSteps.map(step => `
                                <div class="step-item ${step.concluida ? 'completed' : ''}">
                                    <input type="checkbox" ${step.concluida ? 'checked' : ''} disabled>
                                    ${step.titulo}
                                </div>
                            `).join('')}
                            ${hasMoreSteps ? `
                                <button class="expand-steps" onclick="event.stopPropagation(); projectManager.showProjectDetails('${project.id}')">
                                    Ver todas as ${project.etapas.length} etapas
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderProjectTable() {
        const container = document.getElementById('projectsList');
        const tableContainer = document.getElementById('projectsTable');
        const tableBody = document.getElementById('projectsTableBody');
        
        container.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        
        const projects = this.getPaginatedProjects();
        
        if (projects.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum projeto encontrado com os filtros aplicados.</td></tr>';
            return;
        }

        tableBody.innerHTML = projects.map(project => {
            const progress = this.calculateProgress(project);
            const creationDate = new Date(project.dataCriacao).toLocaleDateString('pt-BR');
            const deliveryDate = project.dataEntrega ? new Date(project.dataEntrega).toLocaleDateString('pt-BR') : 'Não definida';

            return `
                <tr onclick="projectManager.showProjectDetails('${project.id}')" style="cursor: pointer;">
                    <td>${project.titulo}</td>
                    <td>${project.responsavel || 'Não informado'}</td>
                    <td><span class="priority-badge ${project.prioridade}">${project.prioridade.toUpperCase()}</span></td>
                    <td>
                        <div class="table-progress">
                            <div class="table-progress-bar">
                                <div class="table-progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <span class="table-progress-text">${progress}%</span>
                        </div>
                    </td>
                    <td>${creationDate}</td>
                    <td>${deliveryDate}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-secondary" onclick="event.stopPropagation(); projectManager.showProjectDetails('${project.id}')">Ver</button>
                            <button class="btn btn-primary" onclick="event.stopPropagation(); projectManager.editProjectFromTable('${project.id}')">Editar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.updateTableHeaders();
    }

    updateTableHeaders() {
        document.querySelectorAll('.table th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === this.sorting.field) {
                th.classList.add(`sort-${this.sorting.direction}`);
            }
        });
    }

    editProjectFromTable(projectId) {
        this.currentProject = this.projects.find(p => p.id === projectId);
        this.showEditModal();
    }

    // Modal Editar Projeto
    showEditModal() {
        if (!this.currentProject) return;

        const project = this.currentProject;
        document.getElementById('editTitulo').value = project.titulo;
        document.getElementById('editDescricao').value = project.descricao || '';
        document.getElementById('editResponsavel').value = project.responsavel || '';
        document.getElementById('editPrioridade').value = project.prioridade;
        document.getElementById('editDataEntrega').value = project.dataEntrega || ''; // Novo campo

        document.getElementById('editarProjetoModal').classList.add('show');
    }

    hideEditModal() {
        document.getElementById('editarProjetoModal').classList.remove('show');
    }

    saveProjectEdit() {
        const updatedData = {
            titulo: document.getElementById('editTitulo').value,
            descricao: document.getElementById('editDescricao').value,
            responsavel: document.getElementById('editResponsavel').value,
            prioridade: document.getElementById('editPrioridade').value,
            dataEntrega: document.getElementById('editDataEntrega').value || null // Novo campo
        };

        if (!updatedData.titulo.trim()) {
            this.showToast('Título do projeto é obrigatório!');
            return;
        }

        Object.assign(this.currentProject, updatedData);
        this.saveProjects();
        this.renderProjectDetails();
        this.hideEditModal();
        this.showToast('Projeto atualizado com sucesso!');
    }

    // Calendário
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Atualizar título
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        document.getElementById('mesAno').textContent = `${monthNames[month]} ${year}`;

        // Calcular dias do mês
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const calendarBody = document.getElementById('calendarBody');
        calendarBody.innerHTML = '';

        // Gerar 6 semanas
        for (let week = 0; week < 6; week++) {
            const row = document.createElement('tr');
            
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);
                
                const cell = document.createElement('td');
                cell.textContent = currentDate.getDate();
                
                // Classes CSS
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = this.isToday(currentDate);
                const isSelected = this.selectedDate && this.isSameDate(currentDate, this.selectedDate);
                
                if (!isCurrentMonth) {
                    cell.classList.add('other-month');
                }
                if (isToday) {
                    cell.classList.add('today');
                }
                if (isSelected) {
                    cell.classList.add('selected');
                }
                
                // Verificar se há eventos neste dia
                if (this.hasEventsOnDate(currentDate)) {
                    cell.classList.add('has-events');
                }
                
                // Event listeners
                cell.addEventListener('click', () => {
                    this.selectDate(currentDate);
                });
                
                // Tooltip para eventos
                const events = this.getEventsForDate(currentDate);
                if (events.length > 0) {
                    cell.addEventListener('mouseenter', (e) => {
                        this.showTooltip(e, currentDate, events);
                    });
                    
                    cell.addEventListener('mouseleave', () => {
                        this.hideTooltip();
                    });
                }
                
                row.appendChild(cell);
            }
            
            calendarBody.appendChild(row);
        }
        
        // Renderizar eventos do dia selecionado
        this.renderCalendarEvents();
        this.renderDailyTasks();
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    getEventsForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        const events = [];

        this.projects.forEach(project => {
            project.etapas.forEach(step => {
                if (step.prazo && step.prazo.startsWith(dateString)) {
                    events.push({
                        step,
                        projectId: project.id,
                        projectTitle: project.titulo
                    });
                }
            });
        });

        return events;
    }

    showTooltip(event, date, steps) {
        const tooltip = document.getElementById('calendarTooltip');
        const dateStr = date.toLocaleDateString('pt-BR');
        
        const content = `
            <h4>${dateStr}</h4>
            ${steps.map(step => {
                const project = this.projects.find(p => p.id === step.projectId);
                const priority = project ? project.prioridade : 'leve';
                return `
                    <div class="calendar-tooltip-item">
                        <div class="calendar-tooltip-priority ${priority}"></div>
                        <div>
                            <strong>${step.titulo}</strong><br>
                            <small>${project ? project.titulo : 'Projeto não encontrado'}</small>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
        
        tooltip.innerHTML = content;
        tooltip.classList.add('show');
        this.updateTooltipPosition(event);
    }

    hideTooltip() {
        const tooltip = document.getElementById('calendarTooltip');
        tooltip.classList.remove('show');
    }

    updateTooltipPosition(event) {
        const tooltip = document.getElementById('calendarTooltip');
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = event.pageX + 10;
        let top = event.pageY - 10;
        
        // Ajustar se sair da viewport
        if (left + rect.width > viewportWidth) {
            left = event.pageX - rect.width - 10;
        }
        if (top + rect.height > viewportHeight) {
            top = event.pageY - rect.height - 10;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    selectDate(date) {
        // Remover seleção anterior
        document.querySelectorAll('.calendar td.selected').forEach(td => {
            td.classList.remove('selected');
        });

        // Definir nova data selecionada
        if (typeof date === 'string') {
            this.selectedDate = new Date(date);
        } else {
            this.selectedDate = date;
        }

        // Re-renderizar calendário para mostrar seleção
        this.renderCalendar();
    }

    hasEventsOnDate(date) {
        const dateString = date.toISOString().split('T')[0];
        return this.projects.some(project => 
            project.etapas.some(step => 
                step.prazo && step.prazo.startsWith(dateString)
            )
        );
    }

    renderCalendarEvents() {
        const container = document.getElementById('eventsList');
        
        if (!this.selectedDate) {
            container.innerHTML = '<p>Selecione um dia para ver as etapas agendadas.</p>';
            return;
        }

        const dateString = this.selectedDate.toISOString().split('T')[0];
        const events = [];

        this.projects.forEach(project => {
            project.etapas.forEach(step => {
                if (step.prazo && step.prazo.startsWith(dateString)) {
                    events.push({
                        step,
                        project
                    });
                }
            });
        });

        if (events.length === 0) {
            container.innerHTML = '<p>Nenhuma etapa agendada para este dia.</p>';
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="event-item">
                <div class="event-title">${event.step.titulo}</div>
                <div class="event-project">Projeto: ${event.project.titulo}</div>
                <div class="event-meta">
                    Responsável: ${event.step.responsavel || 'Não informado'} | 
                    ${event.step.observacao || 'Sem observações'}
                    ${event.step.link ? ` | Link: <a href="${event.step.link}" target="_blank">${event.step.link}</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Gerenciamento de Tarefas Diárias
    loadDailyTasks() {
        const stored = localStorage.getItem('daily_tasks');
        return stored ? JSON.parse(stored) : {};
    }

    saveDailyTasks() {
        localStorage.setItem('daily_tasks', JSON.stringify(this.dailyTasks));
    }

    getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    addDailyTask() {
        if (!this.selectedDate) {
            this.showToast('Selecione um dia no calendário primeiro!', 'warning');
            return;
        }

        const input = document.getElementById('newTaskInput');
        const taskText = input.value.trim();

        if (!taskText) {
            this.showToast('Digite o texto da tarefa!', 'warning');
            return;
        }

        const dateKey = this.getDateKey(this.selectedDate);
        
        if (!this.dailyTasks[dateKey]) {
            this.dailyTasks[dateKey] = [];
        }

        const newTask = {
            id: this.generateId(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.dailyTasks[dateKey].push(newTask);
        this.saveDailyTasks();
        
        input.value = '';
        this.renderDailyTasks();
        this.showToast('Tarefa adicionada com sucesso!');
    }

    toggleTaskCompletion(taskId) {
        if (!this.selectedDate) return;

        const dateKey = this.getDateKey(this.selectedDate);
        const tasks = this.dailyTasks[dateKey];
        
        if (!tasks) return;

        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveDailyTasks();
            this.renderDailyTasks();
        }
    }

    removeTask(taskId) {
        if (!this.selectedDate) return;

        const dateKey = this.getDateKey(this.selectedDate);
        const tasks = this.dailyTasks[dateKey];
        
        if (!tasks) return;

        this.dailyTasks[dateKey] = tasks.filter(t => t.id !== taskId);
        this.saveDailyTasks();
        this.renderDailyTasks();
        this.showToast('Tarefa removida com sucesso!');
    }

    renderDailyTasks() {
        const container = document.getElementById('tasksList');
        const addSection = document.getElementById('addTaskSection');
        
        if (!this.selectedDate) {
            container.innerHTML = '<p>Selecione um dia para gerenciar suas tarefas.</p>';
            addSection.style.display = 'none';
            return;
        }

        addSection.style.display = 'flex';
        
        const dateKey = this.getDateKey(this.selectedDate);
        const tasks = this.dailyTasks[dateKey] || [];

        if (tasks.length === 0) {
            container.innerHTML = '<p>Nenhuma tarefa para este dia. Adicione uma nova tarefa abaixo.</p>';
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="projectManager.toggleTaskCompletion('${task.id}')">
                <span class="task-text">${task.text}</span>
                <div class="task-actions">
                    <button onclick="projectManager.removeTask('${task.id}')" title="Remover tarefa">
                        ×
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Geração de PDF
    showPdfModal() {
        const select = document.getElementById('projetoEspecifico');
        select.innerHTML = '<option value="">' + 'Selecione um projeto' + '</option>' +
            this.projects.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');
        
        document.getElementById('pdfModal').classList.add('show');
    }

    hidePdfModal() {
        document.getElementById('pdfModal').classList.remove('show');
    }

    generatePDF() {
        const option = document.querySelector('input[name="pdfOption"]:checked').value;
        let projectsToInclude = [];

        if (option === 'todos') {
            projectsToInclude = this.projects;
        } else {
            const projectId = document.getElementById('projetoEspecifico').value;
            if (!projectId) {
                this.showToast('Selecione um projeto específico!');
                return;
            }
            projectsToInclude = this.projects.filter(p => p.id === projectId);
        }

        this.createPDF(projectsToInclude);
        this.hidePdfModal();
    }

    createPDF(projects) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configurações
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let yPosition = margin;

        // Título principal
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Relatório de Gestão de Projetos', margin, yPosition);
        yPosition += 15;

        // Data de geração
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
        yPosition += 20;

        projects.forEach((project, index) => {
            // Verificar se precisa de nova página
            if (yPosition > 250) {
                doc.addPage();
                yPosition = margin;
            }

            // Título do projeto
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${project.titulo}`, margin, yPosition);
            yPosition += 10;

            // Informações do projeto
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            const projectInfo = [
                `Descrição: ${project.descricao || 'Não informada'}`,
                `Responsável: ${project.responsavel || 'Não informado'}`,
                `Prioridade: ${project.prioridade.toUpperCase()}`,
                `Data de Criação: ${new Date(project.dataCriacao).toLocaleDateString('pt-BR')}`,
                `Data de Entrega: ${project.dataEntrega ? new Date(project.dataEntrega).toLocaleDateString('pt-BR') : 'Não definida'}`,
                `Progresso: ${this.calculateProgress(project)}%`
            ];

            projectInfo.forEach(info => {
                doc.text(info, margin, yPosition);
                yPosition += 6;
            });

            // Etapas
            if (project.etapas.length > 0) {
                yPosition += 5;
                doc.setFont(undefined, 'bold');
                doc.text('Etapas:', margin, yPosition);
                yPosition += 8;

                const tableData = project.etapas.map(step => [
                    step.titulo,
                    step.responsavel || 'N/A',
                    step.prazo ? new Date(step.prazo).toLocaleDateString('pt-BR') : 'N/A',
                    step.link || 'N/A', // Novo campo
                    step.concluida ? 'Sim' : 'Não',
                    step.observacao || 'N/A'
                ]);

                doc.autoTable({
                    head: [['Título', 'Responsável', 'Prazo', 'Link', 'Concluída', 'Observação']], // Cabeçalho atualizado
                    body: tableData,
                    startY: yPosition,
                    margin: { left: margin, right: margin },
                    styles: {
                        fontSize: 8,
                        cellPadding: 3
                    },
                    headStyles: {
                        fillColor: [51, 51, 51],
                        textColor: [255, 255, 255]
                    },
                    alternateRowStyles: {
                        fillColor: [248, 249, 250]
                    }
                });

                yPosition = doc.lastAutoTable.finalY + 15;
            } else {
                doc.setFont(undefined, 'italic');
                doc.text('Nenhuma etapa cadastrada.', margin, yPosition);
                yPosition += 15;
            }

            yPosition += 10;
        });

        // Salvar PDF
        doc.save('gestao_projetos.pdf');
        this.showToast('PDF gerado com sucesso!');
    }

    // Utilitários
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    calculateProgress(project) {
        if (project.etapas.length === 0) return 0;
        const completed = project.etapas.filter(step => step.concluida).length;
        return Math.round((completed / project.etapas.length) * 100);
    }

    showToast(message, type = 'success', title = null, duration = 3000) {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        // Limpar classes anteriores
        toast.className = 'toast';
        
        // Configurar conteúdo baseado no tipo
        const config = {
            success: {
                icon: '✓',
                title: title || 'Sucesso',
                class: 'success'
            },
            error: {
                icon: '✕',
                title: title || 'Erro',
                class: 'error'
            },
            warning: {
                icon: '⚠',
                title: title || 'Atenção',
                class: 'warning'
            },
            info: {
                icon: 'ℹ',
                title: title || 'Informação',
                class: 'info'
            }
        };
        
        const currentConfig = config[type] || config.success;
        
        // Aplicar configuração
        toast.classList.add(currentConfig.class);
        toastIcon.textContent = currentConfig.icon;
        toastTitle.textContent = currentConfig.title;
        toastMessage.textContent = message;
        
        // Mostrar toast
        toast.classList.add('show');
        
        // Auto-hide após duração especificada
        if (duration > 0) {
            setTimeout(() => {
                this.hideToast();
            }, duration);
        }
    }

    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('show');
    }

    // Persistência
    loadProjects() {
        const stored = localStorage.getItem('gestao_projetos');
        return stored ? JSON.parse(stored) : [];
    }

    saveProjects() {
        localStorage.setItem('gestao_projetos', JSON.stringify(this.projects));
        this.updateDashboard();
    }
}

// Inicialização
let projectManager;

document.addEventListener('DOMContentLoaded', () => {
    projectManager = new ProjectManager();
});

// Funções globais para eventos inline
window.projectManager = {
    showProjectDetails: (id) => projectManager.showProjectDetails(id),
    editStep: (id) => projectManager.editStep(id),
    removeStep: (id) => projectManager.removeStep(id),
    toggleStepCompletion: (id) => projectManager.toggleStepCompletion(id),
    selectDate: (date) => projectManager.selectDate(date),
    toggleTaskCompletion: (id) => projectManager.toggleTaskCompletion(id),
    removeTask: (id) => projectManager.removeTask(id)
};
