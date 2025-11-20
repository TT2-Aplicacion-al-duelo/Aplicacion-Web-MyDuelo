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
const express_1 = require("express");
const chat_1 = require("../controllers/chat");
const validarToken_1 = __importDefault(require("./validarToken"));
const connection_1 = __importDefault(require("../database/connection"));
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// ===== RUTAS DE CHAT =====
// Obtener todos los chats del psicólogo
router.get("/api/psicologo/chats", validarToken_1.default, chat_1.getChats);
// Buscar chats
router.get("/api/psicologo/chats/buscar", validarToken_1.default, chat_1.buscarChats);
// Obtener mensajes de un chat específico
router.get("/api/psicologo/chats/:id_chat/mensajes", validarToken_1.default, chat_1.getMensajes);
// Marcar mensajes como leídos
router.put("/api/psicologo/chats/:id_chat/leer", validarToken_1.default, chat_1.marcarComoLeido);
// Crear nuevo chat
router.post("/api/psicologo/chats", validarToken_1.default, chat_1.crearChat);
// ===== RUTAS DE MENSAJES =====
// Enviar mensaje
router.post("/api/psicologo/mensajes", validarToken_1.default, chat_1.enviarMensaje);
router.get("/api/psicologo/chat/verificar/:idPaciente", validarToken_1.default, chat_1.verificarChatPaciente);
const aes_crypto_1 = require("../utils/aes-crypto"); // ← AGREGAR ESTA IMPORTACIÓN AL INICIO DEL ARCHIVO
// Obtener mensajes de un chat con admin - CON DESCIFRADO
router.get("/api/psicologo/chats/admin/:id_chat_admin/mensajes", validarToken_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id_chat_admin = parseInt(req.params.id_chat_admin);
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        // Obtener mensajes cifrados de la base de datos
        const mensajesCifrados = yield connection_1.default.query(`
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
            type: sequelize_1.QueryTypes.SELECT
        });
        // DESCIFRAR MENSAJES ANTES DE ENVIARLOS AL FRONTEND
        const mensajesDescifrados = (0, aes_crypto_1.decryptMessages)(mensajesCifrados);
        console.log(`Se descifraron ${mensajesDescifrados.length} mensajes del chat admin ${id_chat_admin}`);
        // res.json(mensajesDescifrados);
        // ✅ CONVERTIR fecha_envio a string
        const mensajesConFechaString = mensajesDescifrados.map(mensaje => (Object.assign(Object.assign({}, mensaje), { fecha_envio: mensaje.fecha_envio
                ? new Date(mensaje.fecha_envio).toISOString().replace('T', ' ').substring(0, 19)
                : null })));
        res.json(mensajesConFechaString);
    }
    catch (error) {
        console.error('Error al obtener mensajes de admin:', error);
        res.status(500).json({ msg: "Error interno del servidor", error });
    }
}));
// Enviar mensaje a admin
router.post("/api/psicologo/chats/admin/mensajes", validarToken_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id_chat_admin, contenido } = req.body;
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        if (!id_chat_admin || !contenido) {
            return res.status(400).json({ msg: "Faltan campos requeridos" });
        }
        // Insertar el mensaje
        const resultado = yield connection_1.default.query(`
      INSERT INTO mensaje_admin (id_chat_admin, remitente, contenido, fecha_envio, leido) 
      VALUES (?, 'usuario', ?, CONVERT_TZ(NOW(), @@session.time_zone, '-06:00'), 1)
    `, {
            replacements: [id_chat_admin, contenido.trim()],
            type: sequelize_1.QueryTypes.INSERT
        });
        // Obtener insertId correctamente
        const insertId = Array.isArray(resultado[0]) ? resultado[0] : resultado[0];
        // Obtener el mensaje recién creado
        const nuevoMensaje = yield connection_1.default.query(`
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
            type: sequelize_1.QueryTypes.SELECT
        });
        res.json(nuevoMensaje[0]);
    }
    catch (error) {
        console.error('Error al enviar mensaje a admin:', error);
        res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
}));
// Marcar mensajes de admin como leídos
router.put("/api/psicologo/chats/admin/:id_chat_admin/leer", validarToken_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id_chat_admin = parseInt(req.params.id_chat_admin);
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        yield connection_1.default.query(`
      UPDATE mensaje_admin 
      SET leido = 1 
      WHERE id_chat_admin = ? AND remitente = 'admin' AND leido = 0
    `, {
            replacements: [id_chat_admin],
            type: sequelize_1.QueryTypes.UPDATE
        });
        res.json({ msg: "Mensajes marcados como leídos" });
    }
    catch (error) {
        console.error('Error al marcar como leído:', error);
        res.status(500).json({ msg: "Error interno del servidor", error });
    }
}));
exports.default = router;
