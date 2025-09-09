[Setup]
AppName=CardinalAI MultiModel APP Installer
AppVersion=1.2.5
DefaultDirName={userappdata}\StormGamesStudios\StormPack\CardinalAI MultiModel APP
DefaultGroupName=StormGamesStudios
OutputDir=C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\Build
OutputBaseFilename=CardinalAI_MultiModel_APP_Installer
Compression=lzma
SolidCompression=yes
AppCopyright=Copyright © 2025 StormGamesStudios. All rights reserved.
VersionInfoCompany=StormGamesStudios
AppPublisher=StormGamesStudios
SetupIconFile=icon.ico
VersionInfoVersion=1.2.0.0
DisableDirPage=yes
DisableProgramGroupPage=yes
LicenseFile=C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\LICENSE.txt

[Files]
; Archivos del lanzador
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\Publish\CardinalAI MultiModel APP Installer.deps.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\Publish\CardinalAI MultiModel APP Installer.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\Publish\CardinalAI MultiModel APP Installer.dll.config"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\Publish\CardinalAI MultiModel APP Installer.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\Publish\CardinalAI MultiModel APP Installer.pdb"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\Publish\CardinalAI MultiModel APP Installer.runtimeconfig.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\csharp-game-launcher-master\GameLauncher\images\icono.png"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\csharp-game-launcher-master\GameLauncher\images\icono.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\csharp-game-launcher-master\GameLauncher\images\fondo.png"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\csharp-game-launcher-master\GameLauncher\images\extra1.png"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\csharp-game-launcher-master\GameLauncher\images\extra1.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\csharp-game-launcher-master\GameLauncher\images\extra2.png"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\csharp-game-launcher-master\GameLauncher\images\file-icon.png"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\csharp-game-launcher-master\GameLauncher\images\file-icon.ico"; DestDir: "{app}"; Flags: ignoreversion

; Agregar el instalador de .NET Core 3.1.32
Source: "C:\Users\USER\Documents\GitHub\cardinal-ai-dualmodel-app\windowsdesktop-runtime-3.1.32-win-x64.exe"; DestDir: "{tmp}"; Flags: ignoreversion

[Icons]
; Acceso directo en el escritorio
Name: "{userdesktop}\CardinalAI MultiModel APP"; Filename: "{app}\CardinalAI MultiModel APP Installer.exe"; IconFilename: "{app}\icon.ico"

; Acceso directo en el menú de inicio dentro de la carpeta CardinalAI MultiModel APP_HMCL-Edition
Name: "{commonprograms}\StormGamesStudios\CardinalAI MultiModel APP"; Filename: "{app}\CardinalAI MultiModel APP Installer.exe"; IconFilename: "{app}\icon.ico"
Name: "{commonprograms}\StormGamesStudios\Desinstalar CardinalAI MultiModel APP"; Filename: "{uninstallexe}"; IconFilename: "{app}\icon.ico"

[Registry]
; Guardar ruta de instalación para poder desinstalar
Root: HKCU; Subkey: "Software\CardinalAI MultiModel APP Installer"; ValueType: string; ValueName: "Install_Dir"; ValueData: "{app}"
; Iniciar automáticamente con Windows
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "CardinalAI MultiModel APP"; ValueData: """{app}\CardinalAI MultiModel APP Installer.exe"""

[UninstallDelete]
; Eliminar carpeta del appdata y acceso directo
Type: filesandordirs; Name: "{app}"

[UninstallRun]
; Forzar cierre del juego si está abierto antes de desinstalar
Filename: "taskkill"; Parameters: "/IM CardinalAI MultiModel APP.exe /F"; Flags: runhidden

[Run]
; Ejecutar el lanzador después de la instalación
Filename: "{app}\CardinalAI MultiModel APP Installer.exe"; Description: "Ejecutar CardinalAI MultiModel APP Installer"; Flags: nowait postinstall skipifsilent

; Ejecutar el instalador de .NET Core 3.1.32
Filename: "{tmp}\windowsdesktop-runtime-3.1.32-win-x64.exe"; Parameters: "/quiet /norestart"; Flags: waituntilterminated skipifsilent
