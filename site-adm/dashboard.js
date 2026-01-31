// dashboard.js - Sistema Completo do Dashboard (ATUALIZADO)

console.log("📊 Dashboard carregando...");

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDYplVVXgYLrvItRoTgQv48Zg97bwmSAxg",
    authDomain: "montagem-colchao.firebaseapp.com",
    projectId: "montagem-colchao",
    storageBucket: "montagem-colchao.firebasestorage.app",
    messagingSenderId: "450039467894",
    appId: "1:450039467894:web:38108bed21137121d4b457"
};

// Inicializar Firebase se não estiver inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // Se já existe, use o existente
}

const auth = firebase.auth();
const db = firebase.firestore();

// Configuração
const CONFIG = {
    VERSION: '1.0.0',
    COLLECTIONS: {
        MONTAGENS: 'montagens',
        MOTORISTAS: 'motoristas',
        USERS: 'users'
    }
};

// Estado
let currentUser = null;
let montagens = [];
let motoristas = [];

// Elementos
const elements = {
    // Loading
    loading: document.getElementById('dashboard-loading'),
    app: document.getElementById('dashboard-app'),
    
    // Header
    userEmail: document.getElementById('user-email'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Menu
    menuItems: document.querySelectorAll('.sidebar-menu li'),
    pages: document.querySelectorAll('.page'),
    
    // Dashboard
    countPendentes: document.getElementById('count-pendentes'),
    countAndamento: document.getElementById('count-andamento'),
    countConcluidas: document.getElementById('count-concluidas'),
    countMotoristas: document.getElementById('count-motoristas'),
    refreshDashboard: document.getElementById('refresh-dashboard'),
    recentMontagens: document.getElementById('recent-montagens'),
    
    // Montagens
    searchMontagem: document.getElementById('search-montagem'),
    filterStatus: document.getElementById('filter-status'),
    refreshMontagens: document.getElementById('refresh-montagens'),
    allMontagens: document.getElementById('all-montagens'),
    
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
    motoristasList: document.getElementById('motoristas-list'),
    
    // Modal Motorista
    modalMotorista: document.getElementById('modal-motorista'),
    formMotorista: document.getElementById('form-motorista'),
    motoristaId: document.getElementById('motorista-id'),
    motoristaNome: document.getElementById('motorista-nome'),
    motoristaEmail: document.getElementById('motorista-email'),
    motoristaTelefone: document.getElementById('motorista-telefone'),
    motoristaSenha: document.getElementById('motorista-senha'),
    modalTitle: document.getElementById('modal-title'),
    closeModals: document.querySelectorAll('.close-modal')
};

// Inicialização
async function initDashboard() {
    console.log("🚀 Inicializando dashboard...");
    
    try {
        // Verificar autenticação
        await checkAuth();
        
        // Configurar data atual
        if (elements.dataMontagem) {
            elements.dataMontagem.valueAsDate = new Date();
        }
        
        // Configurar listeners
        setupEventListeners();
        
        // Carregar dados iniciais
        await loadInitialData();
        
        // Mostrar dashboard
        elements.loading.style.display = 'none';
        elements.app.style.display = 'block';
        
        showNotification('Dashboard carregado com sucesso!', 'success');
        
        console.log("✅ Dashboard inicializado!");
        
    } catch (error) {
        console.error("❌ Erro na inicialização:", error);
        showError("Erro ao carregar dashboard: " + error.message);
        
        // Se não estiver autenticado, redirecionar para login
        if (error.message.includes('autenticado')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }
}

// Verificar autenticação
async function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                window.currentUser = user; // Para verificação externa
                
                console.log("✅ Usuário autenticado:", user.email);
                
                // Atualizar email no header
                if (elements.userEmail) {
                    elements.userEmail.textContent = user.email;
                }
                
                resolve();
            } else {
                console.log("❌ Usuário não autenticado");
                reject(new Error('Usuário não autenticado'));
                
                // Redirecionar para login após 1 segundo
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    });
}

// Configurar eventos
function setupEventListeners() {
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navegação no menu
    elements.menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            switchPage(pageId);
        });
    });
    
    // Dashboard
    if (elements.refreshDashboard) {
        elements.refreshDashboard.addEventListener('click', loadDashboardData);
    }
    
    // Montagens
    if (elements.searchMontagem) {
        elements.searchMontagem.addEventListener('input', filterMontagens);
    }
    
    if (elements.filterStatus) {
        elements.filterStatus.addEventListener('change', filterMontagens);
    }
    
    if (elements.refreshMontagens) {
        elements.refreshMontagens.addEventListener('click', loadMontagens);
    }
    
    // Nova Montagem
    if (elements.formNovaMontagem) {
        elements.formNovaMontagem.addEventListener('submit', handleNovaMontagem);
    }
    
    // Motoristas
    if (elements.btnNovoMotorista) {
        elements.btnNovoMotorista.addEventListener('click', () => {
            openMotoristaModal();
        });
    }
    
    if (elements.formMotorista) {
        elements.formMotorista.addEventListener('submit', handleSalvarMotorista);
    }
    
    // Modais
    elements.closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.modalMotorista.style.display = 'none';
        });
    });
    
    // Fechar modal clicando fora
    window.addEventListener('click', (e) => {
        if (e.target === elements.modalMotorista) {
            elements.modalMotorista.style.display = 'none';
        }
    });
}

