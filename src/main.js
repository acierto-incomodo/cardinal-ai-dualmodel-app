const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let tray;
let settingsWindow;

function createWindow() {
    // Leer preferencia de mostrar menú
    const showMenuBar = store.get('showMenuBar', false);

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: !showMenuBar,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadURL('https://cardinal-ai-dualmodel.vercel.app');

    // Menú contextual (clic derecho) con copiar, pegar y cortar
    mainWindow.webContents.on('context-menu', (event, params) => {
        const contextMenu = Menu.buildFromTemplate([
            { role: 'cut', label: 'Cortar' },
            { role: 'copy', label: 'Copiar' },
            { role: 'paste', label: 'Pegar' },
        ]);
        contextMenu.popup(mainWindow);
    });

    // Atajo de teclado CTRL+P para abrir ajustes
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && !input.shift && !input.alt && !input.meta && input.key.toLowerCase() === 'p') {
            openSettingsWindow();
            event.preventDefault();
        }
    });

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
    let iconPath;
    if (app.isPackaged) {
        // En producción, el icono se copia a process.resourcesPath
        iconPath = path.join(process.resourcesPath, 'icon.ico');
    } else {
        // En desarrollo
        iconPath = path.join(__dirname, '../build/icon.ico');
    }

    tray = new Tray(iconPath);
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

// IPC para cambiar la visibilidad de la barra de menú
ipcMain.on('set-menu-bar', (event, showMenuBar) => {
    store.set('showMenuBar', showMenuBar);
    if (mainWindow) {
        mainWindow.setAutoHideMenuBar(!showMenuBar);
        mainWindow.setMenuBarVisibility(showMenuBar);
    }
});

// IPC para buscar actualizaciones
ipcMain.on('buscar-actualizacion', () => {
    autoUpdater.checkForUpdatesAndNotify();
});

// Mostrar alerta cuando haya una actualización disponible
autoUpdater.on('update-available', () => {
    if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Actualización disponible',
            message: '¡Hay una nueva actualización disponible! Se descargará en segundo plano y se instalará al reiniciar la aplicación.',
            buttons: ['OK']
        });
    }
});

autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Actualización lista',
            message: 'La actualización se ha descargado. Se instalará cuando cierres la aplicación.',
            buttons: ['OK']
        });
    }
});

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