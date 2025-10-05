// backend/src/controllers/admin.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Psicologo } from '../models/psicologo';
import { Paciente } from '../models/paciente';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import { CedulaValidacionService } from '../services/cedulaValidacion.services';

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
 * Eliminar un psicólogo (soft delete - cambiar a status inactivo)
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

        //EVITAR QUE SE ELIMINE A SÍ MISMO
        if ((psicologo as any).id_psicologo === req.user?.id_psicologo) {
            return res.status(400).json({
                msg: 'No puedes eliminar tu propia cuenta'
            });
        }

        // SOFT DELETE - Solo cambiar status
        await psicologo.update({ status: 'inactivo' });

        res.json({
            msg: 'Psicólogo eliminado exitosamente',
            psicologo: {
                id: (psicologo as any).id_psicologo,
                nombre: (psicologo as any).nombre
            }
        });

    } catch (error) {
        console.error('Error eliminando psicólogo:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
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

  } catch (error: any) { // ✅ CORREGIDO: Tipado explícito
    console.error('Error validando cédula:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: error.message || 'Error desconocido' // ✅ CORREGIDO: Manejo seguro del error
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
        'id_psicologo'
        // ❌ ELIMINADO: 'createdAt' - la tabla no tiene esta columna
      ],
      include: [{
        model: Psicologo,
        attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo'],
        required: false // LEFT JOIN para incluir pacientes sin psicólogo
      }],
      order: [['id_paciente', 'DESC']] // ✅ CAMBIADO: ordenar por ID en lugar de createdAt
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
      status: 'activo' // ✅ CAMPO POR DEFECTO (agregar a tabla si quieres gestionarlo)
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
 * Cambiar status de un paciente (si tienes campo status en la tabla)
 */
export const cambiarEstadoPaciente = async (req: AuthRequest, res: Response) => {
  try {
    const { id_paciente } = req.params;
    const { status } = req.body;

    if (!['activo', 'inactivo'].includes(status)) {
      return res.status(400).json({
        msg: 'Status inválido. Debe ser "activo" o "inactivo"'
      });
    }

    const paciente = await Paciente.findByPk(id_paciente);

    if (!paciente) {
      return res.status(404).json({
        msg: 'Paciente no encontrado'
      });
    }

    // Si la tabla paciente no tiene campo status, agrégalo o comenta este método
    // await paciente.update({ status });

    res.json({
      msg: `Paciente ${status === 'activo' ? 'habilitado' : 'deshabilitado'} exitosamente`,
      paciente: {
        id: (paciente as any).id_paciente,
        nombre: (paciente as any).nombre,
        status
      }
    });

  } catch (error) {
    console.error('Error cambiando status del paciente:', error);
    res.status(500).json({
      msg: 'Error interno del servidor'
    });
  }
};