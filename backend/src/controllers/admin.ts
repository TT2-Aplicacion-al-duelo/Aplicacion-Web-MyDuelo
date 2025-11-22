// backend/src/controllers/admin.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Psicologo } from '../models/psicologo';
import { Paciente } from '../models/paciente';
import { Op, QueryTypes } from 'sequelize';
import jwt from 'jsonwebtoken';
import { CedulaValidacionService } from '../services/cedulaValidacion.service';
import sequelize from '../database/connection';

// INTERFACE PARA REQUEST CON USER INFO
interface AuthRequest extends Request {
    user?: any;
}

/**
 * Registro especial para administradores (solo para pruebas/setup inicial)
 */
export const registroAdmin = async (req: Request, res: Response) => {
    const { 
        nombre, 
        apellidoPaterno, 
        apellidoMaterno, 
        fecha_nacimiento, 
        especialidad, 
        telefono, 
        contrasena, 
        correo, 
        cedulaProfesional 
    } = req.body;

    //VALIDAR QUE NO EXISTA YA UN ADMIN CON ESE CORREO
    const adminExistente = await Psicologo.findOne({
        where: { 
            [Op.or]: [
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
        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        const nuevoAdmin = await Psicologo.create({
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
                id: (nuevoAdmin as any).id_psicologo,
                nombre: nombre,
                correo: correo,
                rol_admin: true
            }
        });

    } catch (error) {
        console.error('Error creando administrador:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al crear administrador'
        });
    }
};

/**
 * Verificar si el token pertenece a un administrador
 */
export const verificarAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const id_psicologo = req.user?.id_psicologo;
        
        const admin = await Psicologo.findByPk(id_psicologo, {
            attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'correo', 'rol_admin', 'status']
        });

        if (!admin || !(admin as any).rol_admin) {
            return res.status(403).json({
                msg: 'No es administrador'
            });
        }

        res.json({
            msg: 'Token válido',
            admin: {
                id: (admin as any).id_psicologo,
                nombre: (admin as any).nombre,
                apellido: (admin as any).apellidoPaterno,
                correo: (admin as any).correo,
                rol_admin: (admin as any).rol_admin,
                status: (admin as any).status
            }
        });

    } catch (error) {
        console.error('Error verificando admin:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Obtener todos los psicólogos (para administración)
 */
export const getAllPsicologos = async (req: AuthRequest, res: Response) => {
    try {
        const psicologos = await Psicologo.findAll({
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

    } catch (error) {
        console.error('Error obteniendo psicólogos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};


export const cambiarStatusPsicologo = async (req: AuthRequest, res: Response) => {
    try {
        const { id_psicologo } = req.params;
        const { status } = req.body;

        if (!['activo', 'inactivo'].includes(status)) {
            return res.status(400).json({
                msg: 'Status inválido. Debe ser "activo" o "inactivo"'
            });
        }

        const psicologo = await Psicologo.findByPk(id_psicologo);

        if (!psicologo) {
            return res.status(404).json({
                msg: 'Psicólogo no encontrado'
            });
        }

        //EVITAR QUE SE DESHABILITE A SÍ MISMO
        if ((psicologo as any).id_psicologo === req.user?.id_psicologo && status === 'inactivo') {
            return res.status(400).json({
                msg: 'No puedes deshabilitarte a ti mismo'
            });
        }

        await psicologo.update({ status });

        res.json({
            msg: `Psicólogo ${status === 'activo' ? 'habilitado' : 'deshabilitado'} exitosamente`,
            psicologo: {
                id: (psicologo as any).id_psicologo,
                nombre: (psicologo as any).nombre,
                status
            }
        });

    } catch (error) {
        console.error('Error cambiando status:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};


/**
 * Eliminar un psicólogo PERMANENTEMENTE
 */
export const eliminarPsicologo = async (req: AuthRequest, res: Response) => {
    try {
        const { id_psicologo } = req.params;

        const psicologo = await Psicologo.findByPk(id_psicologo);

        if (!psicologo) {
            return res.status(404).json({
                msg: 'Psicólogo no encontrado'
            });
        }

        // EVITAR QUE SE ELIMINE A SÍ MISMO
        if ((psicologo as any).id_psicologo === req.user?.id_psicologo) {
            return res.status(400).json({
                msg: 'No puedes eliminar tu propia cuenta'
            });
        }

        const nombrePsicologo = `${(psicologo as any).nombre} ${(psicologo as any).apellidoPaterno}`;
        const sequelize = psicologo.sequelize;
        
        if (!sequelize) {
            throw new Error('No se pudo obtener la conexión a la base de datos');
        }

        // ✅ INICIAR TRANSACCIÓN para garantizar atomicidad
        const transaction = await sequelize.transaction();

        try {
            console.log(`🗑️ Iniciando eliminación del psicólogo ${id_psicologo}...`);

            // PASO 1: Obtener todos los foros creados por este psicólogo
            const [forosCreados]: any = await sequelize.query(
                'SELECT id_foro FROM foro WHERE id_psicologo_creador = ?',
                { replacements: [id_psicologo], transaction }
            );
            
            const idsForosCreados = forosCreados.map((f: any) => f.id_foro);
            console.log(`📋 Foros creados por el psicólogo: ${idsForosCreados.join(', ') || 'ninguno'}`);

            // PASO 2: Eliminar TODOS los participantes de esos foros
            if (idsForosCreados.length > 0) {
                const placeholders = idsForosCreados.map(() => '?').join(',');
                await sequelize.query(
                    `DELETE FROM foro_participante WHERE id_foro IN (${placeholders})`,
                    { replacements: idsForosCreados, transaction }
                );
                console.log('✅ Todos los participantes de los foros creados eliminados');
            }

            // PASO 3: Eliminar participaciones de este psicólogo en otros foros
            await sequelize.query(
                'DELETE FROM foro_participante WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            console.log('✅ Participaciones del psicólogo en otros foros eliminadas');

            // PASO 4: Eliminar invitaciones de foros
            await sequelize.query(
                'DELETE FROM invitacion_foro WHERE id_psicologo_invitado = ? OR id_psicologo_invitador = ?',
                { replacements: [id_psicologo, id_psicologo], transaction }
            );
            console.log('✅ Invitaciones de foros eliminadas');

            // PASO 5: Eliminar solicitudes de unión a foros
            await sequelize.query(
                'DELETE FROM solicitud_union_foro WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            console.log('✅ Solicitudes de unión eliminadas');

            // PASO 6: Eliminar mensajes de foros donde el psicólogo participó
            if (idsForosCreados.length > 0) {
                const placeholders = idsForosCreados.map(() => '?').join(',');
                await sequelize.query(
                    `DELETE FROM mensaje_foro WHERE id_tema IN (
                        SELECT id_tema FROM tema WHERE id_foro IN (${placeholders})
                    )`,
                    { replacements: idsForosCreados, transaction }
                );
                console.log('✅ Mensajes de foros eliminados');
            }

            // PASO 7: Eliminar temas de los foros creados
            if (idsForosCreados.length > 0) {
                const placeholders = idsForosCreados.map(() => '?').join(',');
                await sequelize.query(
                    `DELETE FROM tema WHERE id_foro IN (${placeholders})`,
                    { replacements: idsForosCreados, transaction }
                );
                console.log('✅ Temas de foros eliminados');
            }

            // PASO 8: Eliminar los foros creados
            if (idsForosCreados.length > 0) {
                await sequelize.query(
                    'DELETE FROM foro WHERE id_psicologo_creador = ?',
                    { replacements: [id_psicologo], transaction }
                );
                console.log('✅ Foros creados eliminados');
            }

            // PASO 9: Actualizar pacientes para desvincularlos
            await sequelize.query(
                'UPDATE paciente SET id_psicologo = NULL WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            console.log('✅ Pacientes desvinculados');

            // ✅ PASO 10: Obtener todas las agendas del psicólogo
            const [agendasPsicologo]: any = await sequelize.query(
                'SELECT id_agenda FROM agenda WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            
            const idsAgendas = agendasPsicologo.map((a: any) => a.id_agenda);
            console.log(`📋 Agendas del psicólogo: ${idsAgendas.join(', ') || 'ninguna'}`);

            //  Eliminar TODAS las citas de esas agendas
            if (idsAgendas.length > 0) {
                const placeholders = idsAgendas.map(() => '?').join(',');
                await sequelize.query(
                    `DELETE FROM cita WHERE id_agenda IN (${placeholders})`,
                    { replacements: idsAgendas, transaction }
                );
                console.log('✅ Citas eliminadas');
            }

            // Eliminar las agendas del psicólogo
            await sequelize.query(
                'DELETE FROM agenda WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            console.log('✅ Agendas eliminadas');

            // Eliminar disponibilidades del psicólogo
            await sequelize.query(
                'DELETE FROM disponibilidad WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            console.log('✅ Disponibilidades eliminadas');

            // Eliminar excepciones de disponibilidad
            await sequelize.query(
                'DELETE FROM excepcion_disponibilidad WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            console.log('✅ Excepciones de disponibilidad eliminadas');

            // PASO 15: Eliminar tokens de recuperación/activación
            await sequelize.query(
                'DELETE FROM token WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            console.log('✅ Tokens eliminados');

            // FINALMENTE, eliminar el psicólogo
            await sequelize.query(
                'DELETE FROM psicologo WHERE id_psicologo = ?',
                { replacements: [id_psicologo], transaction }
            );
            console.log('✅ Psicólogo eliminado');

            //  CONFIRMAR TRANSACCIÓN
            await transaction.commit();

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

        } catch (error) {
            //  REVERTIR TRANSACCIÓN en caso de error
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error(' Error eliminando psicólogo:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al eliminar el psicólogo',
            error: error instanceof Error ? error.message : 'Error desconocido',
            detalle: 'No se pudo completar la eliminación. Se revirtieron todos los cambios.'
        });
    }
};
/**
 *  NUEVO: Validar cédula manualmente (solo por decisión del administrador)
 */
export const validarCedulaManual = async (req: AuthRequest, res: Response) => {
  try {
    const { id_psicologo } = req.params;
    const admin_id = req.user?.id_psicologo;
    const admin_nombre = req.user?.nombre;

    const psicologo = await Psicologo.findByPk(id_psicologo);

    if (!psicologo) {
      return res.status(404).json({
        msg: 'Psicólogo no encontrado'
      });
    }

    const psicologoData = psicologo as any;

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
    await psicologo.update({ 
      cedula_validada: true 
    });

    console.log(`✅ Cédula ${psicologoData.cedula} validada manualmente por admin ${admin_nombre} (ID: ${admin_id})`);

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

  } catch (error) {
    console.error('Error en validación manual de cédula:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Validar cédula profesional usando servicio externo
 */
export const validarCedulaConAPI = async (req: AuthRequest, res: Response) => {
  try {
    const { id_psicologo } = req.params;
    const { forzarValidacion = false } = req.body;

    const psicologo = await Psicologo.findByPk(id_psicologo);

    if (!psicologo) {
      return res.status(404).json({
        msg: 'Psicólogo no encontrado'
      });
    }

    const psicologoData = psicologo as any;
    const nombreCompleto = `${psicologoData.nombre} ${psicologoData.apellidoPaterno} ${psicologoData.apellidoMaterno || ''}`;

    // Validar con API
    const resultadoValidacion = await CedulaValidacionService.validarCedula(
      psicologoData.cedula,
      nombreCompleto,
      psicologoData.apellidoPaterno
    );

    // Si hay error en la API pero se fuerza la validación
    if (!resultadoValidacion.valida && forzarValidacion) {
      await psicologo.update({ 
        cedula_validada: true 
      });

      return res.json({
        msg: 'Cédula validada manualmente por el administrador',
        validacion: {
          valida: true,
          metodo: 'manual',
          administrador: req.user?.nombre
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
      await psicologo.update({ 
        cedula_validada: true 
      });
    }

    res.json({
      msg: resultadoValidacion.valida ? 'Cédula validada exitosamente' : 'Cédula no pudo ser validada',
      validacion: resultadoValidacion,
      urlConsultaManual: CedulaValidacionService.getUrlConsultaOficial(),
      psicologo: {
        id: psicologoData.id_psicologo,
        nombre: nombreCompleto,
        cedula: psicologoData.cedula,
        cedula_validada: resultadoValidacion.valida
      }
    });

  } catch (error: any) { //  CORREGIDO: Tipado explícito
    console.error('Error validando cédula:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: error.message || 'Error desconocido' //  CORREGIDO: Manejo seguro del error
    });
  }
  
};

/**
 * Obtener todos los pacientes con información del psicólogo asignado (CORREGIDO)
 */
export const getAllPacientesAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const pacientes = await Paciente.findAll({
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
        model: Psicologo,
        attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo'],
        required: false // LEFT JOIN para incluir pacientes sin psicólogo
      }],
      order: [['id_paciente', 'DESC']] //  CAMBIADO: ordenar por ID en lugar de createdAt
    });

    // Formatear respuesta
    const pacientesFormateados = pacientes.map((p: any) => ({
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

  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({
      msg: 'Error interno del servidor'
    });
  }
};

/**
 * Reasignar paciente a otro psicólogo
 */
export const reasignarPaciente = async (req: AuthRequest, res: Response) => {
  try {
    const { id_paciente } = req.params;
    const { id_psicologo } = req.body;

    const paciente = await Paciente.findByPk(id_paciente);

    if (!paciente) {
      return res.status(404).json({
        msg: 'Paciente no encontrado'
      });
    }

    // Verificar que el psicólogo existe y está activo
    if (id_psicologo) {
      const psicologo = await Psicologo.findByPk(id_psicologo);
      
      if (!psicologo) {
        return res.status(404).json({
          msg: 'Psicólogo no encontrado'
        });
      }

      if ((psicologo as any).status !== 'activo') {
        return res.status(400).json({
          msg: 'El psicólogo no está activo'
        });
      }
    }

    await paciente.update({ id_psicologo });

    console.log(`Paciente ${id_paciente} reasignado al psicólogo ${id_psicologo}`);

    res.json({
      msg: 'Paciente reasignado correctamente',
      paciente: {
        id: (paciente as any).id_paciente,
        nombre: (paciente as any).nombre,
        nuevo_psicologo: id_psicologo
      }
    });

  } catch (error) {
    console.error('Error reasignando paciente:', error);
    res.status(500).json({
      msg: 'Error interno del servidor'
    });
  }
};


/**
 * Cambiar email_verificado de un paciente
 */
export const cambiarEstadoPaciente = async (req: AuthRequest, res: Response) => {
  try {
    const { id_paciente } = req.params;
    const { email_verificado } = req.body;

    // Validar que sea un valor booleano
    if (typeof email_verificado !== 'boolean') {
      return res.status(400).json({
        msg: 'email_verificado debe ser true o false'
      });
    }

    const paciente = await Paciente.findByPk(id_paciente);

    if (!paciente) {
      return res.status(404).json({
        msg: 'Paciente no encontrado'
      });
    }

    // Actualizar el campo email_verificado
    await paciente.update({ email_verificado });

    console.log(`Paciente ${id_paciente} - email_verificado actualizado a: ${email_verificado}`);

    res.json({
      msg: `Cuenta del paciente ${email_verificado ? 'habilitada' : 'deshabilitada'} exitosamente`,
      paciente: {
        id: (paciente as any).id_paciente,
        nombre: (paciente as any).nombre,
        email_verificado
      }
    });

  } catch (error) {
    console.error('Error cambiando email_verificado del paciente:', error);
    res.status(500).json({
      msg: 'Error interno del servidor'
    });
  }

};

/**
 * Eliminar un paciente PERMANENTEMENTE
 */
export const eliminarPaciente = async (req: AuthRequest, res: Response) => {
    try {
        const { id_paciente } = req.params;

        console.log(`🗑️ Iniciando eliminación del paciente ${id_paciente}`);

        // Verificar que el paciente existe
        const [pacienteExiste]: any = await sequelize.query(
            'SELECT id_paciente, nombre, apellido_paterno FROM paciente WHERE id_paciente = ?',
            { replacements: [id_paciente], type: QueryTypes.SELECT }
        );

        if (!pacienteExiste) {
            return res.status(404).json({ msg: 'Paciente no encontrado' });
        }

        const nombrePaciente = `${pacienteExiste.nombre} ${pacienteExiste.apellido_paterno}`;
        console.log(`📋 Paciente a eliminar: ${nombrePaciente}`);

        // Iniciar transacción para asegurar atomicidad
        const transaction = await sequelize.transaction();

        try {
            // PASO 1: Eliminar mensajes del chat del paciente
            await sequelize.query(
                'DELETE FROM mensaje WHERE id_chat IN (SELECT id_chat FROM chat WHERE id_paciente = ?)',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Mensajes de chat eliminados');

            // PASO 2: Eliminar chats del paciente
            await sequelize.query(
                'DELETE FROM chat WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Chats eliminados');

            // PASO 3: Eliminar mensajes del chat admin del paciente
            await sequelize.query(
                'DELETE FROM mensaje_admin WHERE id_chat_admin IN (SELECT id_chat_admin FROM chat_admin WHERE destinatario_tipo = "paciente" AND destinatario_id = ?)',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Mensajes de chat admin eliminados');

            // PASO 4: Eliminar chats admin del paciente
            await sequelize.query(
                'DELETE FROM chat_admin WHERE destinatario_tipo = "paciente" AND destinatario_id = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Chats admin eliminados');

            // PASO 5: Eliminar notas del paciente
            await sequelize.query(
                'DELETE FROM notas WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Notas eliminadas');

            // PASO 6: Eliminar actividades asignadas al paciente
            await sequelize.query(
                'DELETE FROM actividad_asignada WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Actividades asignadas eliminadas');

            // PASO 7: Eliminar aplicaciones de tests del paciente
            await sequelize.query(
                'DELETE FROM aplicacion_test WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Aplicaciones de tests eliminadas');

            // PASO 8: Eliminar citas del paciente
            await sequelize.query(
                'DELETE FROM cita WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Citas eliminadas');

            // PASO 9: Eliminar participación en foros
            await sequelize.query(
                'DELETE FROM participante_foro WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Participaciones en foros eliminadas');

            // PASO 10: Eliminar invitaciones a foros
            await sequelize.query(
                'DELETE FROM invitacion_foro WHERE id_paciente_invitado = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Invitaciones a foros eliminadas');

            // PASO 11: Eliminar solicitudes de unión a foros
            await sequelize.query(
                'DELETE FROM solicitud_union_foro WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Solicitudes de unión a foros eliminadas');

            // PASO 12: Eliminar mensajes de foro del paciente
            await sequelize.query(
                'DELETE FROM mensaje_foro WHERE tipo_usuario = "paciente" AND id_usuario = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Mensajes de foro eliminados');

            // PASO 13: Eliminar evidencias del paciente
            await sequelize.query(
                'DELETE FROM evidencia WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Evidencias eliminadas');

            // PASO 14: Eliminar tokens del paciente
            await sequelize.query(
                'DELETE FROM token WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Tokens eliminados');

            // PASO 15: FINALMENTE, eliminar el paciente
            await sequelize.query(
                'DELETE FROM paciente WHERE id_paciente = ?',
                { replacements: [id_paciente], transaction }
            );
            console.log('✅ Paciente eliminado');

            // Confirmar transacción
            await transaction.commit();

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
                    tests: true,
                    citas: true,
                    foros: true,
                    evidencias: true,
                    tokens: true
                }
            });

        } catch (error) {
            // Revertir transacción en caso de error
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error eliminando paciente:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al eliminar el paciente',
            error: error instanceof Error ? error.message : 'Error desconocido',
            detalle: 'No se pudo completar la eliminación. Se revirtieron todos los cambios.'
        });
    }
};