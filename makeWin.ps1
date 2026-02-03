# Eliminar carpetas y archivos previos antes de construir
if (Test-Path -Path "node_modules") {
    Write-Host "Eliminando node_modules..."
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path -Path "dist") {
    Write-Host "Limpiando directorio dist, pero conservando latest-linux.yml..."
    # Elimina todo dentro de 'dist' excepto 'latest-linux.yml'
    Get-ChildItem -Path "dist" -Exclude "latest-linux.yml" | Remove-Item -Recurse -Force
}

if (Test-Path -Path "package-lock.json") {
    Write-Host "Eliminando package-lock.json..."
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
}

npm i

# Continuar con el resto del script
npm run build:win

# Reemplazar espacios por guiones en los nombres de archivo .exe y .blockmap generados
Get-ChildItem -Path . -Recurse -Include '*.exe', '*.blockmap', '*.msi' | ForEach-Object {
    $newName = $_.Name -replace ' ', '-'
    Rename-Item -Path $_.FullName -NewName $newName
}