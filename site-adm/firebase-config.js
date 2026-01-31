// firebase-config.js - VERSÃO TESTADA E FUNCIONAL

console.log("🚀 Iniciando configuração do Firebase...");

// SUAS CREDENCIAIS (já estão corretas)
const firebaseConfig = {
    apiKey: "AIzaSyDYplVVXgYLrvItRoTgQv48Zg97bwmSAxg",
    authDomain: "montagem-colchao.firebaseapp.com",
    projectId: "montagem-colchao",
    storageBucket: "montagem-colchao.firebasestorage.app",
    messagingSenderId: "450039467894",
    appId: "1:450039467894:web:38108bed21137121d4b457"
};

// Função para inicializar
function initializeFirebase() {
    console.log("1. Verificando Firebase...");
    
    // Verificar se Firebase está carregado
    if (typeof firebase === 'undefined') {
        console.warn("⚠️ Firebase ainda não carregou, tentando novamente...");
        setTimeout(initializeFirebase, 500);
        return;
    }
    
    console.log("2. Firebase detectado:", typeof firebase);
    
    try {
        // Verificar se já foi inicializado
        if (firebase.apps.length === 0) {
            console.log("3. Inicializando Firebase App...");
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase App inicializado!");
        } else {
            console.log("3. Firebase já estava inicializado");
        }
        
        // Verificar serviços
        console.log("4. Verificando serviços...");
        
        if (typeof firebase.auth === 'function') {
            window.firebaseAuth = firebase.auth();
            console.log("✅ Auth service OK");
        }
        
        if (typeof firebase.firestore === 'function') {
            window.firebaseDb = firebase.firestore();
            console.log("✅ Firestore service OK");
        }
        
        // Marcar como pronto
        window.firebaseReady = true;
        console.log("🎉 TUDO PRONTO! Firebase configurado com sucesso!");
        
        // Disparar evento para o sistema principal
        const event = new Event('firebaseReady');
        window.dispatchEvent(event);
        
        // Atualizar interface
        updateLoadingUI("success", "Firebase configurado!");
        
    } catch (error) {
        console.error("❌ ERRO no Firebase:", error);
        updateLoadingUI("error", error.message);
    }
}

// Atualizar interface do loading
function updateLoadingUI(type, message) {
    const statusEl = document.getElementById('status-text');
    const firebaseStatusEl = document.getElementById('firebase-status');
    
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = type === 'success' ? '#4cc9f0' : '#f94144';
    }
    
    if (firebaseStatusEl) {
        if (type === 'success') {
            firebaseStatusEl.innerHTML = `
                <i class="fas fa-check-circle" style="color: #4cc9f0;"></i>
                <span>Conectado ao Firebase</span>
                <div style="margin-top: 10px; font-size: 0.8rem; background: rgba(76, 201, 240, 0.1); padding: 5px; border-radius: 5px;">
                    Projeto: ${firebaseConfig.projectId}
                </div>
            `;
        } else {
            firebaseStatusEl.innerHTML = `
                <i class="fas fa-exclamation-circle" style="color: #f94144;"></i>
                <span>Erro: ${message}</span>
            `;
        }
    }
}

// Iniciar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}

// Timeout de segurança
setTimeout(() => {
    if (!window.firebaseReady) {
        console.warn("⚠️ Timeout - Firebase não inicializou em 10 segundos");
        updateLoadingUI("warning", "Carregamento demorado... Continuando em modo offline");
        
        // Forçar modo offline após 3 segundos
        setTimeout(() => {
            window.firebaseReady = true;
            const event = new Event('firebaseReady');
            window.dispatchEvent(event);
        }, 3000);
    }
}, 10000);

console.log("📄 Configuração Firebase carregada!");