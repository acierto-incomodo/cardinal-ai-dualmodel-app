const guardarBtn = document.getElementById('guardarBtn');
const trayOptionCheckbox = document.getElementById('trayOption');
const startupOptionCheckbox = document.getElementById('startupOption');
const menuBarOptionCheckbox = document.getElementById('menuBarOption');
const shortcutEnabledCheckbox = document.getElementById('shortcutEnabled'); // Asegúrate de que este ID exista en settings.html

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar las preferencias actuales al cargar la página de ajustes
    const preferences = await window.electronAPI.getPreferences();

    trayOptionCheckbox.checked = preferences.trayOption;
    startupOptionCheckbox.checked = preferences.startupOption;
    menuBarOptionCheckbox.checked = preferences.menuBarOption;
    shortcutEnabledCheckbox.checked = preferences.shortcutEnabled; // Cargar el estado del atajo

    guardarBtn.addEventListener('click', () => {
        const trayOption = trayOptionCheckbox.checked;
        const startupOption = startupOptionCheckbox.checked;
        const menuBarOption = menuBarOptionCheckbox.checked;
        const shortcutEnabled = shortcutEnabledCheckbox.checked; // Obtener el estado del atajo

        // Enviar las preferencias al proceso principal para guardarlas
        window.electronAPI.setPreferences({
            trayOption,
            startupOption,
            menuBarOption,
            shortcutEnabled // Incluir el estado del atajo
        });

        alert('Ajustes guardados. Algunos cambios pueden requerir reiniciar la aplicación.');
        window.close(); // Cerrar la ventana de ajustes después de guardar
    });
});