  // backend/src/controllers/chat-admin.ts

import { Request, Response } from "express";
import sequelize from "../database/connection";
import { QueryTypes } from 'sequelize';
import { encryptMessage, decryptMessages, decryptMessage } from "../utils/aes-crypto";
import { Psicologo } from "../models/psicologo";
import { Paciente } from "../models/paciente";

interface AuthRequest extends Request {
    user?: any;
}

/**
 * Obtener todos los chats del administrador - CON DESCIFRADO
 */
export const getChatsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const id_admin = req.user?.id_psicologo;
    const esAdmin = req.user?.rol_admin === true;

    if (!id_admin || !esAdmin) {
      return res.status(403).json({
        msg: 'Acceso denegado: requiere permisos de administrador'
      });
    }

    console.log(`📋 Buscando chats de admin para ID: ${id_admin}`);

    // Obtener todos los chats del admin
    const chats = await sequelize.query(`
      SELECT 
        c.id_chat_admin,
        c.id_admin,
        c.destinatario_tipo,
        c.destinatario_id,
        c.fecha_inicio,
        -- Último mensaje (CIFRADO)
        (SELECT ma.contenido 
         FROM mensaje_admin ma 
         WHERE ma.id_chat_admin = c.id_chat_admin 
         ORDER BY ma.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_contenido,
        (SELECT ma.remitente 
         FROM mensaje_admin ma 
         WHERE ma.id_chat_admin = c.id_chat_admin 
         ORDER BY ma.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_remitente,
        (SELECT ma.fecha_envio 
         FROM mensaje_admin ma 
         WHERE ma.id_chat_admin = c.id_chat_admin 
         ORDER BY ma.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_fecha,
        -- Contar mensajes no leídos del usuario
        (SELECT COUNT(*) 
         FROM mensaje_admin ma 
         WHERE ma.id_chat_admin = c.id_chat_admin 
         AND ma.remitente = 'usuario' 
         AND ma.leido = 0) as mensajes_no_leidos
      FROM chat_admin c
      WHERE c.id_admin = ?
      ORDER BY 
        CASE WHEN ultimo_mensaje_fecha IS NULL THEN c.fecha_inicio ELSE ultimo_mensaje_fecha END DESC
    `, {
      replacements: [id_admin],
      type: QueryTypes.SELECT
    });

    // Formatear respuesta con información del destinatario y DESCIFRAR
    const chatsFormateados = await Promise.all(chats.map(async (chat: any) => {
      let destinatario = null;

      // Obtener información del destinatario
      if (chat.destinatario_tipo === 'psicologo') {
        const psicologo = await Psicologo.findByPk(chat.destinatario_id, {
          attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo']
        });
        if (psicologo) {
          destinatario = {
            id: (psicologo as any).id_psicologo,
            nombre: (psicologo as any).nombre,
            apellido_paterno: (psicologo as any).apellidoPaterno,
            apellido_materno: (psicologo as any).apellidoMaterno,
            email: (psicologo as any).correo,
            tipo: 'psicologo'
          };
        }
      } else if (chat.destinatario_tipo === 'paciente') {
        const paciente = await Paciente.findByPk(chat.destinatario_id, {
          attributes: ['id_paciente', 'nombre', 'apellido_paterno', 'apellido_materno', 'email']
        });
        if (paciente) {
          destinatario = {
            id: (paciente as any).id_paciente,
            nombre: (paciente as any).nombre,
            apellido_paterno: (paciente as any).apellido_paterno,
            apellido_materno: (paciente as any).apellido_materno,
            email: (paciente as any).email,
            tipo: 'paciente'
          };
        }
      }

      return {
        id_chat_admin: chat.id_chat_admin,
        id_admin: chat.id_admin,
        destinatario_tipo: chat.destinatario_tipo,
        destinatario_id: chat.destinatario_id,
        fecha_inicio: chat.fecha_inicio,
        destinatario,
        ultimo_mensaje: chat.ultimo_mensaje_contenido ? {
          // ✅ DESCIFRAR EL ÚLTIMO MENSAJE
          contenido: decryptMessage(chat.ultimo_mensaje_contenido),
          remitente: chat.ultimo_mensaje_remitente,
          fecha_envio: chat.ultimo_mensaje_fecha
        } : null,
        mensajes_no_leidos: chat.mensajes_no_leidos || 0
      };
    }));

    console.log(`✅ Se encontraron ${chatsFormateados.length} chats de admin`);
    res.json(chatsFormateados);

  } catch (error: any) {
    console.error('❌ Error al obtener chats de admin:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message 
    });
  }
};

