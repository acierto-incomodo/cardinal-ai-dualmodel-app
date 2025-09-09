const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog, screen, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let tray;
let settingsWindow;
let shortcutEnabled = false; // Estado inicial del atajo

// Función para configurar el menú
function configurarMenu() {
    const { app, BrowserWindow } = require("electron");

    const menuTemplate = [
        {
            label: "Inicio",
            click: () => {
                mainWindow.loadURL('https://cardinal-ai-h4rt.vercel.app');
            }
        },
        {
            label: "Páginas",
            submenu: [
                {
                    label: "Status",
                    click: () => {
                        mainWindow.loadURL('https://stats.uptimerobot.com/Kj5fTWCONH');
                    }
                },
                {
                    label: "Versión",
                    click: () => {
                        mainWindow.loadFile('src/version.html'); // Cargar versión.html al hacer clic en "Versión"
                    }
                },
                {
                    label: "StormGamesStudios",
                    click: () => {
                        mainWindow.loadURL('https://stormgamesstudios.vercel.app');
                    }
                }
            ]
        },
        {
            label: "Ayuda",
            submenu: [
                {
                    label: "Error de Actualización",
                    click: () => {
                        mainWindow.loadFile('src/error_actualizacion.html'); // Cargar página de error de actualización
                    }
                }
            ]
        },
        {
            label: "Extras",
            submenu: [
                {
                    label: "Mostrar Consola",
                    accelerator: "F12",
                    click: () => {
                        mainWindow.webContents.openDevTools(); // Abrir herramientas de desarrollo
                    }
                },
                {
                    label: "Recargar Página",
                    accelerator: "F5",
                    click: () => {
                        mainWindow.reload(); // Recargar la página
                    }
                },
                {
                    label: "Recargar (Forzoso)",
                    accelerator: "Ctrl+F5",
                    click: () => {
                        mainWindow.webContents.reloadIgnoringCache(); // Recargar sin caché
                    }
                },
                {
                    label: "Cerrar Aplicación",
                    accelerator: "Alt+F4",
                    click: () => {
                        app.quit(); // Cerrar la aplicación
                    }
                },
                {
                    label: "Reiniciar Aplicación",
                    click: () => {
                        app.relaunch(); // Reiniciar la aplicación
                        app.quit();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu); // Establecer el menú como el menú de la aplicación
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
            nodeIntegration: true,
            webSecurity: true, // Habilitar seguridad web
        },
    });

    // Configurar el menú
    configurarMenu();

    // Si la app se inició con --background, no mostrar la ventana
    if (!process.argv.includes('--background')) {
        mainWindow.maximize();
        mainWindow.show();
    }
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
            // { label: 'Buscar actualización', click: () => autoUpdater.checkForUpdatesAndNotify() },
            // { label: 'Ajustes', click: () => openSettingsWindow() },
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
            label: 'Otros',
            enabled: false // Solo texto, no clickeable
        },
        {
            label: "Reiniciar Aplicación",
            click: () => {
                app.relaunch(); // Reiniciar la aplicación
                app.quit();
            }
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
    tray.setToolTip('CardinalAI MultiModel App');
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

// ipcMain.on('buscar-actualizacion', () => {
//     autoUpdater.checkForUpdatesAndNotify();
// });

ipcMain.on('save-user-data', (event, userData) => {
  store.set('userData', userData);
  console.log('User data saved:', userData);
});

// IPC para guardar preferencias desde settings
ipcMain.on('set-preferences', (event, prefs) => {
    store.set('trayOption', prefs.trayOption);
    store.set('showMenuBar', prefs.menuBarOption);
    store.set('shortcutEnabled', prefs.shortcutEnabled);

    // Aplicar barra de menú
    if (mainWindow) {
        mainWindow.setAutoHideMenuBar(!prefs.menuBarOption);
        mainWindow.setMenuBarVisibility(prefs.menuBarOption);
    }

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
        menuBarOption: store.get('showMenuBar', false),
        shortcutEnabled: store.get('shortcutEnabled', false)
    };
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

// Manejar solicitud de versión
ipcMain.handle("get-app-version", () => {
    return app.getVersion();
});

// Función para verificar si la URL está accesible
function checkAndLoadURL(window, url, fallback) {
    http.get(url, (res) => {
        if (res.statusCode === 200) {
            window.loadURL(url); // Si la URL es accesible, cargarla
        } else {
            window.loadFile(fallback); // Si no, cargar la página 404.html
        }
    }).on('error', (err) => {
        window.loadFile(fallback); // Si ocurre un error, cargar 404.html
    });
}