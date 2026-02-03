#!/bin/bash

# Script para limpiar, construir y subir un paquete Snap a la Snap Store.

# Termina el script inmediatamente si algún comando falla.
set -e

echo "Limpiando archivos .deb anteriores de la carpeta dist/..."
rm -f dist/*.deb

echo "Ejecutando el build para el paquete Deb..."
npm run build:linux:deb

echo "¡Proceso de build completado con éxito!"

echo "Limpiando archivos .AppImage anteriores de la carpeta dist/..."
rm -f dist/*.AppImage

echo "Ejecutando el build para el paquete AppImage..."
npm run build:linux:appimage

echo "Generando latest-linux.yml con .deb y .AppImage..."
node generateLatestLinux.js

echo "¡latest-linux.yml generado exitosamente!"