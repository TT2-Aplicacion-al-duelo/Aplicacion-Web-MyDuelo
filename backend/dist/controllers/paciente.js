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
exports.getFotoPerfilPaciente = exports.getProximaCitaPaciente = exports.getPacientePorId = exports.getPacientes = exports.registroPaciente = void 0;
const paciente_1 = require("../models/paciente");
const connection_1 = __importDefault(require("../database/connection"));
const sequelize_1 = require("sequelize");
const registroPaciente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, apellidoPaterno, apellidoMaterno } = req.body;
    try {
        paciente_1.Paciente.create({
            nombre: nombre,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            status: 1,
        });
        res.json({
            msg: 'User ${nombre} ${apellido} create success...'
        });
    }
    catch (error) {
        res.status(400).json({ msg: 'El usuario ya existe ${correo} o la credencial ${cedula}' });
    }
});
exports.registroPaciente = registroPaciente;
// ✅ FUNCIÓN CORREGIDA PARA FILTRAR POR PSICÓLOGO
const getPacientes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Extraer id_psicologo del token decodificado
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        if (!id_psicologo) {
            return res.status(400).json({
                msg: 'No se pudo identificar al psicólogo'
            });
        }
        console.log(`Buscando pacientes para psicólogo ID: ${id_psicologo}`);
        const listaPacientes = yield paciente_1.Paciente.findAll({
            where: {
                id_psicologo: id_psicologo
            },
            attributes: [
                'id_paciente',
                'nombre',
                'apellido_paterno',
                'apellido_materno',
                'email',
                'telefono',
                'email_verificado',
                'foto_perfil' // ✅ DESCOMENTADO
            ]
        });
        // ✅ LIMPIAR URLs ANTIGUAS Y CONSTRUIR CORRECTAMENTE
        const baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://api.midueloapp.com'
            : `http://localhost:${process.env.PORT || '3017'}`;
        const pacientesFormateados = listaPacientes.map((paciente) => {
            const pacienteJson = paciente.toJSON();
            // Limpiar foto_perfil
            if (pacienteJson.foto_perfil) {
                // Si es URL antigua de Azure/móvil, limpiarla
                if (pacienteJson.foto_perfil.startsWith('http://192.168') ||
                    pacienteJson.foto_perfil.startsWith('http://20.') ||
                    pacienteJson.foto_perfil.startsWith('http://') ||
                    pacienteJson.foto_perfil.includes(':3000/')) {
                    // Extraer solo el nombre del archivo
                    const fileName = pacienteJson.foto_perfil.split('/').pop();
                    pacienteJson.foto_perfil = fileName;
                }
                // Construir URL completa si no es ya una URL
                if (!pacienteJson.foto_perfil.startsWith('http')) {
                    pacienteJson.foto_perfil = `${baseUrl}/uploads/${pacienteJson.foto_perfil}`;
                }
            }
            return pacienteJson;
        });
        console.log(`Encontrados ${pacientesFormateados.length} pacientes`);
        res.json(pacientesFormateados);
    }
    catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.getPacientes = getPacientes;
// Obtener un paciente específico
const getPacientePorId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        if (!id_psicologo) {
            return res.status(400).json({
                msg: 'No se pudo identificar al psicólogo'
            });
        }
        const paciente = yield paciente_1.Paciente.findOne({
            where: {
                id_paciente: id,
                id_psicologo: id_psicologo
            },
            // ✅ AGREGAR: Incluir explícitamente foto_perfil
            attributes: [
                'id_paciente',
                'nombre',
                'apellido_paterno',
                'apellido_materno',
                'email',
                'telefono',
                'fecha_nacimiento',
                'id_psicologo',
                'email_verificado',
                'foto_perfil' // ⭐ CAMPO FALTANTE
            ]
        });
        if (!paciente) {
            return res.status(404).json({
                msg: 'Paciente no encontrado'
            });
        }
        // ✅ AGREGAR: Limpiar y formatear foto_perfil igual que en getPacientes
        const pacienteJson = paciente.toJSON();
        if (pacienteJson.foto_perfil) {
            // Si es URL antigua de Azure/móvil, limpiarla
            if (pacienteJson.foto_perfil.startsWith('http://192.168') ||
                pacienteJson.foto_perfil.startsWith('http://20.') ||
                pacienteJson.foto_perfil.startsWith('http://') ||
                pacienteJson.foto_perfil.includes(':3000/')) {
                // Extraer solo el nombre del archivo
                const fileName = pacienteJson.foto_perfil.split('/').pop();
                pacienteJson.foto_perfil = fileName;
            }
            // Construir URL completa si no es ya una URL
            if (!pacienteJson.foto_perfil.startsWith('http')) {
                const baseUrl = process.env.NODE_ENV === 'production'
                    ? 'https://api.midueloapp.com'
                    : `http://localhost:${process.env.PORT || '3017'}`;
                pacienteJson.foto_perfil = `${baseUrl}/uploads/${pacienteJson.foto_perfil}`;
            }
        }
        res.json(pacienteJson);
    }
    catch (error) {
        console.error('Error al obtener paciente:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.getPacientePorId = getPacientePorId;
// Obtener próxima cita del paciente
const getProximaCitaPaciente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        // Query para obtener la próxima cita
        const proximaCita = yield connection_1.default.query(`
            SELECT c.* 
            FROM cita c
            JOIN agenda a ON a.id_agenda = c.id_agenda
            WHERE c.id_paciente = ? 
            AND a.id_psicologo = ?
            AND c.fecha >= CURDATE()
            AND c.estado IN ('pendiente', 'confirmada')
            ORDER BY c.fecha ASC, c.hora_inicio ASC
            LIMIT 1
        `, {
            replacements: [id, id_psicologo],
            type: sequelize_1.QueryTypes.SELECT
        });
        res.json(proximaCita[0] || null);
    }
    catch (error) {
        console.error('Error al obtener próxima cita:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.getProximaCitaPaciente = getProximaCitaPaciente;
/**
     * GET /api/psicologo/paciente/:id/foto-perfil
     * Obtener la URL de la foto de perfil del paciente (Azure o local)
     */
const getFotoPerfilPaciente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        const { id } = req.params;
        if (!id_psicologo) {
            return res.status(401).json({ msg: "No autorizado" });
        }
        // Verificar que el paciente pertenece al psicólogo
        const paciente = yield paciente_1.Paciente.findOne({
            where: {
                id_paciente: id,
                id_psicologo
            },
            attributes: ['foto_perfil']
        });
        if (!paciente) {
            return res.status(404).json({ msg: "Paciente no encontrado" });
        }
        let fotoUrl = paciente.foto_perfil;
        // Si la foto no tiene protocolo HTTP, construir la URL local
        if (fotoUrl && !fotoUrl.startsWith('http')) {
            const baseUrl = process.env.NODE_ENV === 'production'
                ? 'https://api.midueloapp.com'
                : `http://localhost:${process.env.PORT || '3017'}`;
            fotoUrl = `${baseUrl}/uploads/${fotoUrl}`;
        }
        res.json({
            foto_url: fotoUrl || null
        });
    }
    catch (error) {
        console.error("Error al obtener foto de perfil:", error);
        res.status(500).json({ msg: "Error al obtener foto de perfil" });
    }
});
exports.getFotoPerfilPaciente = getFotoPerfilPaciente;
