const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog, screen, globalShortcut, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let tray;
let settingsWindow;
let shortcutEnabled = false; // Estado inicial del atajo
let updateWindow = null;

// Crear ventana de progreso de actualización
function showUpdateProgressWindow() {
    if (updateWindow) {
        updateWindow.focus();
        return;
    }
    updateWindow = new BrowserWindow({
        width: 400,
        height: 180,
        resizable: false,
        minimizable: false,
        maximizable: false,
        parent: mainWindow,
        modal: true,
        title: "Descargando actualización...",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    updateWindow.removeMenu();
    updateWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <html>
        <head>
            <title>Actualización</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                #progressBar { width: 100%; height: 24px; background: #eee; border-radius: 8px; overflow: hidden; }
                #progress { height: 100%; background: #4caf50; width: 0%; transition: width 0.2s; }
                #info { margin-top: 10px; }
            </style>
        </head>
        <body>
            <h3>Descargando actualización...</h3>
            <div id="progressBar"><div id="progress"></div></div>
            <div id="info">Preparando descarga...</div>
            <script>
                const { ipcRenderer } = require('electron');
                ipcRenderer.on('download-progress', (event, progressObj) => {
                    document.getElementById('progress').style.width = progressObj.percent + '%';
                    document.getElementById('info').innerText = 
                        'Descargado: ' + Math.round(progressObj.transferred / 1024 / 1024) + ' MB de ' +
                        Math.round(progressObj.total / 1024 / 1024) + ' MB (' +
                        Math.round(progressObj.percent) + '%) - Velocidad: ' +
                        Math.round(progressObj.bytesPerSecond / 1024) + ' KB/s';
                });
                ipcRenderer.on('download-complete', () => {
                    document.getElementById('info').innerText = '¡Descarga completa!';
                });
            </script>
        </body>
        </html>
    `));
    updateWindow.on('closed', () => {
        updateWindow = null;
    });
}

function createWindow() {
    const showMenuBar = store.get('showMenuBar', false);
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'icon.ico')
        : path.join(__dirname, '../build/icon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    const smallIcon = icon.isEmpty() ? undefined : icon.resize({ width: 16, height: 16 });

    mainWindow = new BrowserWindow({
        width: Math.floor(width * 0.6),
        height: Math.floor(height * 0.8),
        autoHideMenuBar: !showMenuBar,
        icon: icon,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.maximize();
    mainWindow.loadURL('https://cardinal-ai-h4rt.vercel.app');

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.insertCSS(`
            ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
                background: transparent;
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(120, 120, 120, 0.25);
                border-radius: 8px;
                border: 2px solid transparent;
                background-clip: padding-box;
                transition: background 0.2s;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: rgba(120, 120, 120, 0.45);
            }
            ::-webkit-scrollbar-corner {
                background: transparent;
            }
            ::-webkit-scrollbar-button:single-button:vertical:decrement {
                background: url('data:image/svg+xml;utf8,<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><polygon points="5,2 2,7 8,7" fill="gray"/></svg>') no-repeat center;
                background-size: 8px 8px;
            }
            ::-webkit-scrollbar-button:single-button:vertical:increment {
                background: url('data:image/svg+xml;utf8,<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><polygon points="2,3 8,3 5,8" fill="gray"/></svg>') no-repeat center;
                background-size: 8px 8px;
            }
            ::-webkit-scrollbar-button:single-button:vertical:decrement:inactive,
            ::-webkit-scrollbar-button:single-button:vertical:increment:inactive {
                display: none;
            }
        `);
    });

    mainWindow.webContents.on('context-menu', () => {
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Buscar actualización', click: () => autoUpdater.checkForUpdatesAndNotify() },
            { label: 'Ajustes', click: () => openSettingsWindow() },
            { type: 'separator' },
            { label: 'Recargar página', click: () => mainWindow.reload() },
            { label: 'Forzar recarga', click: () => mainWindow.webContents.reloadIgnoringCache() },
            { type: 'separator' },
            { role: 'cut', label: 'Cortar' },
            { role: 'copy', label: 'Copiar' },
            { role: 'paste', label: 'Pegar' },
        ]);
        contextMenu.popup(mainWindow);
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && !input.shift && !input.alt && !input.meta && input.key.toLowerCase() === 'p') {
            openSettingsWindow();
            event.preventDefault();
        }
    });

    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.on('close', (event) => {
        // Usar la preferencia 'trayOption'
        const trayOption = store.get('trayOption', true); // Por defecto, mantener en bandeja
        if (!app.isQuiting && trayOption) {
            event.preventDefault();
            mainWindow.hide();
        } else if (!app.isQuiting && !trayOption) {
            // Si trayOption es false, permitir que la aplicación se cierre normalmente
            app.quit();
        }
    });
}

function createTray() {
    const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'icon.ico')
        : path.join(__dirname, '../build/icon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    const smallIcon = icon.isEmpty() ? undefined : icon.resize({ width: 16, height: 16 });

    // Leer el estado guardado de las preferencias
    const trayOption = store.get('trayOption', true);
    const startupOption = store.get('startupOption', false);
    const menuBarOption = store.get('showMenuBar', false);
    shortcutEnabled = store.get('shortcutEnabled', false);

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'CardinalAI',
            icon: smallIcon,
            enabled: false // Solo texto, no clickeable
        },
        { type: 'separator' },
        {
            label: 'Ajustes',
            enabled: false // Solo texto, no clickeable
        },
        {
            label: 'Mostrar/Ocultar',
            click: () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                }
            }
        },
        {
            label: 'Mantener en la bandeja al cerrar',
            type: 'checkbox',
            checked: trayOption,
            click: (menuItem) => {
                store.set('trayOption', menuItem.checked);
            }
        },
        {
            label: 'Iniciar con Windows',
            type: 'checkbox',
            checked: startupOption,
            click: (menuItem) => {
                store.set('startupOption', menuItem.checked);
                app.setLoginItemSettings({
                    openAtLogin: !!menuItem.checked
                });
            }
        },
        {
            label: 'Mostrar barra de menú',
            type: 'checkbox',
            checked: menuBarOption,
            click: (menuItem) => {
                store.set('showMenuBar', menuItem.checked);
                if (mainWindow) {
                    mainWindow.setAutoHideMenuBar(!menuItem.checked);
                    mainWindow.setMenuBarVisibility(menuItem.checked);
                }
            }
        },
        {
            label: 'Activar atajo de teclado (Alt+Space)',
            type: 'checkbox',
            checked: shortcutEnabled,
            click: (menuItem) => {
                shortcutEnabled = menuItem.checked;
                store.set('shortcutEnabled', shortcutEnabled);
                if (shortcutEnabled) {
                    globalShortcut.register('Alt+Space', () => {
                        if (mainWindow.isVisible()) {
                            mainWindow.hide();
                        } else {
                            mainWindow.show();
                        }
                    });
                } else {
                    globalShortcut.unregister('Alt+Space');
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Actualizaciones',
            enabled: false // Solo texto, no clickeable
        },
        {
            label: 'Buscar actualización',
            click: () => autoUpdater.checkForUpdatesAndNotify()
        },
        { type: 'separator' },
        {
            label: 'Cerrar app',
            click: () => {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('Cardinal AI MultiModel App');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });

    tray.on('double-click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });

    // Registrar el acceso directo si estaba activado al inicio
    if (shortcutEnabled) {
        globalShortcut.register('Alt+Space', () => {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
            }
        });
    }
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

ipcMain.on('buscar-actualizacion', () => {
    autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('save-user-data', (event, userData) => {
  store.set('userData', userData);
  console.log('User data saved:', userData);
});

// IPC para guardar preferencias desde settings
ipcMain.on('set-preferences', (event, prefs) => {
    store.set('trayOption', prefs.trayOption);
    store.set('startupOption', prefs.startupOption);
    store.set('showMenuBar', prefs.menuBarOption);
    store.set('shortcutEnabled', prefs.shortcutEnabled);

    // Aplicar barra de menú
    if (mainWindow) {
        mainWindow.setAutoHideMenuBar(!prefs.menuBarOption);
        mainWindow.setMenuBarVisibility(prefs.menuBarOption);
    }

    // Aplicar inicio con Windows
    app.setLoginItemSettings({
        openAtLogin: !!prefs.startupOption
    });

    // Aplicar acceso directo Alt+Space
    if (prefs.shortcutEnabled) {
        if (!globalShortcut.isRegistered('Alt+Space')) {
            globalShortcut.register('Alt+Space', () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                }
            });
        }
    } else {
        globalShortcut.unregister('Alt+Space');
    }

    // Actualizar el estado del shortcutEnabled en el proceso principal
    shortcutEnabled = prefs.shortcutEnabled;
});

// IPC para obtener preferencias actuales
ipcMain.handle('get-preferences', () => {
    // Por defecto, 'trayOption' es true (mantener en bandeja)
    // 'shortcutEnabled' debe reflejar el estado actual del atajo
    return {
        trayOption: store.get('trayOption', true),
        startupOption: store.get('startupOption', false),
        menuBarOption: store.get('showMenuBar', false),
        shortcutEnabled: store.get('shortcutEnabled', false) // Este valor se actualiza en createTray y set-preferences
    };
});

autoUpdater.on("update-available", () => {
    showUpdateProgressWindow();
});

// Evento de progreso de descarga
autoUpdater.on('download-progress', (progressObj) => {
    if (updateWindow) {
        updateWindow.webContents.send('download-progress', progressObj);
    }
});

// Evento cuando la descarga termina
autoUpdater.on("update-downloaded", () => {
    if (updateWindow) {
        updateWindow.webContents.send('download-complete');
        setTimeout(() => {
            updateWindow.close();
            updateWindow = null;
        }, 1500);
    }
    dialog.showMessageBox({
        type: "info",
        title: "Actualización Lista",
        message: "La actualización se descargó. ¿Quieres reiniciar para aplicar la actualización?",
        buttons: ["Reiniciar"]
    }).then(result => {
        if (result.response === 0) autoUpdater.quitAndInstall();
    });
});

autoUpdater.on("error", (error) => {
    console.error("Error en la actualización:", error);

    // Mostrar ventana con enlace de descarga manual
    if (updateWindow) {
        updateWindow.close();
        updateWindow = null;
    }

    const manualUpdateWindow = new BrowserWindow({
        width: 420,
        height: 220,
        resizable: false,
        minimizable: false,
        maximizable: false,
        parent: mainWindow,
        modal: true,
        title: "Descarga manual de actualización",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    manualUpdateWindow.removeMenu();
    manualUpdateWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <html>
        <head>
            <title>Descarga manual</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                #enlace { margin-top: 20px; }
                a { color: #1976d2; font-size: 16px; word-break: break-all; }
                #msg { margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <h3>Descarga manual de actualización</h3>
            <div id="msg">No se pudo descargar la actualización automáticamente.<br>
            Puedes descargarla manualmente desde el siguiente enlace:</div>
            <div id="enlace">
                <a href="https://github.com/acierto-incomodo/cardinal-ai-dualmodel-app/releases/latest" id="downloadLink" target="_blank">
                    https://github.com/acierto-incomodo/cardinal-ai-dualmodel-app/releases/latest
                </a>
            </div>
            <script>
                // Abrir el enlace en el navegador externo
                const { shell } = require('electron');
                document.getElementById('downloadLink').onclick = (e) => {
                    e.preventDefault();
                    shell.openExternal(e.target.href);
                };
            </script>
        </body>
        </html>
    `));
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();
        createTray();
        autoUpdater.checkForUpdatesAndNotify();

        app.on('will-quit', () => {
            globalShortcut.unregisterAll();
        });
    });

    app.on('window-all-closed', () => {
        // La lógica para cerrar completamente o mantener en bandeja se maneja en mainWindow.on('close')
        if (process.platform !== 'darwin') {
             // Si trayOption es false, app.quit() ya se llama en mainWindow.on('close')
             // Si trayOption es true, la app no se cierra, solo se oculta
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}