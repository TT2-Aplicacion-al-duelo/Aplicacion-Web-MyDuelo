"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarChatPaciente = exports.buscarChats = exports.marcarComoLeido = exports.crearChat = exports.enviarMensaje = exports.getMensajes = exports.getChats = void 0;
const connection_1 = __importDefault(require("../database/connection"));
const sequelize_1 = require("sequelize");
/**
 * Obtener todos los chats del psicólogo autenticado
 */
const getChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        if (!id_psicologo) {
            return res.status(400).json({
                msg: 'No se pudo identificar al psicólogo'
            });
        }
        console.log(`Buscando chats para psicólogo ID: ${id_psicologo}`);
        const chats = yield connection_1.default.query(`
      SELECT 
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
            type: sequelize_1.QueryTypes.SELECT
        });
        // Formatear la respuesta
        const chatsFormateados = chats.map((chat) => ({
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
                contenido: chat.ultimo_mensaje_contenido,
                remitente: chat.ultimo_mensaje_remitente,
                fecha_envio: chat.ultimo_mensaje_fecha
            } : null,
            mensajes_no_leidos: chat.mensajes_no_leidos || 0
        }));
        console.log(`Encontrados ${chatsFormateados.length} chats`);
        res.json(chatsFormateados);
    }
    catch (error) {
        console.error('Error al obtener chats:', error);
        res.status(500).json({ msg: "Error interno del servidor", error });
    }
});
exports.getChats = getChats;
/**
 * Obtener mensajes de un chat específico
 */
const getMensajes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id_chat = Number(req.params.id_chat);
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        if (!id_chat || !id_psicologo) {
            return res.status(400).json({ msg: "Parámetros requeridos faltantes" });
        }
        // Verificar que el chat pertenece al psicólogo
        const chatExiste = yield connection_1.default.query(`
      SELECT COUNT(*) as count FROM chat WHERE id_chat = ? AND id_psicologo = ?
    `, {
            replacements: [id_chat, id_psicologo],
            type: sequelize_1.QueryTypes.SELECT
        });
        if (chatExiste[0].count === 0) {
            return res.status(404).json({ msg: "Chat no encontrado o no autorizado" });
        }
        const mensajes = yield connection_1.default.query(`
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
            type: sequelize_1.QueryTypes.SELECT
        });
        res.json(mensajes);
    }
    catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ msg: "Error interno del servidor", error });
    }
});
exports.getMensajes = getMensajes;
/**
 * Enviar un nuevo mensaje - CORREGIDO
 */
