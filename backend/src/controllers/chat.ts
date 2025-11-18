// backend/src/controllers/chat.ts - VERSIÓN CORREGIDA
import { Request, Response } from "express";
import sequelize from "../database/connection";
import { encryptMessage, decryptMessages, decryptMessage } from "../utils/aes-crypto";
import { QueryTypes } from 'sequelize';
import { crearNotificacion } from "./notificaciones";

// ✅ INTERFACE PARA REQUEST CON USER INFO
interface AuthRequest extends Request {
    user?: any;
}

/**
 * Obtener todos los chats del psicólogo - CON DESCIFRADO
 */
export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const id_psicologo = req.user?.id_psicologo;
    
    if (!id_psicologo) {
      return res.status(400).json({
        msg: 'No se pudo identificar al psicólogo'
      });
    }

    console.log(`📋 Buscando chats para psicólogo ID: ${id_psicologo}`);

    // Obtener chats con pacientes
    const chats = await sequelize.query(`
      SELECT 
        c.id_chat,
        c.id_psicologo,
        c.id_paciente,
        c.fecha_inicio,
        p.nombre,
        p.apellido_paterno,
        p.apellido_materno,
        p.email,
        -- Último mensaje (CIFRADO)
        (SELECT m.contenido 
         FROM mensaje m 
         WHERE m.id_chat = c.id_chat 
         ORDER BY m.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_contenido,
        (SELECT m.remitente 
         FROM mensaje m 
         WHERE m.id_chat = c.id_chat 
         ORDER BY m.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_remitente,
        (SELECT m.fecha_envio 
         FROM mensaje m 
         WHERE m.id_chat = c.id_chat 
         ORDER BY m.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_fecha,
        -- Contar mensajes no leídos del paciente
        (SELECT COUNT(*) 
         FROM mensaje m 
         WHERE m.id_chat = c.id_chat 
         AND m.remitente = 'paciente' 
         AND m.leido = 0) as mensajes_no_leidos
      FROM chat c
      JOIN paciente p ON p.id_paciente = c.id_paciente
      WHERE c.id_psicologo = ?
      ORDER BY 
        CASE WHEN ultimo_mensaje_fecha IS NULL THEN c.fecha_inicio ELSE ultimo_mensaje_fecha END DESC
    `, {
      replacements: [id_psicologo],
      type: QueryTypes.SELECT
    });

    // Formatear la respuesta y DESCIFRAR el último mensaje
    const chatsFormateados = chats.map((chat: any) => ({
      id_chat: chat.id_chat,
      id_psicologo: chat.id_psicologo,
      id_paciente: chat.id_paciente,
      fecha_inicio: chat.fecha_inicio,
      paciente: {
        id_paciente: chat.id_paciente,
        nombre: chat.nombre,
        apellido_paterno: chat.apellido_paterno,
        apellido_materno: chat.apellido_materno,
        email: chat.email
      },
      ultimo_mensaje: chat.ultimo_mensaje_contenido ? {
        // ✅ DESCIFRAR EL ÚLTIMO MENSAJE
        contenido: decryptMessage(chat.ultimo_mensaje_contenido),
        remitente: chat.ultimo_mensaje_remitente,
        fecha_envio: chat.ultimo_mensaje_fecha
      } : null,
      mensajes_no_leidos: chat.mensajes_no_leidos
    }));

    // ========== AGREGAR CHAT CON ADMIN (SI EXISTE) ==========
    try {
      // Buscar ID del admin
      const adminData = await sequelize.query(`
        SELECT id_psicologo 
        FROM psicologo 
        WHERE rol_admin = 1 
        LIMIT 1
      `, {
        type: QueryTypes.SELECT
      });

      if (adminData.length > 0) {
        const adminId = (adminData[0] as any).id_psicologo;

        // Verificar si existe chat con el admin
        const chatAdminExistente = await sequelize.query(`
          SELECT 
            ca.id_chat_admin,
            ca.fecha_inicio,
            p.nombre,
            p.apellidoPaterno,
            p.apellidoMaterno,
            p.correo,
            (SELECT ma.contenido 
             FROM mensaje_admin ma 
             WHERE ma.id_chat_admin = ca.id_chat_admin 
             ORDER BY ma.fecha_envio DESC 
             LIMIT 1) as ultimo_mensaje_contenido,
            (SELECT ma.remitente 
             FROM mensaje_admin ma 
             WHERE ma.id_chat_admin = ca.id_chat_admin 
             ORDER BY ma.fecha_envio DESC 
             LIMIT 1) as ultimo_mensaje_remitente,
            (SELECT ma.fecha_envio 
             FROM mensaje_admin ma 
             WHERE ma.id_chat_admin = ca.id_chat_admin 
             ORDER BY ma.fecha_envio DESC 
             LIMIT 1) as ultimo_mensaje_fecha,
            (SELECT COUNT(*) 
             FROM mensaje_admin ma 
             WHERE ma.id_chat_admin = ca.id_chat_admin 
             AND ma.remitente = 'admin' 
             AND ma.leido = 0) as mensajes_no_leidos
          FROM chat_admin ca
          JOIN psicologo p ON p.id_psicologo = ca.id_admin
          WHERE ca.id_admin = ? 
            AND ca.destinatario_tipo = 'psicologo' 
            AND ca.destinatario_id = ?
        `, {
          replacements: [adminId, id_psicologo],
          type: QueryTypes.SELECT
        });

        if (chatAdminExistente.length > 0) {
          const adminChat: any = chatAdminExistente[0];
          
          // Agregar el chat del admin al inicio de la lista
          chatsFormateados.unshift({
            id_chat: `admin_${adminChat.id_chat_admin}`,
            id_chat_admin: adminChat.id_chat_admin,
            id_psicologo: adminId,
            id_paciente: null,
            fecha_inicio: adminChat.fecha_inicio,
            paciente: {
              id_paciente: adminId,
              nombre: adminChat.nombre,
              apellido_paterno: adminChat.apellidoPaterno,
              apellido_materno: adminChat.apellidoMaterno,
              email: adminChat.correo
            },
            ultimo_mensaje: adminChat.ultimo_mensaje_contenido ? {
              // ✅ DESCIFRAR EL ÚLTIMO MENSAJE DEL ADMIN
              contenido: decryptMessage(adminChat.ultimo_mensaje_contenido),
              remitente: adminChat.ultimo_mensaje_remitente,
              fecha_envio: adminChat.ultimo_mensaje_fecha
            } : null,
            mensajes_no_leidos: adminChat.mensajes_no_leidos || 0,
            es_chat_admin: true
          } as any);
        }
      }
    } catch (adminError) {
      console.error('⚠️ Error al buscar chat de admin:', adminError);
      // No fallar si el chat de admin tiene error
    }

    console.log(`✅ Se encontraron ${chatsFormateados.length} chats para el psicólogo ${id_psicologo}`);
    res.json(chatsFormateados);

  } catch (error: any) {
    console.error('❌ Error al obtener chats:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message 
    });
  }
};

