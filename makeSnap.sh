#!/bin/bash

# Script para limpiar, construir y subir un paquete Snap a la Snap Store.

# Termina el script inmediatamente si algún comando falla.
set -e

echo "Limpiando archivos .snap anteriores de la carpeta dist/..."
rm -f dist/*.snap

echo "Ejecutando el build para el paquete Snap..."
npm run build:linux:snap

echo "Iniciando la subida a la Snap Store..."
./snapUpload.sh



echo "¡Proceso de build y subida completado con éxito!"