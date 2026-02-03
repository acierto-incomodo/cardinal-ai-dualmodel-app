# Electron App

Este proyecto es una aplicación de escritorio construida con Electron que permite a los usuarios iniciar sesión y guardar sus credenciales de manera segura. La aplicación renderiza la página web de Cardinal AI y cuenta con un sistema de actualización automática.

## Estructura del Proyecto

- **src/main.js**: Punto de entrada de la aplicación. Configura la ventana principal y maneja la creación de la aplicación.
- **src/preload.js**: Establece un contexto seguro entre el proceso principal y el proceso de renderizado.
- **src/renderer.js**: Maneja la lógica del lado del cliente, incluyendo la renderización de la página web y la interacción con el usuario.
- **src/auth/sessionManager.js**: Clase que gestiona el almacenamiento de datos de inicio de sesión, incluyendo métodos para guardar y recuperar credenciales.
- **updater/updater.exe**: Ejecutable que se encarga de actualizar la aplicación, conectándose a GitHub para detectar nuevas versiones.
- **package.json**: Configuración para npm, incluyendo dependencias y scripts necesarios.
- **electron-builder.json**: Configuración para el empaquetado de la aplicación con Electron Builder.

## Instalación

1. Clona el repositorio:
   ```
   git clone <URL del repositorio>
   ```
2. Navega al directorio del proyecto:
   ```
   cd electron-app
   ```
3. Instala las dependencias:
   ```
   npm install
   ```

## Ejecución

Para iniciar la aplicación, ejecuta el siguiente comando:
```
npm start
```

## Actualizaciones

La aplicación incluye un sistema de actualización automática que verifica nuevas versiones en GitHub. Asegúrate de tener el archivo `updater.exe` en la carpeta `updater` para que las actualizaciones funcionen correctamente.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o un pull request en el repositorio.