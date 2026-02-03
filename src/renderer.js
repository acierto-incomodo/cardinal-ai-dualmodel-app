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

// Puedes llamar a esto desde DevTools para forzar la búsqueda de actualización:
window.electronAPI.buscarActualizacion();

function loadWebPage() {
    const webview = document.getElementById('webview');
    webview.src = 'https://cardinal-ai-dualmodel.vercel.app';
}

window.onload = loadWebPage;

// Mostrar la versión actual en la página de versión
window.electronAPI.getAppVersion = () => window.electronAPI.getAppVersionPromise?.() || ipcRenderer.invoke('get-app-version');

window.electronAPI.getAppVersion().then(version => {
    const versionSpanDos = document.getElementById('app-version-dos');
    const versionSpan = document.getElementById('app-version');
    if (versionSpanDos) versionSpanDos.textContent = version;
    if (versionSpan) versionSpan.textContent = version;
});