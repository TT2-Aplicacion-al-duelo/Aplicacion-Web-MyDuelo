// backend/src/routes/psicologo.ts
import { Router } from "express";
import { 
  login, 
  registro, 
  activarCuenta, 
  reenviarActivacion,
  solicitarRecuperacion,
  verificarTokenRecuperacion,
  restablecerContrasena,
  actualizarPerfil,
  cambiarContrasena,
   subirFotoPerfil,
  eliminarFotoPerfil,
  obtenerPerfil  
} from "../controllers/psicologo";
import { verificarToken } from "../middlewares/auth.middlewares";
import { uploadFotoPerfil } from "../config/multer.config";
import validarToken from "./validarToken";

const router = Router();

// Rutas públicas
router.post("/api/psicologo/registro", registro);
router.post("/api/psicologo/iniciar-sesion", login);
router.get("/api/psicologo/activar/:token", activarCuenta);
router.post("/api/psicologo/reenviar-activacion", reenviarActivacion);
router.post("/api/psicologo/recuperar-contrasena", solicitarRecuperacion);
router.get("/api/psicologo/verificar-token/:token", verificarTokenRecuperacion);
router.post("/api/psicologo/restablecer-contrasena/:token", restablecerContrasena);

// Rutas protegidas (requieren autenticación)
router.put("/api/psicologo/actualizar-perfil", verificarToken, actualizarPerfil);
router.put("/api/psicologo/cambiar-contrasena", verificarToken, cambiarContrasena);

// Rutas de foto de perfil
//router.post("/api/psicologo/subir-foto-perfil", verificarToken, uploadFotoPerfil.single('foto'), subirFotoPerfil);
//router.delete("/api/psicologo/eliminar-foto-perfil", verificarToken, eliminarFotoPerfil);
router.post("/api/psicologo/subir-foto-perfil", validarToken,   uploadFotoPerfil.single('foto'),   subirFotoPerfil);

router.delete("/api/psicologo/eliminar-foto-perfil", validarToken, eliminarFotoPerfil);
router.get("/api/psicologo/perfil", validarToken, obtenerPerfil);


export default router;