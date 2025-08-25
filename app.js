// Sistema de Gestão de Projetos - JavaScript
class ProjectManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentProject = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        
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

        // Filtro de projetos
        document.getElementById('filtroTexto').addEventListener('input', (e) => {
            this.filterProjects(e.target.value);
        });

        // Calendário
        document.getElementById('mesAnterior').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('proximoMes').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Fechar modais clicando fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
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
        const container = document.getElementById('projectsList');
        
        if (this.projects.length === 0) {
            container.innerHTML = '<p>Nenhum projeto cadastrado ainda.</p>';
            return;
        }

        // Ordenar por prioridade e data
        const sortedProjects = [...this.projects].sort((a, b) => {
            const priorityOrder = { alta: 3, media: 2, leve: 1 };
            const priorityDiff = priorityOrder[b.prioridade] - priorityOrder[a.prioridade];
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.dataCriacao) - new Date(a.dataCriacao);
        });

        container.innerHTML = sortedProjects.map(project => {
            const progress = this.calculateProgress(project);
            const creationDate = new Date(project.dataCriacao).toLocaleDateString('pt-BR');
            const visibleSteps = project.etapas.slice(0, 2);

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
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    filterProjects(searchTerm) {
        const cards = document.querySelectorAll('.project-card');
        const term = searchTerm.toLowerCase();

        cards.forEach(card => {
            const title = card.querySelector('.project-title').textContent.toLowerCase();
            const description = card.querySelector('.project-description').textContent.toLowerCase();
            const responsible = card.querySelector('.project-meta').textContent.toLowerCase();

            if (title.includes(term) || description.includes(term) || responsible.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Modal Editar Projeto
    showEditModal() {
        if (!this.currentProject) return;

        const project = this.currentProject;
        document.getElementById('editTitulo').value = project.titulo;
        document.getElementById('editDescricao').value = project.descricao || '';
        document.getElementById('editResponsavel').value = project.responsavel || '';
        document.getElementById('editPrioridade').value = project.prioridade;

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
            prioridade: document.getElementById('editPrioridade').value
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
        const calendarBody = document.getElementById('calendarBody');
        const monthYear = document.getElementById('mesAno');

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        monthYear.textContent = new Date(year, month).toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        const calendar = [];

        for (let week = 0; week < 6; week++) {
            const weekRow = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);
                
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = currentDate.toDateString() === today.toDateString();
                const hasEvents = this.hasEventsOnDate(currentDate);

                weekRow.push({
                    date: currentDate,
                    isCurrentMonth,
                    isToday,
                    hasEvents
                });
            }
            calendar.push(weekRow);
        }

        calendarBody.innerHTML = calendar.map(week => `
            <tr>
                ${week.map(day => `
                    <td class="${day.isCurrentMonth ? '' : 'other-month'} ${day.isToday ? 'today' : ''} ${day.hasEvents ? 'has-events' : ''}"
                        onclick="projectManager.selectDate('${day.date.toISOString()}')">
                        ${day.date.getDate()}
                    </td>
                `).join('')}
            </tr>
        `).join('');
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    selectDate(dateString) {
        this.selectedDate = new Date(dateString);
        
        // Remover seleção anterior
        document.querySelectorAll('.calendar td.selected').forEach(td => {
            td.classList.remove('selected');
        });

        // Adicionar seleção atual
        event.target.classList.add('selected');

        this.renderCalendarEvents();
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
                </div>
            </div>
        `).join('');
    }

    // Geração de PDF
    showPdfModal() {
        const select = document.getElementById('projetoEspecifico');
        select.innerHTML = '<option value="">Selecione um projeto</option>' +
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
                    step.concluida ? 'Sim' : 'Não',
                    step.observacao || 'N/A'
                ]);

                doc.autoTable({
                    head: [['Título', 'Responsável', 'Prazo', 'Concluída', 'Observação']],
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

    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
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
    selectDate: (date) => projectManager.selectDate(date)
};