/**
 * Obtener mensajes de chat admin - CON DESCIFRADO
 */
export const getMensajesAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const id_chat_admin = Number(req.params.id_chat_admin);
    const id_admin = req.user?.id_psicologo;
    const esAdmin = req.user?.rol_admin === true;

    if (!id_chat_admin) {
      return res.status(400).json({ msg: "ID de chat admin requerido" });
    }

    console.log(`📥 Obteniendo mensajes del chat admin ${id_chat_admin}`);

    // Verificar autorización
    const chatExiste = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM chat_admin 
      WHERE id_chat_admin = ? 
        AND (id_admin = ? OR (destinatario_tipo = 'psicologo' AND destinatario_id = ?))
    `, {
      replacements: [id_chat_admin, id_admin, id_admin],
      type: QueryTypes.SELECT
    });

    if ((chatExiste[0] as any).count === 0) {
      return res.status(404).json({ msg: "Chat no encontrado o no autorizado" });
    }

    // Obtener mensajes cifrados
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

    //  DESCIFRAR MENSAJES
    const mensajesDescifrados = decryptMessages(mensajesCifrados);

    console.log(`✅ Se descifraron ${mensajesDescifrados.length} mensajes del chat admin ${id_chat_admin}`);

    res.json(mensajesDescifrados);

  } catch (error: any) {
    console.error('❌ Error al obtener mensajes de admin:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message 
    });
  }
};

/**
 * Enviar mensaje en chat admin - CON CIFRADO
 */
export const enviarMensajeAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id_chat_admin, contenido } = req.body;
    const id_usuario = req.user?.id_psicologo;
    const esAdmin = req.user?.rol_admin === true;

    console.log('📤 Enviando mensaje a chat admin:', { 
      id_chat_admin, 
      contenido: contenido ? contenido.substring(0, 50) + '...' : 'vacío',
      esAdmin 
    });

    // ========== VALIDACIONES ==========
    if (!id_chat_admin || !contenido) {
      return res.status(400).json({ msg: "Faltan campos requeridos" });
    }

    if (contenido.trim().length === 0) {
      return res.status(400).json({ msg: "El mensaje no puede estar vacío" });
    }

    if (contenido.length > 1000) {
      return res.status(400).json({ msg: "El mensaje es demasiado largo (máximo 1000 caracteres)" });
    }

    // ========== DETERMINAR REMITENTE ==========
    const remitente = esAdmin ? 'admin' : 'usuario';

    // ========== VERIFICAR AUTORIZACIÓN ==========
    const chatExiste = await sequelize.query(`
      SELECT id_admin, destinatario_tipo, destinatario_id 
      FROM chat_admin 
      WHERE id_chat_admin = ?
    `, {
      replacements: [id_chat_admin],
      type: QueryTypes.SELECT
    });

    if (chatExiste.length === 0) {
      return res.status(404).json({ msg: "Chat no encontrado" });
    }

    const chatData = chatExiste[0] as any;

    // Verificar que el usuario tiene permiso
    if (!esAdmin && chatData.destinatario_id !== id_usuario) {
      return res.status(403).json({ msg: "No autorizado para este chat" });
    }

    // ========== CIFRAR EL MENSAJE ==========
    const { encrypted: contenidoCifrado } = encryptMessage(contenido.trim());
    console.log('🔐 Mensaje admin cifrado correctamente');

    // ========== INSERTAR MENSAJE CIFRADO ==========
    const leido = remitente === 'admin' ? 0 : 1;

    const resultado = await sequelize.query(`
      INSERT INTO mensaje_admin (id_chat_admin, remitente, contenido, fecha_envio, leido) 
      VALUES (?, ?, ?, NOW(), ?)
    `, {
      replacements: [id_chat_admin, remitente, contenidoCifrado, leido],
      type: QueryTypes.INSERT
    });

    // Obtener el ID del mensaje insertado
    const insertId = Array.isArray(resultado) 
      ? (resultado[0] as any) 
      : (resultado as any)[0];

    console.log(`✅ Mensaje admin insertado con ID: ${insertId}`);

    // ========== OBTENER EL MENSAJE RECIÉN CREADO ==========
    const nuevoMensajeCifrado = await sequelize.query(`
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
    }) as any[];

    if (nuevoMensajeCifrado.length === 0) {
      return res.status(500).json({ msg: "Error al recuperar el mensaje enviado" });
    }

    // ========== DESCIFRAR PARA ENVIAR AL CLIENTE ==========
    const mensajeParaCliente = {
      ...nuevoMensajeCifrado[0],
      contenido: decryptMessage(nuevoMensajeCifrado[0].contenido)
    };

    console.log(`✅ Mensaje admin enviado exitosamente en chat ${id_chat_admin}`);
    res.json(mensajeParaCliente);

  } catch (error: any) {
    console.error('❌ Error al enviar mensaje admin:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message 
    });
  }
};
/**
 * Crear un nuevo chat con un psicólogo o paciente
 */
