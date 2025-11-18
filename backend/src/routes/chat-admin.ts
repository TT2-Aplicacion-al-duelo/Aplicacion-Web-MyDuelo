// backend/src/routes/chat-admin.ts

import { Router , Request, Response} from "express";
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
import sequelize from "../database/connection";  
import { QueryTypes } from 'sequelize';         

const router = Router();

// ===== RUTAS DE CHAT DE ADMINISTRADOR =====
// Todas las rutas requieren autenticación de administrador

// Obtener todos los chats del administrador
router.get("/api/admin/chats", validarAdmin, getChatsAdmin);

// Buscar chats
router.get("/api/admin/chats/buscar", validarAdmin, buscarChatsAdmin);

// Obtener mensajes de un chat específico
router.get("/api/admin/chats/:id_chat_admin/mensajes", validarAdmin, getMensajesAdmin);

// Verificar nuevos mensajes para admin
router.get("/api/admin/chats/:id_chat_admin/mensajes/nuevos", validarAdmin, async (req: Request, res: Response) => {
  try {
    const id_chat_admin = parseInt(req.params.id_chat_admin);
    const ultimoIdMensaje = parseInt(req.query.ultimoId as string) || 0;

    const mensajesNuevos = await sequelize.query(`
      SELECT 
        id_mensaje,
        id_chat_admin as id_chat,
        remitente,
        contenido,
        fecha_envio,
        leido
      FROM mensaje_admin 
      WHERE id_chat_admin = ? AND id_mensaje > ?
      ORDER BY fecha_envio ASC
    `, {
      replacements: [id_chat_admin, ultimoIdMensaje],
      type: QueryTypes.SELECT
    });

    res.json(mensajesNuevos);
  } catch (error) {
    console.error('Error al verificar nuevos mensajes:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
});

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

// Verificar nuevos mensajes para admin
router.get("/api/admin/chats/:id_chat_admin/mensajes/nuevos", validarAdmin, async (req: Request, res: Response) => {
  try {
    const id_chat_admin = parseInt(req.params.id_chat_admin);
    const ultimoIdMensaje = parseInt(req.query.ultimoId as string) || 0;

    const mensajesNuevos = await sequelize.query(`
      SELECT 
        id_mensaje,
        id_chat_admin as id_chat,
        remitente,
        contenido,
        fecha_envio,
        leido
      FROM mensaje_admin 
      WHERE id_chat_admin = ? AND id_mensaje > ?
      ORDER BY fecha_envio ASC
    `, {
      replacements: [id_chat_admin, ultimoIdMensaje],
      type: QueryTypes.SELECT
    });

    res.json(mensajesNuevos);
  } catch (error) {
    console.error('Error al verificar nuevos mensajes:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
});

export default router;