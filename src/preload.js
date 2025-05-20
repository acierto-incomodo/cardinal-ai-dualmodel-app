const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

contextBridge.exposeInMainWorld('sessionAPI', {
  guardarSesion: (token) => store.set('token', token),
  obtenerSesion: () => store.get('token')
});

contextBridge.exposeInMainWorld('electronAPI', {
  buscarActualizacion: () => ipcRenderer.send('buscar-actualizacion'),
  setPreferences: (preferences) => ipcRenderer.send('set-preferences', preferences),
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  saveUserData: (userData) => ipcRenderer.send('save-user-data', userData),
  // Añadir un listener para actualizar el checkbox del atajo en settings.html desde main.js
  onUpdateSettingsCheckbox: (callback) => ipcRenderer.on('update-settings-checkbox', (_event, key, value) => callback(key, value))
});