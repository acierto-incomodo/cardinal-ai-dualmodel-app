#!/bin/bash

# Script para construir paquete AppImage.

# Termina el script inmediatamente si algún comando falla.
set -e

echo "Limpiando archivos .AppImage anteriores de la carpeta dist/..."
rm -f dist/*.AppImage

echo "Ejecutando el build para el paquete AppImage..."
npm run build:linux:appimage

echo "¡Proceso de build completado con éxito!"