// Sistema de Gestão de Projetos - JavaScrip
class ProjectManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentProject = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.dailyTasks = this.loadDailyTasks(); // Nova propriedade para tarefas diárias
        this.calendarFilter = 'etapas'; // Filtro padrão do calendário
        this.currentStepTasks = []; // Tarefas temporárias do modal de etapa
        this.ideas = this.loadIdeas(); // Nova propriedade para ideias
        this.meetings = this.loadMeetings(); // Nova propriedade para reuniões
        this.agenda = this.loadAgenda(); // Nova propriedade para agenda
        this.notificationInterval = null; // Intervalo para verificar notificações
        this.snoozedNotifications = new Set(); // Notificações adiadas
        
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
        this.startNotificationSystem(); // Iniciar sistema de notificações
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

        // Modal Excel
        document.getElementById('gerarExcelBtn').addEventListener('click', () => {
            this.showExcelModal();
        });

        document.getElementById('closeExcelModal').addEventListener('click', () => {
            this.hideExcelModal();
        });

        document.getElementById('cancelarExcel').addEventListener('click', () => {
            this.hideExcelModal();
        });

        document.getElementById('confirmarExcel').addEventListener('click', () => {
            this.generateExcel();
        });

        // Radio buttons do Excel
        document.querySelectorAll('input[name="excelOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const select = document.getElementById('projetoEspecificoExcel');
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

        // Filtro do calendário
        document.getElementById('calendarFilter').addEventListener('change', (e) => {
            this.calendarFilter = e.target.value;
            this.renderCalendar();
            if (this.selectedDate) {
                this.renderCalendarEvents();
            }
        });

        // Tarefas do modal de etapa
        document.getElementById('addStepTaskBtn').addEventListener('click', () => {
            this.addStepTask();
        });

        document.getElementById('newStepTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addStepTask();
            }
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

        // Modal de detalhes da etapa
        document.getElementById('closeStepDetailsModal').addEventListener('click', () => {
            this.hideStepDetailsModal();
        });

        document.getElementById('closeStepDetails').addEventListener('click', () => {
            this.hideStepDetailsModal();
        });

        document.getElementById('editStepFromDetails').addEventListener('click', () => {
            const stepId = document.getElementById('stepDetailsModal').dataset.stepId;
            this.hideStepDetailsModal();
            this.showStepModal(stepId);
        });

        // Ideias
        document.getElementById('addIdeaBtn').addEventListener('click', () => {
            this.addIdea();
        });

        document.getElementById('newIdeaTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addIdea();
            }
        });

        // Reuniões
        document.getElementById('addMeetingBtn').addEventListener('click', () => {
            this.addMeeting();
        });

        document.getElementById('newMeetingTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addMeeting();
            }
        });

        // Agenda
        document.getElementById('addAgendaBtn').addEventListener('click', () => {
            this.addAgendaItem();
        });

        document.getElementById('newAgendaTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addAgendaItem();
            }
        });

        document.getElementById('agendaFilter').addEventListener('change', () => {
            this.renderAgenda();
        });

        // Notificações
        document.getElementById('closeNotification').addEventListener('click', () => {
            this.hideNotification();
        });

        document.getElementById('markAsViewed').addEventListener('click', () => {
            this.markNotificationAsViewed();
        });

        document.getElementById('snoozeNotification').addEventListener('click', () => {
            this.snoozeNotification();
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
        } else if (sectionName === 'ideias') {
            this.renderIdeas();
        } else if (sectionName === 'reunioes') {
            this.renderMeetings();
        } else if (sectionName === 'agenda') {
            this.renderAgenda();
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
        const tableBody = document.getElementById('stepsTableBody');
        const project = this.currentProject;

        if (project.etapas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma etapa adicionada ainda.</td></tr>';
            return;
        }

        tableBody.innerHTML = project.etapas.map(step => {
            const prazoFormatado = step.prazo ? new Date(step.prazo).toLocaleDateString('pt-BR') : 'Não definido';
            const statusText = step.concluida ? 'Concluída' : 'Pendente';
            const statusClass = step.concluida ? 'status-completed' : 'status-pending';
            const tasksCount = step.tarefas ? step.tarefas.length : 0;
            const completedTasks = step.tarefas ? step.tarefas.filter(t => t.concluida).length : 0;
            const tasksText = tasksCount > 0 ? `${completedTasks}/${tasksCount}` : '0';

            return `
                <tr onclick="projectManager.showStepDetails('${step.id}')" style="cursor: pointer;" class="step-row ${step.concluida ? 'completed-row' : ''}">
                    <td>${step.titulo}</td>
                    <td>${step.responsavel || 'Não informado'}</td>
                    <td>${prazoFormatado}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${tasksText}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); projectManager.editStep('${step.id}')">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); projectManager.removeStep('${step.id}')">Remover</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Gerenciamento de Etapas
    showStepModal(stepId = null) {
        const modal = document.getElementById('etapaModal');
        const title = document.getElementById('etapaModalTitle');
        
        // Limpar tarefas temporárias
        this.currentStepTasks = [];
        
        if (stepId) {
            const step = this.currentProject.etapas.find(s => s.id === stepId);
            title.textContent = 'Editar Etapa';
            document.getElementById('etapaTitulo').value = step.titulo;
            document.getElementById('etapaResponsavel').value = step.responsavel || '';
            document.getElementById('etapaPrazo').value = step.prazo || '';
            document.getElementById('etapaLink').value = step.link || ''; // Novo campo
            document.getElementById('etapaObservacao').value = step.observacao || '';
            document.getElementById('etapaConcluida').checked = step.concluida;
            
            // Carregar tarefas existentes
            this.currentStepTasks = step.tarefas ? [...step.tarefas] : [];
            
            modal.dataset.stepId = stepId;
        } else {
            title.textContent = 'Adicionar Etapa';
            document.getElementById('etapaForm').reset();
            delete modal.dataset.stepId;
        }

        this.renderStepTasksList();
        modal.classList.add('show');
    }

    hideStepModal() {
        document.getElementById('etapaModal').classList.remove('show');
        this.currentStepTasks = [];
    }

    // Funções para gerenciar tarefas no modal de etapa
    addStepTask() {
        const input = document.getElementById('newStepTaskInput');
        const taskText = input.value.trim();

        if (!taskText) {
            this.showToast('Digite o texto da tarefa!', 'warning');
            return;
        }

        const newTask = {
            id: this.generateId(),
            titulo: taskText,
            concluida: false,
            responsavel: '',
            prazo: '',
            observacao: ''
        };

        this.currentStepTasks.push(newTask);
        input.value = '';
        this.renderStepTasksList();
    }

    removeStepTask(taskId) {
        this.currentStepTasks = this.currentStepTasks.filter(t => t.id !== taskId);
        this.renderStepTasksList();
    }

    toggleStepTaskCompletion(taskId) {
        const task = this.currentStepTasks.find(t => t.id === taskId);
        if (task) {
            task.concluida = !task.concluida;
            this.renderStepTasksList();
        }
    }

    renderStepTasksList() {
        const container = document.getElementById('stepTasksList');
        
        if (this.currentStepTasks.length === 0) {
            container.innerHTML = '<p class="no-tasks">Nenhuma tarefa adicionada ainda.</p>';
            return;
        }

        container.innerHTML = this.currentStepTasks.map(task => `
            <div class="task-item ${task.concluida ? 'completed' : ''}">
                <div class="task-content">
                    <input type="checkbox" ${task.concluida ? 'checked' : ''} 
                           onchange="projectManager.toggleStepTaskCompletion('${task.id}')">
                    <span class="task-title">${task.titulo}</span>
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="projectManager.removeStepTask('${task.id}')">×</button>
            </div>
        `).join('');
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
            concluida: document.getElementById('etapaConcluida').checked,
            tarefas: [...this.currentStepTasks] // Incluir tarefas
        };

        if (!stepData.titulo.trim()) {
            this.showToast('Título da etapa é obrigatório!', 'warning');
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

    // Detalhes da Etapa
    showStepDetails(stepId) {
        const step = this.currentProject.etapas.find(s => s.id === stepId);
        if (!step) return;

        const modal = document.getElementById('stepDetailsModal');
        const title = document.getElementById('stepDetailsTitle');
        const content = document.getElementById('stepDetailsContent');

        title.textContent = `Detalhes: ${step.titulo}`;

        const prazoFormatado = step.prazo ? new Date(step.prazo).toLocaleDateString('pt-BR') : 'Não definido';
        const tasksCount = step.tarefas ? step.tarefas.length : 0;
        const completedTasks = step.tarefas ? step.tarefas.filter(t => t.concluida).length : 0;

        content.innerHTML = `
            <div class="step-details-grid">
                <div class="detail-item">
                    <h4>Título</h4>
                    <p>${step.titulo}</p>
                </div>
                <div class="detail-item">
                    <h4>Responsável</h4>
                    <p>${step.responsavel || 'Não informado'}</p>
                </div>
                <div class="detail-item">
                    <h4>Prazo</h4>
                    <p>${prazoFormatado}</p>
                </div>
                <div class="detail-item">
                    <h4>Status</h4>
                    <p><span class="status-badge ${step.concluida ? 'status-completed' : 'status-pending'}">${step.concluida ? 'Concluída' : 'Pendente'}</span></p>
                </div>
                ${step.link ? `
                    <div class="detail-item">
                        <h4>Link</h4>
                        <p><a href="${step.link}" target="_blank">${step.link}</a></p>
                    </div>
                ` : ''}
                ${step.observacao ? `
                    <div class="detail-item full-width">
                        <h4>Observações</h4>
                        <p>${step.observacao}</p>
                    </div>
                ` : ''}
                ${tasksCount > 0 ? `
                    <div class="detail-item full-width">
                        <h4>Tarefas (${completedTasks}/${tasksCount} concluídas)</h4>
                        <div class="tasks-list-details">
                            ${step.tarefas.map(task => `
                                <div class="task-item-detail ${task.concluida ? 'completed' : ''}">
                                    <input type="checkbox" ${task.concluida ? 'checked' : ''} 
                                           onchange="projectManager.toggleTaskCompletion('${stepId}', '${task.id}')">
                                    <span class="task-title">${task.titulo}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Armazenar o ID da etapa para edição
        modal.dataset.stepId = stepId;
        modal.classList.add('show');
    }

    hideStepDetailsModal() {
        document.getElementById('stepDetailsModal').classList.remove('show');
    }

    toggleTaskCompletion(stepId, taskId) {
        const step = this.currentProject.etapas.find(s => s.id === stepId);
        const task = step.tarefas.find(t => t.id === taskId);
        task.concluida = !task.concluida;
        this.saveProjects();
        this.renderProjectSteps();
        // Atualizar o modal se estiver aberto
        if (document.getElementById('stepDetailsModal').classList.contains('show')) {
            this.showStepDetails(stepId);
        }
    }

    // Gerenciamento de Ideias
    loadIdeas() {
        const saved = localStorage.getItem('project-ideas');
        return saved ? JSON.parse(saved) : [];
    }

    saveIdeas() {
        localStorage.setItem('project-ideas', JSON.stringify(this.ideas));
    }

    addIdea() {
        const titleInput = document.getElementById('newIdeaTitle');
        const descriptionInput = document.getElementById('newIdeaDescription');
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();

        if (!title) {
            this.showToast('Título da ideia é obrigatório!', 'warning');
            return;
        }

        const newIdea = {
            id: this.generateId(),
            titulo: title,
            descricao: description,
            dataCriacao: new Date().toISOString(),
            implementada: false
        };

        this.ideas.push(newIdea);
        this.saveIdeas();
        this.renderIdeas();
        
        // Limpar campos
        titleInput.value = '';
        descriptionInput.value = '';
        
        this.showToast('Ideia adicionada com sucesso!');
    }

    renderIdeas() {
        const container = document.getElementById('ideasContainer');
        
        if (this.ideas.length === 0) {
            container.innerHTML = '<p class="no-ideas">Nenhuma ideia adicionada ainda. Que tal começar com uma nova ideia?</p>';
            return;
        }

        container.innerHTML = this.ideas.map(idea => {
            const creationDate = new Date(idea.dataCriacao).toLocaleDateString('pt-BR');
            
            return `
                <div class="idea-card ${idea.implementada ? 'implemented' : ''}">
                    <div class="idea-header">
                        <h3 class="idea-title">${idea.titulo}</h3>
                        <div class="idea-actions">
                            <button class="btn btn-sm ${idea.implementada ? 'btn-secondary' : 'btn-success'}" 
                                    onclick="projectManager.toggleIdeaImplementation('${idea.id}')">
                                ${idea.implementada ? 'Implementada' : 'Marcar como Implementada'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="projectManager.removeIdea('${idea.id}')">×</button>
                        </div>
                    </div>
                    <div class="idea-content">
                        <p class="idea-description">${idea.descricao || 'Sem descrição'}</p>
                        <div class="idea-meta">
                            <small>Criada em: ${creationDate}</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleIdeaImplementation(ideaId) {
        const idea = this.ideas.find(i => i.id === ideaId);
        idea.implementada = !idea.implementada;
        this.saveIdeas();
        this.renderIdeas();
        this.showToast(idea.implementada ? 'Ideia marcada como implementada!' : 'Ideia desmarcada como implementada!');
    }

    removeIdea(ideaId) {
        if (confirm('Tem certeza que deseja remover esta ideia?')) {
            this.ideas = this.ideas.filter(i => i.id !== ideaId);
            this.saveIdeas();
            this.renderIdeas();
            this.showToast('Ideia removida com sucesso!');
        }
    }

    // Gerenciamento de Reuniões
    loadMeetings() {
        const saved = localStorage.getItem('project-meetings');
        return saved ? JSON.parse(saved) : [];
    }

    saveMeetings() {
        localStorage.setItem('project-meetings', JSON.stringify(this.meetings));
    }

    addMeeting() {
        const titleInput = document.getElementById('newMeetingTitle');
        const descriptionInput = document.getElementById('newMeetingDescription');
        const dateInput = document.getElementById('newMeetingDate');
        const projectSelect = document.getElementById('newMeetingProject');
        const locationInput = document.getElementById('newMeetingLocation');
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const date = dateInput.value;
        const projectId = projectSelect.value;
        const location = locationInput.value.trim();

        if (!title) {
            this.showToast('Título da reunião é obrigatório!', 'warning');
            return;
        }

        if (!date) {
            this.showToast('Data e hora da reunião são obrigatórias!', 'warning');
            return;
        }

        const newMeeting = {
            id: this.generateId(),
            titulo: title,
            descricao: description,
            dataHora: date,
            projectId: projectId || null,
            local: location,
            dataCriacao: new Date().toISOString(),
            concluida: false
        };

        this.meetings.push(newMeeting);
        this.saveMeetings();
        this.renderMeetings();
        
        // Limpar campos
        titleInput.value = '';
        descriptionInput.value = '';
        dateInput.value = '';
        projectSelect.value = '';
        locationInput.value = '';
        
        this.showToast('Reunião agendada com sucesso!');
    }

    renderMeetings() {
        const container = document.getElementById('meetingsContainer');
        
        // Atualizar select de projetos
        this.updateMeetingProjectSelect();
        
        if (this.meetings.length === 0) {
            container.innerHTML = '<p class="no-meetings">Nenhuma reunião agendada ainda. Que tal agendar uma nova reunião?</p>';
            return;
        }

        // Ordenar reuniões por data
        const sortedMeetings = [...this.meetings].sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

        container.innerHTML = sortedMeetings.map(meeting => {
            const meetingDate = new Date(meeting.dataHora);
            const formattedDate = meetingDate.toLocaleDateString('pt-BR');
            const formattedTime = meetingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const project = meeting.projectId ? this.projects.find(p => p.id === meeting.projectId) : null;
            const isUpcoming = meetingDate > new Date();
            const isPast = meetingDate < new Date();
            
            return `
                <div class="meeting-card ${meeting.concluida ? 'completed' : ''} ${isPast && !meeting.concluida ? 'overdue' : ''}">
                    <div class="meeting-header">
                        <h3 class="meeting-title">${meeting.titulo}</h3>
                        <div class="meeting-actions">
                            <button class="btn btn-sm ${meeting.concluida ? 'btn-secondary' : 'btn-success'}" 
                                    onclick="projectManager.toggleMeetingCompletion('${meeting.id}')">
                                ${meeting.concluida ? 'Realizada' : 'Marcar como Realizada'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="projectManager.removeMeeting('${meeting.id}')">×</button>
                        </div>
                    </div>
                    <div class="meeting-content">
                        <div class="meeting-datetime">
                            <strong>📅 ${formattedDate} às ${formattedTime}</strong>
                            ${isUpcoming ? '<span class="meeting-status upcoming">Próxima</span>' : ''}
                            ${isPast && !meeting.concluida ? '<span class="meeting-status overdue">Atrasada</span>' : ''}
                        </div>
                        ${meeting.descricao ? `<p class="meeting-description">${meeting.descricao}</p>` : ''}
                        ${meeting.local ? `<p class="meeting-location">📍 ${meeting.local}</p>` : ''}
                        ${project ? `<p class="meeting-project">🔗 Projeto: ${project.titulo}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateMeetingProjectSelect() {
        const select = document.getElementById('newMeetingProject');
        select.innerHTML = '<option value="">Projeto relacionado (opcional)</option>' +
            this.projects.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');
    }

    toggleMeetingCompletion(meetingId) {
        const meeting = this.meetings.find(m => m.id === meetingId);
        meeting.concluida = !meeting.concluida;
        this.saveMeetings();
        this.renderMeetings();
        this.showToast(meeting.concluida ? 'Reunião marcada como realizada!' : 'Reunião desmarcada como realizada!');
    }

    removeMeeting(meetingId) {
        if (confirm('Tem certeza que deseja remover esta reunião?')) {
            this.meetings = this.meetings.filter(m => m.id !== meetingId);
            this.saveMeetings();
            this.renderMeetings();
            this.showToast('Reunião removida com sucesso!');
        }
    }

    // Gerenciamento de Agenda
    loadAgenda() {
        const saved = localStorage.getItem('project-agenda');
        return saved ? JSON.parse(saved) : [];
    }

    saveAgenda() {
        localStorage.setItem('project-agenda', JSON.stringify(this.agenda));
    }

    addAgendaItem() {
        const titleInput = document.getElementById('newAgendaTitle');
        const descriptionInput = document.getElementById('newAgendaDescription');
        const dateInput = document.getElementById('newAgendaDate');
        const typeSelect = document.getElementById('newAgendaType');
        const projectSelect = document.getElementById('newAgendaProject');
        const notificationCheckbox = document.getElementById('agendaNotification');
        const notificationTimeSelect = document.getElementById('agendaNotificationTime');
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const date = dateInput.value;
        const type = typeSelect.value;
        const projectId = projectSelect.value;
        const hasNotification = notificationCheckbox.checked;
        const notificationMinutes = parseInt(notificationTimeSelect.value);

        if (!title) {
            this.showToast('Título do compromisso é obrigatório!', 'warning');
            return;
        }

        if (!date) {
            this.showToast('Data e hora do compromisso são obrigatórias!', 'warning');
            return;
        }

        const newAgendaItem = {
            id: this.generateId(),
            titulo: title,
            descricao: description,
            dataHora: date,
            tipo: type,
            projectId: projectId || null,
            hasNotification: hasNotification,
            notificationMinutes: notificationMinutes,
            dataCriacao: new Date().toISOString(),
            concluida: false,
            notificationShown: false
        };

        this.agenda.push(newAgendaItem);
        this.saveAgenda();
        this.renderAgenda();
        
        // Limpar campos
        titleInput.value = '';
        descriptionInput.value = '';
        dateInput.value = '';
        typeSelect.value = 'compromisso';
        projectSelect.value = '';
        notificationCheckbox.checked = true;
        notificationTimeSelect.value = '15';
        
        this.showToast('Compromisso adicionado à agenda com sucesso!');
    }

    renderAgenda() {
        const container = document.getElementById('agendaContainer');
        const filter = document.getElementById('agendaFilter').value;
        
        // Atualizar select de projetos
        this.updateAgendaProjectSelect();
        
        // Filtrar itens da agenda
        let filteredAgenda = this.filterAgendaItems(filter);
        
        if (filteredAgenda.length === 0) {
            container.innerHTML = '<p class="no-agenda">Nenhum compromisso encontrado para o filtro selecionado.</p>';
            return;
        }

        // Ordenar por data
        filteredAgenda.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

        container.innerHTML = filteredAgenda.map(item => {
            const itemDate = new Date(item.dataHora);
            const formattedDate = itemDate.toLocaleDateString('pt-BR');
            const formattedTime = itemDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const project = item.projectId ? this.projects.find(p => p.id === item.projectId) : null;
            const isUpcoming = itemDate > new Date();
            const isPast = itemDate < new Date();
            const isToday = this.isToday(itemDate);
            
            return `
                <div class="agenda-card ${item.concluida ? 'completed' : ''} ${isPast && !item.concluida ? 'overdue' : ''} ${isToday ? 'today' : ''}">
                    <div class="agenda-header">
                        <div class="agenda-title-section">
                            <h3 class="agenda-title">${item.titulo}</h3>
                            <span class="agenda-type ${item.tipo}">${this.getTypeLabel(item.tipo)}</span>
                        </div>
                        <div class="agenda-actions">
                            <button class="btn btn-sm ${item.concluida ? 'btn-secondary' : 'btn-success'}" 
                                    onclick="projectManager.toggleAgendaCompletion('${item.id}')">
                                ${item.concluida ? 'Concluído' : 'Marcar como Concluído'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="projectManager.removeAgendaItem('${item.id}')">×</button>
                        </div>
                    </div>
                    <div class="agenda-content">
                        <div class="agenda-datetime">
                            <strong>📅 ${formattedDate} às ${formattedTime}</strong>
                            ${isToday ? '<span class="agenda-status today">Hoje</span>' : ''}
                            ${isUpcoming && !isToday ? '<span class="agenda-status upcoming">Próximo</span>' : ''}
                            ${isPast && !item.concluida ? '<span class="agenda-status overdue">Atrasado</span>' : ''}
                        </div>
                        ${item.descricao ? `<p class="agenda-description">${item.descricao}</p>` : ''}
                        ${project ? `<p class="agenda-project">🔗 Projeto: ${project.titulo}</p>` : ''}
                        ${item.hasNotification ? `<p class="agenda-notification">🔔 Notificação: ${item.notificationMinutes} min antes</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    filterAgendaItems(filter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        return this.agenda.filter(item => {
            const itemDate = new Date(item.dataHora);
            
            switch (filter) {
                case 'hoje':
                    return itemDate >= today && itemDate < tomorrow;
                case 'semana':
                    return itemDate >= weekStart && itemDate < weekEnd;
                case 'mes':
                    return itemDate >= monthStart && itemDate <= monthEnd;
                case 'compromisso':
                case 'reuniao':
                case 'projeto':
                case 'pessoal':
                case 'outro':
                    return item.tipo === filter;
                default:
                    return true;
            }
        });
    }

    getTypeLabel(type) {
        const labels = {
            'compromisso': 'Compromisso',
            'reuniao': 'Reunião',
            'projeto': 'Projeto',
            'pessoal': 'Pessoal',
            'outro': 'Outro'
        };
        return labels[type] || type;
    }

    updateAgendaProjectSelect() {
        const select = document.getElementById('newAgendaProject');
        select.innerHTML = '<option value="">Projeto relacionado (opcional)</option>' +
            this.projects.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');
    }

    toggleAgendaCompletion(agendaId) {
        const item = this.agenda.find(a => a.id === agendaId);
        item.concluida = !item.concluida;
        this.saveAgenda();
        this.renderAgenda();
        this.showToast(item.concluida ? 'Compromisso marcado como concluído!' : 'Compromisso desmarcado como concluído!');
    }

    removeAgendaItem(agendaId) {
        if (confirm('Tem certeza que deseja remover este compromisso?')) {
            this.agenda = this.agenda.filter(a => a.id !== agendaId);
            this.saveAgenda();
            this.renderAgenda();
            this.showToast('Compromisso removido com sucesso!');
        }
    }

    // Sistema de Notificações
    startNotificationSystem() {
        // Verificar notificações a cada minuto
        this.notificationInterval = setInterval(() => {
            this.checkNotifications();
        }, 60000); // 60 segundos

        // Verificar imediatamente ao iniciar
        this.checkNotifications();
    }

    checkNotifications() {
        const now = new Date();
        
        // Verificar agenda
        this.agenda.forEach(item => {
            if (item.hasNotification && !item.concluida && !item.notificationShown) {
                const itemDate = new Date(item.dataHora);
                const timeDiff = itemDate.getTime() - now.getTime();
                const minutesDiff = Math.floor(timeDiff / (1000 * 60));
                
                // Se está dentro do tempo de notificação e não foi adiada
                if (minutesDiff <= item.notificationMinutes && minutesDiff >= 0 && !this.snoozedNotifications.has(item.id)) {
                    this.showNotification(item);
                    item.notificationShown = true;
                    this.saveAgenda();
                }
            }
        });

        // Verificar reuniões
        this.meetings.forEach(meeting => {
            if (!meeting.concluida && !meeting.notificationShown) {
                const meetingDate = new Date(meeting.dataHora);
                const timeDiff = meetingDate.getTime() - now.getTime();
                const minutesDiff = Math.floor(timeDiff / (1000 * 60));
                
                // Notificar 15 minutos antes por padrão
                if (minutesDiff <= 15 && minutesDiff >= 0 && !this.snoozedNotifications.has(meeting.id)) {
                    this.showNotification(meeting, 'reuniao');
                    meeting.notificationShown = true;
                    this.saveMeetings();
                }
            }
        });
    }

    showNotification(item, type = 'agenda') {
        const card = document.getElementById('notificationCard');
        const title = document.getElementById('notificationTitle');
        const message = document.getElementById('notificationMessage');
        
        const itemDate = new Date(item.dataHora);
        const formattedDate = itemDate.toLocaleDateString('pt-BR');
        const formattedTime = itemDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        if (type === 'reuniao') {
            title.textContent = 'Reunião Próxima';
            message.innerHTML = `
                <strong>${item.titulo}</strong><br>
                📅 ${formattedDate} às ${formattedTime}<br>
                ${item.local ? `📍 ${item.local}` : ''}
            `;
        } else {
            title.textContent = 'Compromisso Próximo';
            message.innerHTML = `
                <strong>${item.titulo}</strong><br>
                📅 ${formattedDate} às ${formattedTime}<br>
                🏷️ ${this.getTypeLabel(item.tipo)}
            `;
        }
        
        // Armazenar ID do item atual para ações
        card.dataset.itemId = item.id;
        card.dataset.itemType = type;
        
        card.classList.remove('hidden');
        
        // Auto-hide após 10 segundos se não interagir
        setTimeout(() => {
            if (!card.classList.contains('hidden')) {
                this.hideNotification();
            }
        }, 10000);
    }

    hideNotification() {
        const card = document.getElementById('notificationCard');
        card.classList.add('hidden');
    }

    markNotificationAsViewed() {
        const card = document.getElementById('notificationCard');
        const itemId = card.dataset.itemId;
        const itemType = card.dataset.itemType;
        
        if (itemType === 'reuniao') {
            const meeting = this.meetings.find(m => m.id === itemId);
            if (meeting) {
                meeting.notificationViewed = true;
                this.saveMeetings();
            }
        } else {
            const item = this.agenda.find(a => a.id === itemId);
            if (item) {
                item.notificationViewed = true;
                this.saveAgenda();
            }
        }
        
        this.hideNotification();
        this.showToast('Notificação marcada como vista!');
    }

    snoozeNotification() {
        const card = document.getElementById('notificationCard');
        const itemId = card.dataset.itemId;
        
        // Adicionar à lista de adiadas por 5 minutos
        this.snoozedNotifications.add(itemId);
        
        setTimeout(() => {
            this.snoozedNotifications.delete(itemId);
            // Reativar notificação
            const itemType = card.dataset.itemType;
            if (itemType === 'reuniao') {
                const meeting = this.meetings.find(m => m.id === itemId);
                if (meeting) {
                    meeting.notificationShown = false;
                    this.saveMeetings();
                }
            } else {
                const item = this.agenda.find(a => a.id === itemId);
                if (item) {
                    item.notificationShown = false;
                    this.saveAgenda();
                }
            }
        }, 5 * 60 * 1000); // 5 minutos
        
        this.hideNotification();
        this.showToast('Notificação adiada por 5 minutos!');
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
        
        if (this.calendarFilter === 'projetos') {
            return this.projects.some(project => 
                project.dataEntrega && project.dataEntrega.startsWith(dateString)
            );
        } else if (this.calendarFilter === 'etapas') {
            return this.projects.some(project => 
                project.etapas.some(step => 
                    step.prazo && step.prazo.startsWith(dateString)
                )
            );
        } else if (this.calendarFilter === 'tarefas') {
            return this.projects.some(project => 
                project.etapas.some(step => 
                    step.tarefas && step.tarefas.some(task => 
                        task.prazo && task.prazo.startsWith(dateString)
                    )
                )
            );
        }
        
        return false;
    }

    renderCalendarEvents() {
        const container = document.getElementById('eventsList');
        
        if (!this.selectedDate) {
            const filterText = this.calendarFilter === 'projetos' ? 'projetos' : 
                              this.calendarFilter === 'etapas' ? 'etapas' : 'tarefas';
            container.innerHTML = `<p>Selecione um dia para ver os ${filterText} agendados.</p>`;
            return;
        }

        const dateString = this.selectedDate.toISOString().split('T')[0];
        const events = [];

        if (this.calendarFilter === 'projetos') {
            // Mostrar projetos com data de entrega no dia selecionado
            this.projects.forEach(project => {
                if (project.dataEntrega && project.dataEntrega.startsWith(dateString)) {
                    events.push({
                        type: 'projeto',
                        titulo: project.titulo,
                        descricao: project.descricao,
                        responsavel: project.responsavel,
                        prioridade: project.prioridade
                    });
                }
            });
            
            if (events.length === 0) {
                container.innerHTML = '<p>Nenhum projeto com entrega agendada para este dia.</p>';
                return;
            }

            container.innerHTML = events.map(event => `
                <div class="event-item">
                    <div class="event-title">${event.titulo}</div>
                    <div class="event-description">${event.descricao || 'Sem descrição'}</div>
                    <div class="event-meta">
                        Responsável: ${event.responsavel || 'Não informado'} | 
                        Prioridade: <span class="priority-badge ${event.prioridade}">${event.prioridade.toUpperCase()}</span>
                    </div>
                </div>
            `).join('');
            
        } else if (this.calendarFilter === 'etapas') {
            // Mostrar etapas com prazo no dia selecionado
            this.projects.forEach(project => {
                project.etapas.forEach(step => {
                    if (step.prazo && step.prazo.startsWith(dateString)) {
                        events.push({
                            type: 'etapa',
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
            
        } else if (this.calendarFilter === 'tarefas') {
            // Mostrar tarefas com prazo no dia selecionado
            this.projects.forEach(project => {
                project.etapas.forEach(step => {
                    if (step.tarefas) {
                        step.tarefas.forEach(task => {
                            if (task.prazo && task.prazo.startsWith(dateString)) {
                                events.push({
                                    type: 'tarefa',
                                    task,
                                    step,
                                    project
                                });
                            }
                        });
                    }
                });
            });
            
            if (events.length === 0) {
                container.innerHTML = '<p>Nenhuma tarefa agendada para este dia.</p>';
                return;
            }

            container.innerHTML = events.map(event => `
                <div class="event-item">
                    <div class="event-title">${event.task.titulo}</div>
                    <div class="event-project">Etapa: ${event.step.titulo} | Projeto: ${event.project.titulo}</div>
                    <div class="event-meta">
                        Responsável: ${event.task.responsavel || 'Não informado'} | 
                        Status: ${event.task.concluida ? 'Concluída' : 'Pendente'}
                        ${event.task.observacao ? ` | ${event.task.observacao}` : ''}
                    </div>
                </div>
            `).join('');
        }
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

    // Geração de Excel
    showExcelModal() {
        const select = document.getElementById('projetoEspecificoExcel');
        select.innerHTML = '<option value="">' + 'Selecione um projeto' + '</option>' +
            this.projects.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');
        
        document.getElementById('excelModal').classList.add('show');
    }

    hideExcelModal() {
        document.getElementById('excelModal').classList.remove('show');
    }

    generateExcel() {
        const option = document.querySelector('input[name="excelOption"]:checked').value;
        let projectsToInclude = [];

        if (option === 'todos') {
            projectsToInclude = this.projects;
        } else {
            const projectId = document.getElementById('projetoEspecificoExcel').value;
            if (!projectId) {
                this.showToast('Selecione um projeto específico!', 'warning');
                return;
            }
            projectsToInclude = this.projects.filter(p => p.id === projectId);
        }

        this.createExcel(projectsToInclude);
        this.hideExcelModal();
    }

    createExcel(projects) {
        // Criar workbook
        const wb = XLSX.utils.book_new();
        
        // Planilha 1: Resumo dos Projetos
        const resumoData = [
            ['Relatório de Gestão de Projetos'],
            ['Gerado em:', new Date().toLocaleDateString('pt-BR')],
            [''],
            ['Título', 'Responsável', 'Prioridade', 'Progresso (%)', 'Data Criação', 'Data Entrega', 'Status']
        ];

        projects.forEach(project => {
            const progress = this.calculateProgress(project);
            const status = progress === 100 ? 'Concluído' : 'Em Andamento';
            const creationDate = new Date(project.dataCriacao).toLocaleDateString('pt-BR');
            const deliveryDate = project.dataEntrega ? new Date(project.dataEntrega).toLocaleDateString('pt-BR') : 'Não definida';

            resumoData.push([
                project.titulo,
                project.responsavel || 'Não informado',
                project.prioridade.toUpperCase(),
                progress,
                creationDate,
                deliveryDate,
                status
            ]);
        });

        const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
        
        // Estilizar cabeçalho
        wsResumo['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
        
        // Definir larguras das colunas
        wsResumo['!cols'] = [
            { wch: 25 }, // Título
            { wch: 20 }, // Responsável
            { wch: 12 }, // Prioridade
            { wch: 12 }, // Progresso
            { wch: 15 }, // Data Criação
            { wch: 15 }, // Data Entrega
            { wch: 15 }  // Status
        ];

        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo dos Projetos');

        // Planilha 2: Detalhes das Etapas
        const etapasData = [
            ['Detalhes das Etapas'],
            [''],
            ['Projeto', 'Etapa', 'Responsável', 'Prazo', 'Status', 'Link', 'Observação', 'Tarefas Concluídas', 'Total Tarefas']
        ];

        projects.forEach(project => {
            if (project.etapas && project.etapas.length > 0) {
                project.etapas.forEach(etapa => {
                    const prazoFormatado = etapa.prazo ? new Date(etapa.prazo).toLocaleDateString('pt-BR') : 'Não definido';
                    const status = etapa.concluida ? 'Concluída' : 'Pendente';
                    const totalTarefas = etapa.tarefas ? etapa.tarefas.length : 0;
                    const tarefasConcluidas = etapa.tarefas ? etapa.tarefas.filter(t => t.concluida).length : 0;

                    etapasData.push([
                        project.titulo,
                        etapa.titulo,
                        etapa.responsavel || 'Não informado',
                        prazoFormatado,
                        status,
                        etapa.link || 'N/A',
                        etapa.observacao || 'N/A',
                        tarefasConcluidas,
                        totalTarefas
                    ]);
                });
            } else {
                etapasData.push([
                    project.titulo,
                    'Nenhuma etapa cadastrada',
                    '',
                    '',
                    '',
                    '',
                    '',
                    0,
                    0
                ]);
            }
        });

        const wsEtapas = XLSX.utils.aoa_to_sheet(etapasData);
        
        // Definir larguras das colunas
        wsEtapas['!cols'] = [
            { wch: 25 }, // Projeto
            { wch: 25 }, // Etapa
            { wch: 20 }, // Responsável
            { wch: 15 }, // Prazo
            { wch: 12 }, // Status
            { wch: 30 }, // Link
            { wch: 30 }, // Observação
            { wch: 15 }, // Tarefas Concluídas
            { wch: 12 }  // Total Tarefas
        ];

        XLSX.utils.book_append_sheet(wb, wsEtapas, 'Detalhes das Etapas');

        // Planilha 3: Estatísticas
        const estatisticasData = [
            ['Estatísticas do Projeto'],
            [''],
            ['Métrica', 'Valor'],
            ['Total de Projetos', projects.length],
            ['Projetos Concluídos', projects.filter(p => this.calculateProgress(p) === 100).length],
            ['Projetos em Andamento', projects.filter(p => this.calculateProgress(p) < 100).length],
            ['Projetos Prioridade Alta', projects.filter(p => p.prioridade === 'alta').length],
            ['Projetos Prioridade Média', projects.filter(p => p.prioridade === 'media').length],
            ['Projetos Prioridade Leve', projects.filter(p => p.prioridade === 'leve').length],
            [''],
            ['Progresso Médio (%)', Math.round(projects.reduce((acc, p) => acc + this.calculateProgress(p), 0) / projects.length) || 0],
            ['Total de Etapas', projects.reduce((acc, p) => acc + (p.etapas ? p.etapas.length : 0), 0)],
            ['Etapas Concluídas', projects.reduce((acc, p) => acc + (p.etapas ? p.etapas.filter(e => e.concluida).length : 0), 0)]
        ];

        const wsEstatisticas = XLSX.utils.aoa_to_sheet(estatisticasData);
        
        // Definir larguras das colunas
        wsEstatisticas['!cols'] = [
            { wch: 25 }, // Métrica
            { wch: 15 }  // Valor
        ];

        XLSX.utils.book_append_sheet(wb, wsEstatisticas, 'Estatísticas');

        // Salvar arquivo
        const fileName = `gestao_projetos_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.showToast('Excel gerado com sucesso!', 'success');
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

        // Configurações e cores
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPosition = margin;
        
        // Cores
        const primaryColor = [52, 152, 219]; // Azul
        const secondaryColor = [236, 240, 241]; // Cinza claro
        const successColor = [46, 204, 113]; // Verde
        const warningColor = [241, 196, 15]; // Amarelo
        const dangerColor = [231, 76, 60]; // Vermelho

        // Função para adicionar cabeçalho
        const addHeader = () => {
            // Fundo do cabeçalho
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            // Título principal
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text('Relatório de Gestão de Projetos', margin, 25);
            
            // Data de geração
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin - 60, 25);
            
            // Linha decorativa
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(2);
            doc.line(margin, 45, pageWidth - margin, 45);
            
            return 55; // Nova posição Y
        };

        // Função para adicionar rodapé
        const addFooter = (pageNum) => {
            doc.setTextColor(128, 128, 128);
            doc.setFontSize(10);
            doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        };

        // Função para verificar espaço e adicionar nova página se necessário
        const checkPageSpace = (requiredSpace) => {
            if (yPosition + requiredSpace > pageHeight - 30) {
                addFooter(doc.internal.getNumberOfPages());
                doc.addPage();
                yPosition = addHeader();
            }
        };

        // Adicionar cabeçalho da primeira página
        yPosition = addHeader();

        // Resumo executivo
        checkPageSpace(60);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Resumo Executivo', margin, yPosition);
        yPosition += 15;

        // Estatísticas em caixas coloridas
        const totalProjects = projects.length;
        const completedProjects = projects.filter(p => this.calculateProgress(p) === 100).length;
        const inProgressProjects = totalProjects - completedProjects;
        const avgProgress = Math.round(projects.reduce((acc, p) => acc + this.calculateProgress(p), 0) / totalProjects) || 0;

        // Caixa de estatísticas
        doc.setFillColor(...secondaryColor);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        
        const statsY = yPosition + 10;
        doc.text(`Total de Projetos: ${totalProjects}`, margin + 10, statsY);
        doc.text(`Concluídos: ${completedProjects}`, margin + 10, statsY + 8);
        doc.text(`Em Andamento: ${inProgressProjects}`, margin + 10, statsY + 16);
        doc.text(`Progresso Médio: ${avgProgress}%`, margin + 100, statsY + 8);

        yPosition += 50;

        // Lista de projetos
        projects.forEach((project, index) => {
            checkPageSpace(80);

            // Caixa do projeto
            const projectBoxHeight = 25;
            
            // Cor da prioridade
            let priorityColor;
            switch (project.prioridade) {
                case 'alta': priorityColor = dangerColor; break;
                case 'media': priorityColor = warningColor; break;
                case 'leve': priorityColor = successColor; break;
                default: priorityColor = [128, 128, 128];
            }

            // Fundo do projeto
            doc.setFillColor(...priorityColor);
            doc.rect(margin, yPosition, 5, projectBoxHeight, 'F');
            
            doc.setFillColor(248, 249, 250);
            doc.rect(margin + 5, yPosition, pageWidth - 2 * margin - 5, projectBoxHeight, 'F');

            // Título do projeto
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${project.titulo}`, margin + 10, yPosition + 8);

            // Progresso
            const progress = this.calculateProgress(project);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`${progress}% concluído`, pageWidth - margin - 40, yPosition + 8);

            // Prioridade
            doc.setTextColor(...priorityColor);
            doc.setFont(undefined, 'bold');
            doc.text(project.prioridade.toUpperCase(), margin + 10, yPosition + 18);

            yPosition += projectBoxHeight + 5;

            // Informações detalhadas
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            const projectInfo = [
                `Descrição: ${project.descricao || 'Não informada'}`,
                `Responsável: ${project.responsavel || 'Não informado'}`,
                `Data de Criação: ${new Date(project.dataCriacao).toLocaleDateString('pt-BR')}`,
                `Data de Entrega: ${project.dataEntrega ? new Date(project.dataEntrega).toLocaleDateString('pt-BR') : 'Não definida'}`
            ];

            projectInfo.forEach(info => {
                checkPageSpace(8);
                doc.text(info, margin + 10, yPosition);
                yPosition += 6;
            });

            // Etapas
            if (project.etapas.length > 0) {
                checkPageSpace(40);
                yPosition += 5;
                doc.setFont(undefined, 'bold');
                doc.text('Etapas:', margin + 10, yPosition);
                yPosition += 8;

                const tableData = project.etapas.map(step => [
                    step.titulo,
                    step.responsavel || 'N/A',
                    step.prazo ? new Date(step.prazo).toLocaleDateString('pt-BR') : 'N/A',
                    step.link || 'N/A',
                    step.concluida ? 'Sim' : 'Não',
                    step.observacao || 'N/A'
                ]);

                doc.autoTable({
                    head: [['Título', 'Responsável', 'Prazo', 'Link', 'Concluída', 'Observação']],
                    body: tableData,
                    startY: yPosition,
                    margin: { left: margin + 10, right: margin },
                    styles: {
                        fontSize: 8,
                        cellPadding: 3,
                        textColor: [0, 0, 0]
                    },
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: [248, 249, 250]
                    },
                    columnStyles: {
                        0: { cellWidth: 35 }, // Título
                        1: { cellWidth: 25 }, // Responsável
                        2: { cellWidth: 20 }, // Prazo
                        3: { cellWidth: 30 }, // Link
                        4: { cellWidth: 15 }, // Concluída
                        5: { cellWidth: 35 }  // Observação
                    }
                });

                yPosition = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFont(undefined, 'italic');
                doc.setTextColor(128, 128, 128);
                doc.text('Nenhuma etapa cadastrada.', margin + 10, yPosition);
                yPosition += 10;
            }

            yPosition += 15; // Espaço entre projetos
        });

        // Adicionar rodapé na última página
        addFooter(doc.internal.getNumberOfPages());

        // Salvar PDF
        const fileName = `gestao_projetos_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        this.showToast('PDF gerado com sucesso!', 'success');
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
        try {
            // Primeiro tenta carregar do Firebase
            if (window.firebaseService) {
                return window.firebaseService.loadProjects() || [];
            }
            // Fallback para localStorage
            const stored = localStorage.getItem('gestao_projetos');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            return [];
        }
    }

    saveProjects() {
        try {
            // Salva no Firebase se disponível
            if (window.firebaseService) {
                window.firebaseService.saveProjects(this.projects);
            }
            // Também salva no localStorage como backup
            localStorage.setItem('gestao_projetos', JSON.stringify(this.projects));
            this.updateDashboard();
        } catch (error) {
            console.error('Erro ao salvar projetos:', error);
        }
    }

    loadDailyTasks() {
        try {
            if (window.firebaseService) {
                return window.firebaseService.loadDailyTasks() || {};
            }
            const tasks = localStorage.getItem('dailyTasks');
            return tasks ? JSON.parse(tasks) : {};
        } catch (error) {
            console.error('Erro ao carregar tarefas diárias:', error);
            return {};
        }
    }

    saveDailyTasks() {
        try {
            if (window.firebaseService) {
                window.firebaseService.saveDailyTasks(this.dailyTasks);
            }
            localStorage.setItem('dailyTasks', JSON.stringify(this.dailyTasks));
        } catch (error) {
            console.error('Erro ao salvar tarefas diárias:', error);
        }
    }

    loadIdeas() {
        try {
            if (window.firebaseService) {
                return window.firebaseService.loadIdeas() || [];
            }
            const ideas = localStorage.getItem('ideas');
            return ideas ? JSON.parse(ideas) : [];
        } catch (error) {
            console.error('Erro ao carregar ideias:', error);
            return [];
        }
    }

    saveIdeas() {
        try {
            if (window.firebaseService) {
                window.firebaseService.saveIdeas(this.ideas);
            }
            localStorage.setItem('ideas', JSON.stringify(this.ideas));
        } catch (error) {
            console.error('Erro ao salvar ideias:', error);
        }
    }

    loadMeetings() {
        try {
            if (window.firebaseService) {
                return window.firebaseService.loadMeetings() || [];
            }
            const meetings = localStorage.getItem('meetings');
            return meetings ? JSON.parse(meetings) : [];
        } catch (error) {
            console.error('Erro ao carregar reuniões:', error);
            return [];
        }
    }

    saveMeetings() {
        try {
            if (window.firebaseService) {
                window.firebaseService.saveMeetings(this.meetings);
            }
            localStorage.setItem('meetings', JSON.stringify(this.meetings));
        } catch (error) {
            console.error('Erro ao salvar reuniões:', error);
        }
    }

    loadAgenda() {
        try {
            if (window.firebaseService) {
                return window.firebaseService.loadAgenda() || [];
            }
            const agenda = localStorage.getItem('agenda');
            return agenda ? JSON.parse(agenda) : [];
        } catch (error) {
            console.error('Erro ao carregar agenda:', error);
            return [];
        }
    }

    saveAgenda() {
        try {
            if (window.firebaseService) {
                window.firebaseService.saveAgenda(this.agenda);
            }
            localStorage.setItem('agenda', JSON.stringify(this.agenda));
        } catch (error) {
            console.error('Erro ao salvar agenda:', error);
        }
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
    removeTask: (id) => projectManager.removeTask(id),
    toggleMeetingCompletion: (id) => projectManager.toggleMeetingCompletion(id),
    removeMeeting: (id) => projectManager.removeMeeting(id),
    toggleAgendaCompletion: (id) => projectManager.toggleAgendaCompletion(id),
    removeAgendaItem: (id) => projectManager.removeAgendaItem(id)
};