const enviarMensaje = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id_chat, contenido } = req.body;
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        console.log('Datos recibidos:', { id_chat, contenido, id_psicologo });
        if (!id_chat || !contenido || !id_psicologo) {
            return res.status(400).json({
                msg: "Faltan campos requeridos",
                campos_requeridos: ["id_chat", "contenido"],
                datos_recibidos: { id_chat, contenido: !!contenido, id_psicologo }
            });
        }
        if (contenido.trim().length === 0) {
            return res.status(400).json({ msg: "El mensaje no puede estar vacío" });
        }
        if (contenido.length > 1000) {
            return res.status(400).json({ msg: "El mensaje es demasiado largo (máximo 1000 caracteres)" });
        }
        // Verificar que el chat pertenece al psicólogo
        const chatExiste = yield connection_1.default.query(`
      SELECT COUNT(*) as count FROM chat WHERE id_chat = ? AND id_psicologo = ?
    `, {
            replacements: [id_chat, id_psicologo],
            type: sequelize_1.QueryTypes.SELECT
        });
        if (chatExiste[0].count === 0) {
            return res.status(404).json({ msg: "Chat no encontrado o no autorizado" });
        }
        // ✅ CORREGIDO: Insertar el mensaje con parámetros correctos
        const resultado = yield connection_1.default.query(`
      INSERT INTO mensaje (id_chat, remitente, contenido, fecha_envio, leido) 
      VALUES (?, ?, ?, NOW(), 1)
    `, {
            replacements: [id_chat, 'psicologo', contenido.trim()],
            type: sequelize_1.QueryTypes.INSERT
        });
        // ✅ CORREGIDO: Obtener el ID del mensaje insertado
        const insertId = resultado[0].insertId || resultado[0];
        console.log('Mensaje insertado con ID:', insertId);
        // Obtener el mensaje recién creado
        const nuevoMensaje = yield connection_1.default.query(`
      SELECT id_mensaje, id_chat, remitente, contenido, fecha_envio, leido
      FROM mensaje 
      WHERE id_mensaje = ?
    `, {
            replacements: [insertId],
            type: sequelize_1.QueryTypes.SELECT
        });
        if (nuevoMensaje.length === 0) {
            // Si no se puede obtener por ID, obtener el último mensaje del chat
            const ultimoMensaje = yield connection_1.default.query(`
        SELECT id_mensaje, id_chat, remitente, contenido, fecha_envio, leido
        FROM mensaje 
        WHERE id_chat = ? AND remitente = 'psicologo'
        ORDER BY fecha_envio DESC 
        LIMIT 1
      `, {
                replacements: [id_chat],
                type: sequelize_1.QueryTypes.SELECT
            });
            console.log(`Mensaje enviado en chat ${id_chat} por psicólogo ${id_psicologo}`);
            res.json(ultimoMensaje[0]);
        }
        else {
            console.log(`Mensaje enviado en chat ${id_chat} por psicólogo ${id_psicologo}`);
            res.json(nuevoMensaje[0]);
        }
    }
    catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({
            msg: "Error interno del servidor",
            error: error.message
        });
    }
});
exports.enviarMensaje = enviarMensaje;
/**
 * Crear un nuevo chat con un paciente
 */
const crearChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id_paciente } = req.body;
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        console.log('Datos para crear chat:', { id_paciente, id_psicologo });
        if (!id_paciente || !id_psicologo) {
            return res.status(400).json({
                msg: "Faltan campos requeridos",
                campos_requeridos: ["id_paciente"]
            });
        }
        // Verificar que el paciente existe y está asignado al psicólogo
        const pacienteValido = yield connection_1.default.query(`
      SELECT COUNT(*) as count FROM paciente 
      WHERE id_paciente = ? AND id_psicologo = ?
    `, {
            replacements: [id_paciente, id_psicologo],
            type: sequelize_1.QueryTypes.SELECT
        });
        if (pacienteValido[0].count === 0) {
            return res.status(400).json({
                msg: "Paciente no encontrado o no asignado a este psicólogo"
            });
        }
        // Verificar que no existe ya un chat
        const chatExistente = yield connection_1.default.query(`
      SELECT id_chat FROM chat 
      WHERE id_psicologo = ? AND id_paciente = ?
    `, {
            replacements: [id_psicologo, id_paciente],
            type: sequelize_1.QueryTypes.SELECT
        });
        if (chatExistente.length > 0) {
            return res.status(409).json({
                msg: "Ya existe un chat con este paciente",
                chat_existente: chatExistente[0]
            });
        }
        // Crear el nuevo chat
        const resultado = yield connection_1.default.query(`
      INSERT INTO chat (id_psicologo, id_paciente, fecha_inicio) 
      VALUES (?, ?, NOW())
    `, {
            replacements: [id_psicologo, id_paciente],
            type: sequelize_1.QueryTypes.INSERT
        });
        // ✅ CORREGIDO: Obtener el ID del chat
        const insertId = resultado[0].insertId || resultado[0];
        // Obtener el chat recién creado con información del paciente
        const nuevoChat = yield connection_1.default.query(`
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
            type: sequelize_1.QueryTypes.SELECT
        });
        const chatFormateado = {
            id_chat: nuevoChat[0].id_chat,
            id_psicologo: nuevoChat[0].id_psicologo,
            id_paciente: nuevoChat[0].id_paciente,
            fecha_inicio: nuevoChat[0].fecha_inicio,
            paciente: {
                id_paciente: nuevoChat[0].id_paciente,
                nombre: nuevoChat[0].nombre,
                apellido_paterno: nuevoChat[0].apellido_paterno,
                apellido_materno: nuevoChat[0].apellido_materno,
                email: nuevoChat[0].email
            },
            ultimo_mensaje: null,
            mensajes_no_leidos: 0
        };
        console.log(`Chat creado entre psicólogo ${id_psicologo} y paciente ${id_paciente}`);
        res.json(chatFormateado);
    }
    catch (error) {
        console.error('Error al crear chat:', error);
        res.status(500).json({
            msg: "Error interno del servidor",
            error: error.message
        });
    }
});
exports.crearChat = crearChat;
/**
 * Marcar mensajes como leídos
 */
const marcarComoLeido = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id_chat = Number(req.params.id_chat);
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        if (!id_chat || !id_psicologo) {
            return res.status(400).json({ msg: "Parámetros requeridos faltantes" });
        }
        // Verificar que el chat pertenece al psicólogo
        const chatExiste = yield connection_1.default.query(`
      SELECT COUNT(*) as count FROM chat WHERE id_chat = ? AND id_psicologo = ?
    `, {
            replacements: [id_chat, id_psicologo],
            type: sequelize_1.QueryTypes.SELECT
        });
        if (chatExiste[0].count === 0) {
            return res.status(404).json({ msg: "Chat no encontrado o no autorizado" });
        }
        // Marcar mensajes del paciente como leídos
        yield connection_1.default.query(`
      UPDATE mensaje 
      SET leido = 1 
      WHERE id_chat = ? AND remitente = 'paciente' AND leido = 0
    `, {
            replacements: [id_chat],
            type: sequelize_1.QueryTypes.UPDATE
        });
        res.json({ msg: "Mensajes marcados como leídos" });
    }
    catch (error) {
        console.error('Error al marcar como leído:', error);
        res.status(500).json({ msg: "Error interno del servidor", error });
    }
});
exports.marcarComoLeido = marcarComoLeido;
/**
 * Buscar chats por nombre de paciente o contenido de mensaje
 */
const buscarChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const termino = req.query.q;
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        if (!termino || !id_psicologo) {
            return res.status(400).json({ msg: "Término de búsqueda requerido" });
        }
        if (termino.length < 2) {
            return res.status(400).json({ msg: "El término debe tener al menos 2 caracteres" });
        }
        const chats = yield connection_1.default.query(`
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
            type: sequelize_1.QueryTypes.SELECT
        });
        // Formatear la respuesta
        const chatsFormateados = chats.map((chat) => ({
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
                contenido: chat.ultimo_mensaje_contenido,
                remitente: chat.ultimo_mensaje_remitente,
                fecha_envio: chat.ultimo_mensaje_fecha
            } : null,
            mensajes_no_leidos: 0 // No calculamos en búsqueda por performance
        }));
        res.json(chatsFormateados);
    }
    catch (error) {
        console.error('Error en búsqueda de chats:', error);
        res.status(500).json({ msg: "Error interno del servidor", error });
    }
});
exports.buscarChats = buscarChats;
// Verificar si existe chat con un paciente
const verificarChatPaciente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { idPaciente } = req.params;
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        const chat = yield connection_1.default.query(`
            SELECT id_chat FROM chat 
            WHERE id_psicologo = ? AND id_paciente = ?
            LIMIT 1
        `, {
            replacements: [id_psicologo, idPaciente],
            type: sequelize_1.QueryTypes.SELECT
        });
        res.json({
            existe: chat.length > 0,
            idChat: chat.length > 0 ? chat[0].id_chat : null
        });
    }
    catch (error) {
        console.error('Error verificando chat:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.verificarChatPaciente = verificarChatPaciente;
