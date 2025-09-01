// Sistema de Gestão de Projetos - JavaScript com Firebase
class ProjectManager {
    constructor() {
        this.projects = [];
        this.meetings = [];
        this.appointments = [];
        this.currentProject = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.dailyTasks = {};
        this.calendarFilter = 'etapas';
        this.currentStepTasks = [];
        this.ideas = [];
        
        // Firebase
        this.db = null;
        this.isFirebaseReady = false;
        
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
        
        // Sistema de notificações
        this.notifications = [];
        this.notificationInterval = null;
        
        this.init();
    }

    // Inicialização
    async init() {
        await this.initFirebase();
        this.setupEventListeners();
        this.setupNavigation();
        await this.loadAllData();
        this.updateDashboard();
        this.renderProjects();
        this.renderCalendar();
        this.showSection('dashboard');
        this.startNotificationSystem();
    }

    // Firebase Integration
    async initFirebase() {
        try {
            // Aguardar Firebase estar disponível
            let attempts = 0;
            while (!window.firebase && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (window.firebase) {
                this.db = window.firebase.db;
                this.isFirebaseReady = true;
                console.log('Firebase inicializado com sucesso');
            } else {
                throw new Error('Firebase não disponível');
            }
        } catch (error) {
            console.error('Erro ao inicializar Firebase:', error);
            this.showToast('Usando modo offline. Dados serão salvos localmente.', 'warning');
            this.isFirebaseReady = false;
        }
    }

    // Funções de persistência Firebase
    async saveProjects() {
        if (!this.isFirebaseReady) {
            localStorage.setItem('gestao_projetos', JSON.stringify(this.projects));
            this.updateDashboard();
            return;
        }

        try {
            const { collection, doc, setDoc } = window.firebase;
            
            for (const project of this.projects) {
                await setDoc(doc(this.db, 'projects', project.id), project);
            }
            
            this.updateDashboard();
        } catch (error) {
            console.error('Erro ao salvar projetos:', error);
            // Fallback para localStorage
            localStorage.setItem('gestao_projetos', JSON.stringify(this.projects));
            this.showToast('Dados salvos localmente', 'warning');
        }
    }

    async loadProjects() {
        if (!this.isFirebaseReady) {
            const stored = localStorage.getItem('gestao_projetos');
            return stored ? JSON.parse(stored) : [];
        }

        try {
            const { collection, getDocs } = window.firebase;
            const querySnapshot = await getDocs(collection(this.db, 'projects'));
            const projects = [];
            
            querySnapshot.forEach((doc) => {
                projects.push({ id: doc.id, ...doc.data() });
            });
            
            return projects;
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            // Fallback para localStorage
            const stored = localStorage.getItem('gestao_projetos');
            return stored ? JSON.parse(stored) : [];
        }
    }

    async saveMeetings() {
        if (!this.isFirebaseReady) {
            localStorage.setItem('gestao_meetings', JSON.stringify(this.meetings));
            return;
        }

        try {
            const { collection, doc, setDoc } = window.firebase;
            
            for (const meeting of this.meetings) {
                await setDoc(doc(this.db, 'meetings', meeting.id), meeting);
            }
        } catch (error) {
            console.error('Erro ao salvar reuniões:', error);
            localStorage.setItem('gestao_meetings', JSON.stringify(this.meetings));
        }
    }

    async loadMeetings() {
        if (!this.isFirebaseReady) {
            const stored = localStorage.getItem('gestao_meetings');
            return stored ? JSON.parse(stored) : [];
        }

        try {
            const { collection, getDocs } = window.firebase;
            const querySnapshot = await getDocs(collection(this.db, 'meetings'));
            const meetings = [];
            
            querySnapshot.forEach((doc) => {
                meetings.push({ id: doc.id, ...doc.data() });
            });
            
            return meetings;
        } catch (error) {
            console.error('Erro ao carregar reuniões:', error);
            const stored = localStorage.getItem('gestao_meetings');
            return stored ? JSON.parse(stored) : [];
        }
    }

    async saveAppointments() {
        if (!this.isFirebaseReady) {
            localStorage.setItem('gestao_appointments', JSON.stringify(this.appointments));
            return;
        }

        try {
            const { collection, doc, setDoc } = window.firebase;
            
            for (const appointment of this.appointments) {
                await setDoc(doc(this.db, 'appointments', appointment.id), appointment);
            }
        } catch (error) {
            console.error('Erro ao salvar compromissos:', error);
            localStorage.setItem('gestao_appointments', JSON.stringify(this.appointments));
        }
    }

    async loadAppointments() {
        if (!this.isFirebaseReady) {
            const stored = localStorage.getItem('gestao_appointments');
            return stored ? JSON.parse(stored) : [];
        }

        try {
            const { collection, getDocs } = window.firebase;
            const querySnapshot = await getDocs(collection(this.db, 'appointments'));
            const appointments = [];
            
            querySnapshot.forEach((doc) => {
                appointments.push({ id: doc.id, ...doc.data() });
            });
            
            return appointments;
        } catch (error) {
            console.error('Erro ao carregar compromissos:', error);
            const stored = localStorage.getItem('gestao_appointments');
            return stored ? JSON.parse(stored) : [];
        }
    }

    async saveIdeas() {
        if (!this.isFirebaseReady) {
            localStorage.setItem('project-ideas', JSON.stringify(this.ideas));
            return;
        }

        try {
            const { collection, doc, setDoc } = window.firebase;
            
            for (const idea of this.ideas) {
                await setDoc(doc(this.db, 'ideas', idea.id), idea);
            }
        } catch (error) {
            console.error('Erro ao salvar ideias:', error);
            localStorage.setItem('project-ideas', JSON.stringify(this.ideas));
        }
    }

    async loadIdeas() {
        if (!this.isFirebaseReady) {
            const stored = localStorage.getItem('project-ideas');
            return stored ? JSON.parse(stored) : [];
        }

        try {
            const { collection, getDocs } = window.firebase;
            const querySnapshot = await getDocs(collection(this.db, 'ideas'));
            const ideas = [];
            
            querySnapshot.forEach((doc) => {
                ideas.push({ id: doc.id, ...doc.data() });
            });
            
            return ideas;
        } catch (error) {
            console.error('Erro ao carregar ideias:', error);
            const stored = localStorage.getItem('project-ideas');
            return stored ? JSON.parse(stored) : [];
        }
    }

    async saveDailyTasks() {
        if (!this.isFirebaseReady) {
            localStorage.setItem('daily_tasks', JSON.stringify(this.dailyTasks));
            return;
        }

        try {
            const { doc, setDoc } = window.firebase;
            await setDoc(doc(this.db, 'settings', 'dailyTasks'), { tasks: this.dailyTasks });
        } catch (error) {
            console.error('Erro ao salvar tarefas diárias:', error);
            localStorage.setItem('daily_tasks', JSON.stringify(this.dailyTasks));
        }
    }

    async loadDailyTasks() {
        if (!this.isFirebaseReady) {
            const saved = localStorage.getItem('daily_tasks');
            return saved ? JSON.parse(saved) : {};
        }

        try {
            const { doc, getDoc } = window.firebase;
            const docRef = doc(this.db, 'settings', 'dailyTasks');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data().tasks || {};
            }
            return {};
        } catch (error) {
            console.error('Erro ao carregar tarefas diárias:', error);
            const saved = localStorage.getItem('daily_tasks');
            return saved ? JSON.parse(saved) : {};
        }
    }

