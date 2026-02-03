const { app, BrowserWindow, Menu, shell, ipcMain, dialog, screen, globalShortcut, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const packageJson = require('../package.json');

let mainWindow;
let settingsWindow;
let shortcutEnabled = false; // Estado inicial del atajo

// Función para configurar el menú
function configurarMenu() {
    const { app, BrowserWindow } = require("electron");

    const menuTemplate = [
        {
            label: "Inicio",
            click: () => {
                mainWindow.loadURL('https://cardinal-ai-web.vercel.app');
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
                    label: "Acerca de CardinalAI",
                    click: () => {
                        const aboutWindow = new BrowserWindow({
                            width: 400,
                            height: 505,
                            resizable: false,
                            title: 'Acerca de CardinalAI',
                            icon: path.join(__dirname, '../icons/icon.ico'),
                            webPreferences: {
                                nodeIntegration: true
                            }
                        });
                        aboutWindow.setMenu(null); // Deshabilita el menú en la ventana "Acerca de CardinalAI"
                        aboutWindow.loadURL('data:text/html;charset=utf-8,' +
                            encodeURIComponent(`
                                <h1>CardinalAI</h1>
                                <p>CardinalCORE: v1.0.1</p>
                                <p>Cardinal System: v2.0.3</p>
                                <p>Cardinal SubSystem: v1.3.5</p>
                                <p>CardinalAI: v2.5.0</p>
                                <br>
                                <h3>CardinalAI Models:</h3>
                                <ul>
                                    <li>Cardinal System AI v1.0</li>
                                    <li>Cardinal System AI v1.5</li>
                                    <li>CardinalAI v1.5 Flash</li>
                                    <li>CardinalAI v2.0 Flash</li>
                                    <li>CardinalAI v2.5 Flash Beta</li>
                                </ul>
                                <br>
                                <h3>Desarrollado por StormGamesStudios</h3>
                            `));
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
                // {
                //     label: "Desactivar o activar inicio automatico con Windows",
                //     click: () => {
                //         // Abre la configuración de aplicaciones de inicio de Windows 10/11
                //         shell.openExternal('ms-settings:startupapps');
                //     }
                // },
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
    const showMenuBar = false;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'icon.ico')
        : path.join(__dirname, '../icons/icon.ico');
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
    mainWindow.loadURL('https://cardinal-ai-web.vercel.app');

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
            // { type: 'separator' },
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
        // Cierre normal de la aplicación
        app.quit();
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
    if (mainWindow) {
        mainWindow.setAutoHideMenuBar(!showMenuBar);
        mainWindow.setMenuBarVisibility(showMenuBar);
    }
});

ipcMain.on('buscar-actualizacion', () => {
    autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('save-user-data', (event, userData) => {
  console.log('User data saved:', userData);
});

// IPC para guardar preferencias desde settings
ipcMain.on('set-preferences', (event, prefs) => {

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
        menuBarOption: false,
        shortcutEnabled: false
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

// Enviar la versión de la aplicación al proceso de renderizado
ipcMain.handle('get-app-version', () => {
    return packageJson.version;
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

// --- Configuración de AutoUpdater ---
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualización disponible',
        message: 'Hay una nueva versión disponible. ¿Quieres descargarla ahora?',
        buttons: ['Sí', 'No']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualización lista',
        message: 'La actualización se ha descargado. Se instalará automáticamente al cerrar la aplicación.',
        buttons: ['Entendido']
    });
});