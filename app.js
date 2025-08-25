// Verificar autenticação
function checkAuth() {
    if (!localStorage.getItem("loggedIn") && !window.location.pathname.endsWith("login.html")) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// Função de logout
function logout() {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
}

class ProjectManager {
    constructor() {
        // Verificar autenticação antes de inicializar
        if (!checkAuth()) {
            return;
        }
        
        this.projects = this.loadProjects();
        this.currentProject = null;
        this.currentIdea = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.dailyTasks = this.loadDailyTasks();
        
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
        this.currentView = 'cards';
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

        // Filtros
        document.getElementById('filtroTexto').addEventListener('input', (e) => {
            this.filters.text = e.target.value;
            this.applyFilters();
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

        // Toggle filtros avançados
        document.getElementById('toggleAdvancedFilters').addEventListener('click', () => {
            this.toggleAdvancedFilters();
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
            this.previousPage();
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.nextPage();
        });

        document.getElementById('pageSize').addEventListener('change', (e) => {
            this.pagination.pageSize = parseInt(e.target.value);
            this.pagination.currentPage = 1;
            this.applyFilters();
        });

        // Detalhes do projeto
        document.getElementById('voltarAcompanhar').addEventListener('click', () => {
            this.showSection('acompanhar');
        });

        document.getElementById('editarProjetoBtn').addEventListener('click', () => {
            this.showEditProjectModal();
        });

        document.getElementById('removerProjetoBtn').addEventListener('click', () => {
            this.removeProject();
        });

        // Modal editar projeto
        document.getElementById('closeEditarModal').addEventListener('click', () => {
            this.hideEditProjectModal();
        });

        document.getElementById('cancelarEdicao').addEventListener('click', () => {
            this.hideEditProjectModal();
        });

        document.getElementById('salvarEdicao').addEventListener('click', () => {
            this.saveProjectEdit();
        });

        // Modal ideia
        document.getElementById('adicionarIdeiaBtn').addEventListener('click', () => {
            this.showIdeaModal();
        });

        document.getElementById('closeIdeiaModal').addEventListener('click', () => {
            this.hideIdeaModal();
        });

        document.getElementById('cancelarIdeia').addEventListener('click', () => {
            this.hideIdeaModal();
        });

        document.getElementById('salvarIdeia').addEventListener('click', () => {
            this.saveIdea();
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

        // Calendário
        document.getElementById('mesAnterior').addEventListener('click', () => {
            this.previousMonth();
        });

        document.getElementById('proximoMes').addEventListener('click', () => {
            this.nextMonth();
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

        // Toast
        document.getElementById('toastClose').addEventListener('click', () => {
            this.hideToast();
        });

        // Fechar modais clicando fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // Navegação
    setupNavigation() {
        // Configurar navegação inicial
    }

    showSection(sectionName) {
        // Esconder todas as seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar seção selecionada
        document.getElementById(sectionName).classList.add('active');

        // Atualizar dados específicos da seção
        if (sectionName === 'acompanhar') {
            this.renderProjects();
        } else if (sectionName === 'calendario') {
            this.renderCalendar();
        } else if (sectionName === 'dashboard') {
            this.updateDashboard();
        }
    }

    setActiveNav(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    // Projetos
    loadProjects() {
        const projects = localStorage.getItem('projects');
        if (projects) {
            const parsedProjects = JSON.parse(projects);
            // Migrar projetos antigos para nova estrutura
            return parsedProjects.map(project => this.migrateProject(project));
        }
        return [];
    }

    migrateProject(project) {
        // Se o projeto já tem ideias, não precisa migrar
        if (project.ideias) {
            return project;
        }

        // Migrar etapas antigas para ideias
        const ideias = [];
        if (project.etapas && project.etapas.length > 0) {
            // Criar uma ideia padrão com as etapas antigas
            ideias.push({
                id: Date.now(),
                titulo: 'Ideias do Projeto',
                descricao: 'Ideias migradas automaticamente do sistema anterior.',
                etapas: project.etapas || []
            });
        }

        return {
            ...project,
            ideias: ideias,
            etapas: undefined // Remover propriedade antiga
        };
    }

    saveProjects() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }

    addProject() {
        const form = document.getElementById('adicionarProjetoForm');
        const formData = new FormData(form);
        
        const project = {
            id: Date.now(),
            titulo: formData.get('titulo'),
            descricao: formData.get('descricao') || '',
            responsavel: formData.get('responsavel') || '',
            prioridade: formData.get('prioridade'),
            dataEntrega: formData.get('dataEntrega') || '',
            dataCriacao: new Date().toLocaleDateString('pt-BR'),
            ideias: []
        };

        this.projects.push(project);
        this.saveProjects();
        
        form.reset();
        this.showToast('Sucesso', 'Projeto adicionado com sucesso!', 'success');
        this.updateDashboard();
        this.renderProjects();
    }

    removeProject() {
        if (!this.currentProject) return;
        
        if (confirm('Tem certeza que deseja remover este projeto?')) {
            this.projects = this.projects.filter(p => p.id !== this.currentProject.id);
            this.saveProjects();
            this.showToast('Sucesso', 'Projeto removido com sucesso!', 'success');
            this.showSection('acompanhar');
            this.updateDashboard();
            this.renderProjects();
        }
    }

    showProjectDetails(projectId) {
        this.currentProject = this.projects.find(p => p.id === projectId);
        if (!this.currentProject) return;

        const detailsContainer = document.getElementById('projectDetails');
        
        detailsContainer.innerHTML = `
            <div class="project-info-grid">
                <div class="info-card">
                    <h4>Título</h4>
                    <p>${this.currentProject.titulo}</p>
                </div>
                <div class="info-card">
                    <h4>Responsável</h4>
                    <p>${this.currentProject.responsavel || 'Não definido'}</p>
                </div>
                <div class="info-card">
                    <h4>Data de Criação</h4>
                    <p>${this.currentProject.dataCriacao}</p>
                </div>
                <div class="info-card">
                    <h4>Data de Entrega</h4>
                    <p>${this.currentProject.dataEntrega || 'Não definida'}</p>
                </div>
                <div class="info-card">
                    <h4>Prioridade</h4>
                    <span class="priority-badge priority-${this.currentProject.prioridade}">${this.currentProject.prioridade.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="project-description">
                <h4>Descrição</h4>
                <div class="description-content">${this.formatText(this.currentProject.descricao)}</div>
            </div>
            
            <div class="project-progress">
                <h4>Progresso</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.calculateProjectProgress()}%"></div>
                </div>
                <span class="progress-text">${this.calculateProjectProgress()}% concluído</span>
            </div>
        `;

        this.renderProjectIdeas();
        this.showSection('detalhes');
    }

    // Função para formatar texto preservando quebras de linha
    formatText(text) {
        if (!text) return '';
        return text.replace(/\n/g, '<br>');
    }

    calculateProjectProgress() {
        if (!this.currentProject || !this.currentProject.ideias) return 0;
        
        let totalSteps = 0;
        let completedSteps = 0;
        
        this.currentProject.ideias.forEach(idea => {
            if (idea.etapas) {
                totalSteps += idea.etapas.length;
                completedSteps += idea.etapas.filter(step => step.concluida).length;
            }
        });
        
        return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    }

    showEditProjectModal() {
        if (!this.currentProject) return;

        document.getElementById('editTitulo').value = this.currentProject.titulo;
        document.getElementById('editDescricao').value = this.currentProject.descricao || '';
        document.getElementById('editResponsavel').value = this.currentProject.responsavel || '';
        document.getElementById('editPrioridade').value = this.currentProject.prioridade;
        document.getElementById('editDataEntrega').value = this.currentProject.dataEntrega || '';

        document.getElementById('editarProjetoModal').style.display = 'block';
    }

    hideEditProjectModal() {
        document.getElementById('editarProjetoModal').style.display = 'none';
    }

    saveProjectEdit() {
        if (!this.currentProject) return;

        this.currentProject.titulo = document.getElementById('editTitulo').value;
        this.currentProject.descricao = document.getElementById('editDescricao').value;
        this.currentProject.responsavel = document.getElementById('editResponsavel').value;
        this.currentProject.prioridade = document.getElementById('editPrioridade').value;
        this.currentProject.dataEntrega = document.getElementById('editDataEntrega').value;

        this.saveProjects();
        this.hideEditProjectModal();
        this.showProjectDetails(this.currentProject.id);
        this.showToast('Sucesso', 'Projeto atualizado com sucesso!', 'success');
        this.updateDashboard();
        this.renderProjects();
    }

    // Ideias
    renderProjectIdeas() {
        if (!this.currentProject) return;

        const ideasContainer = document.getElementById('ideasList');
        
        if (!this.currentProject.ideias || this.currentProject.ideias.length === 0) {
            ideasContainer.innerHTML = '<p class="no-ideas">Nenhuma ideia adicionada ainda.</p>';
            return;
        }

        ideasContainer.innerHTML = this.currentProject.ideias.map(idea => `
            <div class="idea-card">
                <div class="idea-header">
                    <h4>${idea.titulo}</h4>
                    <div class="idea-actions">
                        <button class="btn btn-sm btn-primary" onclick="projectManager.editIdea(${idea.id})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="projectManager.removeIdea(${idea.id})">Remover</button>
                    </div>
                </div>
                
                <div class="idea-description">
                    ${this.formatText(idea.descricao)}
                </div>
                
                <div class="idea-steps">
                    <div class="steps-header">
                        <h5>Etapas (${idea.etapas ? idea.etapas.length : 0})</h5>
                        <button class="btn btn-sm btn-primary" onclick="projectManager.showStepModal(${idea.id})">Adicionar Etapa</button>
                    </div>
                    
                    <div class="steps-list">
                        ${this.renderIdeaSteps(idea)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderIdeaSteps(idea) {
        if (!idea.etapas || idea.etapas.length === 0) {
            return '<p class="no-steps">Nenhuma etapa adicionada ainda.</p>';
        }

        return idea.etapas.map(step => `
            <div class="step-item ${step.concluida ? 'completed' : ''}">
                <div class="step-header">
                    <h6>${step.titulo}</h6>
                    <div class="step-actions">
                        <button class="btn btn-sm btn-primary" onclick="projectManager.editStep(${idea.id}, ${step.id})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="projectManager.removeStep(${idea.id}, ${step.id})">Remover</button>
                    </div>
                </div>
                
                ${step.responsavel ? `<p><strong>Responsável:</strong> ${step.responsavel}</p>` : ''}
                ${step.prazo ? `<p><strong>Prazo:</strong> ${new Date(step.prazo).toLocaleDateString('pt-BR')}</p>` : ''}
                ${step.link ? `<p><strong>Link:</strong> <a href="${step.link}" target="_blank">${step.link}</a></p>` : ''}
                
                ${step.observacao ? `
                    <div class="step-observation">
                        <strong>Observação:</strong>
                        <div>${this.formatText(step.observacao)}</div>
                    </div>
                ` : ''}
                
                <div class="step-status">
                    <label>
                        <input type="checkbox" ${step.concluida ? 'checked' : ''} 
                               onchange="projectManager.toggleStepCompletion(${idea.id}, ${step.id})">
                        Etapa concluída
                    </label>
                </div>
            </div>
        `).join('');
    }

    showIdeaModal(ideaId = null) {
        this.currentIdea = ideaId ? this.currentProject.ideias.find(i => i.id === ideaId) : null;
        
        if (this.currentIdea) {
            document.getElementById('ideiaModalTitle').textContent = 'Editar Ideia';
            document.getElementById('ideiaTitulo').value = this.currentIdea.titulo;
            document.getElementById('ideiaDescricao').value = this.currentIdea.descricao || '';
        } else {
            document.getElementById('ideiaModalTitle').textContent = 'Adicionar Ideia';
            document.getElementById('ideiaTitulo').value = '';
            document.getElementById('ideiaDescricao').value = '';
        }

        document.getElementById('ideiaModal').style.display = 'block';
    }

    hideIdeaModal() {
        document.getElementById('ideiaModal').style.display = 'none';
        this.currentIdea = null;
    }

    saveIdea() {
        const titulo = document.getElementById('ideiaTitulo').value;
        const descricao = document.getElementById('ideiaDescricao').value;

        if (!titulo.trim()) {
            this.showToast('Erro', 'O título da ideia é obrigatório!', 'error');
            return;
        }

        if (this.currentIdea) {
            // Editar ideia existente
            this.currentIdea.titulo = titulo;
            this.currentIdea.descricao = descricao;
        } else {
            // Adicionar nova ideia
            const newIdea = {
                id: Date.now(),
                titulo: titulo,
                descricao: descricao,
                etapas: []
            };
            
            if (!this.currentProject.ideias) {
                this.currentProject.ideias = [];
            }
            
            this.currentProject.ideias.push(newIdea);
        }

        this.saveProjects();
        this.hideIdeaModal();
        this.renderProjectIdeas();
        this.showToast('Sucesso', 'Ideia salva com sucesso!', 'success');
    }

    editIdea(ideaId) {
        this.showIdeaModal(ideaId);
    }

    removeIdea(ideaId) {
        if (confirm('Tem certeza que deseja remover esta ideia?')) {
            this.currentProject.ideias = this.currentProject.ideias.filter(i => i.id !== ideaId);
            this.saveProjects();
            this.renderProjectIdeas();
            this.showToast('Sucesso', 'Ideia removida com sucesso!', 'success');
        }
    }

    // Etapas
    showStepModal(ideaId, stepId = null) {
        const idea = this.currentProject.ideias.find(i => i.id === ideaId);
        if (!idea) return;

        this.currentIdea = idea;
        this.currentStep = stepId ? idea.etapas.find(s => s.id === stepId) : null;

        if (this.currentStep) {
            document.getElementById('etapaModalTitle').textContent = 'Editar Etapa';
            document.getElementById('etapaTitulo').value = this.currentStep.titulo;
            document.getElementById('etapaResponsavel').value = this.currentStep.responsavel || '';
            document.getElementById('etapaPrazo').value = this.currentStep.prazo || '';
            document.getElementById('etapaLink').value = this.currentStep.link || '';
            document.getElementById('etapaObservacao').value = this.currentStep.observacao || '';
            document.getElementById('etapaConcluida').checked = this.currentStep.concluida || false;
        } else {
            document.getElementById('etapaModalTitle').textContent = 'Adicionar Etapa';
            document.getElementById('etapaTitulo').value = '';
            document.getElementById('etapaResponsavel').value = '';
            document.getElementById('etapaPrazo').value = '';
            document.getElementById('etapaLink').value = '';
            document.getElementById('etapaObservacao').value = '';
            document.getElementById('etapaConcluida').checked = false;
        }

        document.getElementById('etapaModal').style.display = 'block';
    }

    hideStepModal() {
        document.getElementById('etapaModal').style.display = 'none';
        this.currentStep = null;
    }

    saveStep() {
        const titulo = document.getElementById('etapaTitulo').value;
        const responsavel = document.getElementById('etapaResponsavel').value;
        const prazo = document.getElementById('etapaPrazo').value;
        const link = document.getElementById('etapaLink').value;
        const observacao = document.getElementById('etapaObservacao').value;
        const concluida = document.getElementById('etapaConcluida').checked;

        if (!titulo.trim()) {
            this.showToast('Erro', 'O título da etapa é obrigatório!', 'error');
            return;
        }

        if (this.currentStep) {
            // Editar etapa existente
            this.currentStep.titulo = titulo;
            this.currentStep.responsavel = responsavel;
            this.currentStep.prazo = prazo;
            this.currentStep.link = link;
            this.currentStep.observacao = observacao;
            this.currentStep.concluida = concluida;
        } else {
            // Adicionar nova etapa
            const newStep = {
                id: Date.now(),
                titulo: titulo,
                responsavel: responsavel,
                prazo: prazo,
                link: link,
                observacao: observacao,
                concluida: concluida
            };
            
            if (!this.currentIdea.etapas) {
                this.currentIdea.etapas = [];
            }
            
            this.currentIdea.etapas.push(newStep);
        }

        this.saveProjects();
        this.hideStepModal();
        this.renderProjectIdeas();
        this.showToast('Sucesso', 'Etapa salva com sucesso!', 'success');
    }

    editStep(ideaId, stepId) {
        this.showStepModal(ideaId, stepId);
    }

    removeStep(ideaId, stepId) {
        if (confirm('Tem certeza que deseja remover esta etapa?')) {
            const idea = this.currentProject.ideias.find(i => i.id === ideaId);
            if (idea) {
                idea.etapas = idea.etapas.filter(s => s.id !== stepId);
                this.saveProjects();
                this.renderProjectIdeas();
                this.showToast('Sucesso', 'Etapa removida com sucesso!', 'success');
            }
        }
    }

    toggleStepCompletion(ideaId, stepId) {
        const idea = this.currentProject.ideias.find(i => i.id === ideaId);
        if (idea) {
            const step = idea.etapas.find(s => s.id === stepId);
            if (step) {
                step.concluida = !step.concluida;
                this.saveProjects();
                this.renderProjectIdeas();
                this.updateDashboard();
            }
        }
    }

    // Dashboard
    updateDashboard() {
        const total = this.projects.length;
        const completed = this.projects.filter(p => this.calculateProjectProgress(p) === 100).length;
        const inProgress = total - completed;
        
        const alta = this.projects.filter(p => p.prioridade === 'alta').length;
        const media = this.projects.filter(p => p.prioridade === 'media').length;
        const leve = this.projects.filter(p => p.prioridade === 'leve').length;

        document.getElementById('totalProjetos').textContent = total;
        document.getElementById('projetosConcluidos').textContent = completed;
        document.getElementById('projetosAndamento').textContent = inProgress;
        document.getElementById('prioridadeAlta').textContent = alta;
        document.getElementById('prioridadeMedia').textContent = media;
        document.getElementById('prioridadeLeve').textContent = leve;
    }

    // Filtros e Paginação
    applyFilters() {
        let filtered = [...this.projects];

        // Filtro de texto
        if (this.filters.text) {
            const searchText = this.filters.text.toLowerCase();
            filtered = filtered.filter(project => 
                project.titulo.toLowerCase().includes(searchText) ||
                (project.descricao && project.descricao.toLowerCase().includes(searchText)) ||
                (project.responsavel && project.responsavel.toLowerCase().includes(searchText))
            );
        }

        // Filtro de prioridade
        if (this.filters.priority) {
            filtered = filtered.filter(project => project.prioridade === this.filters.priority);
        }

        // Filtro de status
        if (this.filters.status) {
            filtered = filtered.filter(project => {
                const progress = this.calculateProjectProgress(project);
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
            let aValue, bValue;
            
            switch (this.sorting.field) {
                case 'titulo':
                    aValue = a.titulo.toLowerCase();
                    bValue = b.titulo.toLowerCase();
                    break;
                case 'responsavel':
                    aValue = (a.responsavel || '').toLowerCase();
                    bValue = (b.responsavel || '').toLowerCase();
                    break;
                case 'prioridade':
                    const priorityOrder = { 'alta': 3, 'media': 2, 'leve': 1 };
                    aValue = priorityOrder[a.prioridade] || 0;
                    bValue = priorityOrder[b.prioridade] || 0;
                    break;
                case 'data':
                    aValue = new Date(a.dataCriacao.split('/').reverse().join('-'));
                    bValue = new Date(b.dataCriacao.split('/').reverse().join('-'));
                    break;
                case 'progresso':
                    aValue = this.calculateProjectProgress(a);
                    bValue = this.calculateProjectProgress(b);
                    break;
                default:
                    aValue = a[this.sorting.field];
                    bValue = b[this.sorting.field];
            }

            if (this.sorting.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        this.filteredProjects = filtered;
        this.updatePagination();
        this.renderProjects();
        this.updateResponsibleFilter();
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

    toggleAdvancedFilters() {
        const advancedFilters = document.getElementById('advancedFilters');
        const arrow = document.querySelector('.filter-arrow');
        
        if (advancedFilters.style.display === 'none' || !advancedFilters.style.display) {
            advancedFilters.style.display = 'block';
            arrow.textContent = '▲';
        } else {
            advancedFilters.style.display = 'none';
            arrow.textContent = '▼';
        }
    }

    updateResponsibleFilter() {
        const responsibleSelect = document.getElementById('filtroResponsavel');
        const responsibles = [...new Set(this.projects.map(p => p.responsavel).filter(r => r))];
        
        responsibleSelect.innerHTML = '<option value="">Todos</option>';
        responsibles.forEach(responsible => {
            const option = document.createElement('option');
            option.value = responsible;
            option.textContent = responsible;
            if (responsible === this.filters.responsible) {
                option.selected = true;
            }
            responsibleSelect.appendChild(option);
        });
    }

    updatePagination() {
        this.pagination.totalPages = Math.ceil(this.filteredProjects.length / this.pagination.pageSize);
        
        if (this.pagination.currentPage > this.pagination.totalPages) {
            this.pagination.currentPage = 1;
        }
        
        document.getElementById('paginationInfo').textContent = 
            `Página ${this.pagination.currentPage} de ${this.pagination.totalPages}`;
        
        document.getElementById('prevPage').disabled = this.pagination.currentPage === 1;
        document.getElementById('nextPage').disabled = this.pagination.currentPage === this.pagination.totalPages;
    }

    previousPage() {
        if (this.pagination.currentPage > 1) {
            this.pagination.currentPage--;
            this.renderProjects();
            this.updatePagination();
        }
    }

    nextPage() {
        if (this.pagination.currentPage < this.pagination.totalPages) {
            this.pagination.currentPage++;
            this.renderProjects();
            this.updatePagination();
        }
    }

    setView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.view-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (view === 'cards') {
            document.getElementById('viewCards').classList.add('active');
            document.getElementById('projectsList').classList.remove('hidden');
            document.getElementById('projectsTable').classList.add('hidden');
        } else {
            document.getElementById('viewTable').classList.add('active');
            document.getElementById('projectsList').classList.add('hidden');
            document.getElementById('projectsTable').classList.remove('hidden');
        }
        
        this.renderProjects();
    }

    // Renderização
    renderProjects() {
        if (this.filteredProjects.length === 0) {
            this.applyFilters();
        }

        const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const endIndex = startIndex + this.pagination.pageSize;
        const paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);

        document.getElementById('projectsCount').textContent = 
            `${this.filteredProjects.length} projeto${this.filteredProjects.length !== 1 ? 's' : ''}`;

        if (this.currentView === 'cards') {
            this.renderProjectCards(paginatedProjects);
        } else {
            this.renderProjectTable(paginatedProjects);
        }

        this.updatePagination();
    }

    renderProjectCards(projects) {
        const container = document.getElementById('projectsList');
        
        if (projects.length === 0) {
            container.innerHTML = '<div class="no-projects">Nenhum projeto encontrado.</div>';
            return;
        }

        container.innerHTML = projects.map(project => {
            const progress = this.calculateProjectProgress(project);
            return `
                <div class="project-card" onclick="projectManager.showProjectDetails(${project.id})">
                    <div class="project-header">
                        <h3>${project.titulo}</h3>
                        <span class="priority-badge priority-${project.prioridade}">${project.prioridade.toUpperCase()}</span>
                    </div>
                    
                    <div class="project-info">
                        <p><strong>Responsável:</strong> ${project.responsavel || 'Não definido'}</p>
                        <p><strong>Data de Criação:</strong> ${project.dataCriacao}</p>
                        ${project.dataEntrega ? `<p><strong>Data de Entrega:</strong> ${project.dataEntrega}</p>` : ''}
                    </div>
                    
                    ${project.descricao ? `
                        <div class="project-description">
                            <p>${this.truncateText(project.descricao, 100)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${progress}% concluído</span>
                    </div>
                    
                    <div class="project-stats">
                        <span class="stat">
                            <strong>${project.ideias ? project.ideias.length : 0}</strong> ideias
                        </span>
                        <span class="stat">
                            <strong>${this.getTotalSteps(project)}</strong> etapas
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderProjectTable(projects) {
        const tbody = document.getElementById('projectsTableBody');
        
        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-projects">Nenhum projeto encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = projects.map(project => {
            const progress = this.calculateProjectProgress(project);
            return `
                <tr onclick="projectManager.showProjectDetails(${project.id})">
                    <td>${project.titulo}</td>
                    <td>${project.responsavel || 'Não definido'}</td>
                    <td><span class="priority-badge priority-${project.prioridade}">${project.prioridade.toUpperCase()}</span></td>
                    <td>
                        <div class="progress-bar small">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        ${progress}%
                    </td>
                    <td>${project.dataCriacao}</td>
                    <td>${project.dataEntrega || 'Não definida'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); projectManager.showProjectDetails(${project.id})">Ver</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getTotalSteps(project) {
        if (!project.ideias) return 0;
        return project.ideias.reduce((total, idea) => total + (idea.etapas ? idea.etapas.length : 0), 0);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    calculateProjectProgress(project = null) {
        const proj = project || this.currentProject;
        if (!proj || !proj.ideias) return 0;
        
        let totalSteps = 0;
        let completedSteps = 0;
        
        proj.ideias.forEach(idea => {
            if (idea.etapas) {
                totalSteps += idea.etapas.length;
                completedSteps += idea.etapas.filter(step => step.concluida).length;
            }
        });
        
        return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    }

    // PDF
    showPdfModal() {
        const select = document.getElementById('projetoEspecifico');
        select.innerHTML = '<option value="">Selecione um projeto</option>';
        
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.titulo;
            select.appendChild(option);
        });

        document.getElementById('pdfModal').style.display = 'block';
    }

    hidePdfModal() {
        document.getElementById('pdfModal').style.display = 'none';
    }

    generatePDF() {
        const option = document.querySelector('input[name="pdfOption"]:checked').value;
        const projectId = document.getElementById('projetoEspecifico').value;

        let projectsToInclude = [];
        
        if (option === 'todos') {
            projectsToInclude = this.projects;
        } else if (option === 'especifico' && projectId) {
            const project = this.projects.find(p => p.id == projectId);
            if (project) {
                projectsToInclude = [project];
            }
        }

        if (projectsToInclude.length === 0) {
            this.showToast('Erro', 'Selecione pelo menos um projeto!', 'error');
            return;
        }

        this.createPDF(projectsToInclude);
        this.hidePdfModal();
    }

    createPDF(projects) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configurações
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPosition = margin;

        // Título
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Relatório de Projetos', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        // Data de geração
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        projects.forEach((project, index) => {
            // Verificar se precisa de nova página
            if (yPosition > pageHeight - 60) {
                doc.addPage();
                yPosition = margin;
            }

            // Título do projeto
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${project.titulo}`, margin, yPosition);
            yPosition += 10;

            // Informações básicas
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            const info = [
                `Responsável: ${project.responsavel || 'Não definido'}`,
                `Prioridade: ${project.prioridade.toUpperCase()}`,
                `Data de Criação: ${project.dataCriacao}`,
                `Data de Entrega: ${project.dataEntrega || 'Não definida'}`,
                `Progresso: ${this.calculateProjectProgress(project)}%`
            ];

            info.forEach(line => {
                doc.text(line, margin, yPosition);
                yPosition += 6;
            });

            // Descrição
            if (project.descricao) {
                yPosition += 5;
                doc.setFont(undefined, 'bold');
                doc.text('Descrição:', margin, yPosition);
                yPosition += 6;
                
                doc.setFont(undefined, 'normal');
                const descriptionLines = doc.splitTextToSize(project.descricao, pageWidth - 2 * margin);
                doc.text(descriptionLines, margin, yPosition);
                yPosition += descriptionLines.length * 6;
            }

            // Ideias
            if (project.ideias && project.ideias.length > 0) {
                yPosition += 10;
                doc.setFont(undefined, 'bold');
                doc.text('Ideias:', margin, yPosition);
                yPosition += 8;

                project.ideias.forEach((idea, ideaIndex) => {
                    doc.setFont(undefined, 'bold');
                    doc.text(`  ${ideaIndex + 1}. ${idea.titulo}`, margin + 5, yPosition);
                    yPosition += 6;

                    if (idea.descricao) {
                        doc.setFont(undefined, 'normal');
                        const ideaDescLines = doc.splitTextToSize(idea.descricao, pageWidth - 2 * margin - 10);
                        doc.text(ideaDescLines, margin + 10, yPosition);
                        yPosition += ideaDescLines.length * 6;
                    }

                    // Etapas da ideia
                    if (idea.etapas && idea.etapas.length > 0) {
                        yPosition += 5;
                        doc.setFont(undefined, 'bold');
                        doc.text('    Etapas:', margin + 10, yPosition);
                        yPosition += 6;

                        idea.etapas.forEach((step, stepIndex) => {
                            const status = step.concluida ? '✓' : '○';
                            doc.setFont(undefined, 'normal');
                            doc.text(`      ${status} ${step.titulo}`, margin + 15, yPosition);
                            yPosition += 6;

                            if (step.responsavel) {
                                doc.text(`        Responsável: ${step.responsavel}`, margin + 20, yPosition);
                                yPosition += 5;
                            }

                            if (step.prazo) {
                                doc.text(`        Prazo: ${new Date(step.prazo).toLocaleDateString('pt-BR')}`, margin + 20, yPosition);
                                yPosition += 5;
                            }
                        });
                    }

                    yPosition += 5;
                });
            }

            yPosition += 15;
        });

        // Salvar PDF
        const fileName = `relatorio-projetos-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        this.showToast('Sucesso', 'PDF gerado com sucesso!', 'success');
    }

    // Calendário
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('mesAno').textContent = 
            new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const calendarBody = document.getElementById('calendarBody');
        calendarBody.innerHTML = '';

        let currentDate = new Date(startDate);
        
        for (let week = 0; week < 6; week++) {
            const row = document.createElement('tr');
            
            for (let day = 0; day < 7; day++) {
                const cell = document.createElement('td');
                const dayNumber = currentDate.getDate();
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = this.isToday(currentDate);
                const isSelected = this.selectedDate && this.isSameDate(currentDate, this.selectedDate);
                
                cell.textContent = dayNumber;
                cell.className = '';
                
                if (!isCurrentMonth) {
                    cell.classList.add('other-month');
                }
                
                if (isToday) {
                    cell.classList.add('today');
                }
                
                if (isSelected) {
                    cell.classList.add('selected');
                }

                // Verificar se há etapas neste dia
                const stepsOnDay = this.getStepsOnDate(currentDate);
                if (stepsOnDay.length > 0) {
                    cell.classList.add('has-events');
                    cell.title = `${stepsOnDay.length} etapa(s) agendada(s)`;
                }

                cell.addEventListener('click', () => {
                    this.selectDate(new Date(currentDate));
                });

                row.appendChild(cell);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            calendarBody.appendChild(row);
            
            // Se já passou do último dia do mês, parar
            if (currentDate.getMonth() !== month && week >= 4) {
                break;
            }
        }
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
        this.showEventsForDate(date);
        this.showTasksForDate(date);
    }

    showEventsForDate(date) {
        const steps = this.getStepsOnDate(date);
        const eventsList = document.getElementById('eventsList');
        
        if (steps.length === 0) {
            eventsList.innerHTML = '<p>Nenhuma etapa agendada para este dia.</p>';
            return;
        }

        eventsList.innerHTML = `
            <h4>${date.toLocaleDateString('pt-BR')}</h4>
            ${steps.map(step => `
                <div class="event-item">
                    <h5>${step.titulo}</h5>
                    <p><strong>Projeto:</strong> ${step.projectTitle}</p>
                    <p><strong>Ideia:</strong> ${step.ideaTitle}</p>
                    ${step.responsavel ? `<p><strong>Responsável:</strong> ${step.responsavel}</p>` : ''}
                    <span class="event-status ${step.concluida ? 'completed' : 'pending'}">
                        ${step.concluida ? 'Concluída' : 'Pendente'}
                    </span>
                </div>
            `).join('')}
        `;
    }

    getStepsOnDate(date) {
        const steps = [];
        const dateString = date.toISOString().split('T')[0];
        
        this.projects.forEach(project => {
            if (project.ideias) {
                project.ideias.forEach(idea => {
                    if (idea.etapas) {
                        idea.etapas.forEach(step => {
                            if (step.prazo === dateString) {
                                steps.push({
                                    ...step,
                                    projectTitle: project.titulo,
                                    ideaTitle: idea.titulo
                                });
                            }
                        });
                    }
                });
            }
        });
        
        return steps;
    }

    isToday(date) {
        const today = new Date();
        return this.isSameDate(date, today);
    }

    isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    // Tarefas diárias
    loadDailyTasks() {
        const tasks = localStorage.getItem('dailyTasks');
        return tasks ? JSON.parse(tasks) : {};
    }

    saveDailyTasks() {
        localStorage.setItem('dailyTasks', JSON.stringify(this.dailyTasks));
    }

    showTasksForDate(date) {
        const dateKey = date.toISOString().split('T')[0];
        const tasks = this.dailyTasks[dateKey] || [];
        const tasksList = document.getElementById('tasksList');
        const addTaskSection = document.getElementById('addTaskSection');
        
        addTaskSection.style.display = 'block';
        
        if (tasks.length === 0) {
            tasksList.innerHTML = '<p>Nenhuma tarefa para este dia.</p>';
        } else {
            tasksList.innerHTML = `
                <h4>Tarefas para ${date.toLocaleDateString('pt-BR')}</h4>
                ${tasks.map((task, index) => `
                    <div class="task-item ${task.completed ? 'completed' : ''}">
                        <label>
                            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                                   onchange="projectManager.toggleTaskCompletion('${dateKey}', ${index})">
                            ${task.text}
                        </label>
                        <button class="btn btn-sm btn-danger" onclick="projectManager.removeTask('${dateKey}', ${index})">×</button>
                    </div>
                `).join('')}
            `;
        }
    }

    addDailyTask() {
        if (!this.selectedDate) {
            this.showToast('Erro', 'Selecione uma data primeiro!', 'error');
            return;
        }

        const input = document.getElementById('newTaskInput');
        const taskText = input.value.trim();
        
        if (!taskText) {
            this.showToast('Erro', 'Digite o texto da tarefa!', 'error');
            return;
        }

        const dateKey = this.selectedDate.toISOString().split('T')[0];
        
        if (!this.dailyTasks[dateKey]) {
            this.dailyTasks[dateKey] = [];
        }
        
        this.dailyTasks[dateKey].push({
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        this.saveDailyTasks();
        input.value = '';
        this.showTasksForDate(this.selectedDate);
        this.showToast('Sucesso', 'Tarefa adicionada!', 'success');
    }

    toggleTaskCompletion(dateKey, taskIndex) {
        if (this.dailyTasks[dateKey] && this.dailyTasks[dateKey][taskIndex]) {
            this.dailyTasks[dateKey][taskIndex].completed = !this.dailyTasks[dateKey][taskIndex].completed;
            this.saveDailyTasks();
        }
    }

    removeTask(dateKey, taskIndex) {
        if (this.dailyTasks[dateKey] && this.dailyTasks[dateKey][taskIndex]) {
            this.dailyTasks[dateKey].splice(taskIndex, 1);
            this.saveDailyTasks();
            this.showTasksForDate(this.selectedDate);
            this.showToast('Sucesso', 'Tarefa removida!', 'success');
        }
    }

    // Toast
    showToast(title, message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');

        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        toast.className = `toast ${type}`;
        
        if (type === 'success') {
            toastIcon.textContent = '✓';
        } else if (type === 'error') {
            toastIcon.textContent = '✗';
        } else if (type === 'warning') {
            toastIcon.textContent = '⚠';
        }

        toast.style.display = 'block';
        
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    hideToast() {
        document.getElementById('toast').style.display = 'none';
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.projectManager = new ProjectManager();
});

// Configurar radio buttons do PDF
document.addEventListener('DOMContentLoaded', () => {
    const radioButtons = document.querySelectorAll('input[name="pdfOption"]');
    const projectSelect = document.getElementById('projetoEspecifico');
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'especifico') {
                projectSelect.disabled = false;
            } else {
                projectSelect.disabled = true;
                projectSelect.value = '';
            }
        });
    });
});

