const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog, screen, globalShortcut, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let tray;
let settingsWindow;
let shortcutEnabled = false;

function createWindow() {
    const showMenuBar = store.get('showMenuBar', false);
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Carga el icono y lo redimensiona para el tray
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

    // Abrir la ventana maximizada al iniciar
    mainWindow.maximize();

    mainWindow.loadURL('https://cardinal-ai-h4rt.vercel.app');

    // Inyectar CSS para scrollbars modernos estilo Windows 11/Edge
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
            /* Oculta los botones inactivos (cuando no hay más para desplazar) */
            ::-webkit-scrollbar-button:single-button:vertical:decrement:inactive,
            ::-webkit-scrollbar-button:single-button:vertical:increment:inactive {
                display: none;
            }
        `);
    });

    // Menú contextual (clic derecho)
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

    // Atajo de teclado CTRL+P para abrir ajustes
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
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'icon.ico')
        : path.join(__dirname, '../build/icon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    const smallIcon = icon.isEmpty() ? undefined : icon.resize({ width: 16, height: 16 });

    // Leer el estado guardado del acceso directo
    shortcutEnabled = store.get('shortcutEnabled', false);

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Mostrar/Ocultar',
            icon: smallIcon,
            click: () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                }
            }
        },
        {
            label: 'Activar acceso directo Alt+Space',
            type: 'checkbox',
            checked: shortcutEnabled,
            click: (menuItem) => {
                shortcutEnabled = menuItem.checked;
                store.set('shortcutEnabled', shortcutEnabled); // Guardar preferencia
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
            label: 'Ajustes',
            click: () => openSettingsWindow()
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
    tray.setToolTip('Cardinal AI DualModel App');
    tray.setContextMenu(contextMenu);

    // Mostrar/ocultar ventana con clic izquierdo en el tray
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

    // Registrar el acceso directo si estaba activado
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

// IPC para buscar actualizaciones
ipcMain.on('buscar-actualizacion', () => {
    autoUpdater.checkForUpdatesAndNotify();
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
});

// IPC para obtener preferencias actuales
ipcMain.handle('get-preferences', () => {
    return {
        trayOption: store.get('trayOption', false),
        startupOption: store.get('startupOption', false),
        menuBarOption: store.get('showMenuBar', false),
        shortcutEnabled: store.get('shortcutEnabled', false)
    };
});

// Mostrar alerta cuando haya una actualización disponible
autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
        type: "info",
        title: "Actualización Disponible",
        message: "Hay una nueva versión disponible. Se descargará en segundo plano. Si no se descarga automáticamente, puedes descargarla manualmente.",
        buttons: ["Descarga manual", "OK"],
        defaultId: 1,
        cancelId: 1
    }).then(result => {
        if (result.response === 0) {
            shell.openExternal("https://github.com/acierto-incomodo/cardinal-ai-dualmodel-app/releases/latest");
        }
    });
});

autoUpdater.on("update-downloaded", () => {
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
});

// Solo permitir una instancia de la app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Si el usuario intenta abrir otra instancia, mostrar la ventana principal
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
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}