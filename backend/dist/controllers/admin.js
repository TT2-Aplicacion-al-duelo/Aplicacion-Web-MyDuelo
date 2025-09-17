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
exports.validarCedulaConAPI = exports.eliminarPsicologo = exports.cambiarStatusPsicologo = exports.getAllPacientes = exports.getAllPsicologos = exports.verificarAdmin = exports.registroAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const psicologo_1 = require("../models/psicologo");
const paciente_1 = require("../models/paciente");
const sequelize_1 = require("sequelize");
const cedulaValidacion_services_1 = require("../services/cedulaValidacion.services");
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
/**
 * Obtener todos los pacientes (para administración)
 */
const getAllPacientes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                'id_psicologo'
            ],
            include: [{
                    model: psicologo_1.Psicologo,
                    attributes: ['nombre', 'apellidoPaterno', 'apellidoMaterno'],
                    required: false
                }],
            order: [['nombre', 'ASC']]
        });
        res.json({
            total: pacientes.length,
            pacientes
        });
    }
    catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.getAllPacientes = getAllPacientes;
/**
 * Validar cédula profesional de un psicólogo
 */
// export const validarCedula = async (req: AuthRequest, res: Response) => {
//     try {
//         const { id_psicologo } = req.params;
//         const { cedula_validada } = req.body;
//         const psicologo = await Psicologo.findByPk(id_psicologo);
//         if (!psicologo) {
//             return res.status(404).json({
//                 msg: 'Psicólogo no encontrado'
//             });
//         }
//         await psicologo.update({ cedula_validada: !!cedula_validada });
//         res.json({
//             msg: `Cédula ${cedula_validada ? 'validada' : 'invalidada'} exitosamente`,
//             psicologo: {
//                 id: (psicologo as any).id_psicologo,
//                 nombre: (psicologo as any).nombre,
//                 cedula: (psicologo as any).cedula,
//                 cedula_validada: !!cedula_validada
//             }
//         });
//     } catch (error) {
//         console.error('Error validando cédula:', error);
//         res.status(500).json({
//             msg: 'Error interno del servidor'
//         });
//     }
// };
/**
 * Cambiar status de un psicólogo (activo/inactivo)
 */
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
 * Eliminar un psicólogo (soft delete - cambiar a status inactivo)
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
        //EVITAR QUE SE ELIMINE A SÍ MISMO
        if (psicologo.id_psicologo === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id_psicologo)) {
            return res.status(400).json({
                msg: 'No puedes eliminar tu propia cuenta'
            });
        }
        // SOFT DELETE - Solo cambiar status
        yield psicologo.update({ status: 'inactivo' });
        res.json({
            msg: 'Psicólogo eliminado exitosamente',
            psicologo: {
                id: psicologo.id_psicologo,
                nombre: psicologo.nombre
            }
        });
    }
    catch (error) {
        console.error('Error eliminando psicólogo:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
});
exports.eliminarPsicologo = eliminarPsicologo;
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
        const resultadoValidacion = yield cedulaValidacion_services_1.CedulaValidacionService.validarCedula(psicologoData.cedula, nombreCompleto, psicologoData.apellidoPaterno);
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
        res.json({
            msg: resultadoValidacion.valida ? 'Cédula validada exitosamente' : 'Cédula no pudo ser validada',
            validacion: resultadoValidacion,
            urlConsultaManual: cedulaValidacion_services_1.CedulaValidacionService.getUrlConsultaOficial(),
            psicologo: {
                id: psicologoData.id_psicologo,
                nombre: nombreCompleto,
                cedula: psicologoData.cedula,
                cedula_validada: resultadoValidacion.valida
            }
        });
    }
    catch (error) { // ✅ CORREGIDO: Tipado explícito
        console.error('Error validando cédula:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
            error: error.message || 'Error desconocido' // ✅ CORREGIDO: Manejo seguro del error
        });
    }
});
exports.validarCedulaConAPI = validarCedulaConAPI;