/**
 * Obtener mensajes de un chat específico - CON DESCIFRADO
 */
export const getMensajes = async (req: AuthRequest, res: Response) => {
  try {
    const id_chat = Number(req.params.id_chat);
    const id_psicologo = req.user?.id_psicologo;

    if (!id_chat || !id_psicologo) {
      return res.status(400).json({ msg: "Parámetros requeridos faltantes" });
    }

    console.log(`📥 Obteniendo mensajes del chat ${id_chat} para psicólogo ${id_psicologo}`);

    // Verificar que el chat pertenece al psicólogo
    const chatExiste = await sequelize.query(`
      SELECT COUNT(*) as count FROM chat WHERE id_chat = ? AND id_psicologo = ?
    `, {
      replacements: [id_chat, id_psicologo],
      type: QueryTypes.SELECT
    });

    if ((chatExiste[0] as any).count === 0) {
      return res.status(404).json({ msg: "Chat no encontrado o no autorizado" });
    }

    // Obtener mensajes cifrados de la base de datos
    const mensajesCifrados = await sequelize.query(`
      SELECT 
        id_mensaje,
        id_chat,
        remitente,
        contenido,
        fecha_envio,
        leido
      FROM mensaje 
      WHERE id_chat = ? 
      ORDER BY fecha_envio ASC
    `, {
      replacements: [id_chat],
      type: QueryTypes.SELECT
    });

    // DESCIFRAR MENSAJES ANTES DE ENVIARLOS AL CLIENTE
    const mensajesDescifrados = decryptMessages(mensajesCifrados as any[]);
    
    console.log(`Se descifraron ${mensajesDescifrados.length} mensajes del chat ${id_chat}`);
    
    res.json(mensajesDescifrados);

  } catch (error: any) {
    console.error(' Error al obtener mensajes:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message 
    });
  }
};


  /**
   * Enviar un nuevo mensaje - CON CIFRADO
   */
  export const enviarMensaje = async (req: AuthRequest, res: Response) => {
    try {
      const { id_chat, contenido } = req.body;
      const id_psicologo = req.user?.id_psicologo;
      const tipoUsuario = req.user?.tipo; // 'psicologo' o 'paciente'

      console.log('📤 Datos recibidos:', { 
        id_chat, 
        contenido: contenido ? contenido.substring(0, 50) + '...' : 'vacío',
        id_psicologo, 
        tipoUsuario 
      });

      // ========== VALIDACIONES ==========
      if (!id_chat || !contenido) {
        return res.status(400).json({ 
          msg: "Faltan campos requeridos",
          campos_requeridos: ["id_chat", "contenido"]
        });
      }

      if (contenido.trim().length === 0) {
        return res.status(400).json({ msg: "El mensaje no puede estar vacío" });
      }

      if (contenido.length > 1000) {
        return res.status(400).json({ msg: "El mensaje es demasiado largo (máximo 1000 caracteres)" });
      }

      // ========== DETERMINAR REMITENTE ==========
      const remitente = tipoUsuario === 'paciente' ? 'paciente' : 'psicologo';

      // ========== VERIFICAR AUTORIZACIÓN ==========
      const chatExiste = await sequelize.query(`
        SELECT id_psicologo, id_paciente FROM chat WHERE id_chat = ?
      `, {
        replacements: [id_chat],
        type: QueryTypes.SELECT
      });

      if (chatExiste.length === 0) {
        return res.status(404).json({ msg: "Chat no encontrado" });
      }

      const chatData = chatExiste[0] as any;

      // Verificar que el usuario tiene permiso
      if (tipoUsuario === 'psicologo' && chatData.id_psicologo !== id_psicologo) {
        return res.status(403).json({ msg: "No autorizado para este chat" });
      }

      // ========== CIFRAR EL MENSAJE ==========
      const { encrypted: contenidoCifrado } = encryptMessage(contenido.trim());
      console.log('🔐 Mensaje cifrado correctamente');

      // ========== INSERTAR MENSAJE CIFRADO ==========
      const leido = remitente === 'psicologo' ? 1 : 0;

      const resultado = await sequelize.query(`
        INSERT INTO mensaje (id_chat, remitente, contenido, fecha_envio, leido) 
        VALUES (?, ?, ?, NOW(), ?)
      `, {
        replacements: [id_chat, remitente, contenidoCifrado, leido],
        type: QueryTypes.INSERT
      });

      // Obtener el ID del mensaje insertado
      const insertId = Array.isArray(resultado) 
        ? (resultado[0] as any) 
        : (resultado as any)[0];

      console.log(`✅ Mensaje insertado con ID: ${insertId}`);

      // ========== OBTENER EL MENSAJE RECIÉN CREADO ==========
      const nuevoMensajeCifrado = await sequelize.query(`
        SELECT id_mensaje, id_chat, remitente, contenido, fecha_envio, leido
        FROM mensaje 
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

      // ========== CREAR NOTIFICACIÓN ==========
      if (remitente === 'paciente') {
        try {
          const pacienteData = await sequelize.query(`
            SELECT nombre, apellido_paterno, apellido_materno 
            FROM paciente 
            WHERE id_paciente = ?
          `, {
            replacements: [chatData.id_paciente],
            type: QueryTypes.SELECT
          }) as any[];

          if (pacienteData.length > 0) {
            const nombreCompleto = `${pacienteData[0].nombre} ${pacienteData[0].apellido_paterno} ${pacienteData[0].apellido_materno}`;
            
            await crearNotificacion({
              id_psicologo: chatData.id_psicologo,
              tipo: 'chat',
              titulo: `Nuevo mensaje de ${nombreCompleto}`,
              mensaje: contenido.substring(0, 100), // Preview SIN CIFRAR
              id_relacionado: id_chat,
              enlace: '/chat-pacientes-del-psicologo'
            });
          }
        } catch (notifError) {
          console.error('⚠️ Error al crear notificación:', notifError);
          // No fallar si la notificación falla
        }
      }

      console.log(`✅ Mensaje enviado exitosamente en chat ${id_chat}`);
      res.json(mensajeParaCliente);

    } catch (error: any) {
      console.error('❌ Error al enviar mensaje:', error);
      res.status(500).json({ 
        msg: "Error interno del servidor", 
        error: error.message 
      });
    }
  };
/**
 * Crear un nuevo chat con un paciente
 */
export const crearChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id_paciente } = req.body;
    const id_psicologo = req.user?.id_psicologo;

    console.log('Datos para crear chat:', { id_paciente, id_psicologo });

    if (!id_paciente || !id_psicologo) {
      return res.status(400).json({ 
        msg: "Faltan campos requeridos",
        campos_requeridos: ["id_paciente"]
      });
    }

    // Verificar que el paciente existe y está asignado al psicólogo
    const pacienteValido = await sequelize.query(`
      SELECT COUNT(*) as count FROM paciente 
      WHERE id_paciente = ? AND id_psicologo = ?
    `, {
      replacements: [id_paciente, id_psicologo],
      type: QueryTypes.SELECT
    });

    if ((pacienteValido[0] as any).count === 0) {
      return res.status(400).json({ 
        msg: "Paciente no encontrado o no asignado a este psicólogo" 
      });
    }

    // Verificar que no existe ya un chat
    const chatExistente = await sequelize.query(`
      SELECT id_chat FROM chat 
      WHERE id_psicologo = ? AND id_paciente = ?
    `, {
      replacements: [id_psicologo, id_paciente],
      type: QueryTypes.SELECT
    });

    if (chatExistente.length > 0) {
      return res.status(409).json({ 
        msg: "Ya existe un chat con este paciente",
        chat_existente: chatExistente[0]
      });
    }

    // Crear el nuevo chat
    const resultado = await sequelize.query(`
      INSERT INTO chat (id_psicologo, id_paciente, fecha_inicio) 
      VALUES (?, ?, NOW())
    `, {
      replacements: [id_psicologo, id_paciente],
      type: QueryTypes.INSERT
    });

    // ✅ CORREGIDO: Obtener el ID del chat
    const insertId = (resultado[0] as any).insertId || resultado[0];

    // Obtener el chat recién creado con información del paciente
    const nuevoChat = await sequelize.query(`
      SELECT 
        c.id_chat,
        c.id_psicologo,
        c.id_paciente,
        c.fecha_inicio,
        p.nombre,
        p.apellido_paterno,
        p.apellido_materno,
        p.email
      FROM chat c
      JOIN paciente p ON p.id_paciente = c.id_paciente
      WHERE c.id_chat = ?
    `, {
      replacements: [insertId],
      type: QueryTypes.SELECT
    });

    const chatFormateado = {
      id_chat: (nuevoChat[0] as any).id_chat,
      id_psicologo: (nuevoChat[0] as any).id_psicologo,
      id_paciente: (nuevoChat[0] as any).id_paciente,
      fecha_inicio: (nuevoChat[0] as any).fecha_inicio,
      paciente: {
        id_paciente: (nuevoChat[0] as any).id_paciente,
        nombre: (nuevoChat[0] as any).nombre,
        apellido_paterno: (nuevoChat[0] as any).apellido_paterno,
        apellido_materno: (nuevoChat[0] as any).apellido_materno,
        email: (nuevoChat[0] as any).email
      },
      ultimo_mensaje: null,
      mensajes_no_leidos: 0
    };

    console.log(`Chat creado entre psicólogo ${id_psicologo} y paciente ${id_paciente}`);
    res.json(chatFormateado);

  } catch (error: any) {
    console.error('Error al crear chat:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message 
    });
  }
};

/**
 * Marcar mensajes como leídos
 */
export const marcarComoLeido = async (req: AuthRequest, res: Response) => {
  try {
    const id_chat = Number(req.params.id_chat);
    const id_psicologo = req.user?.id_psicologo;

    if (!id_chat || !id_psicologo) {
      return res.status(400).json({ msg: "Parámetros requeridos faltantes" });
    }

    // Verificar que el chat pertenece al psicólogo
    const chatExiste = await sequelize.query(`
      SELECT COUNT(*) as count FROM chat WHERE id_chat = ? AND id_psicologo = ?
    `, {
      replacements: [id_chat, id_psicologo],
      type: QueryTypes.SELECT
    });

    if ((chatExiste[0] as any).count === 0) {
      return res.status(404).json({ msg: "Chat no encontrado o no autorizado" });
    }

    // Marcar mensajes del paciente como leídos
    await sequelize.query(`
      UPDATE mensaje 
      SET leido = 1 
      WHERE id_chat = ? AND remitente = 'paciente' AND leido = 0
    `, {
      replacements: [id_chat],
      type: QueryTypes.UPDATE
    });

    res.json({ msg: "Mensajes marcados como leídos" });
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
};

/**
 * Buscar chats por nombre de paciente o contenido de mensaje
 */
export const buscarChats = async (req: AuthRequest, res: Response) => {
  try {
    const termino = req.query.q as string;
    const id_psicologo = req.user?.id_psicologo;

    if (!termino || !id_psicologo) {
      return res.status(400).json({ msg: "Término de búsqueda requerido" });
    }

    if (termino.length < 2) {
      return res.status(400).json({ msg: "El término debe tener al menos 2 caracteres" });
    }

    const chats = await sequelize.query(`
      SELECT DISTINCT
        c.id_chat,
        c.id_psicologo,
        c.id_paciente,
        c.fecha_inicio,
        p.nombre,
        p.apellido_paterno,
        p.apellido_materno,
        p.email,
        -- Último mensaje
        (SELECT m.contenido 
         FROM mensaje m 
         WHERE m.id_chat = c.id_chat 
         ORDER BY m.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_contenido,
        (SELECT m.remitente 
         FROM mensaje m 
         WHERE m.id_chat = c.id_chat 
         ORDER BY m.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_remitente,
        (SELECT m.fecha_envio 
         FROM mensaje m 
         WHERE m.id_chat = c.id_chat 
         ORDER BY m.fecha_envio DESC 
         LIMIT 1) as ultimo_mensaje_fecha
      FROM chat c
      JOIN paciente p ON p.id_paciente = c.id_paciente
      LEFT JOIN mensaje m ON m.id_chat = c.id_chat
      WHERE c.id_psicologo = ?
      AND (
        CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', IFNULL(p.apellido_materno, '')) LIKE ?
        OR m.contenido LIKE ?
      )
      ORDER BY 
        CASE WHEN ultimo_mensaje_fecha IS NULL THEN c.fecha_inicio ELSE ultimo_mensaje_fecha END DESC
    `, {
      replacements: [id_psicologo, `%${termino}%`, `%${termino}%`],
      type: QueryTypes.SELECT
    });

    // Formatear la respuesta
    const chatsFormateados = chats.map((chat: any) => ({
      id_chat: chat.id_chat,
      id_psicologo: chat.id_psicologo,
      id_paciente: chat.id_paciente,
      fecha_inicio: chat.fecha_inicio,
      paciente: {
        id_paciente: chat.id_paciente,
        nombre: chat.nombre,
        apellido_paterno: chat.apellido_paterno,
        apellido_materno: chat.apellido_materno,
        email: chat.email
      },
      ultimo_mensaje: chat.ultimo_mensaje_contenido ? {
        contenido: decryptMessage(chat.ultimo_mensaje_contenido),
        remitente: chat.ultimo_mensaje_remitente,
        fecha_envio: chat.ultimo_mensaje_fecha
      } : null,
      mensajes_no_leidos: 0 // No calculamos en búsqueda por performance
    }));

    res.json(chatsFormateados);
  } catch (error) {
    console.error('Error en búsqueda de chats:', error);
    res.status(500).json({ msg: "Error interno del servidor", error });
  }
};
// Verificar si existe chat con un paciente
export const verificarChatPaciente = async (req: AuthRequest, res: Response) => {
    try {
        const { idPaciente } = req.params;
        const id_psicologo = req.user?.id_psicologo;
        
        const chat = await sequelize.query(`
            SELECT id_chat FROM chat 
            WHERE id_psicologo = ? AND id_paciente = ?
            LIMIT 1
        `, {
            replacements: [id_psicologo, idPaciente],
            type: QueryTypes.SELECT
        });
        
        res.json({ 
            existe: chat.length > 0,
            idChat: chat.length > 0 ? (chat[0] as any).id_chat : null
        });
        
    } catch (error) {
        console.error('Error verificando chat:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
}