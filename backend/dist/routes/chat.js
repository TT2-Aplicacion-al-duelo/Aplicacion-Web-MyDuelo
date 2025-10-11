"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/chat.ts
const express_1 = require("express");
const chat_1 = require("../controllers/chat");
const validarToken_1 = __importDefault(require("./validarToken"));
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
exports.default = router;
