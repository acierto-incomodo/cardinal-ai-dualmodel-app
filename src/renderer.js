const { ipcRenderer } = require('electron');
const sessionManager = require('./auth/sessionManager');

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    sessionManager.saveCredentials(username, password);
    // Optionally, you can add logic to handle login here
});

// Guardar el token de sesión
window.sessionAPI.guardarSesion('mi_token_de_sesion');

// Obtener el token de sesión
const token = window.sessionAPI.obtenerSesion();
console.log(token);

function loadWebPage() {
    const webview = document.getElementById('webview');
    webview.src = 'https://cardinal-ai-dualmodel.vercel.app';
}

window.onload = loadWebPage;