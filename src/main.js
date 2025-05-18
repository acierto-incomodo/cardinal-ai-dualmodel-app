const { app, BrowserWindow, Menu, Tray, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;
let tray;
let settingsWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadURL('https://cardinal-ai-dualmodel.vercel.app');

    mainWindow.on('minimize', function (event) {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, '../build/icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Mostrar',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Buscar actualización',
            click: () => {
                autoUpdater.checkForUpdatesAndNotify();
            }
        },
        {
            label: 'Ajustes',
            click: () => {
                openSettingsWindow();
            }
        },
        {
            label: 'Cerrar app',
            click: () => {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('Cardinal AI DualModel App');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        mainWindow.show();
    });
}

function openSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }
    settingsWindow = new BrowserWindow({
        width: 400,
        height: 300,
        resizable: false,
        minimizable: false,
        maximizable: false,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        }
    });
    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
    // No cerrar la app si está en la bandeja
    if (process.platform !== 'darwin') {
        // app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});