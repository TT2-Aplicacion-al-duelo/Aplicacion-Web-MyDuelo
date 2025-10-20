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
  cambiarContrasena
} from "../controllers/psicologo";
import { verificarToken } from "../middlewares/auth.middlewares";

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

export default router;