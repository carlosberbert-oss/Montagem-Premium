// script.js - SISTEMA COMPLETO COM FIREBASE

// ============ CONFIGURAÇÃO ============
const CONFIG = {
    VERSION: '1.0.0',
    ADMIN_EMAIL: 'admin@montagem.com',
    ADMIN_PASSWORD: 'admin123'
};

// ============ ESTADO GLOBAL ============
let currentUser = null;
let montagens = [];
let motoristas = [];
let atividades = [];

// ============ ELEMENTOS DOM ============
const elements = {
    // Telas
    loading: document.getElementById('loading'),
    app: document.getElementById('app'),
    loginScreen: document.getElementById('login-screen'),
    mainScreen: document.getElementById('main-screen'),
    
    // Login
    loginForm: document.getElementById('login-form'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    
    // Header
    currentUserSpan: document.getElementById('current-user'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Menu
    tabs: document.querySelectorAll('.sidebar li'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Dashboard
    countPending: document.getElementById('count-pending'),
    countInProgress: document.getElementById('count-in-progress'),
    countCompleted: document.getElementById('count-completed'),
    countMotoristas: document.getElementById('count-motoristas'),
    activityList: document.getElementById('activity-list'),
    
    // Montagens
    searchMontagem: document.getElementById('search-montagem'),
    filterStatus: document.getElementById('filter-status'),
    refreshMontagens: document.getElementById('refresh-montagens'),
    montagensBody: document.getElementById('montagens-body'),
    
    // Nova Montagem
    formNovaMontagem: document.getElementById('form-nova-montagem'),
    clienteNome: document.getElementById('cliente-nome'),
    clienteTelefone: document.getElementById('cliente-telefone'),
    clienteEndereco: document.getElementById('cliente-endereco'),
    clienteCidade: document.getElementById('cliente-cidade'),
    tipoBase: document.getElementById('tipo-base'),
    prioridade: document.getElementById('prioridade'),
    observacoes: document.getElementById('observacoes'),
    motoristaSelect: document.getElementById('motorista'),
    dataMontagem: document.getElementById('data-montagem'),
    
    // Motoristas
    btnNovoMotorista: document.getElementById('btn-novo-motorista'),
    motoristasBody: document.getElementById('motoristas-body'),
    
    // Modal Motorista
    modalMotorista: document.getElementById('modal-motorista'),
    formMotorista: document.getElementById('form-motorista'),
    motoristaId: document.getElementById('motorista-id'),
    motoristaNome: document.getElementById('motorista-nome'),
    motoristaEmail: document.getElementById('motorista-email'),
    motoristaTelefone: document.getElementById('motorista-telefone'),
    motoristaSenha: document.getElementById('motorista-senha'),
    modalTitle: document.getElementById('modal-title'),
    closeModals: document.querySelectorAll('.close-modal'),
    
    // Relatórios
    filterMonth: document.getElementById('filter-month'),
    filterDriver: document.getElementById('filter-driver'),
    generateReport: document.getElementById('generate-report')
};

// ============ INICIALIZAÇÃO ============
document.addEventListener('DOMContentLoaded', async () => {
    console.log(`🚀 Sistema Montagem Colchões v${CONFIG.VERSION}`);
    
    try {
        // 1. Verificar Firebase
        updateLoadingText('Verificando Firebase...');
        
        if (!window.firebaseApp || !window.firebaseApp.checkFirebase()) {
            throw new Error('Firebase não inicializado');
        }
        
        // 2. Inicializar banco de dados
        updateLoadingText('Inicializando banco de dados...');
        await firebaseApp.initializeDatabase();
        
        // 3. Configurar data atual
        elements.dataMontagem.valueAsDate = new Date();
        
        // 4. Configurar listeners
        setupEventListeners();
        
        // 5. Verificar se já está logado
        updateLoadingText('Verificando autenticação...');
        await checkAuthState();
        
        // 6. Mostrar aplicação
        setTimeout(() => {
            elements.loading.style.display = 'none';
            elements.app.style.display = 'block';
            showNotification('Sistema carregado com sucesso!', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('Erro na inicialização:', error);
        updateLoadingText(`Erro: ${error.message}`);
        showErrorScreen(error.message);
    }
});

// ============ FUNÇÕES DE UTILIDADE ============
function updateLoadingText(text) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.textContent = text;
}

function showErrorScreen(message) {
    elements.loading.innerHTML = `
        <div style="text-align: center; color: white;">
            <h2 style="color: #f94144;">❌ Erro no Sistema</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #4361ee;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-top: 20px;
                cursor: pointer;
                font-weight: bold;
            ">
                Tentar Novamente
            </button>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    // Remove notificação anterior
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Adiciona estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#4cc9f0' : 
                    type === 'error' ? '#f94144' : '#4361ee'};
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Remove após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ============ AUTENTICAÇÃO ============
async function checkAuthState() {
    return new Promise((resolve) => {
        firebaseApp.auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Usuário logado
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                };
                
                // Buscar dados do usuário no Firestore
                const userDoc = await firebaseApp.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUser = { ...currentUser, ...userDoc.data() };
                }
                
                showMainScreen();
                showNotification(`Bem-vindo, ${currentUser.email}!`, 'success');
            } else {
                // Usuário não logado
                showLoginScreen();
            }
            resolve();
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    try {
        showNotification('Fazendo login...', 'info');
        
        // Fazer login no Firebase
        const userCredential = await firebaseApp.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Buscar dados adicionais do usuário
        const userDoc = await firebaseApp.db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            currentUser = { 
                uid: user.uid, 
                email: user.email,
                ...userDoc.data() 
            };
            
            showMainScreen();
            showNotification('Login realizado com sucesso!', 'success');
            
            // Registrar atividade
            await registrarAtividade('login', `Usuário ${email} fez login`);
        } else {
            throw new Error('Usuário não encontrado no sistema');
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        elements.loginError.textContent = getErrorMessage(error);
        elements.loginError.style.display = 'block';
        showNotification('Erro no login: ' + error.message, 'error');
    }
}

function getErrorMessage(error) {
    switch(error.code) {
        case 'auth/user-not-found':
            return 'Usuário não encontrado';
        case 'auth/wrong-password':
            return 'Senha incorreta';
        case 'auth/invalid-email':
            return 'E-mail inválido';
        default:
            return error.message;
    }
}

async function handleLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        try {
            await firebaseApp.auth.signOut();
            currentUser = null;
            showLoginScreen();
            showNotification('Logout realizado com sucesso', 'info');
        } catch (error) {
            console.error('Erro no logout:', error);
            showNotification('Erro ao fazer logout', 'error');
        }
    }
}

// ============ NAVEGAÇÃO ============
function showLoginScreen() {
    elements.loginScreen.classList.add('active');
    elements.mainScreen.classList.remove('active');
    elements.loginForm.reset();
    elements.loginError.style.display = 'none';
}

function showMainScreen() {
    elements.loginScreen.classList.remove('active');
    elements.mainScreen.classList.add('active');
    
    // Atualizar informações do usuário
    if (currentUser) {
        elements.currentUserSpan.textContent = currentUser.email;
    }
    
    // Carregar dados iniciais
    loadDashboardData();
    loadMotoristas();
    loadMontagens();
}

function setupEventListeners() {
    // Login/Logout
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Navegação
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Filtros
    elements.searchMontagem.addEventListener('input', filterMontagens);
    elements.filterStatus.addEventListener('change', filterMontagens);
    elements.refreshMontagens.addEventListener('click', loadMontagens);
    
    // Nova Montagem
    elements.formNovaMontagem.addEventListener('submit', handleNovaMontagem);
    
    // Motoristas
    elements.btnNovoMotorista.addEventListener('click', () => openMotoristaModal());
    elements.formMotorista.addEventListener('submit', handleSalvarMotorista);
    
    // Modais
    elements.closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.modalMotorista.classList.remove('active');
        });
    });
    
    // Fechar modal clicando fora
    window.addEventListener('click', (e) => {
        if (e.target === elements.modalMotorista) {
            elements.modalMotorista.classList.remove('active');
        }
    });
    
    // Relatórios
    elements.generateReport.addEventListener('click', generateReport);
}

function switchTab(tabId) {
    // Atualizar menu
    elements.tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        }
    });
    
    // Mostrar conteúdo
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
            
            // Carregar dados específicos
            switch(tabId) {
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'montagens':
                    loadMontagens();
                    break;
                case 'nova-montagem':
                    loadMotoristasParaSelect();
                    break;
                case 'motoristas':
                    loadMotoristas();
                    break;
            }
        }
    });
}

// ============ DASHBOARD ============
async function loadDashboardData() {
    try {
        // Buscar estatísticas do Firebase
        const montagensSnapshot = await firebaseApp.db.collection('montagens').get();
        const motoristasSnapshot = await firebaseApp.db.collection('motoristas').where('ativo', '==', true).get();
        
        // Calcular estatísticas
        let pendentes = 0, andamento = 0, concluidas = 0;
        
        montagensSnapshot.forEach(doc => {
            const data = doc.data();
            switch(data.status) {
                case 'pendente': pendentes++; break;
                case 'andamento': andamento++; break;
                case 'concluida': concluidas++; break;
            }
        });
        
        // Atualizar UI
        elements.countPending.textContent = pendentes;
        elements.countInProgress.textContent = andamento;
        elements.countCompleted.textContent = concluidas;
        elements.countMotoristas.textContent = motoristasSnapshot.size;
        
        // Carregar atividades recentes
        await loadAtividades();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dashboard', 'error');
    }
}

async function loadAtividades() {
    try {
        const atividadesSnapshot = await firebaseApp.db.collection('atividades')
            .orderBy('data', 'desc')
            .limit(5)
            .get();
        
        elements.activityList.innerHTML = '';
        
        if (atividadesSnapshot.empty) {
            elements.activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-info">
                        <h4>Nenhuma atividade recente</h4>
                        <p>As atividades aparecerão aqui</p>
                    </div>
                </div>
            `;
            return;
        }
        
        atividadesSnapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-${getActivityIcon(data.tipo)}"></i>
                </div>
                <div class="activity-info">
                    <h4>${data.descricao}</h4>
                    <p>${formatDate(data.data.toDate())}</p>
                </div>
            `;
            elements.activityList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
    }
}

function getActivityIcon(tipo) {
    const icons = {
        'login': 'sign-in-alt',
        'logout': 'sign-out-alt',
        'nova_montagem': 'bed',
        'motorista': 'user',
        'default': 'info-circle'
    };
    return icons[tipo] || icons.default;
}

// ============ MONTAGENS ============
async function loadMontagens() {
    try {
        showNotification('Carregando montagens...', 'info');
        
        const snapshot = await firebaseApp.db.collection('montagens')
            .orderBy('criadoEm', 'desc')
            .get();
        
        montagens = [];
        snapshot.forEach(doc => {
            montagens.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        updateMontagensTable(montagens);
        showNotification(`${montagens.length} montagens carregadas`, 'success');
        
    } catch (error) {
        console.error('Erro ao carregar montagens:', error);
        showNotification('Erro ao carregar montagens', 'error');
    }
}

function updateMontagensTable(montagensList) {
    elements.montagensBody.innerHTML = '';
    
    if (montagensList.length === 0) {
        elements.montagensBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                    <h3 style="color: #6c757d;">Nenhuma montagem encontrada</h3>
                    <p>Comece cadastrando uma nova montagem</p>
                </td>
            </tr>
        `;
        return;
    }
    
    montagensList.forEach(montagem => {
        const row = document.createElement('tr');
        
        // Formatar data
        const dataFormatada = montagem.dataMontagem ? 
            new Date(montagem.dataMontagem).toLocaleDateString('pt-BR') : 
            'Não definida';
        
        row.innerHTML = `
            <td>
                <strong>${montagem.clienteNome}</strong><br>
                <small>${montagem.clienteTelefone}</small>
            </td>
            <td>${montagem.clienteEndereco}<br><small>${montagem.clienteCidade}</small></td>
            <td>${montagem.tipoBase}</td>
            <td>${montagem.motoristaNome || 'Não atribuído'}</td>
            <td>
                <span class="status-badge status-${montagem.status || 'pendente'}">
                    ${formatStatus(montagem.status)}
                </span>
            </td>
            <td>
                <button class="btn-action btn-view" onclick="viewMontagem('${montagem.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-edit" onclick="editMontagem('${montagem.id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        elements.montagensBody.appendChild(row);
    });
}

function formatStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'andamento': 'Em Andamento',
        'concluida': 'Concluída'
    };
    return statusMap[status] || 'Pendente';
}

function filterMontagens() {
    const searchTerm = elements.searchMontagem.value.toLowerCase();
    const statusFilter = elements.filterStatus.value;
    
    let filtered = montagens;
    
    if (searchTerm) {
        filtered = filtered.filter(m => 
            m.clienteNome.toLowerCase().includes(searchTerm) ||
            m.clienteTelefone.includes(searchTerm) ||
            m.clienteEndereco.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    updateMontagensTable(filtered);
}

async function handleNovaMontagem(e) {
    e.preventDefault();
    
    // Coletar dados
    const montagemData = {
        clienteNome: elements.clienteNome.value.trim(),
        clienteTelefone: elements.clienteTelefone.value.trim(),
        clienteEndereco: elements.clienteEndereco.value.trim(),
        clienteCidade: elements.clienteCidade.value.trim(),
        tipoBase: elements.tipoBase.value,
        prioridade: elements.prioridade.value,
        observacoes: elements.observacoes.value.trim(),
        motoristaId: elements.motoristaSelect.value,
        motoristaNome: elements.motoristaSelect.options[elements.motoristaSelect.selectedIndex]?.text || '',
        dataMontagem: elements.dataMontagem.value,
        status: 'pendente',
        criadoPor: currentUser.email,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Validação
    if (!montagemData.motoristaId) {
        showNotification('Selecione um motorista', 'error');
        return;
    }
    
    try {
        showNotification('Salvando montagem...', 'info');
        
        // Salvar no Firebase
        const docRef = await firebaseApp.db.collection('montagens').add(montagemData);
        
        // Registrar atividade
        await registrarAtividade('nova_montagem', 
            `Nova montagem criada para ${montagemData.clienteNome}`);
        
        // Limpar formulário
        elements.formNovaMontagem.reset();
        elements.dataMontagem.valueAsDate = new Date();
        
        showNotification('Montagem criada com sucesso!', 'success');
        
        // Recarregar dados
        loadMontagens();
        loadDashboardData();
        
        // Voltar para lista
        switchTab('montagens');
        
    } catch (error) {
        console.error('Erro ao salvar montagem:', error);
        showNotification('Erro ao criar montagem', 'error');
    }
}

// ============ MOTORISTAS ============
async function loadMotoristas() {
    try {
        const snapshot = await firebaseApp.db.collection('motoristas').get();
        
        motoristas = [];
        snapshot.forEach(doc => {
            motoristas.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        updateMotoristasTable(motoristas);
        loadMotoristasParaSelect();
        updateMotoristaFilter();
        
    } catch (error) {
        console.error('Erro ao carregar motoristas:', error);
        showNotification('Erro ao carregar motoristas', 'error');
    }
}

function updateMotoristasTable(motoristasList) {
    elements.motoristasBody.innerHTML = '';
    
    if (motoristasList.length === 0) {
        elements.motoristasBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-user-friends" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                    <h3 style="color: #6c757d;">Nenhum motorista cadastrado</h3>
                    <p>Cadastre o primeiro motorista</p>
                </td>
            </tr>
        `;
        return;
    }
    
    motoristasList.forEach(motorista => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${motorista.nome}</td>
            <td>${motorista.email}</td>
            <td>${motorista.telefone}</td>
            <td>
                <span class="status-badge ${motorista.ativo ? 'status-concluida' : 'status-pendente'}">
                    ${motorista.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <button class="btn-action btn-edit" onclick="editMotorista('${motorista.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteMotorista('${motorista.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        elements.motoristasBody.appendChild(row);
    });
}

function loadMotoristasParaSelect() {
    elements.motoristaSelect.innerHTML = '<option value="">Selecione um motorista...</option>';
    elements.filterDriver.innerHTML = '<option value="">Todos motoristas</option>';
    
    motoristas
        .filter(m => m.ativo)
        .forEach(motorista => {
            // Para o select do formulário
            const option = document.createElement('option');
            option.value = motorista.id;
            option.textContent = `${motorista.nome} (${motorista.telefone})`;
            elements.motoristaSelect.appendChild(option);
            
            // Para o filtro de relatórios
            const option2 = document.createElement('option');
            option2.value = motorista.id;
            option2.textContent = motorista.nome;
            elements.filterDriver.appendChild(option2);
        });
}

function updateMotoristaFilter() {
    // Já feito em loadMotoristasParaSelect
}

function openMotoristaModal(motoristaId = null) {
    elements.formMotorista.reset();
    
    if (motoristaId) {
        // Editar motorista existente
        const motorista = motoristas.find(m => m.id === motoristaId);
        if (motorista) {
            elements.modalTitle.textContent = 'Editar Motorista';
            elements.motoristaId.value = motorista.id;
            elements.motoristaNome.value = motorista.nome;
            elements.motoristaEmail.value = motorista.email;
            elements.motoristaTelefone.value = motorista.telefone;
            elements.motoristaSenha.required = false;
            elements.motoristaSenha.placeholder = 'Deixe em branco para manter a senha atual';
        }
    } else {
        // Novo motorista
        elements.modalTitle.textContent = 'Novo Motorista';
        elements.motoristaId.value = '';
        elements.motoristaSenha.required = true;
        elements.motoristaSenha.placeholder = '';
    }
    
    elements.modalMotorista.classList.add('active');
}

async function handleSalvarMotorista(e) {
    e.preventDefault();
    
    const motoristaData = {
        nome: elements.motoristaNome.value.trim(),
        email: elements.motoristaEmail.value.trim(),
        telefone: elements.motoristaTelefone.value.trim(),
        ativo: true,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const motoristaId = elements.motoristaId.value;
    const senha = elements.motoristaSenha.value;
    
    try {
        showNotification('Salvando motorista...', 'info');
        
        if (motoristaId) {
            // Atualizar motorista existente
            await firebaseApp.db.collection('motoristas').doc(motoristaId).update(motoristaData);
            
            // Atualizar senha se fornecida
            if (senha) {
                // Aqui você precisaria atualizar no Authentication também
                // Para simplificar, estamos só atualizando no Firestore
            }
            
            showNotification('Motorista atualizado com sucesso!', 'success');
        } else {
            // Criar novo motorista
            // 1. Criar no Authentication
            const userCredential = await firebaseApp.auth.createUserWithEmailAndPassword(
                motoristaData.email, 
                senha
            );
            
            // 2. Salvar no Firestore
            await firebaseApp.db.collection('motoristas').doc(userCredential.user.uid).set(motoristaData);
            
            // 3. Criar também na coleção users
            await firebaseApp.db.collection('users').doc(userCredential.user.uid).set({
                ...motoristaData,
                tipo: 'motorista'
            });
            
            showNotification('Motorista criado com sucesso!', 'success');
        }
        
        // Registrar atividade
        await registrarAtividade('motorista', 
            motoristaId ? `Motorista ${motoristaData.nome} atualizado` : 
                         `Novo motorista ${motoristaData.nome} cadastrado`);
        
        // Fechar modal e atualizar dados
        elements.modalMotorista.classList.remove('active');
        await loadMotoristas();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Erro ao salvar motorista:', error);
        showNotification('Erro ao salvar motorista: ' + error.message, 'error');
    }
}

async function deleteMotorista(motoristaId) {
    if (!confirm('Tem certeza que deseja excluir este motorista?')) return;
    
    try {
        const motorista = motoristas.find(m => m.id === motoristaId);
        
        // Verificar se o motorista tem montagens atribuídas
        const montagensSnapshot = await firebaseApp.db.collection('montagens')
            .where('motoristaId', '==', motoristaId)
            .where('status', 'in', ['pendente', 'andamento'])
            .get();
        
        if (!montagensSnapshot.empty) {
            showNotification('Este motorista tem montagens pendentes. Não pode ser excluído.', 'error');
            return;
        }
        
        // Marcar como inativo (ao invés de excluir)
        await firebaseApp.db.collection('motoristas').doc(motoristaId).update({
            ativo: false,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Registrar atividade
        await registrarAtividade('motorista', `Motorista ${motorista.nome} desativado`);
        
        showNotification('Motorista desativado com sucesso', 'success');
        
        // Atualizar lista
        await loadMotoristas();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Erro ao excluir motorista:', error);
        showNotification('Erro ao excluir motorista', 'error');
    }
}

// ============ RELATÓRIOS ============
async function generateReport() {
    const month = elements.filterMonth.value;
    const driverId = elements.filterDriver.value;
    
    if (!month) {
        showNotification('Selecione um mês', 'error');
        return;
    }
    
    try {
        showNotification('Gerando relatório...', 'info');
        
        // Buscar dados do mês selecionado
        const [year, monthNum] = month.split('-');
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);
        
        let query = firebaseApp.db.collection('montagens')
            .where('dataMontagem', '>=', startDate.toISOString().split('T')[0])
            .where('dataMontagem', '<=', endDate.toISOString().split('T')[0]);
        
        if (driverId) {
            query = query.where('motoristaId', '==', driverId);
        }
        
        const snapshot = await query.get();
        
        const montagensRelatorio = [];
        snapshot.forEach(doc => {
            montagensRelatorio.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Gerar estatísticas
        const stats = calcularEstatisticas(montagensRelatorio);
        
        // Atualizar gráfico
        atualizarGrafico(stats);
        
        showNotification('Relatório gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showNotification('Erro ao gerar relatório', 'error');
    }
}

function calcularEstatisticas(montagens) {
    const stats = {
        total: montagens.length,
        pendentes: montagens.filter(m => m.status === 'pendente').length,
        andamento: montagens.filter(m => m.status === 'andamento').length,
        concluidas: montagens.filter(m => m.status === 'concluida').length,
        tiposBase: {},
        motoristas: {}
    };
    
    // Contar por tipo de base
    montagens.forEach(m => {
        stats.tiposBase[m.tipoBase] = (stats.tiposBase[m.tipoBase] || 0) + 1;
    });
    
    // Contar por motorista
    montagens.forEach(m => {
        if (m.motoristaNome) {
            stats.motoristas[m.motoristaNome] = (stats.motoristas[m.motoristaNome] || 0) + 1;
        }
    });
    
    return stats;
}

function atualizarGrafico(stats) {
    const ctx = document.getElementById('montagensChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.montagensChart) {
        window.montagensChart.destroy();
    }
    
    window.montagensChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pendentes', 'Em Andamento', 'Concluídas'],
            datasets: [{
                data: [stats.pendentes, stats.andamento, stats.concluidas],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(0, 123, 255, 0.8)',
                    'rgba(40, 167, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 193, 7, 1)',
                    'rgba(0, 123, 255, 1)',
                    'rgba(40, 167, 69, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: `Distribuição das Montagens (Total: ${stats.total})`
                }
            }
        }
    });
}

// ============ FUNÇÕES AUXILIARES ============
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
}

async function registrarAtividade(tipo, descricao) {
    try {
        await firebaseApp.db.collection('atividades').add({
            tipo: tipo,
            descricao: descricao,
            usuario: currentUser.email,
            data: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Erro ao registrar atividade:', error);
    }
}

// ============ FUNÇÕES GLOBAIS PARA BOTÕES ============
window.viewMontagem = async function(id) {
    try {
        const doc = await firebaseApp.db.collection('montagens').doc(id).get();
        if (doc.exists) {
            const montagem = doc.data();
            alert(`Detalhes da Montagem:\n\n` +
                  `Cliente: ${montagem.clienteNome}\n` +
                  `Telefone: ${montagem.clienteTelefone}\n` +
                  `Endereço: ${montagem.clienteEndereco}, ${montagem.clienteCidade}\n` +
                  `Tipo de Base: ${montagem.tipoBase}\n` +
                  `Status: ${formatStatus(montagem.status)}\n` +
                  `Motorista: ${montagem.motoristaNome || 'Não atribuído'}\n` +
                  `Data: ${montagem.dataMontagem || 'Não definida'}`);
        }
    } catch (error) {
        console.error('Erro ao visualizar montagem:', error);
        showNotification('Erro ao visualizar montagem', 'error');
    }
};

window.editMontagem = function(id) {
    showNotification('Funcionalidade em desenvolvimento', 'info');
};

window.editMotorista = function(id) {
    openMotoristaModal(id);
};

window.deleteMotorista = function(id) {
    deleteMotorista(id);
};

// ============ INICIALIZAR ANIMAÇÕES CSS ============
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .btn-action {
        padding: 0.4rem 0.8rem;
        border: none;
        border-radius: 4px;
        font-size: 0.85rem;
        cursor: pointer;
        margin-right: 0.3rem;
        transition: all 0.3s;
    }
    
    .btn-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .btn-view {
        background: #17a2b8;
        color: white;
    }
    
    .btn-edit {
        background: #ffc107;
        color: #212529;
    }
    
    .btn-delete {
        background: #dc3545;
        color: white;
    }
    
    .loading-row {
        text-align: center;
        color: #6c757d;
    }
    
    .fa-spin {
        animation: fa-spin 2s infinite linear;
    }
    
    @keyframes fa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('✅ Sistema inicializado com sucesso!');