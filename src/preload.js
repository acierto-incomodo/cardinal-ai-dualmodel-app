const { contextBridge } = require('electron');
const Store = require('electron-store');
const store = new Store();

contextBridge.exposeInMainWorld('sessionAPI', {
  guardarSesion: (token) => store.set('token', token),
  obtenerSesion: () => store.get('token')
});