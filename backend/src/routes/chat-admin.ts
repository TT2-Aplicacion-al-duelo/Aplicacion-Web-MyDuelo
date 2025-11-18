// backend/src/routes/chat-admin.ts

import { Router } from "express";
import { 
  getChatsAdmin, 
  getMensajesAdmin, 
  enviarMensajeAdmin, 
  crearChatAdmin,
  marcarComoLeidoAdmin,
  buscarChatsAdmin,
  getTodosUsuariosDisponibles
} from "../controllers/chat-admin";
import validarAdmin from "./validarAdmin";

const router = Router();

// ===== RUTAS DE CHAT DE ADMINISTRADOR =====
// Todas las rutas requieren autenticación de administrador

// Obtener todos los chats del administrador
router.get("/api/admin/chats", validarAdmin, getChatsAdmin);

// Buscar chats
router.get("/api/admin/chats/buscar", validarAdmin, buscarChatsAdmin);

// Obtener mensajes de un chat específico
router.get("/api/admin/chats/:id_chat_admin/mensajes", validarAdmin, getMensajesAdmin);

// Marcar mensajes como leídos
router.put("/api/admin/chats/:id_chat_admin/leer", validarAdmin, marcarComoLeidoAdmin);

// Crear nuevo chat
router.post("/api/admin/chats", validarAdmin, crearChatAdmin);

// ===== RUTAS DE MENSAJES =====
// Enviar mensaje
router.post("/api/admin/mensajes", validarAdmin, enviarMensajeAdmin);

// ===== RUTAS DE USUARIOS DISPONIBLES =====
// Obtener todos los usuarios disponibles (psicólogos y pacientes)
router.get("/api/admin/usuarios-disponibles", validarAdmin, getTodosUsuariosDisponibles);

export default router;