import { Router, Request, Response } from "express";
import { 
  getChats, 
  getMensajes, 
  enviarMensaje, 
  crearChat,
  marcarComoLeido,
  buscarChats,
  verificarChatPaciente
} from "../controllers/chat";
import validarToken from "./validarToken";
import sequelize from "../database/connection";  // ← AGREGAR SI NO ESTÁ
import { QueryTypes } from 'sequelize';         // ← AGREGAR SI NO ESTÁ

// Definir AuthRequest si no está
interface AuthRequest extends Request {
    user?: any;
}

const router = Router();

// ===== RUTAS DE CHAT =====
// Obtener todos los chats del psicólogo
router.get("/api/psicologo/chats", validarToken, getChats);

// Buscar chats
router.get("/api/psicologo/chats/buscar", validarToken, buscarChats);

// Obtener mensajes de un chat específico
router.get("/api/psicologo/chats/:id_chat/mensajes", validarToken, getMensajes);

// Marcar mensajes como leídos
router.put("/api/psicologo/chats/:id_chat/leer", validarToken, marcarComoLeido);

// Crear nuevo chat
router.post("/api/psicologo/chats", validarToken, crearChat);

// ===== RUTAS DE MENSAJES =====
// Enviar mensaje
router.post("/api/psicologo/mensajes", validarToken, enviarMensaje);
router.get("/api/psicologo/chat/verificar/:idPaciente", validarToken, verificarChatPaciente);

// ====================================
// RUTAS PARA MENSAJES CON ADMINISTRADOR
// ====================================

// Obtener mensajes de un chat con admin
// router.get("/api/psicologo/chats/admin/:id_chat_admin/mensajes", validarToken, async (req: AuthRequest, res: Response) => {
//   try {
//     const id_chat_admin = parseInt(req.params.id_chat_admin);
//     const id_psicologo = req.user?.id_psicologo;

//     const mensajes = await sequelize.query(`
//       SELECT 
//         id_mensaje,
//         id_chat_admin as id_chat,
//         remitente,
//         contenido,
//         fecha_envio,
//         leido
//       FROM mensaje_admin 
//       WHERE id_chat_admin = ? 
//       ORDER BY fecha_envio ASC
//     `, {
//       replacements: [id_chat_admin],
//       type: QueryTypes.SELECT
//     });

//     res.json(mensajes);
//   } catch (error) {
//     console.error('Error al obtener mensajes de admin:', error);
//     res.status(500).json({ msg: "Error interno del servidor", error });
//   }
// });
// ====================================
// RUTAS PARA MENSAJES CON ADMINISTRADOR
// ====================================

import { decryptMessages } from '../utils/aes-crypto';  // ← AGREGAR ESTA IMPORTACIÓN AL INICIO DEL ARCHIVO

// Obtener mensajes de un chat con admin - CON DESCIFRADO
router.get("/api/psicologo/chats/admin/:id_chat_admin/mensajes", validarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id_chat_admin = parseInt(req.params.id_chat_admin);
    const id_psicologo = req.user?.id_psicologo;

    // Obtener mensajes cifrados de la base de datos
    const mensajesCifrados = await sequelize.query(`
      SELECT 
        id_mensaje,
        id_chat_admin as id_chat,
        remitente,
        contenido,
        fecha_envio,
        leido
      FROM mensaje_admin 
      WHERE id_chat_admin = ? 
      ORDER BY fecha_envio ASC
    `, {
      replacements: [id_chat_admin],
      type: QueryTypes.SELECT
    }) as any[];

    // ✅ DESCIFRAR MENSAJES ANTES DE ENVIARLOS AL FRONTEND
    const mensajesDescifrados = decryptMessages(mensajesCifrados);

    console.log(`✅ Se descifraron ${mensajesDescifrados.length} mensajes del chat admin ${id_chat_admin}`);

    res.json(mensajesDescifrados);
  } catch (error) {
    console.error('❌ Error al obtener mensajes de admin:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
});

// Enviar mensaje a admin
router.post("/api/psicologo/chats/admin/mensajes", validarToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id_chat_admin, contenido } = req.body;
    const id_psicologo = req.user?.id_psicologo;

    if (!id_chat_admin || !contenido) {
      return res.status(400).json({ msg: "Faltan campos requeridos" });
    }

    // Insertar el mensaje
    const resultado = await sequelize.query(`
      INSERT INTO mensaje_admin (id_chat_admin, remitente, contenido, fecha_envio, leido) 
      VALUES (?, 'usuario', ?, NOW(), 1)
    `, {
      replacements: [id_chat_admin, contenido.trim()],
      type: QueryTypes.INSERT
    });

    // Obtener insertId correctamente
    const insertId = Array.isArray(resultado[0]) ? resultado[0] : (resultado[0] as any);

    // Obtener el mensaje recién creado
    const nuevoMensaje = await sequelize.query(`
      SELECT 
        id_mensaje, 
        id_chat_admin as id_chat, 
        remitente, 
        contenido, 
        fecha_envio, 
        leido
      FROM mensaje_admin 
      WHERE id_mensaje = ?
    `, {
      replacements: [insertId],
      type: QueryTypes.SELECT
    });

    res.json(nuevoMensaje[0]);
  } catch (error: any) {
    console.error('Error al enviar mensaje a admin:', error);
    res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
});

// Marcar mensajes de admin como leídos
router.put("/api/psicologo/chats/admin/:id_chat_admin/leer", validarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id_chat_admin = parseInt(req.params.id_chat_admin);
    const id_psicologo = req.user?.id_psicologo;

    await sequelize.query(`
      UPDATE mensaje_admin 
      SET leido = 1 
      WHERE id_chat_admin = ? AND remitente = 'admin' AND leido = 0
    `, {
      replacements: [id_chat_admin],
      type: QueryTypes.UPDATE
    });

    res.json({ msg: "Mensajes marcados como leídos" });
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
});

export default router;