export const crearChatAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { destinatario_tipo, destinatario_id } = req.body;
    const id_admin = req.user?.id_psicologo;

    console.log('Datos para crear chat admin:', { destinatario_tipo, destinatario_id, id_admin });

    if (!destinatario_tipo || !destinatario_id || !id_admin) {
      return res.status(400).json({ 
        msg: "Faltan campos requeridos",
        campos_requeridos: ["destinatario_tipo", "destinatario_id"]
      });
    }

    if (!['psicologo', 'paciente'].includes(destinatario_tipo)) {
      return res.status(400).json({ 
        msg: "Tipo de destinatario inválido. Debe ser 'psicologo' o 'paciente'" 
      });
    }

    // Verificar que el destinatario existe
    if (destinatario_tipo === 'psicologo') {
      const psicologo = await Psicologo.findByPk(destinatario_id);
      if (!psicologo) {
        return res.status(404).json({ msg: 'Psicólogo no encontrado' });
      }
    } else {
      const paciente = await Paciente.findByPk(destinatario_id);
      if (!paciente) {
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }
    }

    // Verificar que no existe ya un chat
    const chatExistente = await sequelize.query(`
      SELECT id_chat_admin FROM chat_admin 
      WHERE id_admin = ? AND destinatario_tipo = ? AND destinatario_id = ?
    `, {
      replacements: [id_admin, destinatario_tipo, destinatario_id],
      type: QueryTypes.SELECT
    });

    if (chatExistente.length > 0) {
      return res.status(409).json({ 
        msg: "Ya existe un chat con este usuario",
        chat_existente: chatExistente[0]
      });
    }

    // Crear el nuevo chat
    const resultado = await sequelize.query(`
      INSERT INTO chat_admin (id_admin, destinatario_tipo, destinatario_id, fecha_inicio) 
      VALUES (?, ?, ?, NOW())
    `, {
      replacements: [id_admin, destinatario_tipo, destinatario_id],
      type: QueryTypes.INSERT
    });

    const insertId = (resultado[0] as any).insertId || resultado[0];

    // Obtener el chat recién creado con información del destinatario
    const nuevoChat = await sequelize.query(`
      SELECT 
        id_chat_admin,
        id_admin,
        destinatario_tipo,
        destinatario_id,
        fecha_inicio
      FROM chat_admin
      WHERE id_chat_admin = ?
    `, {
      replacements: [insertId],
      type: QueryTypes.SELECT
    });

    // Obtener información del destinatario
    let destinatario = null;
    if (destinatario_tipo === 'psicologo') {
      const psicologo = await Psicologo.findByPk(destinatario_id, {
        attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo']
      });
      if (psicologo) {
        destinatario = {
          id: (psicologo as any).id_psicologo,
          nombre: (psicologo as any).nombre,
          apellido_paterno: (psicologo as any).apellidoPaterno,
          apellido_materno: (psicologo as any).apellidoMaterno,
          email: (psicologo as any).correo,
          tipo: 'psicologo'
        };
      }
    } else {
      const paciente = await Paciente.findByPk(destinatario_id, {
        attributes: ['id_paciente', 'nombre', 'apellido_paterno', 'apellido_materno', 'email']
      });
      if (paciente) {
        destinatario = {
          id: (paciente as any).id_paciente,
          nombre: (paciente as any).nombre,
          apellido_paterno: (paciente as any).apellido_paterno,
          apellido_materno: (paciente as any).apellido_materno,
          email: (paciente as any).email,
          tipo: 'paciente'
        };
      }
    }

    const chatFormateado = {
      ...(nuevoChat[0] as any),
      destinatario,
      ultimo_mensaje: null,
      mensajes_no_leidos: 0
    };

    console.log(`Chat de admin creado entre admin ${id_admin} y ${destinatario_tipo} ${destinatario_id}`);
    res.json(chatFormateado);

  } catch (error: any) {
    console.error('Error al crear chat de admin:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message 
    });
  }
};

