const { app, BrowserWindow, Menu, shell, ipcMain, dialog, screen, globalShortcut, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const http = require('http');
const packageJson = require('../package.json');

// Detectar si estamos en Snap
const isSnap = !!process.env.SNAP;

// ⚠️ IMPORTANTE:
// - NO usar autoUpdater en Snap
// - SÍ usarlo en Windows / deb / AppImage
if (!isSnap) {
  ({ autoUpdater } = require("electron-updater"));
}

// ─────────────────────────────────────
// CONFIGURACIÓN ESPECIAL PARA SNAP
// ─────────────────────────────────────
if (isSnap) {
  app.commandLine.appendSwitch("no-sandbox");
}

let mainWindow;
let settingsWindow;
let shortcutEnabled = false;

// ---------------- MENU ----------------
function configurarMenu() {
  const menuTemplate = [
    {
      label: 'Inicio',
      click: () => mainWindow.loadURL('https://cardinal-ai-web.vercel.app')
    },
    {
      label: 'Páginas',
      submenu: [
        {
          label: 'Status',
          click: () => mainWindow.loadURL('https://stats.uptimerobot.com/Kj5fTWCONH')
        },
        {
          label: 'Acerca de CardinalAI',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 400,
              height: 505,
              resizable: false,
              title: 'Acerca de CardinalAI',
              icon: path.join(__dirname, '../icons/icon.png'),
              webPreferences: {
                contextIsolation: true,
                nodeIntegration: false
              }
            });

            aboutWindow.setMenu(null);
            aboutWindow.loadURL(
              'data:text/html;charset=utf-8,' +
              encodeURIComponent(`
                <h1>CardinalAI</h1>
                <p>Versión: ${packageJson.version}</p>
                <h3>Desarrollado por StormGamesStudios</h3>
              `)
            );
          }
        }
      ]
    },
    {
      label: 'Extras',
      submenu: [
        { label: 'Recargar', accelerator: 'F5', click: () => mainWindow.reload() },
        { label: 'Forzar recarga', accelerator: 'Ctrl+F5', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Cerrar', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

// ---------------- VENTANA PRINCIPAL ----------------
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icons', 'icon.png')
    : path.join(__dirname, '../icons/icon.png');

  const icon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.6),
    height: Math.floor(height * 0.8),
    icon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  configurarMenu();
  mainWindow.loadURL('https://cardinal-ai-web.vercel.app');
  mainWindow.maximize();

  mainWindow.on('close', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('context-menu', () => {
    Menu.buildFromTemplate([
      { label: 'Recargar', click: () => mainWindow.reload() },
      { label: 'Forzar recarga', click: () => mainWindow.webContents.reloadIgnoringCache() },
      { type: 'separator' },
      { role: 'copy' },
      { role: 'paste' }
    ]).popup();
  });
}

// ---------------- SETTINGS ----------------
function openSettingsWindow() {
  if (settingsWindow) return settingsWindow.focus();

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    modal: true,
    parent: mainWindow,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  settingsWindow.on('closed', () => (settingsWindow = null));
}

// ---------------- IPC ----------------
ipcMain.on('set-preferences', (event, prefs) => {
  if (!isSnap) {
    if (prefs.shortcutEnabled && !globalShortcut.isRegistered('Alt+Space')) {
      globalShortcut.register('Alt+Space', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
      });
    } else {
      globalShortcut.unregister('Alt+Space');
    }
  }
});

// ---------------- SINGLE INSTANCE ----------------
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(createWindow);

  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}

// ---------------- AUTO UPDATER ----------------
if (!isSnap) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
}
