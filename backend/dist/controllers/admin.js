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
exports.eliminarPaciente = exports.cambiarEstadoPaciente = exports.reasignarPaciente = exports.getAllPacientesAdmin = exports.validarCedulaConAPI = exports.validarCedulaManual = exports.eliminarPsicologo = exports.cambiarStatusPsicologo = exports.getAllPsicologos = exports.verificarAdmin = exports.registroAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const psicologo_1 = require("../models/psicologo");
const paciente_1 = require("../models/paciente");
const sequelize_1 = require("sequelize");
const cedulaValidacion_service_1 = require("../services/cedulaValidacion.service");
const connection_1 = __importDefault(require("../database/connection"));
const email_service_1 = __importDefault(require("../services/email.service"));
/**
 * Registro especial para administradores (solo para pruebas/setup inicial)
 */
const registroAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, apellidoPaterno, apellidoMaterno, fecha_nacimiento, especialidad, telefono, contrasena, correo, cedulaProfesional } = req.body;
    //VALIDAR QUE NO EXISTA YA UN ADMIN CON ESE CORREO
    const adminExistente = yield psicologo_1.Psicologo.findOne({
        where: {
            [sequelize_1.Op.or]: [
                { correo: correo },
                { cedula: cedulaProfesional }
            ]
        }
    });
    if (adminExistente) {
        return res.status(400).json({
            msg: `Ya existe un usuario con el correo ${correo} o cédula ${cedulaProfesional}`
        });
    }
    try {
        const contrasenaHash = yield bcrypt_1.default.hash(contrasena, 10);
        const nuevoAdmin = yield psicologo_1.Psicologo.create({
            nombre: nombre,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            fecha_nacimiento: fecha_nacimiento,
            especialidad: especialidad || 'Administrador del Sistema',
            telefono: telefono,
            correo: correo,
            contrasena: contrasenaHash,
            cedula: cedulaProfesional,
            rol_admin: true, // ✅ MARCAR COMO ADMINISTRADOR
            cedula_validada: true, // ✅ ADMIN VIENE PRE-VALIDADO
            status: 'activo'
        });
        res.json({
            msg: `Administrador ${nombre} ${apellidoPaterno} creado exitosamente`,
            admin: {
                id: nuevoAdmin.id_psicologo,
                nombre: nombre,
                correo: correo,
                rol_admin: true
            }
        });
    }
    catch (error) {
        console.error('Error creando administrador:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al crear administrador'
        });
    }
});
exports.registroAdmin = registroAdmin;
/**
 * Verificar si el token pertenece a un administrador
 */
const verificarAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id_psicologo = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        const admin = yield psicologo_1.Psicologo.findByPk(id_psicologo, {
            attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'correo', 'rol_admin', 'status']
        });
        if (!admin || !admin.rol_admin) {
            return res.status(403).json({
                msg: 'No es administrador'
            });
        }
        res.json({
            msg: 'Token válido',
            admin: {
                id: admin.id_psicologo,
                nombre: admin.nombre,
                apellido: admin.apellidoPaterno,
                correo: admin.correo,
                rol_admin: admin.rol_admin,
                status: admin.status
            }
        });
    }
    catch (error) {
        console.error('Error verificando admin:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.verificarAdmin = verificarAdmin;
/**
 * Obtener todos los psicólogos (para administración)
 */
const getAllPsicologos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const psicologos = yield psicologo_1.Psicologo.findAll({
            attributes: [
                'id_psicologo',
                'nombre',
                'apellidoPaterno',
                'apellidoMaterno',
                'correo',
                'telefono',
                'cedula',
                'especialidad',
                'cedula_validada',
                'rol_admin',
                'status',
                'fecha_nacimiento',
                'codigo_vinculacion', // ← AGREGADO
                'createdAt'
            ],
            order: [['createdAt', 'DESC']]
        });
        // ✅ CAMBIO: Devolver array directo
        res.json(psicologos);
    }
    catch (error) {
        console.error('Error obteniendo psicólogos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.getAllPsicologos = getAllPsicologos;
const cambiarStatusPsicologo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id_psicologo } = req.params;
        const { status } = req.body;
        if (!['activo', 'inactivo'].includes(status)) {
            return res.status(400).json({
                msg: 'Status inválido. Debe ser "activo" o "inactivo"'
            });
        }
        const psicologo = yield psicologo_1.Psicologo.findByPk(id_psicologo);
        if (!psicologo) {
            return res.status(404).json({
                msg: 'Psicólogo no encontrado'
            });
        }
        //EVITAR QUE SE DESHABILITE A SÍ MISMO
        if (psicologo.id_psicologo === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo) && status === 'inactivo') {
            return res.status(400).json({
                msg: 'No puedes deshabilitarte a ti mismo'
            });
        }
        yield psicologo.update({ status });
        res.json({
            msg: `Psicólogo ${status === 'activo' ? 'habilitado' : 'deshabilitado'} exitosamente`,
            psicologo: {
                id: psicologo.id_psicologo,
                nombre: psicologo.nombre,
                status
            }
        });
    }
    catch (error) {
        console.error('Error cambiando status:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.cambiarStatusPsicologo = cambiarStatusPsicologo;
/**
 * Eliminar un psicólogo PERMANENTEMENTE
 */
const eliminarPsicologo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id_psicologo } = req.params;
        const psicologo = yield psicologo_1.Psicologo.findByPk(id_psicologo);
        if (!psicologo) {
            return res.status(404).json({
                msg: 'Psicólogo no encontrado'
            });
        }
        // EVITAR QUE SE ELIMINE A SÍ MISMO
        if (psicologo.id_psicologo === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo)) {
            return res.status(400).json({
                msg: 'No puedes eliminar tu propia cuenta'
            });
        }
        const nombrePsicologo = `${psicologo.nombre} ${psicologo.apellidoPaterno}`;
        const sequelize = psicologo.sequelize;
        if (!sequelize) {
            throw new Error('No se pudo obtener la conexión a la base de datos');
        }
        // ✅ INICIAR TRANSACCIÓN para garantizar atomicidad
        const transaction = yield sequelize.transaction();
        try {
            console.log(`🗑️ Iniciando eliminación del psicólogo ${id_psicologo}...`);
            // PASO 1: Obtener todos los foros creados por este psicólogo
            const [forosCreados] = yield sequelize.query('SELECT id_foro FROM foro WHERE id_psicologo_creador = ?', { replacements: [id_psicologo], transaction });
            const idsForosCreados = forosCreados.map((f) => f.id_foro);
            console.log(`📋 Foros creados por el psicólogo: ${idsForosCreados.join(', ') || 'ninguno'}`);
            // PASO 2: Eliminar TODOS los participantes de esos foros
            if (idsForosCreados.length > 0) {
                const placeholders = idsForosCreados.map(() => '?').join(',');
                yield sequelize.query(`DELETE FROM foro_participante WHERE id_foro IN (${placeholders})`, { replacements: idsForosCreados, transaction });
                console.log('✅ Todos los participantes de los foros creados eliminados');
            }
            // PASO 3: Eliminar participaciones de este psicólogo en otros foros
            yield sequelize.query('DELETE FROM foro_participante WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            console.log('✅ Participaciones del psicólogo en otros foros eliminadas');
            // PASO 4: Eliminar invitaciones de foros
            yield sequelize.query('DELETE FROM invitacion_foro WHERE id_psicologo_invitado = ? OR id_psicologo_invitador = ?', { replacements: [id_psicologo, id_psicologo], transaction });
            console.log('✅ Invitaciones de foros eliminadas');
            // PASO 5: Eliminar solicitudes de unión a foros
            yield sequelize.query('DELETE FROM solicitud_union_foro WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            console.log('✅ Solicitudes de unión eliminadas');
            // PASO 6: Eliminar mensajes de foros donde el psicólogo participó
            if (idsForosCreados.length > 0) {
                const placeholders = idsForosCreados.map(() => '?').join(',');
                yield sequelize.query(`DELETE FROM mensaje_foro WHERE id_tema IN (
                        SELECT id_tema FROM tema WHERE id_foro IN (${placeholders})
                    )`, { replacements: idsForosCreados, transaction });
                console.log('✅ Mensajes de foros eliminados');
            }
            // PASO 7: Eliminar temas de los foros creados
            if (idsForosCreados.length > 0) {
                const placeholders = idsForosCreados.map(() => '?').join(',');
                yield sequelize.query(`DELETE FROM tema WHERE id_foro IN (${placeholders})`, { replacements: idsForosCreados, transaction });
                console.log('✅ Temas de foros eliminados');
            }
            // PASO 8: Eliminar los foros creados
            if (idsForosCreados.length > 0) {
                yield sequelize.query('DELETE FROM foro WHERE id_psicologo_creador = ?', { replacements: [id_psicologo], transaction });
                console.log('✅ Foros creados eliminados');
            }
            // PASO 9: Actualizar pacientes para desvincularlos
            yield sequelize.query('UPDATE paciente SET id_psicologo = NULL WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            console.log('✅ Pacientes desvinculados');
            // ✅ PASO 10: Obtener todas las agendas del psicólogo
            const [agendasPsicologo] = yield sequelize.query('SELECT id_agenda FROM agenda WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            const idsAgendas = agendasPsicologo.map((a) => a.id_agenda);
            console.log(`📋 Agendas del psicólogo: ${idsAgendas.join(', ') || 'ninguna'}`);
            //  Eliminar TODAS las citas de esas agendas
            if (idsAgendas.length > 0) {
                const placeholders = idsAgendas.map(() => '?').join(',');
                yield sequelize.query(`DELETE FROM cita WHERE id_agenda IN (${placeholders})`, { replacements: idsAgendas, transaction });
                console.log('✅ Citas eliminadas');
            }
            // Eliminar las agendas del psicólogo
            yield sequelize.query('DELETE FROM agenda WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            console.log('✅ Agendas eliminadas');
            // Eliminar disponibilidades del psicólogo
            yield sequelize.query('DELETE FROM disponibilidad WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            console.log('✅ Disponibilidades eliminadas');
            // Eliminar excepciones de disponibilidad
            yield sequelize.query('DELETE FROM excepcion_disponibilidad WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            console.log('✅ Excepciones de disponibilidad eliminadas');
            // PASO 15: Eliminar tokens de recuperación/activación
            yield sequelize.query('DELETE FROM token WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            console.log('✅ Tokens eliminados');
            // FINALMENTE, eliminar el psicólogo
            yield sequelize.query('DELETE FROM psicologo WHERE id_psicologo = ?', { replacements: [id_psicologo], transaction });
            console.log('✅ Psicólogo eliminado');
            //  CONFIRMAR TRANSACCIÓN
            yield transaction.commit();
            res.json({
                msg: 'Psicólogo eliminado permanentemente junto con todos sus datos asociados',
                psicologo: {
                    id: id_psicologo,
                    nombre: nombrePsicologo
                },
                datos_eliminados: {
                    foros_creados: idsForosCreados.length,
                    agendas: idsAgendas.length,
                    citas: true,
                    disponibilidades: true,
                    participantes_foros: true,
                    invitaciones_foro: true,
                    solicitudes_union: true,
                    mensajes_foro: true,
                    temas_foro: true,
                    pacientes_desvinculados: true,
                    tokens: true
                }
            });
        }
        catch (error) {
            //  REVERTIR TRANSACCIÓN en caso de error
            yield transaction.rollback();
            throw error;
        }
    }
    catch (error) {
        console.error(' Error eliminando psicólogo:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al eliminar el psicólogo',
            error: error instanceof Error ? error.message : 'Error desconocido',
            detalle: 'No se pudo completar la eliminación. Se revirtieron todos los cambios.'
        });
    }
});
exports.eliminarPsicologo = eliminarPsicologo;
/**
 *  NUEVO: Validar cédula manualmente (solo por decisión del administrador)
 */
const validarCedulaManual = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id_psicologo } = req.params;
        const admin_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo;
        const admin_nombre = (_b = req.user) === null || _b === void 0 ? void 0 : _b.nombre;
        const psicologo = yield psicologo_1.Psicologo.findByPk(id_psicologo);
        if (!psicologo) {
            return res.status(404).json({
                msg: 'Psicólogo no encontrado'
            });
        }
        const psicologoData = psicologo;
        // Verificar si ya está validada
        if (psicologoData.cedula_validada) {
            return res.status(400).json({
                msg: 'La cédula ya está validada',
                psicologo: {
                    id: psicologoData.id_psicologo,
                    nombre: `${psicologoData.nombre} ${psicologoData.apellidoPaterno}`,
                    cedula: psicologoData.cedula,
                    cedula_validada: true
                }
            });
        }
        // Actualizar estado de validación
        yield psicologo.update({
            cedula_validada: true
        });
        console.log(`✅ Cédula ${psicologoData.cedula} validada manualmente por admin ${admin_nombre} (ID: ${admin_id})`);
        // ✅ ENVIAR CORREO AUTOMÁTICO DE NOTIFICACIÓN
        try {
            yield email_service_1.default.enviarNotificacionCedulaValidada(psicologoData.correo, psicologoData.nombre);
            console.log(`📧 Correo de validación manual enviado a: ${psicologoData.correo}`);
        }
        catch (emailError) {
            console.error('⚠️ Error al enviar correo de validación:', emailError);
            // No fallar la validación si el correo falla
        }
        res.json({
            msg: `Cédula profesional ${psicologoData.cedula} validada manualmente por el administrador`,
            psicologo: {
                id: psicologoData.id_psicologo,
                nombre: `${psicologoData.nombre} ${psicologoData.apellidoPaterno} ${psicologoData.apellidoMaterno || ''}`,
                cedula: psicologoData.cedula,
                cedula_validada: true
            },
            validacion: {
                metodo: 'manual',
                validado_por: admin_nombre,
                fecha: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error en validación manual de cédula:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.validarCedulaManual = validarCedulaManual;
/**
 * Validar cédula profesional usando servicio externo
 */
const validarCedulaConAPI = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id_psicologo } = req.params;
        const { forzarValidacion = false } = req.body;
        const psicologo = yield psicologo_1.Psicologo.findByPk(id_psicologo);
        if (!psicologo) {
            return res.status(404).json({
                msg: 'Psicólogo no encontrado'
            });
        }
        const psicologoData = psicologo;
        const nombreCompleto = `${psicologoData.nombre} ${psicologoData.apellidoPaterno} ${psicologoData.apellidoMaterno || ''}`;
        // Validar con API
        const resultadoValidacion = yield cedulaValidacion_service_1.CedulaValidacionService.validarCedula(psicologoData.cedula, nombreCompleto, psicologoData.apellidoPaterno);
        // Si hay error en la API pero se fuerza la validación
        if (!resultadoValidacion.valida && forzarValidacion) {
            yield psicologo.update({
                cedula_validada: true
            });
            return res.json({
                msg: 'Cédula validada manualmente por el administrador',
                validacion: {
                    valida: true,
                    metodo: 'manual',
                    administrador: (_a = req.user) === null || _a === void 0 ? void 0 : _a.nombre
                },
                psicologo: {
                    id: psicologoData.id_psicologo,
                    nombre: nombreCompleto,
                    cedula: psicologoData.cedula,
                    cedula_validada: true
                }
            });
        }
        // Actualizar estado basado en validación
        if (resultadoValidacion.valida) {
            yield psicologo.update({
                cedula_validada: true
            });
        }
        // ✅ ENVIAR CORREO AUTOMÁTICO DE NOTIFICACIÓN
        try {
            yield email_service_1.default.enviarNotificacionCedulaValidada(psicologoData.correo, psicologoData.nombre);
            console.log(`📧 Correo de validación enviado a: ${psicologoData.correo}`);
        }
        catch (emailError) {
            console.error('⚠️ Error al enviar correo de validación:', emailError);
            // No fallar la validación si el correo falla
        }
        res.json({
            msg: resultadoValidacion.valida ? 'Cédula validada exitosamente' : 'Cédula no pudo ser validada',
            validacion: resultadoValidacion,
            urlConsultaManual: cedulaValidacion_service_1.CedulaValidacionService.getUrlConsultaOficial(),
            psicologo: {
                id: psicologoData.id_psicologo,
                nombre: nombreCompleto,
                cedula: psicologoData.cedula,
                cedula_validada: resultadoValidacion.valida
            }
        });
    }
    catch (error) { //  CORREGIDO: Tipado explícito
        console.error('Error validando cédula:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
            error: error.message || 'Error desconocido' //  CORREGIDO: Manejo seguro del error
        });
    }
});
exports.validarCedulaConAPI = validarCedulaConAPI;
/**
 * Obtener todos los pacientes con información del psicólogo asignado (CORREGIDO)
 */
const getAllPacientesAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pacientes = yield paciente_1.Paciente.findAll({
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
            ],
            include: [{
                    model: psicologo_1.Psicologo,
                    attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo'],
                    required: false // LEFT JOIN para incluir pacientes sin psicólogo
                }],
            order: [['id_paciente', 'DESC']] //  CAMBIADO: ordenar por ID en lugar de createdAt
        });
        // Formatear respuesta
        const pacientesFormateados = pacientes.map((p) => ({
            id_paciente: p.id_paciente,
            nombre: p.nombre,
            apellido_paterno: p.apellido_paterno,
            apellido_materno: p.apellido_materno,
            email: p.email,
            telefono: p.telefono,
            fecha_nacimiento: p.fecha_nacimiento,
            id_psicologo: p.id_psicologo,
            psicologo: p.psicologo ? {
                id_psicologo: p.psicologo.id_psicologo,
                nombre: p.psicologo.nombre,
                apellidoPaterno: p.psicologo.apellidoPaterno,
                apellidoMaterno: p.psicologo.apellidoMaterno,
                correo: p.psicologo.correo
            } : null,
            //status: 'activo'
            // status: p.email_verificado ? 'activo' : 'inactivo', //  Status real basado en email_verificado
            // email_verificado: p.email_verificado //  Campo adicional para el frontend
            email_verificado: p.email_verificado //Campo real de la base de datos
        }));
        res.json(pacientesFormateados);
    }
    catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.getAllPacientesAdmin = getAllPacientesAdmin;