/**
 * Marcar mensajes como leídos
 */
export const marcarComoLeidoAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const id_chat_admin = Number(req.params.id_chat_admin);
    const id_admin = req.user?.id_psicologo;

    if (!id_chat_admin || !id_admin) {
      return res.status(400).json({ msg: "Parámetros requeridos faltantes" });
    }

    // Verificar que el chat pertenece al admin
    const chatExiste = await sequelize.query(`
      SELECT COUNT(*) as count FROM chat_admin WHERE id_chat_admin = ? AND id_admin = ?
    `, {
      replacements: [id_chat_admin, id_admin],
      type: QueryTypes.SELECT
    });

    if ((chatExiste[0] as any).count === 0) {
      return res.status(404).json({ msg: "Chat no encontrado o no autorizado" });
    }

    // Marcar mensajes del usuario como leídos
    await sequelize.query(`
      UPDATE mensaje_admin 
      SET leido = 1 
      WHERE id_chat_admin = ? AND remitente = 'usuario' AND leido = 0
    `, {
      replacements: [id_chat_admin],
      type: QueryTypes.UPDATE
    });

    res.json({ msg: "Mensajes marcados como leídos" });
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
};

/**
 * Buscar chats por nombre o contenido
 */
export const buscarChatsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const termino = req.query.q as string;
    const id_admin = req.user?.id_psicologo;

    if (!termino || !id_admin) {
      return res.status(400).json({ msg: "Término de búsqueda requerido" });
    }

    if (termino.length < 2) {
      return res.status(400).json({ msg: "El término debe tener al menos 2 caracteres" });
    }

    // Buscar en psicólogos
    const chatsPsicologos = await sequelize.query(`
      SELECT DISTINCT c.*
      FROM chat_admin c
      INNER JOIN psicologo p ON c.destinatario_id = p.id_psicologo
      WHERE c.id_admin = ? 
      AND c.destinatario_tipo = 'psicologo'
      AND (
        CONCAT(p.nombre, ' ', p.apellidoPaterno, ' ', IFNULL(p.apellidoMaterno, '')) LIKE ?
        OR p.correo LIKE ?
      )
    `, {
      replacements: [id_admin, `%${termino}%`, `%${termino}%`],
      type: QueryTypes.SELECT
    });

    // Buscar en pacientes
    const chatsPacientes = await sequelize.query(`
      SELECT DISTINCT c.*
      FROM chat_admin c
      INNER JOIN paciente p ON c.destinatario_id = p.id_paciente
      WHERE c.id_admin = ? 
      AND c.destinatario_tipo = 'paciente'
      AND (
        CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', IFNULL(p.apellido_materno, '')) LIKE ?
        OR p.email LIKE ?
      )
    `, {
      replacements: [id_admin, `%${termino}%`, `%${termino}%`],
      type: QueryTypes.SELECT
    });

    const todosChats = [...chatsPsicologos, ...chatsPacientes];

    // Formatear respuesta (similar a getChatsAdmin)
    const chatsFormateados = await Promise.all(todosChats.map(async (chat: any) => {
      // ... (código de formateo similar a getChatsAdmin)
      return chat; // Simplificado por brevedad
    }));

    res.json(chatsFormateados);
  } catch (error) {
    console.error('Error en búsqueda de chats de admin:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
};

/**
 * Obtener todos los usuarios disponibles (psicólogos y pacientes)
 */
export const getTodosUsuariosDisponibles = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener psicólogos activos
    const psicologos = await Psicologo.findAll({
      where: { status: 'activo' },
      attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo', 'especialidad', 'cedula_validada']
    });

    // Obtener pacientes
    const pacientes = await Paciente.findAll({
      attributes: ['id_paciente', 'nombre', 'apellido_paterno', 'apellido_materno', 'email']
    });

    // Formatear respuesta
    const usuarios = [
      ...psicologos.map((p: any) => ({
        id: p.id_psicologo,
        nombre: p.nombre,
        apellido_paterno: p.apellidoPaterno,
        apellido_materno: p.apellidoMaterno,
        email: p.correo,
        tipo: 'psicologo',
        especialidad: p.especialidad,
        cedula_validada: p.cedula_validada
      })),
      ...pacientes.map((p: any) => ({
        id: p.id_paciente,
        nombre: p.nombre,
        apellido_paterno: p.apellido_paterno,
        apellido_materno: p.apellido_materno,
        email: p.email,
        tipo: 'paciente'
      }))
    ];

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios disponibles:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
};