    async loadAllData() {
        try {
            this.projects = await this.loadProjects();
            this.meetings = await this.loadMeetings();
            this.appointments = await this.loadAppointments();
            this.ideas = await this.loadIdeas();
            this.dailyTasks = await this.loadDailyTasks();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
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

        // Radio buttons do PDF e Excel
        document.querySelectorAll('input[name="pdfOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const select = document.getElementById('projetoEspecifico');
                if (select) select.disabled = e.target.value === 'todos';
            });
        });

        document.querySelectorAll('input[name="excelOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const select = document.getElementById('projetoEspecificoExcel');
                if (select) select.disabled = e.target.value === 'todos';
            });
        });

        // Modal Reunião
        document.getElementById('adicionarReuniaoBtn').addEventListener('click', () => {
            this.showMeetingModal();
        });

        document.getElementById('closeReuniaoModal').addEventListener('click', () => {
            this.hideMeetingModal();
        });

        document.getElementById('cancelarReuniao').addEventListener('click', () => {
            this.hideMeetingModal();
        });

        document.getElementById('salvarReuniao').addEventListener('click', () => {
            this.saveMeeting();
        });

        // Modal Compromisso
        document.getElementById('adicionarCompromissoBtn').addEventListener('click', () => {
            this.showAppointmentModal();
        });

        document.getElementById('closeCompromissoModal').addEventListener('click', () => {
            this.hideAppointmentModal();
        });

        document.getElementById('cancelarCompromisso').addEventListener('click', () => {
            this.hideAppointmentModal();
        });

        document.getElementById('salvarCompromisso').addEventListener('click', () => {
            this.saveAppointment();
        });

        // Notificações
        const notificarCheckbox = document.getElementById('notificarCompromisso');
        if (notificarCheckbox) {
            notificarCheckbox.addEventListener('change', (e) => {
                const options = document.getElementById('notificationOptions');
                if (options) options.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        const closeNotification = document.getElementById('closeNotification');
        if (closeNotification) {
            closeNotification.addEventListener('click', () => {
                this.hideNotification();
            });
        }

        const snoozeNotification = document.getElementById('snoozeNotification');
        if (snoozeNotification) {
            snoozeNotification.addEventListener('click', () => {
                this.snoozeNotification();
            });
        }

        const markAsSeenNotification = document.getElementById('markAsSeenNotification');
        if (markAsSeenNotification) {
            markAsSeenNotification.addEventListener('click', () => {
                this.markNotificationAsSeen();
            });
        }

        // Continuar com os event listeners existentes...
        this.setupExistingEventListeners();
    }

    setupExistingEventListeners() {
        // Modal editar projeto
        const closeEditarModal = document.getElementById('closeEditarModal');
        if (closeEditarModal) {
            closeEditarModal.addEventListener('click', () => {
                this.hideEditModal();
            });
        }

        const cancelarEdicao = document.getElementById('cancelarEdicao');
        if (cancelarEdicao) {
            cancelarEdicao.addEventListener('click', () => {
                this.hideEditModal();
            });
        }

        const salvarEdicao = document.getElementById('salvarEdicao');
        if (salvarEdicao) {
            salvarEdicao.addEventListener('click', () => {
                this.saveProjectEdit();
            });
        }

        // Modal etapa
        const closeEtapaModal = document.getElementById('closeEtapaModal');
        if (closeEtapaModal) {
            closeEtapaModal.addEventListener('click', () => {
                this.hideStepModal();
            });
        }

        const cancelarEtapa = document.getElementById('cancelarEtapa');
        if (cancelarEtapa) {
            cancelarEtapa.addEventListener('click', () => {
                this.hideStepModal();
            });
        }

        const salvarEtapa = document.getElementById('salvarEtapa');
        if (salvarEtapa) {
            salvarEtapa.addEventListener('click', () => {
                this.saveStep();
            });
        }

        // Detalhes do projeto
        const voltarAcompanhar = document.getElementById('voltarAcompanhar');
        if (voltarAcompanhar) {
            voltarAcompanhar.addEventListener('click', () => {
                this.showSection('acompanhar');
                this.setActiveNav(document.querySelector('[data-section="acompanhar"]'));
            });
        }

        const editarProjetoBtn = document.getElementById('editarProjetoBtn');
        if (editarProjetoBtn) {
            editarProjetoBtn.addEventListener('click', () => {
                this.showEditModal();
            });
        }

        const removerProjetoBtn = document.getElementById('removerProjetoBtn');
        if (removerProjetoBtn) {
            removerProjetoBtn.addEventListener('click', () => {
                this.removeProject();
            });
        }

        const adicionarEtapaBtn = document.getElementById('adicionarEtapaBtn');
        if (adicionarEtapaBtn) {
            adicionarEtapaBtn.addEventListener('click', () => {
                this.showStepModal();
            });
        }

        // Filtros básicos
        const filtroTexto = document.getElementById('filtroTexto');
        if (filtroTexto) {
            filtroTexto.addEventListener('input', (e) => {
                this.filters.text = e.target.value;
                this.applyFilters();
            });
        }

        // Filtros avançados
        const toggleAdvancedFilters = document.getElementById('toggleAdvancedFilters');
        if (toggleAdvancedFilters) {
            toggleAdvancedFilters.addEventListener('click', () => {
                this.toggleAdvancedFilters();
            });
        }

        const filtroPrioridade = document.getElementById('filtroPrioridade');
        if (filtroPrioridade) {
            filtroPrioridade.addEventListener('change', (e) => {
                this.filters.priority = e.target.value;
                this.applyFilters();
            });
        }

        const filtroStatus = document.getElementById('filtroStatus');
        if (filtroStatus) {
            filtroStatus.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        const filtroResponsavel = document.getElementById('filtroResponsavel');
        if (filtroResponsavel) {
            filtroResponsavel.addEventListener('change', (e) => {
                this.filters.responsible = e.target.value;
                this.applyFilters();
            });
        }

        const ordenarPor = document.getElementById('ordenarPor');
        if (ordenarPor) {
            ordenarPor.addEventListener('change', (e) => {
                this.sorting.field = e.target.value;
                this.applyFilters();
            });
        }

        const direcaoOrdem = document.getElementById('direcaoOrdem');
        if (direcaoOrdem) {
            direcaoOrdem.addEventListener('change', (e) => {
                this.sorting.direction = e.target.value;
                this.applyFilters();
            });
        }

        const limparFiltros = document.getElementById('limparFiltros');
        if (limparFiltros) {
            limparFiltros.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Visualização
        const viewCards = document.getElementById('viewCards');
        if (viewCards) {
            viewCards.addEventListener('click', () => {
                this.setView('cards');
            });
        }

        const viewTable = document.getElementById('viewTable');
        if (viewTable) {
            viewTable.addEventListener('click', () => {
                this.setView('table');
            });
        }

        // Paginação
        const prevPage = document.getElementById('prevPage');
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                this.changePage(this.pagination.currentPage - 1);
            });
        }

        const nextPage = document.getElementById('nextPage');
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                this.changePage(this.pagination.currentPage + 1);
            });
        }

        const pageSize = document.getElementById('pageSize');
        if (pageSize) {
            pageSize.addEventListener('change', (e) => {
                this.pagination.pageSize = parseInt(e.target.value);
                this.pagination.currentPage = 1;
                this.applyFilters();
            });
        }

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
        const mesAnterior = document.getElementById('mesAnterior');
        if (mesAnterior) {
            mesAnterior.addEventListener('click', () => {
                this.changeMonth(-1);
            });
        }

        const proximoMes = document.getElementById('proximoMes');
        if (proximoMes) {
            proximoMes.addEventListener('click', () => {
                this.changeMonth(1);
            });
        }

        // Filtro do calendário
        const calendarFilter = document.getElementById('calendarFilter');
        if (calendarFilter) {
            calendarFilter.addEventListener('change', (e) => {
                this.calendarFilter = e.target.value;
                this.renderCalendar();
                if (this.selectedDate) {
                    this.renderCalendarEvents();
                }
            });
        }

        // Tarefas do modal de etapa
        const addStepTaskBtn = document.getElementById('addStepTaskBtn');
        if (addStepTaskBtn) {
            addStepTaskBtn.addEventListener('click', () => {
                this.addStepTask();
            });
        }

        const newStepTaskInput = document.getElementById('newStepTaskInput');
        if (newStepTaskInput) {
            newStepTaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addStepTask();
                }
            });
        }

        // Tarefas diárias
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.addDailyTask();
            });
        }

        const newTaskInput = document.getElementById('newTaskInput');
        if (newTaskInput) {
            newTaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addDailyTask();
                }
            });
        }

        // Modal de detalhes da etapa
        const closeStepDetailsModal = document.getElementById('closeStepDetailsModal');
        if (closeStepDetailsModal) {
            closeStepDetailsModal.addEventListener('click', () => {
                this.hideStepDetailsModal();
            });
        }

        const closeStepDetails = document.getElementById('closeStepDetails');
        if (closeStepDetails) {
            closeStepDetails.addEventListener('click', () => {
                this.hideStepDetailsModal();
            });
        }

        const editStepFromDetails = document.getElementById('editStepFromDetails');
        if (editStepFromDetails) {
            editStepFromDetails.addEventListener('click', () => {
                const stepId = document.getElementById('stepDetailsModal').dataset.stepId;
                this.hideStepDetailsModal();
                this.showStepModal(stepId);
            });
        }

        // Ideias
        const addIdeaBtn = document.getElementById('addIdeaBtn');
        if (addIdeaBtn) {
            addIdeaBtn.addEventListener('click', () => {
                this.addIdea();
            });
        }

        const newIdeaTitle = document.getElementById('newIdeaTitle');
        if (newIdeaTitle) {
            newIdeaTitle.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addIdea();
                }
            });
        }

        // Fechar modais clicando fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });

        // Fechar toast
        const toastClose = document.getElementById('toastClose');
        if (toastClose) {
            toastClose.addEventListener('click', () => {
                this.hideToast();
            });
        }

        // Acessibilidade - fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Fechar toast
                const toast = document.getElementById('toast');
                if (toast && toast.classList.contains('show')) {
                    this.hideToast();
                }
                
                // Fechar modais
                document.querySelectorAll('.modal.show').forEach(modal => {
                    modal.classList.remove('show');
                });

                // Fechar notificação
                const notificationCard = document.getElementById('notificationCard');
                if (notificationCard && notificationCard.classList.contains('show')) {
                    this.hideNotification();
                }
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
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

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
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Dashboard
    updateDashboard() {
        const total = this.projects.length;
        const completed = this.projects.filter(p => this.calculateProgress(p) === 100).length;
        const inProgress = total - completed;
        
        const highPriority = this.projects.filter(p => p.prioridade === 'alta').length;
        const mediumPriority = this.projects.filter(p => p.prioridade === 'media').length;
        const lowPriority = this.projects.filter(p => p.prioridade === 'leve').length;

        const totalProjetos = document.getElementById('totalProjetos');
        const projetosConcluidos = document.getElementById('projetosConcluidos');
        const projetosAndamento = document.getElementById('projetosAndamento');
        const prioridadeAlta = document.getElementById('prioridadeAlta');
        const prioridadeMedia = document.getElementById('prioridadeMedia');
        const prioridadeLeve = document.getElementById('prioridadeLeve');

        if (totalProjetos) totalProjetos.textContent = total;
        if (projetosConcluidos) projetosConcluidos.textContent = completed;
        if (projetosAndamento) projetosAndamento.textContent = inProgress;
        if (prioridadeAlta) prioridadeAlta.textContent = highPriority;
        if (prioridadeMedia) prioridadeMedia.textContent = mediumPriority;
        if (prioridadeLeve) prioridadeLeve.textContent = lowPriority;
    }

    // Geração de Excel
    showExcelModal() {
        const select = document.getElementById('projetoEspecificoExcel');
        if (select) {
            select.innerHTML = '<option value="">Selecione um projeto</option>' +
                this.projects.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');
        }
        
        const modal = document.getElementById('excelModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    hideExcelModal() {
        const modal = document.getElementById('excelModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    generateExcel() {
        const option = document.querySelector('input[name="excelOption"]:checked');
        if (!option) {
            this.showToast('Selecione uma opção!', 'warning');
            return;
        }

        let projectsToInclude = [];

        if (option.value === 'todos') {
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
        try {
            if (!window.XLSX) {
                this.showToast('Biblioteca Excel não carregada', 'error');
                return;
            }

            // Criar workbook
            const wb = XLSX.utils.book_new();
            
            // Dados dos projetos
            const projectsData = projects.map(project => ({
                'Título': project.titulo,
                'Descrição': project.descricao || 'Não informada',
                'Responsável': project.responsavel || 'Não informado',
                'Prioridade': project.prioridade.toUpperCase(),
                'Data de Criação': new Date(project.dataCriacao).toLocaleDateString('pt-BR'),
                'Data de Entrega': project.dataEntrega ? new Date(project.dataEntrega).toLocaleDateString('pt-BR') : 'Não definida',
                'Progresso (%)': this.calculateProgress(project),
                'Status': this.calculateProgress(project) === 100 ? 'Concluído' : 'Em Andamento',
                'Total de Etapas': project.etapas.length,
                'Etapas Concluídas': project.etapas.filter(e => e.concluida).length
            }));

            // Criar planilha de projetos
            const wsProjects = XLSX.utils.json_to_sheet(projectsData);
            
            // Ajustar largura das colunas
            const colWidths = [
                { wch: 25 }, // Título
                { wch: 40 }, // Descrição
                { wch: 20 }, // Responsável
                { wch: 12 }, // Prioridade
                { wch: 15 }, // Data Criação
                { wch: 15 }, // Data Entrega
                { wch: 12 }, // Progresso
                { wch: 15 }, // Status
                { wch: 15 }, // Total Etapas
                { wch: 18 }  // Etapas Concluídas
            ];
            wsProjects['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, wsProjects, 'Projetos');

            // Se for um projeto específico, adicionar planilha de etapas
            if (projects.length === 1 && projects[0].etapas.length > 0) {
                const project = projects[0];
                const stepsData = project.etapas.map(step => ({
                    'Título': step.titulo,
                    'Responsável': step.responsavel || 'Não informado',
                    'Prazo': step.prazo ? new Date(step.prazo).toLocaleDateString('pt-BR') : 'Não definido',
                    'Status': step.concluida ? 'Concluída' : 'Pendente',
                    'Link': step.link || 'Não informado',
                    'Observação': step.observacao || 'Nenhuma',
                    'Total de Tarefas': step.tarefas ? step.tarefas.length : 0,
                    'Tarefas Concluídas': step.tarefas ? step.tarefas.filter(t => t.concluida).length : 0
                }));

                const wsSteps = XLSX.utils.json_to_sheet(stepsData);
                wsSteps['!cols'] = [
                    { wch: 25 }, // Título
                    { wch: 20 }, // Responsável
                    { wch: 15 }, // Prazo
                    { wch: 12 }, // Status
                    { wch: 30 }, // Link
                    { wch: 40 }, // Observação
                    { wch: 15 }, // Total Tarefas
                    { wch: 18 }  // Tarefas Concluídas
                ];
                
                XLSX.utils.book_append_sheet(wb, wsSteps, 'Etapas');
            }

            // Gerar e baixar arquivo
            const fileName = `gestao_projetos_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            this.showToast('Excel gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar Excel:', error);
            this.showToast('Erro ao gerar Excel', 'error');
        }
    }

    // Reuniões
    showMeetingModal(meetingId = null) {
        const modal = document.getElementById('reuniaoModal');
        const title = document.getElementById('reuniaoModalTitle');
        
        // Preencher select de projetos
        const projectSelect = document.getElementById('reuniaoProjeto');
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">Nenhum projeto específico</option>' +
                this.projects.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');
        }
        
        if (meetingId) {
            const meeting = this.meetings.find(m => m.id === meetingId);
            if (meeting && title) {
                title.textContent = 'Editar Reunião';
                const reuniaoTitulo = document.getElementById('reuniaoTitulo');
                const reuniaoDescricao = document.getElementById('reuniaoDescricao');
                const reuniaoData = document.getElementById('reuniaoData');
                const reuniaoDuracao = document.getElementById('reuniaoDuracao');
                const reuniaoParticipantes = document.getElementById('reuniaoParticipantes');
                const reuniaoLink = document.getElementById('reuniaoLink');
                const reuniaoProjeto = document.getElementById('reuniaoProjeto');

                if (reuniaoTitulo) reuniaoTitulo.value = meeting.titulo;
                if (reuniaoDescricao) reuniaoDescricao.value = meeting.descricao || '';
                if (reuniaoData) reuniaoData.value = meeting.dataHora;
                if (reuniaoDuracao) reuniaoDuracao.value = meeting.duracao || 60;
                if (reuniaoParticipantes) reuniaoParticipantes.value = meeting.participantes || '';
                if (reuniaoLink) reuniaoLink.value = meeting.link || '';
                if (reuniaoProjeto) reuniaoProjeto.value = meeting.projetoId || '';
                
                modal.dataset.meetingId = meetingId;
            }
        } else {
            if (title) title.textContent = 'Agendar Reunião';
            const reuniaoForm = document.getElementById('reuniaoForm');
            if (reuniaoForm) reuniaoForm.reset();
            delete modal.dataset.meetingId;
        }

        if (modal) modal.classList.add('show');
    }

    hideMeetingModal() {
        const modal = document.getElementById('reuniaoModal');
        if (modal) modal.classList.remove('show');
    }

    async saveMeeting() {
        const modal = document.getElementById('reuniaoModal');
        const meetingId = modal ? modal.dataset.meetingId : null;
        
        const reuniaoTitulo = document.getElementById('reuniaoTitulo');
        const reuniaoDescricao = document.getElementById('reuniaoDescricao');
        const reuniaoData = document.getElementById('reuniaoData');
        const reuniaoDuracao = document.getElementById('reuniaoDuracao');
        const reuniaoParticipantes = document.getElementById('reuniaoParticipantes');
        const reuniaoLink = document.getElementById('reuniaoLink');
        const reuniaoProjeto = document.getElementById('reuniaoProjeto');

        const meetingData = {
            titulo: reuniaoTitulo ? reuniaoTitulo.value : '',
            descricao: reuniaoDescricao ? reuniaoDescricao.value : '',
            dataHora: reuniaoData ? reuniaoData.value : '',
            duracao: reuniaoDuracao ? parseInt(reuniaoDuracao.value) || 60 : 60,
            participantes: reuniaoParticipantes ? reuniaoParticipantes.value : '',
            link: reuniaoLink ? reuniaoLink.value : '',
            projetoId: reuniaoProjeto ? reuniaoProjeto.value || null : null
        };

        if (!meetingData.titulo.trim()) {
            this.showToast('Título da reunião é obrigatório!', 'warning');
            return;
        }

        if (!meetingData.dataHora) {
            this.showToast('Data e hora são obrigatórias!', 'warning');
            return;
        }

        if (meetingId) {
            // Editar reunião existente
            const meetingIndex = this.meetings.findIndex(m => m.id === meetingId);
            if (meetingIndex !== -1) {
                this.meetings[meetingIndex] = { ...this.meetings[meetingIndex], ...meetingData };
                this.showToast('Reunião atualizada com sucesso!');
            }
        } else {
            // Adicionar nova reunião
            const newMeeting = {
                id: this.generateId(),
                ...meetingData,
                dataCriacao: new Date().toISOString()
            };
            this.meetings.push(newMeeting);
            this.showToast('Reunião agendada com sucesso!');
        }

        await this.saveMeetings();
        this.renderMeetings();
        this.hideMeetingModal();
    }

    async removeMeeting(meetingId) {
        if (confirm('Tem certeza que deseja remover esta reunião?')) {
            this.meetings = this.meetings.filter(m => m.id !== meetingId);
            await this.saveMeetings();
            this.renderMeetings();
            this.showToast('Reunião removida com sucesso!');
        }
    }

    renderMeetings() {
        const container = document.getElementById('meetingsContainer');
        if (!container) return;
        
        if (this.meetings.length === 0) {
            container.innerHTML = '<p>Nenhuma reunião agendada ainda.</p>';
            return;
        }

        // Ordenar reuniões por data
        const sortedMeetings = [...this.meetings].sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

        container.innerHTML = sortedMeetings.map(meeting => {
            const dataFormatada = new Date(meeting.dataHora).toLocaleString('pt-BR');
            const project = meeting.projetoId ? this.projects.find(p => p.id === meeting.projetoId) : null;
            const isPast = new Date(meeting.dataHora) < new Date();

            return `
                <div class="meeting-card ${isPast ? 'past-meeting' : ''}">
                    <div class="meeting-header">
                        <h3>${meeting.titulo}</h3>
                        <div class="meeting-actions">
                            <button class="btn btn-sm btn-secondary" onclick="projectManager.editMeeting('${meeting.id}')">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="projectManager.removeMeeting('${meeting.id}')">Remover</button>
                        </div>
                    </div>
                    <div class="meeting-info">
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>Duração:</strong> ${meeting.duracao} minutos</p>
                        ${meeting.descricao ? `<p><strong>Descrição:</strong> ${meeting.descricao}</p>` : ''}
                        ${meeting.participantes ? `<p><strong>Participantes:</strong> ${meeting.participantes}</p>` : ''}
                        ${meeting.link ? `<p><strong>Link:</strong> <a href="${meeting.link}" target="_blank">${meeting.link}</a></p>` : ''}
                        ${project ? `<p><strong>Projeto:</strong> ${project.titulo}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    editMeeting(meetingId) {
        this.showMeetingModal(meetingId);
    }

    // Agenda
    showAppointmentModal(appointmentId = null) {
        const modal = document.getElementById('compromissoModal');
        const title = document.getElementById('compromissoModalTitle');
        
        // Preencher select de projetos
        const projectSelect = document.getElementById('compromissoProjeto');
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">Nenhum projeto específico</option>' +
                this.projects.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');
        }
        
        if (appointmentId) {
            const appointment = this.appointments.find(a => a.id === appointmentId);
            if (appointment && title) {
                title.textContent = 'Editar Compromisso';
                const compromissoTitulo = document.getElementById('compromissoTitulo');
                const compromissoDescricao = document.getElementById('compromissoDescricao');
                const compromissoData = document.getElementById('compromissoData');
                const compromissoTipo = document.getElementById('compromissoTipo');
                const compromissoProjeto = document.getElementById('compromissoProjeto');
                const notificarCompromisso = document.getElementById('notificarCompromisso');
                const antecedencia = document.getElementById('antecedencia');

                if (compromissoTitulo) compromissoTitulo.value = appointment.titulo;
                if (compromissoDescricao) compromissoDescricao.value = appointment.descricao || '';
                if (compromissoData) compromissoData.value = appointment.dataHora;
                if (compromissoTipo) compromissoTipo.value = appointment.tipo || 'pessoal';
                if (compromissoProjeto) compromissoProjeto.value = appointment.projetoId || '';
                if (notificarCompromisso) notificarCompromisso.checked = appointment.notificar !== false;
                if (antecedencia) antecedencia.value = appointment.antecedencia || 15;
                
                modal.dataset.appointmentId = appointmentId;
            }
        } else {
            if (title) title.textContent = 'Novo Compromisso';
            const compromissoForm = document.getElementById('compromissoForm');
            if (compromissoForm) compromissoForm.reset();
            const notificarCompromisso = document.getElementById('notificarCompromisso');
            if (notificarCompromisso) notificarCompromisso.checked = true;
            delete modal.dataset.appointmentId;
        }

        // Mostrar/ocultar opções de notificação
        const notificationOptions = document.getElementById('notificationOptions');
        const notificarCompromisso = document.getElementById('notificarCompromisso');
        if (notificationOptions && notificarCompromisso) {
            notificationOptions.style.display = notificarCompromisso.checked ? 'block' : 'none';
        }

        if (modal) modal.classList.add('show');
    }

    hideAppointmentModal() {
        const modal = document.getElementById('compromissoModal');
        if (modal) modal.classList.remove('show');
    }

    async saveAppointment() {
        const modal = document.getElementById('compromissoModal');
        const appointmentId = modal ? modal.dataset.appointmentId : null;
        
        const compromissoTitulo = document.getElementById('compromissoTitulo');
        const compromissoDescricao = document.getElementById('compromissoDescricao');
        const compromissoData = document.getElementById('compromissoData');
        const compromissoTipo = document.getElementById('compromissoTipo');
        const compromissoProjeto = document.getElementById('compromissoProjeto');
        const notificarCompromisso = document.getElementById('notificarCompromisso');
        const antecedencia = document.getElementById('antecedencia');

        const appointmentData = {
            titulo: compromissoTitulo ? compromissoTitulo.value : '',
            descricao: compromissoDescricao ? compromissoDescricao.value : '',
            dataHora: compromissoData ? compromissoData.value : '',
            tipo: compromissoTipo ? compromissoTipo.value : 'pessoal',
            projetoId: compromissoProjeto ? compromissoProjeto.value || null : null,
            notificar: notificarCompromisso ? notificarCompromisso.checked : false,
            antecedencia: antecedencia ? parseInt(antecedencia.value) || 15 : 15
        };

        if (!appointmentData.titulo.trim()) {
            this.showToast('Título do compromisso é obrigatório!', 'warning');
            return;
        }

        if (!appointmentData.dataHora) {
            this.showToast('Data e hora são obrigatórias!', 'warning');
            return;
        }

        if (appointmentId) {
            // Editar compromisso existente
            const appointmentIndex = this.appointments.findIndex(a => a.id === appointmentId);
            if (appointmentIndex !== -1) {
                this.appointments[appointmentIndex] = { ...this.appointments[appointmentIndex], ...appointmentData };
                this.showToast('Compromisso atualizado com sucesso!');
            }
        } else {
            // Adicionar novo compromisso
            const newAppointment = {
                id: this.generateId(),
                ...appointmentData,
                dataCriacao: new Date().toISOString(),
                visto: false
            };
            this.appointments.push(newAppointment);
            this.showToast('Compromisso adicionado com sucesso!');
        }

        await this.saveAppointments();
        this.renderAgenda();
        this.hideAppointmentModal();
    }

    async removeAppointment(appointmentId) {
        if (confirm('Tem certeza que deseja remover este compromisso?')) {
            this.appointments = this.appointments.filter(a => a.id !== appointmentId);
            await this.saveAppointments();
            this.renderAgenda();
            this.showToast('Compromisso removido com sucesso!');
        }
    }

    renderAgenda() {
        const container = document.getElementById('agendaEvents');
        if (!container) return;

        const agendaFilter = document.getElementById('agendaFilter');
        const filter = agendaFilter ? agendaFilter.value : 'todos';
        
        let filteredAppointments = [...this.appointments];
        const now = new Date();
        
        // Aplicar filtro
        switch (filter) {
            case 'hoje':
                filteredAppointments = filteredAppointments.filter(a => {
                    const appointmentDate = new Date(a.dataHora);
                    return appointmentDate.toDateString() === now.toDateString();
                });
                break;
            case 'semana':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                filteredAppointments = filteredAppointments.filter(a => {
                    const appointmentDate = new Date(a.dataHora);
                    return appointmentDate >= weekStart && appointmentDate <= weekEnd;
                });
                break;
            case 'mes':
                filteredAppointments = filteredAppointments.filter(a => {
                    const appointmentDate = new Date(a.dataHora);
                    return appointmentDate.getMonth() === now.getMonth() && 
                           appointmentDate.getFullYear() === now.getFullYear();
                });
                break;
        }
        
        if (filteredAppointments.length === 0) {
            container.innerHTML = '<p>Nenhum compromisso encontrado para o período selecionado.</p>';
            return;
        }

        // Ordenar compromissos por data
        filteredAppointments.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

        container.innerHTML = filteredAppointments.map(appointment => {
            const dataFormatada = new Date(appointment.dataHora).toLocaleString('pt-BR');
            const project = appointment.projetoId ? this.projects.find(p => p.id === appointment.projetoId) : null;
            const isPast = new Date(appointment.dataHora) < now;

            return `
                <div class="appointment-card ${isPast ? 'past-appointment' : ''} ${appointment.tipo}">
                    <div class="appointment-header">
                        <h3>${appointment.titulo}</h3>
                        <div class="appointment-actions">
                            <button class="btn btn-sm btn-secondary" onclick="projectManager.editAppointment('${appointment.id}')">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="projectManager.removeAppointment('${appointment.id}')">Remover</button>
                        </div>
                    </div>
                    <div class="appointment-info">
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>Tipo:</strong> ${appointment.tipo.charAt(0).toUpperCase() + appointment.tipo.slice(1)}</p>
                        ${appointment.descricao ? `<p><strong>Descrição:</strong> ${appointment.descricao}</p>` : ''}
                        ${project ? `<p><strong>Projeto:</strong> ${project.titulo}</p>` : ''}
                        ${appointment.notificar ? `<p><strong>Notificação:</strong> ${appointment.antecedencia} minutos antes</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    editAppointment(appointmentId) {
        this.showAppointmentModal(appointmentId);
    }

    // Sistema de Notificações
    startNotificationSystem() {
        // Verificar notificações a cada minuto
        this.notificationInterval = setInterval(() => {
            this.checkNotifications();
        }, 60000); // 60 segundos

        // Verificar imediatamente
        this.checkNotifications();
    }

    checkNotifications() {
        const now = new Date();
        
        this.appointments.forEach(appointment => {
            if (!appointment.notificar || appointment.visto) return;
            
            const appointmentTime = new Date(appointment.dataHora);
            const notificationTime = new Date(appointmentTime.getTime() - (appointment.antecedencia * 60000));
            
            if (now >= notificationTime && now < appointmentTime) {
                this.showNotification(appointment);
            }
        });
    }

    showNotification(appointment) {
        const card = document.getElementById('notificationCard');
        const title = document.getElementById('notificationTitle');
        const message = document.getElementById('notificationMessage');
        const time = document.getElementById('notificationTime');
        
        if (!card || !title || !message || !time) return;

        title.textContent = 'Lembrete de Compromisso';
        message.textContent = appointment.titulo;
        time.textContent = `Em ${appointment.antecedencia} minutos - ${new Date(appointment.dataHora).toLocaleString('pt-BR')}`;
        
        card.dataset.appointmentId = appointment.id;
        card.style.display = 'block';
        
        // Pequeno delay para garantir que a animação funcione
        setTimeout(() => {
            card.classList.add('show');
        }, 10);
        
        // Auto-hide após 30 segundos se não interagir
        setTimeout(() => {
            if (card.classList.contains('show')) {
                this.hideNotification();
            }
        }, 30000);
    }

    hideNotification() {
        const card = document.getElementById('notificationCard');
        if (card) {
            card.classList.remove('show');
            // Garantir que o card seja completamente ocultado
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    }

    snoozeNotification() {
        // Adiar por 5 minutos
        const card = document.getElementById('notificationCard');
        if (!card) return;

        const appointmentId = card.dataset.appointmentId;
        const appointment = this.appointments.find(a => a.id === appointmentId);
        
        if (appointment) {
            // Criar um novo "compromisso" temporário para notificar em 5 minutos
            setTimeout(() => {
                this.showNotification(appointment);
            }, 5 * 60000); // 5 minutos
        }
        
        this.hideNotification();
    }

    async markNotificationAsSeen() {
        const card = document.getElementById('notificationCard');
        if (!card) return;

        const appointmentId = card.dataset.appointmentId;
        const appointment = this.appointments.find(a => a.id === appointmentId);
        
        if (appointment) {
            appointment.visto = true;
            await this.saveAppointments();
        }
        
        this.hideNotification();
    }

    // Continuar com as funções existentes do código original...
    // Vou adicionar as funções principais que faltam

    // Gerenciamento de Projetos
    async addProject() {
        const form = document.getElementById('adicionarProjetoForm');
        if (!form) return;

        const formData = new FormData(form);
        
        const project = {
            id: this.generateId(),
            titulo: formData.get('titulo'),
            descricao: formData.get('descricao'),
            responsavel: formData.get('responsavel'),
            prioridade: formData.get('prioridade'),
            dataCriacao: new Date().toISOString(),
            dataEntrega: formData.get('dataEntrega') || null,
            etapas: []
        };

        this.projects.push(project);
        await this.saveProjects();
        this.showToast('Projeto adicionado com sucesso!');
        
        form.reset();
        this.showSection('acompanhar');
        this.setActiveNav(document.querySelector('[data-section="acompanhar"]'));
    }

    async removeProject() {
        if (!this.currentProject) return;

        if (confirm('Tem certeza que deseja remover este projeto?')) {
            this.projects = this.projects.filter(p => p.id !== this.currentProject.id);
            await this.saveProjects();
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
        if (!container || !this.currentProject) return;

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
        if (!tableBody || !this.currentProject) return;

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

    // Utilitários
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    calculateProgress(project) {
        if (!project.etapas || project.etapas.length === 0) return 0;
        const completed = project.etapas.filter(step => step.concluida).length;
        return Math.round((completed / project.etapas.length) * 100);
    }

    showToast(message, type = 'success', title = null, duration = 3000) {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastIcon || !toastTitle || !toastMessage) return;

        // Limpar classes anteriores
        toast.className = 'toast';
        
        // Configurar conteúdo baseado no tipo
        const config = {
            success: {
                icon: '<i class="fas fa-check"></i>',
                title: title || 'Sucesso',
                class: 'success'
            },
            error: {
                icon: '<i class="fas fa-times"></i>',
                title: title || 'Erro',
                class: 'error'
            },
            warning: {
                icon: '<i class="fas fa-exclamation-triangle"></i>',
                title: title || 'Atenção',
                class: 'warning'
            },
            info: {
                icon: '<i class="fas fa-info-circle"></i>',
                title: title || 'Informação',
                class: 'info'
            }
        };
        
        const currentConfig = config[type] || config.success;
        
        // Aplicar configuração
        toast.classList.add(currentConfig.class);
        toastIcon.innerHTML = currentConfig.icon;
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
        if (toast) toast.classList.remove('show');
    }

    // Adicionar as funções restantes que são necessárias mas não implementadas ainda
    // Estas são placeholders para manter a compatibilidade
    
    toggleAdvancedFilters() {
        const filtersDiv = document.getElementById('advancedFilters');
        const toggleBtn = document.getElementById('toggleAdvancedFilters');
        
        if (filtersDiv && toggleBtn) {
            filtersDiv.classList.toggle('show');
            toggleBtn.classList.toggle('active');
            
            if (filtersDiv.classList.contains('show')) {
                this.populateResponsibleFilter();
            }
        }
    }

    populateResponsibleFilter() {
        const select = document.getElementById('filtroResponsavel');
        if (!select) return;

        const responsibles = [...new Set(this.projects
            .map(p => p.responsavel)
            .filter(r => r && r.trim())
        )].sort();

        select.innerHTML = '<option value="">Todos</option>' +
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

        const filtroTexto = document.getElementById('filtroTexto');
        const filtroPrioridade = document.getElementById('filtroPrioridade');
        const filtroStatus = document.getElementById('filtroStatus');
        const filtroResponsavel = document.getElementById('filtroResponsavel');

        if (filtroTexto) filtroTexto.value = '';
        if (filtroPrioridade) filtroPrioridade.value = '';
        if (filtroStatus) filtroStatus.value = '';
        if (filtroResponsavel) filtroResponsavel.value = '';

        this.applyFilters();
    }

    setView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.view-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const viewBtn = document.getElementById(`view${view.charAt(0).toUpperCase() + view.slice(1)}`);
        if (viewBtn) viewBtn.classList.add('active');

        this.renderCurrentView();
    }

    renderCurrentView() {
        if (this.currentView === 'cards') {
            this.renderProjectCards();
        } else {
            this.renderProjectTable();
        }
    }

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
        const paginationInfo = document.getElementById('paginationInfo');

        if (prevBtn) prevBtn.disabled = this.pagination.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.pagination.currentPage >= this.pagination.totalPages;
        
        if (paginationInfo) {
            paginationInfo.textContent = `Página ${this.pagination.currentPage} de ${this.pagination.totalPages}`;
        }
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
        
        const projectsCount = document.getElementById('projectsCount');
        if (projectsCount) projectsCount.textContent = countText;
    }

    renderProjects() {
        this.applyFilters();
    }

    renderProjectCards() {
        const container = document.getElementById('projectsList');
        const tableContainer = document.getElementById('projectsTable');
        
        if (!container || !tableContainer) return;

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
        
        if (!container || !tableContainer || !tableBody) return;

        container.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        
        const projects = this.getPaginatedProjects();
        
        if (projects.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum projeto encontrado com os filtros aplicados.</td></tr>';
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

    // Placeholder functions for missing functionality
    showEditModal() {
        // TODO: Implement edit modal
        this.showToast('Funcionalidade de edição será implementada em breve', 'info');
    }

    hideEditModal() {
        // TODO: Implement
    }

    saveProjectEdit() {
        // TODO: Implement
    }

    showStepModal() {
        // TODO: Implement step modal
        this.showToast('Funcionalidade de etapas será implementada em breve', 'info');
    }

    hideStepModal() {
        // TODO: Implement
    }

    saveStep() {
        // TODO: Implement
    }

    showStepDetails() {
        // TODO: Implement
    }

    hideStepDetailsModal() {
        // TODO: Implement
    }

    editStep() {
        // TODO: Implement
    }

    removeStep() {
        // TODO: Implement
    }

    addStepTask() {
        // TODO: Implement
    }

    addDailyTask() {
        // TODO: Implement
    }

    addIdea() {
        // TODO: Implement
    }

    renderIdeas() {
        const container = document.getElementById('ideasContainer');
        if (!container) return;

        if (this.ideas.length === 0) {
            container.innerHTML = '<p>Nenhuma ideia cadastrada ainda.</p>';
            return;
        }

        container.innerHTML = this.ideas.map(idea => `
            <div class="idea-card">
                <h3>${idea.titulo}</h3>
                <p>${idea.descricao || 'Sem descrição'}</p>
                <small>Criada em: ${new Date(idea.dataCriacao).toLocaleDateString('pt-BR')}</small>
            </div>
        `).join('');
    }

    renderCalendar() {
        // TODO: Implement calendar rendering
        const container = document.getElementById('calendarBody');
        if (container) {
            container.innerHTML = '<tr><td colspan="7">Calendário será implementado em breve</td></tr>';
        }
    }

    renderCalendarEvents() {
        // TODO: Implement
    }

    changeMonth() {
        // TODO: Implement
    }

    selectDate() {
        // TODO: Implement
    }

    showPdfModal() {
        const modal = document.getElementById('pdfModal');
        if (modal) {
            // Atualizar lista de projetos no modal
            const projectSelect = document.getElementById('pdfProjectSelect');
            if (projectSelect) {
                projectSelect.innerHTML = '<option value="">Selecione um projeto</option>' +
                    this.projects.map(project => 
                        `<option value="${project.id}">${project.titulo}</option>`
                    ).join('');
            }
            modal.classList.add('show');
        }
    }

    hidePdfModal() {
        const modal = document.getElementById('pdfModal');
        if (modal) modal.classList.remove('show');
    }

    generatePDF() {
        const pdfType = document.querySelector('input[name="pdfType"]:checked');
        const projectSelect = document.getElementById('pdfProjectSelect');
        
        if (!pdfType) {
            this.showToast('Selecione uma opção para gerar o PDF', 'warning');
            return;
        }

        let projectsToInclude = [];
        
        if (pdfType.value === 'all') {
            projectsToInclude = this.projects;
        } else if (pdfType.value === 'specific') {
            if (!projectSelect || !projectSelect.value) {
                this.showToast('Selecione um projeto específico', 'warning');
                return;
            }
            const selectedProject = this.projects.find(p => p.id === projectSelect.value);
            if (selectedProject) {
                projectsToInclude = [selectedProject];
            }
        }

        if (projectsToInclude.length === 0) {
            this.showToast('Nenhum projeto encontrado para gerar o PDF', 'warning');
            return;
        }

        this.createPDF(projectsToInclude);
        this.hidePdfModal();
    }

    createPDF(projects) {
        // Criar um novo documento PDF usando jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurações de estilo
        const colors = {
            primary: '#333333',
            secondary: '#666666',
            accent: '#007bff',
            success: '#28a745',
            warning: '#ffc107',
            danger: '#dc3545',
            light: '#f8f9fa',
            border: '#dddddd'
        };

        let yPosition = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const lineHeight = 7;

        // Função para adicionar nova página se necessário
        const checkPageBreak = (requiredSpace = 20) => {
            if (yPosition + requiredSpace > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        };

        // Cabeçalho do documento
        doc.setFillColor(51, 51, 51); // Cor primária
        doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório de Projetos', margin, 25);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, 35);

        yPosition = 60;

        // Resumo geral
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo Geral', margin, yPosition);
        yPosition += 15;

        // Estatísticas
        const totalProjects = projects.length;
        const completedProjects = projects.filter(p => this.calculateProgress(p) === 100).length;
        const inProgressProjects = projects.filter(p => {
            const progress = this.calculateProgress(p);
            return progress > 0 && progress < 100;
        }).length;
        const notStartedProjects = projects.filter(p => this.calculateProgress(p) === 0).length;

        const stats = [
            { label: 'Total de Projetos:', value: totalProjects, color: colors.primary },
            { label: 'Concluídos:', value: completedProjects, color: colors.success },
            { label: 'Em Andamento:', value: inProgressProjects, color: colors.warning },
            { label: 'Não Iniciados:', value: notStartedProjects, color: colors.danger }
        ];

        stats.forEach(stat => {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(102, 102, 102);
            doc.text(stat.label, margin, yPosition);
            
            doc.setFont('helvetica', 'bold');
            const rgb = this.hexToRgb(stat.color);
            doc.setTextColor(rgb.r, rgb.g, rgb.b);
            doc.text(stat.value.toString(), margin + 60, yPosition);
            
            yPosition += lineHeight + 2;
        });

        yPosition += 10;

        // Detalhes dos projetos
        projects.forEach((project, index) => {
            checkPageBreak(60);

            // Cabeçalho do projeto
            doc.setFillColor(248, 249, 250);
            doc.rect(margin, yPosition - 5, doc.internal.pageSize.width - (margin * 2), 25, 'F');
            
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${project.titulo}`, margin + 5, yPosition + 5);

            // Badge de prioridade
            const priorityColors = {
                'alta': colors.danger,
                'media': colors.warning,
                'leve': colors.accent
            };
            const priorityColor = priorityColors[project.prioridade] || colors.primary;
            const rgb = this.hexToRgb(priorityColor);
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.roundedRect(doc.internal.pageSize.width - 80, yPosition - 2, 25, 8, 2, 2, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            const priorityText = project.prioridade.toUpperCase();
            doc.text(priorityText, doc.internal.pageSize.width - 77, yPosition + 3);

            yPosition += 30;

            // Informações do projeto
            doc.setTextColor(102, 102, 102);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            if (project.descricao) {
                doc.text('Descrição:', margin, yPosition);
                yPosition += lineHeight;
                const descLines = doc.splitTextToSize(project.descricao, doc.internal.pageSize.width - (margin * 2) - 10);
                doc.text(descLines, margin + 10, yPosition);
                yPosition += descLines.length * lineHeight + 5;
            }

            if (project.responsavel) {
                doc.text(`Responsável: ${project.responsavel}`, margin, yPosition);
                yPosition += lineHeight + 2;
            }

            if (project.dataEntrega) {
                const dataFormatada = new Date(project.dataEntrega).toLocaleDateString('pt-BR');
                doc.text(`Data de Entrega: ${dataFormatada}`, margin, yPosition);
                yPosition += lineHeight + 2;
            }

            // Progresso
            const progress = this.calculateProgress(project);
            doc.text(`Progresso: ${progress}%`, margin, yPosition);
            
            // Barra de progresso
            const barWidth = 100;
            const barHeight = 6;
            doc.setFillColor(233, 236, 239); // Cor de fundo da barra
            doc.rect(margin + 50, yPosition - 3, barWidth, barHeight, 'F');
            
            if (progress > 0) {
                const progressWidth = (barWidth * progress) / 100;
                const progressRgb = this.hexToRgb(colors.success);
                doc.setFillColor(progressRgb.r, progressRgb.g, progressRgb.b);
                doc.rect(margin + 50, yPosition - 3, progressWidth, barHeight, 'F');
            }

            yPosition += 15;

            // Etapas do projeto
            if (project.etapas && project.etapas.length > 0) {
                checkPageBreak(30);
                
                doc.setTextColor(51, 51, 51);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Etapas:', margin, yPosition);
                yPosition += 10;

                project.etapas.forEach((etapa, etapaIndex) => {
                    checkPageBreak(15);
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(102, 102, 102);
                    
                    const statusIcon = etapa.concluida ? '✓' : '○';
                    const statusColor = etapa.concluida ? colors.success : colors.warning;
                    const statusRgb = this.hexToRgb(statusColor);
                    
                    doc.setTextColor(statusRgb.r, statusRgb.g, statusRgb.b);
                    doc.text(statusIcon, margin + 5, yPosition);
                    
                    doc.setTextColor(51, 51, 51);
                    doc.text(`${etapaIndex + 1}. ${etapa.titulo}`, margin + 15, yPosition);
                    
                    if (etapa.responsavel) {
                        doc.setTextColor(102, 102, 102);
                        doc.text(`(${etapa.responsavel})`, margin + 15 + doc.getTextWidth(`${etapaIndex + 1}. ${etapa.titulo}`) + 5, yPosition);
                    }
                    
                    yPosition += lineHeight + 1;
                });
            }

            yPosition += 15;
        });

        // Rodapé
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(102, 102, 102);
            doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
            doc.text('Sistema de Gestão de Projetos', margin, doc.internal.pageSize.height - 10);
        }

        // Salvar o PDF
        const fileName = projects.length === 1 
            ? `projeto_${projects[0].titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
            : `relatorio_projetos_${new Date().toISOString().split('T')[0]}.pdf`;
        
        doc.save(fileName);
        this.showToast('PDF gerado com sucesso!', 'success');
    }

    // Função auxiliar para converter hex para RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
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
    editMeeting: (id) => projectManager.editMeeting(id),
    removeMeeting: (id) => projectManager.removeMeeting(id),
    editAppointment: (id) => projectManager.editAppointment(id),
    removeAppointment: (id) => projectManager.removeAppointment(id)
};