/**
 * Reasignar paciente a otro psicólogo
 */
const reasignarPaciente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_paciente } = req.params;
        const { id_psicologo } = req.body;
        const paciente = yield paciente_1.Paciente.findByPk(id_paciente);
        if (!paciente) {
            return res.status(404).json({
                msg: 'Paciente no encontrado'
            });
        }
        // Verificar que el psicólogo existe y está activo
        if (id_psicologo) {
            const psicologo = yield psicologo_1.Psicologo.findByPk(id_psicologo);
            if (!psicologo) {
                return res.status(404).json({
                    msg: 'Psicólogo no encontrado'
                });
            }
            if (psicologo.status !== 'activo') {
                return res.status(400).json({
                    msg: 'El psicólogo no está activo'
                });
            }
        }
        yield paciente.update({ id_psicologo });
        console.log(`Paciente ${id_paciente} reasignado al psicólogo ${id_psicologo}`);
        res.json({
            msg: 'Paciente reasignado correctamente',
            paciente: {
                id: paciente.id_paciente,
                nombre: paciente.nombre,
                nuevo_psicologo: id_psicologo
            }
        });
    }
    catch (error) {
        console.error('Error reasignando paciente:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.reasignarPaciente = reasignarPaciente;
/**
 * Cambiar email_verificado de un paciente
 */
const cambiarEstadoPaciente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_paciente } = req.params;
        const { email_verificado } = req.body;
        // Validar que sea un valor booleano
        if (typeof email_verificado !== 'boolean') {
            return res.status(400).json({
                msg: 'email_verificado debe ser true o false'
            });
        }
        const paciente = yield paciente_1.Paciente.findByPk(id_paciente);
        if (!paciente) {
            return res.status(404).json({
                msg: 'Paciente no encontrado'
            });
        }
        // Actualizar el campo email_verificado
        yield paciente.update({ email_verificado });
        console.log(`Paciente ${id_paciente} - email_verificado actualizado a: ${email_verificado}`);
        res.json({
            msg: `Cuenta del paciente ${email_verificado ? 'habilitada' : 'deshabilitada'} exitosamente`,
            paciente: {
                id: paciente.id_paciente,
                nombre: paciente.nombre,
                email_verificado
            }
        });
    }
    catch (error) {
        console.error('Error cambiando email_verificado del paciente:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.cambiarEstadoPaciente = cambiarEstadoPaciente;
/**
 * Eliminar un paciente PERMANENTEMENTE
 */
const eliminarPaciente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_paciente } = req.params;
        console.log(`🗑️ Iniciando eliminación del paciente ${id_paciente}`);
        // Verificar que el paciente existe
        const [pacienteExiste] = yield connection_1.default.query('SELECT id_paciente, nombre, apellido_paterno FROM paciente WHERE id_paciente = ?', { replacements: [id_paciente], type: sequelize_1.QueryTypes.SELECT });
        if (!pacienteExiste) {
            return res.status(404).json({ msg: 'Paciente no encontrado' });
        }
        const nombrePaciente = `${pacienteExiste.nombre} ${pacienteExiste.apellido_paterno}`;
        console.log(`📋 Paciente a eliminar: ${nombrePaciente}`);
        // Iniciar transacción para asegurar atomicidad
        const transaction = yield connection_1.default.transaction();
        try {
            // PASO 1: Eliminar mensajes del chat del paciente
            yield connection_1.default.query('DELETE FROM mensaje WHERE id_chat IN (SELECT id_chat FROM chat WHERE id_paciente = ?)', { replacements: [id_paciente], transaction });
            console.log('✅ Mensajes de chat eliminados');
            // PASO 2: Eliminar chats del paciente
            yield connection_1.default.query('DELETE FROM chat WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Chats eliminados');
            // PASO 3: Eliminar mensajes del chat admin del paciente
            yield connection_1.default.query('DELETE FROM mensaje_admin WHERE id_chat_admin IN (SELECT id_chat_admin FROM chat_admin WHERE destinatario_tipo = "paciente" AND destinatario_id = ?)', { replacements: [id_paciente], transaction });
            console.log('✅ Mensajes de chat admin eliminados');
            // PASO 4: Eliminar chats admin del paciente
            yield connection_1.default.query('DELETE FROM chat_admin WHERE destinatario_tipo = "paciente" AND destinatario_id = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Chats admin eliminados');
            // PASO 5: Eliminar notas del paciente
            yield connection_1.default.query('DELETE FROM nota WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Notas eliminadas');
            // PASO 6: Eliminar respuestas de tests del paciente
            yield connection_1.default.query('DELETE FROM respuesta_test WHERE id_aplicacion IN (SELECT id_aplicacion FROM aplicacion_test WHERE id_paciente = ?)', { replacements: [id_paciente], transaction });
            console.log('✅ Respuestas de tests eliminadas');
            // PASO 7: Eliminar resultados de tests del paciente
            yield connection_1.default.query('DELETE FROM resultado_test WHERE id_aplicacion IN (SELECT id_aplicacion FROM aplicacion_test WHERE id_paciente = ?)', { replacements: [id_paciente], transaction });
            console.log('✅ Resultados de tests eliminados');
            // PASO 8: Eliminar aplicaciones de tests del paciente
            yield connection_1.default.query('DELETE FROM aplicacion_test WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Aplicaciones de tests eliminadas');
            // PASO 9: Eliminar actividades asignadas (esto eliminará evidencias automáticamente por CASCADE)
            yield connection_1.default.query('DELETE FROM actividad_asignada WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Actividades asignadas eliminadas (evidencias eliminadas automáticamente)');
            // PASO 10: Eliminar actividades del paciente
            yield connection_1.default.query('DELETE FROM actividad_paciente WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Actividades del paciente eliminadas');
            // PASO 11: Eliminar citas (esto eliminará recordatorios automáticamente por CASCADE)
            yield connection_1.default.query('DELETE FROM cita WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Citas eliminadas (recordatorios eliminados automáticamente)');
            // PASO 12: Eliminar participación en foros
            yield connection_1.default.query('DELETE FROM foro_participante WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Participaciones en foros eliminadas');
            // PASO 13: Eliminar solicitudes de unión a foros
            yield connection_1.default.query('DELETE FROM solicitud_union_foro WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Solicitudes de unión a foros eliminadas');
            // PASO 14: Eliminar mensajes de foro del paciente
            yield connection_1.default.query('DELETE FROM mensaje_foro WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Mensajes de foro eliminados');
            // PASO 15: Eliminar diario de emociones del paciente
            yield connection_1.default.query('DELETE FROM diario_emociones WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Diario de emociones eliminado');
            // PASO 16: Eliminar historial clínico del paciente
            yield connection_1.default.query('DELETE FROM historial_clinico WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Historial clínico eliminado');
            // PASO 17: Eliminar tokens push del paciente
            yield connection_1.default.query('DELETE FROM paciente_push_tokens WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Tokens push eliminados');
            // PASO 18: Eliminar consentimientos del paciente
            yield connection_1.default.query('DELETE FROM consentimientos WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Consentimientos eliminados');
            // PASO 20: FINALMENTE, eliminar el paciente
            yield connection_1.default.query('DELETE FROM paciente WHERE id_paciente = ?', { replacements: [id_paciente], transaction });
            console.log('✅ Paciente eliminado');
            // Confirmar transacción
            yield transaction.commit();
            res.json({
                msg: 'Paciente eliminado permanentemente junto con todos sus datos asociados',
                paciente: {
                    id: id_paciente,
                    nombre: nombrePaciente
                },
                datos_eliminados: {
                    chats: true,
                    mensajes: true,
                    notas: true,
                    actividades: true,
                    evidencias: true, // Eliminadas automáticamente
                    tests: true,
                    citas: true,
                    recordatorios: true, // Eliminados automáticamente
                    foros: true,
                    diario_emociones: true,
                    historial_clinico: true,
                    consentimientos: true,
                    tokens: true
                }
            });
        }
        catch (error) {
            // Revertir transacción en caso de error
            yield transaction.rollback();
            throw error;
        }
    }
    catch (error) {
        console.error('❌ Error eliminando paciente:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al eliminar el paciente',
            error: error instanceof Error ? error.message : 'Error desconocido',
            detalle: 'No se pudo completar la eliminación. Se revirtieron todos los cambios.'
        });
    }
});
exports.eliminarPaciente = eliminarPaciente;