// Carregar dados iniciais
async function loadInitialData() {
    await Promise.all([
        loadDashboardData(),
        loadMotoristas(),
        loadMontagens()
    ]);
}

// Navegação entre páginas
function switchPage(pageId) {
    // Atualizar menu
    elements.menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });
    
    // Mostrar página correspondente
    elements.pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === `page-${pageId}`) {
            page.classList.add('active');
            
            // Carregar dados específicos da página
            if (pageId === 'nova-montagem') {
                loadMotoristasSelect();
            }
        }
    });
}

// DASHBOARD
async function loadDashboardData() {
    try {
        showNotification('Atualizando dashboard...', 'info');
        
        // Buscar contagem de montagens
        const snapshot = await db.collection(CONFIG.COLLECTIONS.MONTAGENS).get();
        
        let pendentes = 0, andamento = 0, concluidas = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'pendente') pendentes++;
            if (data.status === 'andamento') andamento++;
            if (data.status === 'concluida') concluidas++;
        });
        
        // Atualizar estatísticas
        if (elements.countPendentes) elements.countPendentes.textContent = pendentes;
        if (elements.countAndamento) elements.countAndamento.textContent = andamento;
        if (elements.countConcluidas) elements.countConcluidas.textContent = concluidas;
        
        // Contar motoristas ativos
        const motoristasSnapshot = await db.collection(CONFIG.COLLECTIONS.MOTORISTAS)
            .where('ativo', '==', true)
            .get();
        
        if (elements.countMotoristas) {
            elements.countMotoristas.textContent = motoristasSnapshot.size;
        }
        
        // Carregar montagens recentes
        await loadRecentMontagens();
        
        showNotification('Dashboard atualizado!', 'success');
        
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        showError("Erro ao carregar dados do dashboard");
    }
}

async function loadRecentMontagens() {
    try {
        const snapshot = await db.collection(CONFIG.COLLECTIONS.MONTAGENS)
            .orderBy('criadoEm', 'desc')
            .limit(5)
            .get();
        
        const tbody = elements.recentMontagens;
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        Nenhuma montagem encontrada
                    </td>
                </tr>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const row = document.createElement('tr');
            
            // Formatar data
            const dataFormatada = data.dataMontagem ? 
                new Date(data.dataMontagem).toLocaleDateString('pt-BR') : 
                'Não definida';
            
            row.innerHTML = `
                <td>${data.clienteNome || 'N/A'}</td>
                <td>${data.clienteEndereco || 'N/A'}</td>
                <td>${data.tipoBase || 'N/A'}</td>
                <td>${data.motoristaNome || 'Não atribuído'}</td>
                <td>
                    <span class="status-badge status-${data.status || 'pendente'}">
                        ${getStatusText(data.status)}
                    </span>
                </td>
                <td>${dataFormatada}</td>
            `;
            
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error("Erro ao carregar montagens recentes:", error);
    }
}

// MONTAGENS
async function loadMontagens() {
    try {
        showNotification('Carregando montagens...', 'info');
        
        const snapshot = await db.collection(CONFIG.COLLECTIONS.MONTAGENS)
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
        console.error("Erro ao carregar montagens:", error);
        showError("Erro ao carregar montagens");
    }
}

