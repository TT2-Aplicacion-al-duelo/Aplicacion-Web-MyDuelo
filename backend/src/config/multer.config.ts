import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// ⭐ RUTA ABSOLUTA A SERVERAPP (ajusta según tu usuario)
const homeDir = os.homedir();
const UPLOADS_DIR = path.join(homeDir, 'ServerApp', 'server', 'uploads');
const EVIDENCIAS_DIR = path.join(UPLOADS_DIR, 'evidencias');

// Crear directorios si no existen
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('✅ Directorio de uploads creado:', UPLOADS_DIR);
}

if (!fs.existsSync(EVIDENCIAS_DIR)) {
  fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
  console.log('✅ Directorio de evidencias creado:', EVIDENCIAS_DIR);
}

// Configuración para FOTOS DE PERFIL
const storagePerfil = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `foto-${uniqueSuffix}${ext}`);
  }
});

// Configuración para EVIDENCIAS
const storageEvidencias = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, EVIDENCIAS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Filtro para imágenes
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, GIF, WEBP).'), false);
  }
};

// Export de configuraciones
export const uploadFotoPerfil = multer({
  storage: storagePerfil,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export const uploadEvidencia = multer({
  storage: storageEvidencias,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB para evidencias
});

// Export de rutas para uso en controladores
export const PATHS = {
  UPLOADS_DIR,
  EVIDENCIAS_DIR
};