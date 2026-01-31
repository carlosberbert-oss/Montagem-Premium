// js/login.js - LOGIN SIMPLIFICADO
console.log("🔐 Inicializando sistema de login...");

// Aguardar Firebase carregar
window.addEventListener('firebaseReady', function() {
    console.log("✅ Firebase pronto para login");
    setupLogin();
});

function setupLogin() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!loginForm) {
        console.error("❌ Formulário de login não encontrado");
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        console.log("🔐 Tentando login com:", email);
        
        try {
            // Mostrar loading
            showLoading("Fazendo login...");
            
            // Login com Firebase
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log("✅ Login bem-sucedido:", user.email);
            
            // Mostrar notificação
            showNotification("✅ Login realizado com sucesso!", "success");
            
            // Redirecionar após 1.5 segundos
            setTimeout(() => {
                console.log("🔄 Redirecionando para Dashboard...");
                window.location.href = "Dashboard.html";
            }, 1500);
            
        } catch (error) {
            console.error("❌ Erro no login:", error);
            
            let errorMessage = "Erro no login";
            
            // Traduzir erros do Firebase
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = "Usuário não encontrado";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Senha incorreta";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Email inválido";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Muitas tentativas. Tente mais tarde";
                    break;
                default:
                    errorMessage = error.message;
            }
            
            loginError.textContent = "Erro: " + errorMessage;
            loginError.style.display = 'block';
            
            showNotification("❌ " + errorMessage, "error");
        } finally {
            hideLoading();
        }
    });
}

// Funções auxiliares
function showLoading(message) {
    const statusText = document.getElementById('status-text');
    if (statusText) {
        statusText.textContent = message;
    }
}

function hideLoading() {
    // Implemente se necessário
}

function showNotification(message, type) {
    // Criar notificação simples
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        background: ${type === 'success' ? '#4cc9f0' : '#f94144'};
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}"></i>
        <span style="margin-left: 10px;">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Adicionar animação CSS
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
`;
document.head.appendChild(style);

console.log("✅ Sistema de login carregado!");