function updateMontagensTable(montagensList) {
    const tbody = elements.allMontagens;
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (montagensList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 2rem; color: #ccc;"></i>
                    <p style="margin-top: 1rem; color: #666;">Nenhuma montagem encontrada</p>
                </td>
            </tr>
        `;
        return;
    }
    
    montagensList.forEach(montagem => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <strong>${montagem.clienteNome}</strong>
                ${montagem.prioridade === 'alta' ? '<span class="badge-danger">ALTA</span>' : ''}
                ${montagem.prioridade === 'urgente' ? '<span class="badge-urgent">URGENTE</span>' : ''}
            </td>
            <td>${montagem.clienteTelefone}</td>
            <td>${montagem.clienteEndereco}<br><small>${montagem.clienteCidade}</small></td>
            <td>${montagem.tipoBase}</td>
            <td>${montagem.motoristaNome || 'Não atribuído'}</td>
            <td>
                <span class="status-badge status-${montagem.status || 'pendente'}">
                    ${getStatusText(montagem.status)}
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
        
        tbody.appendChild(row);
    });
}

function filterMontagens() {
    const searchTerm = elements.searchMontagem.value.toLowerCase();
    const statusFilter = elements.filterStatus.value;
    
    let filtered = montagens;
    
    if (searchTerm) {
        filtered = filtered.filter(m => 
            m.clienteNome?.toLowerCase().includes(searchTerm) ||
            m.clienteTelefone?.includes(searchTerm) ||
            m.clienteEndereco?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    updateMontagensTable(filtered);
}

// NOVA MONTAGEM
async function loadMotoristasSelect() {
    try {
        const snapshot = await db.collection(CONFIG.COLLECTIONS.MOTORISTAS)
            .where('ativo', '==', true)
            .get();
        
        const select = elements.motoristaSelect;
        if (!select) return;
        
        // Limpar opções exceto a primeira
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        if (snapshot.empty) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum motorista disponível';
            select.appendChild(option);
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${data.nome} (${data.telefone})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error("Erro ao carregar motoristas:", error);
    }
}

async function handleNovaMontagem(e) {
    e.preventDefault();
    
    const montagemData = {
        clienteNome: elements.clienteNome.value,
        clienteTelefone: elements.clienteTelefone.value,
        clienteEndereco: elements.clienteEndereco.value,
        clienteCidade: elements.clienteCidade.value,
        tipoBase: elements.tipoBase.value,
        prioridade: elements.prioridade.value,
        observacoes: elements.observacoes.value,
        motoristaId: elements.motoristaSelect.value,
        motoristaNome: elements.motoristaSelect.options[elements.motoristaSelect.selectedIndex]?.text,
        dataMontagem: elements.dataMontagem.value,
        status: 'pendente',
        criadoPor: currentUser.email,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Validação
    if (!montagemData.motoristaId) {
        showError('Selecione um motorista para a montagem');
        return;
    }
    
    try {
        showNotification('Salvando montagem...', 'info');
        
        await db.collection(CONFIG.COLLECTIONS.MONTAGENS).add(montagemData);
        
        // Limpar formulário
        e.target.reset();
        elements.dataMontagem.valueAsDate = new Date();
        
        showNotification('Montagem criada com sucesso!', 'success');
        
        // Recarregar dados
        await loadDashboardData();
        await loadMontagens();
        
        // Ir para lista de montagens
        switchPage('montagens');
        
    } catch (error) {
        console.error("Erro ao salvar montagem:", error);
        showError('Erro ao criar montagem: ' + error.message);
    }
}

// MOTORISTAS
async function loadMotoristas() {
    try {
        const snapshot = await db.collection(CONFIG.COLLECTIONS.MOTORISTAS).get();
        
        motoristas = [];
        snapshot.forEach(doc => {
            motoristas.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        updateMotoristasTable(motoristas);
        
    } catch (error) {
        console.error("Erro ao carregar motoristas:", error);
        showError('Erro ao carregar motoristas');
    }
}

function updateMotoristasTable(motoristasList) {
    const tbody = elements.motoristasList;
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (motoristasList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-user-friends" style="font-size: 2rem; color: #ccc;"></i>
                    <p style="margin-top: 1rem; color: #666;">Nenhum motorista cadastrado</p>
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
                <span class="status-badge ${motorista.ativo !== false ? 'status-concluida' : 'status-pendente'}">
                    ${motorista.ativo !== false ? 'Ativo' : 'Inativo'}
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
        
        tbody.appendChild(row);
    });
}

function openMotoristaModal(motoristaId = null) {
    // Resetar formulário
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
            elements.motoristaSenha.placeholder = 'Deixe em branco para manter senha atual';
        }
    } else {
        // Novo motorista
        elements.modalTitle.textContent = 'Novo Motorista';
        elements.motoristaId.value = '';
        elements.motoristaSenha.required = true;
        elements.motoristaSenha.placeholder = '';
    }
    
    elements.modalMotorista.style.display = 'block';
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
            await db.collection(CONFIG.COLLECTIONS.MOTORISTAS)
                .doc(motoristaId)
                .update(motoristaData);
            
            showNotification('Motorista atualizado com sucesso!', 'success');
        } else {
            // Criar novo motorista
            // 1. Criar usuário no Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(
                motoristaData.email,
                senha
            );
            
            // 2. Salvar no Firestore
            await db.collection(CONFIG.COLLECTIONS.MOTORISTAS)
                .doc(userCredential.user.uid)
                .set(motoristaData);
            
            // 3. Criar também na coleção users
            await db.collection(CONFIG.COLLECTIONS.USERS)
                .doc(userCredential.user.uid)
                .set({
                    ...motoristaData,
                    tipo: 'motorista'
                });
            
            showNotification('Motorista criado com sucesso!', 'success');
        }
        
        // Fechar modal
        elements.modalMotorista.style.display = 'none';
        
        // Atualizar dados
        await loadMotoristas();
        await loadMotoristasSelect();
        await loadDashboardData();
        
    } catch (error) {
        console.error("Erro ao salvar motorista:", error);
        showError('Erro ao salvar motorista: ' + error.message);
    }
}

async function deleteMotorista(motoristaId) {
    if (!confirm('Tem certeza que deseja desativar este motorista?')) {
        return;
    }
    
    try {
        // Verificar se o motorista tem montagens pendentes
        const montagensSnapshot = await db.collection(CONFIG.COLLECTIONS.MONTAGENS)
            .where('motoristaId', '==', motoristaId)
            .where('status', 'in', ['pendente', 'andamento'])
            .get();
        
        if (!montagensSnapshot.empty) {
            showError('Este motorista tem montagens pendentes. Não pode ser desativado.');
            return;
        }
        
        // Marcar como inativo
        await db.collection(CONFIG.COLLECTIONS.MOTORISTAS)
            .doc(motoristaId)
            .update({
                ativo: false,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        showNotification('Motorista desativado com sucesso!', 'success');
        
        // Atualizar lista
        await loadMotoristas();
        await loadMotoristasSelect();
        await loadDashboardData();
        
    } catch (error) {
        console.error("Erro ao desativar motorista:", error);
        showError('Erro ao desativar motorista');
    }
}

// FUNÇÕES AUXILIARES
function getStatusText(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'andamento': 'Em Andamento',
        'concluida': 'Concluída'
    };
    return statusMap[status] || 'Pendente';
}

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Estilos
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
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function showError(message) {
    showNotification(message, 'error');
}

async function handleLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        try {
            showNotification('Saindo do sistema...', 'info');
            await auth.signOut();
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            console.error("Erro no logout:", error);
            showError('Erro ao fazer logout');
        }
    }
}

// FUNÇÕES GLOBAIS PARA OS BOTÕES
window.viewMontagem = async function(montagemId) {
    try {
        const doc = await db.collection(CONFIG.COLLECTIONS.MONTAGENS).doc(montagemId).get();
        if (doc.exists) {
            const montagem = doc.data();
            
            // Formatar data
            const dataFormatada = montagem.dataMontagem ? 
                new Date(montagem.dataMontagem).toLocaleDateString('pt-BR') : 
                'Não definida';
            
            alert(`📋 Detalhes da Montagem\n\n` +
                  `Cliente: ${montagem.clienteNome}\n` +
                  `Telefone: ${montagem.clienteTelefone}\n` +
                  `Endereço: ${montagem.clienteEndereco}, ${montagem.clienteCidade}\n` +
                  `Tipo de Base: ${montagem.tipoBase}\n` +
                  `Status: ${getStatusText(montagem.status)}\n` +
                  `Motorista: ${montagem.motoristaNome || 'Não atribuído'}\n` +
                  `Data: ${dataFormatada}\n` +
                  `Prioridade: ${montagem.prioridade || 'Normal'}\n` +
                  `${montagem.observacoes ? `Observações: ${montagem.observacoes}` : ''}`);
        }
    } catch (error) {
        console.error("Erro ao visualizar montagem:", error);
        showError('Erro ao visualizar montagem');
    }
};

window.editMontagem = function(montagemId) {
    showNotification('Funcionalidade de edição em desenvolvimento', 'info');
};

window.editMotorista = function(motoristaId) {
    openMotoristaModal(motoristaId);
};

window.deleteMotorista = function(motoristaId) {
    deleteMotorista(motoristaId);
};

// Adicionar animações CSS
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
    
    .status-badge {
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
    }
    
    .status-pendente {
        background: #fff3cd;
        color: #856404;
    }
    
    .status-andamento {
        background: #cce5ff;
        color: #004085;
    }
    
    .status-concluida {
        background: #d4edda;
        color: #155724;
    }
    
    .badge-danger {
        background: #f8d7da;
        color: #721c24;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-size: 0.7rem;
        margin-left: 0.5rem;
    }
    
    .badge-urgent {
        background: #f5c6cb;
        color: #721c24;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-size: 0.7rem;
        margin-left: 0.5rem;
        font-weight: bold;
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
`;
document.head.appendChild(style);

// Iniciar quando página carregar
document.addEventListener('DOMContentLoaded', initDashboard);

console.log("✅ Dashboard script carregado!");