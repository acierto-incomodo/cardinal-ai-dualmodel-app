echo "Preparando build general..."
rm -rf node_modules/
rm -f package-lock.json
npm i

sleep 1

echo "Iniciando build AppImage..."
./makeAppImage.sh
echo "¡Proceso de build completado con éxito!"
echo "AppImage Finalizado"

sleep 1

echo "Iniciando build DEB..."
./makeDeb.sh
echo "¡Proceso de build completado con éxito!"
echo "DEB Finalizado"

sleep 1

echo "Iniciando build SNAP..."
./makeSnap.sh
echo "¡Proceso de build y subida completado con éxito!"
echo "SNAP Finalizado"

sleep 1

echo "Build general completado con éxito."