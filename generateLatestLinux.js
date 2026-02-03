#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function calculateSHA512(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha512');
  hashSum.update(fileBuffer);
  return hashSum.digest('base64');
}

function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

// Leer la versión del package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

const distDir = path.join(__dirname, 'dist');

// Buscar archivos .deb, .AppImage y opcionalmente .snap
const filesInDist = fs.readdirSync(distDir);
const debFile = filesInDist.find(f => f.endsWith('.deb'));
const appImageFile = filesInDist.find(f => f.endsWith('.AppImage'));
const snapFile = filesInDist.find(f => f.endsWith('.snap'));

if (!debFile || !appImageFile) {
  console.error('Error: No se encontraron ambos archivos (.deb y .AppImage) en la carpeta dist/');
  if (!debFile) console.error('  - Falta el archivo .deb');
  if (!appImageFile) console.error('  - Falta el archivo .AppImage');
  process.exit(1);
}

const debPath = path.join(distDir, debFile);
const appImagePath = path.join(distDir, appImageFile);
const snapPath = snapFile ? path.join(distDir, snapFile) : null;

const debSha512 = calculateSHA512(debPath);
const appImageSha512 = calculateSHA512(appImagePath);
const snapSha512 = snapPath ? calculateSHA512(snapPath) : null;

const debSize = getFileSize(debPath);
const appImageSize = getFileSize(appImagePath);
const snapSize = snapPath ? getFileSize(snapPath) : null;

// Construir la sección files dinámicamente (incluir snap si existe)
const filesList = [];
filesList.push({ url: debFile, sha512: debSha512, size: debSize });
filesList.push({ url: appImageFile, sha512: appImageSha512, size: appImageSize });
if (snapFile) {
  filesList.push({ url: snapFile, sha512: snapSha512, size: snapSize });
}

// Elegir el `path` principal: si existe snap, usarlo; si no, usar el .deb
const mainPath = snapFile ? snapFile : debFile;
const mainSha = snapFile ? snapSha512 : debSha512;

// Generar el archivo YAML con los formatos detectados
const filesYaml = filesList.map(f => `  - url: ${f.url}\n    sha512: ${f.sha512}\n    size: ${f.size}`).join('\n');

const latestLinuxContent = `version: ${version}\nfiles:\n${filesYaml}\npath: ${mainPath}\nsha512: ${mainSha}\nreleaseDate: '${new Date().toISOString()}'\n`;

const latestLinuxPath = path.join(distDir, 'latest-linux.yml');
fs.writeFileSync(latestLinuxPath, latestLinuxContent);

console.log('✓ Archivo latest-linux.yml generado exitosamente');
console.log(`  - Versión: ${version}`);
console.log(`  - DEB: ${debFile} (${debSize} bytes)`);
console.log(`  - AppImage: ${appImageFile} (${appImageSize} bytes)`);
