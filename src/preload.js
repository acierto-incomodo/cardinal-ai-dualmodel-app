const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sessionAPI', {
  guardarSesion: (token) => {},
  obtenerSesion: () => null
});

contextBridge.exposeInMainWorld('electronAPI', {
  buscarActualizacion: () => ipcRenderer.send('buscar-actualizacion'),
  setPreferences: (preferences) => ipcRenderer.send('set-preferences', preferences),
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  saveUserData: (userData) => ipcRenderer.send('save-user-data', userData),
  onUpdateSettingsCheckbox: (callback) => ipcRenderer.on('update-settings-checkbox', (_event, key, value) => callback(key, value)),
  getAppVersionPromise: () => ipcRenderer.invoke('get-app-version')
});

window.addEventListener('DOMContentLoaded', async () => {
  // Obtener la versión de la aplicación desde el proceso principal
  const appVersion = await ipcRenderer.invoke('get-app-version');

  const footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML = `© 2025 StormSearch - By StormGamesStudios | Versión: ${appVersion}`;
  }
});