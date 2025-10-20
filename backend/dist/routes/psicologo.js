"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/psicologo.ts
const express_1 = require("express");
const psicologo_1 = require("../controllers/psicologo");
const auth_middlewares_1 = require("../middlewares/auth.middlewares");
const router = (0, express_1.Router)();
// Rutas públicas
router.post("/api/psicologo/registro", psicologo_1.registro);
router.post("/api/psicologo/iniciar-sesion", psicologo_1.login);
router.get("/api/psicologo/activar/:token", psicologo_1.activarCuenta);
router.post("/api/psicologo/reenviar-activacion", psicologo_1.reenviarActivacion);
router.post("/api/psicologo/recuperar-contrasena", psicologo_1.solicitarRecuperacion);
router.get("/api/psicologo/verificar-token/:token", psicologo_1.verificarTokenRecuperacion);
router.post("/api/psicologo/restablecer-contrasena/:token", psicologo_1.restablecerContrasena);
// Rutas protegidas (requieren autenticación)
router.put("/api/psicologo/actualizar-perfil", auth_middlewares_1.verificarToken, psicologo_1.actualizarPerfil);
router.put("/api/psicologo/cambiar-contrasena", auth_middlewares_1.verificarToken, psicologo_1.cambiarContrasena);
exports.default = router;
