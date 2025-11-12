// backend/src/services/foro.service.ts
import { Op } from 'sequelize';
import Foro from '../models/foro/foro';
import ForoParticipante from '../models/foro/foro-participante';
import Tema from '../models/foro/tema';
import MensajeForo from '../models/foro/mensaje-foro';
import InvitacionForo from '../models/foro/inivitacion';
import {
  CreateForoRequest,
  ForoResponse,
  TemaResponse,
  MensajeResponse,
  ParticipanteResponse,
  InvitacionResponse,
  PaginatedResponse,
  ListForosQuery,
} from '../types/foro';
import sequelize from '../database/connection';
import { Paciente } from '../models/paciente';
import { Psicologo } from '../models/psicologo';
import ModeracionLog from '../models/foro/moderacion-log';
import { decryptMessage, encryptMessage } from '../utils/aes-crypto';

export class ForoService {
  /**
   * Crear un nuevo foro
   * Nota: El trigger de la BD automáticamente asigna al creador como admin
   */
  async crearForo(data: CreateForoRequest): Promise<ForoResponse> {
    const foro = await Foro.create({
      titulo: data.titulo,
      descripcion: data.descripcion,
      publico: data.publico,
      id_psicologo_creador: data.id_psicologo_creador,
    });

    return this.obtenerForoPorId(foro.id_foro, data.id_psicologo_creador, 'psicologo');
  }

  /**
   * Listar foros con filtros y paginación
   */
  async listarForos(
    query: ListForosQuery,
    userId?: number,
    userType?: 'psicologo' | 'paciente'
  ): Promise<PaginatedResponse<ForoResponse>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    const whereClause: any = { activo: true };

    // Filtro por público
    if (query.publico !== undefined) {
      whereClause.publico = query.publico === 'true';
    }

    // Búsqueda por título o descripción
    if (query.buscar) {
      whereClause[Op.or] = [
        { titulo: { [Op.like]: `%${query.buscar}%` } },
        { descripcion: { [Op.like]: `%${query.buscar}%` } },
      ];
    }

    // Ordenamiento
    let order: any = [['fecha_creacion', 'DESC']];
    if (query.ordenar === 'antiguos') {
      order = [['fecha_creacion', 'ASC']];
    }

    const { count, rows } = await Foro.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order,
      include: [
        {
          model: sequelize.models.psicologo,
          as: 'creador',
          attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'especialidad'],
        },
      ],
    });

    const forosConInfo = await Promise.all(
      rows.map(async (foro) => {
        const totalParticipantes = await ForoParticipante.count({
          where: { id_foro: foro.id_foro },
        });

        const totalTemas = await Tema.count({
          where: { id_foro: foro.id_foro },
        });

        let esParticipante = false;
        let rolUsuario = null;

        if (userId && userType) {
          const participante = await ForoParticipante.findOne({
            where: {
              id_foro: foro.id_foro,
              tipo_usuario: userType,
              ...(userType === 'psicologo'
                ? { id_psicologo: userId }
                : { id_paciente: userId }),
            },
          });

          esParticipante = !!participante;
          rolUsuario = participante?.rol || null;
        }

        return {
          ...foro.toJSON(),
          total_participantes: totalParticipantes,
          total_temas: totalTemas,
          es_participante: esParticipante,
          rol_usuario: rolUsuario,
        };
      })
    );

    return {
      data: forosConInfo,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Obtener detalles de un foro
   */
  async obtenerForoPorId(
    idForo: number,
    userId?: number,
    userType?: 'psicologo' | 'paciente'
  ): Promise<ForoResponse> {
    const foro = await Foro.findOne({
      where: { id_foro: idForo, activo: true },
      include: [
        {
          model: sequelize.models.psicologo,
          as: 'creador',
          attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'especialidad'],
        },
      ],
    });

    if (!foro) {
      throw new Error('Foro no encontrado');
    }

    const totalParticipantes = await ForoParticipante.count({
      where: { id_foro: idForo },
    });

    const totalTemas = await Tema.count({
      where: { id_foro: idForo },
    });

    let esParticipante = false;
    let rolUsuario = null;

    if (userId && userType) {
      const participante = await ForoParticipante.findOne({
        where: {
          id_foro: idForo,
          tipo_usuario: userType,
          ...(userType === 'psicologo'
            ? { id_psicologo: userId }
            : { id_paciente: userId }),
        },
      });

      esParticipante = !!participante;
      rolUsuario = participante?.rol || null;
    }

    return {
      ...foro.toJSON(),
      total_participantes: totalParticipantes,
      total_temas: totalTemas,
      es_participante: esParticipante,
      rol_usuario: rolUsuario,
    };
  }

  /**
   * Actualizar un foro (solo admin)
   */
  async actualizarForo(
    idForo: number,
    updates: Partial<CreateForoRequest>
  ): Promise<ForoResponse> {
    const foro = await Foro.findByPk(idForo);

    if (!foro) {
      throw new Error('Foro no encontrado');
    }

    await foro.update(updates);
    return this.obtenerForoPorId(idForo);
  }

  /**
   * Eliminar un foro (soft delete)
   */
  async eliminarForo(idForo: number): Promise<void> {
    const foro = await Foro.findByPk(idForo);

    if (!foro) {
      throw new Error('Foro no encontrado');
    }

    await foro.update({ activo: false });
  }

  /**
   * Unirse a un foro público (pacientes)
   */
  async unirseAForo(idForo: number, idPaciente: number): Promise<void> {
    const foro = await Foro.findOne({
      where: { id_foro: idForo, activo: true, publico: true },
    });

    if (!foro) {
      throw new Error('Foro no encontrado o no es público');
    }

    // Verificar si ya es participante
    const yaEsParticipante = await ForoParticipante.findOne({
      where: {
        id_foro: idForo,
        id_paciente: idPaciente,
      },
    });

    if (yaEsParticipante) {
      throw new Error('Ya eres participante de este foro');
    }

    await ForoParticipante.create({
      id_foro: idForo,
      tipo_usuario: 'paciente',
      id_paciente: idPaciente,
      rol: 'miembro',
    });
  }

  /**
   * Listar participantes de un foro
   */
  async listarParticipantes(idForo: number): Promise<ParticipanteResponse[]> {
    const participantes = await ForoParticipante.findAll({
      where: { id_foro: idForo },
      order: [
        ['rol', 'ASC'],
        ['fecha_union', 'DESC'],
      ],
      include: [
        {
          model: sequelize.models.psicologo,
          as: 'psicologo',
          attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'especialidad'],
        },
        {
          model: Paciente,  // ✅ Import directo
          as: 'paciente',
          attributes: ['id_paciente', 'nombre', 'apellido_paterno'],  // ✅ snake_case correcto
          required: false,
        },
      ],
    });

    return participantes.map((p) => ({
      id_participante: p.id_participante,
      tipo_usuario: p.tipo_usuario,
      rol: p.rol,
      fecha_union: p.fecha_union,
      usuario:
        p.tipo_usuario === 'psicologo'
          ? {
              id: p.id_psicologo!,
              nombre: (p as any).psicologo.nombre,
              apellido: (p as any).psicologo.apellidoPaterno,
              especialidad: (p as any).psicologo.especialidad,
            }
          : {
              id: p.id_paciente!,
              nombre: (p as any).paciente.nombre,
              apellido: (p as any).paciente.apellido_Paterno,
            },
    }));
  }

  /**
   * Invitar un psicólogo como moderador
   */
  async invitarModerador(
    idForo: number,
    idPsicologoInvitado: number,
    idPsicologoInvitador: number,
    mensaje?: string
  ): Promise<InvitacionResponse> {
    // Verificar que el invitado no es ya participante
    const yaEsParticipante = await ForoParticipante.findOne({
      where: {
        id_foro: idForo,
        id_psicologo: idPsicologoInvitado,
      },
    });

    if (yaEsParticipante) {
      throw new Error('Este psicólogo ya es participante del foro');
    }

    // Verificar que no hay invitación pendiente
    const invitacionPendiente = await InvitacionForo.findOne({
      where: {
        id_foro: idForo,
        id_psicologo_invitado: idPsicologoInvitado,
        estado: 'pendiente',
      },
    });

    if (invitacionPendiente) {
      throw new Error('Ya existe una invitación pendiente para este psicólogo');
    }

    const invitacion = await InvitacionForo.create({
      id_foro: idForo,
      id_psicologo_invitado: idPsicologoInvitado,
      id_psicologo_invitador: idPsicologoInvitador,
      rol_ofrecido: 'moderador',
      mensaje,
    });

    return this.obtenerInvitacionPorId(invitacion.id_invitacion);
  }

  /**
   * Obtener invitación por ID
   */
  async obtenerInvitacionPorId(idInvitacion: number): Promise<InvitacionResponse> {
    const invitacion = await InvitacionForo.findByPk(idInvitacion, {
      include: [
        {
          model: Foro,
          as: 'foro',
          attributes: ['id_foro', 'titulo', 'descripcion'],
        },
        {
          model: sequelize.models.psicologo,
          as: 'invitador',
          attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
        },
      ],
    });

    if (!invitacion) {
      throw new Error('Invitación no encontrada');
    }

    return {
      id_invitacion: invitacion.id_invitacion,
      id_foro: invitacion.id_foro,
      estado: invitacion.estado,
      rol_ofrecido: invitacion.rol_ofrecido,
      mensaje: invitacion.mensaje,
      fecha_invitacion: invitacion.fecha_invitacion,
      fecha_respuesta: invitacion.fecha_respuesta,
      foro: (invitacion as any).foro,
      invitador: (invitacion as any).invitador,
    };
  }

  /**
   * Listar invitaciones de un psicólogo
   */
  async listarInvitacionesPsicologo(
    idPsicologo: number,
    estado?: 'pendiente' | 'aceptada' | 'rechazada'
  ): Promise<InvitacionResponse[]> {
    const whereClause: any = { id_psicologo_invitado: idPsicologo };
    
    if (estado) {
      whereClause.estado = estado;
    }

    const invitaciones = await InvitacionForo.findAll({
      where: whereClause,
      order: [['fecha_invitacion', 'DESC']],
      include: [
        {
          model: Foro,
          as: 'foro',
          attributes: ['id_foro', 'titulo', 'descripcion'],
        },
        {
          model: sequelize.models.psicologo,
          as: 'invitador',
          attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
        },
      ],
    });

    return invitaciones.map((inv) => ({
      id_invitacion: inv.id_invitacion,
      id_foro: inv.id_foro,
      estado: inv.estado,
      rol_ofrecido: inv.rol_ofrecido,
      mensaje: inv.mensaje,
      fecha_invitacion: inv.fecha_invitacion,
      fecha_respuesta: inv.fecha_respuesta,
      foro: (inv as any).foro,
      invitador: (inv as any).invitador,
    }));
  }

  /**
   * Responder a una invitación
   */
  async responderInvitacion(
    idInvitacion: number,
    idPsicologo: number,
    aceptar: boolean
  ): Promise<void> {
    const invitacion = await InvitacionForo.findOne({
      where: {
        id_invitacion: idInvitacion,
        id_psicologo_invitado: idPsicologo,
        estado: 'pendiente',
      },
    });

    if (!invitacion) {
      throw new Error('Invitación no encontrada o ya fue respondida');
    }

    const nuevoEstado = aceptar ? 'aceptada' : 'rechazada';
    
    await invitacion.update({
      estado: nuevoEstado,
      fecha_respuesta: new Date(),
    });

    // Si aceptó, agregarlo como moderador
    if (aceptar) {
      await ForoParticipante.create({
        id_foro: invitacion.id_foro,
        tipo_usuario: 'psicologo',
        id_psicologo: idPsicologo,
        rol: 'moderador',
      });
    }
  }

  // ========== TEMAS ==========

  /**
   * Crear un tema en un foro
   */
  async crearTema(
    idForo: number,
    titulo: string,
    descripcion?: string
  ): Promise<TemaResponse> {
    const tema = await Tema.create({
      id_foro: idForo,
      titulo,
      descripcion,
      cerrado: false,
      fijado: false
    });

    return {
      id_tema: tema.id_tema,
      id_foro: tema.id_foro,
      titulo: tema.titulo,
      descripcion: tema.descripcion,
      fecha_creacion: tema.fecha_creacion,
      total_mensajes: 0,
    };
  }

  /**
 * Listar temas de un foro (con soporte para cerrados y fijados)
 */
  async listarTemas(
    idForo: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<TemaResponse>> {
    const offset = (page - 1) * limit;

    const { count, rows } = await Tema.findAndCountAll({
      where: { id_foro: idForo },
      // ✅ FASE 3: Ordenar por fijados primero, luego por fecha
      order: [
        ['fijado', 'DESC'],
        ['fecha_creacion', 'DESC'],
      ],
      limit,
      offset,
    });

    const temasConInfo = await Promise.all(
      rows.map(async (tema: Tema) => {
        const totalMensajes = await MensajeForo.count({
          where: { 
            id_tema: tema.id_tema,
            eliminado: false  // ✅ No contar mensajes eliminados
          },
        });

        const ultimoMensaje = await MensajeForo.findOne({
          where: { 
            id_tema: tema.id_tema,
            eliminado: false  // ✅ No mostrar mensajes eliminados
          },
          order: [['fecha_envio', 'DESC']],
          include: [
            {
              model: Psicologo,
              as: 'psicologo',
              attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
              required: false,
            },
            {
              model: Paciente,
              as: 'paciente',
              attributes: ['id_paciente', 'nombre', 'apellido_paterno'],
              required: false,
            },
          ],
        });

        let ultimoMensajeInfo = undefined;
        if (ultimoMensaje) {
          const autor =
            ultimoMensaje.tipo_usuario === 'psicologo'
              ? (ultimoMensaje as any).psicologo
              : (ultimoMensaje as any).paciente;
          const apellido =
            ultimoMensaje.tipo_usuario === 'psicologo'
              ? autor.apellidoPaterno
              : autor.apellido_paterno;
          ultimoMensajeInfo = {
            contenido: ultimoMensaje.contenido.substring(0, 100),
            fecha_envio: ultimoMensaje.fecha_envio,
            autor: `${autor.nombre} ${apellido}`,
          };
        }

        return {
          id_tema: tema.id_tema,
          id_foro: tema.id_foro,
          titulo: tema.titulo,
          descripcion: tema.descripcion,
          fecha_creacion: tema.fecha_creacion,
          total_mensajes: totalMensajes,
          ultimo_mensaje: ultimoMensajeInfo,
          // ✅ FASE 3: Nuevos campos
          cerrado: tema.cerrado,
          fijado: tema.fijado,
          fecha_cierre: tema.fecha_cierre,
        };
      })
    );

    return {
      data: temasConInfo,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // ========== MENSAJES ==========

  /**
 * FUNCIÓN 1: crearMensaje (COMPLETA CON CIFRADO)
 * Buscar en línea ~220
 */
  async crearMensaje(
    idTema: number,
    contenido: string,
    tipoUsuario: 'psicologo' | 'paciente',
    idUsuario: number
  ): Promise<MensajeResponse> {
    // ✅ CIFRAR EL MENSAJE ANTES DE GUARDAR
    const { encrypted: contenidoCifrado } = encryptMessage(contenido);
    console.log('🔐 Mensaje de foro cifrado');

    const mensaje = await MensajeForo.create({
      id_tema: idTema,
      tipo_usuario: tipoUsuario,
      contenido: contenidoCifrado,  // ← Guardar cifrado
      editado: false,
      eliminado: false,
      ...(tipoUsuario === 'psicologo'
        ? { id_psicologo: idUsuario }
        : { id_paciente: idUsuario }),
    });

    return this.obtenerMensajePorId(mensaje.id_mensaje_foro);
  }

  /**
 * FUNCIÓN 2: obtenerMensajePorId (COMPLETA CON DESCIFRADO)
 * Buscar en línea ~240
 */
  async obtenerMensajePorId(idMensaje: number): Promise<MensajeResponse> {
    const mensaje = await MensajeForo.findByPk(idMensaje, {
      include: [
        {
          model: Psicologo,
          as: 'psicologo',
          attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
          required: false,
        },
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['id_paciente', 'nombre', 'apellido_paterno'],
          required: false,
        },
      ],
    });

    if (!mensaje) {
      throw new Error('Mensaje no encontrado');
    }

    const autor =
      mensaje.tipo_usuario === 'psicologo'
        ? (mensaje as any).psicologo
        : (mensaje as any).paciente;

    // ✅ DESCIFRAR EL CONTENIDO ANTES DE RETORNAR
    const contenidoDescifrado = decryptMessage(mensaje.contenido);

    return {
      id_mensaje_foro: mensaje.id_mensaje_foro,
      id_tema: mensaje.id_tema,
      contenido: contenidoDescifrado,  // ← Retornar descifrado
      fecha_envio: mensaje.fecha_envio,
      autor: {
        tipo: mensaje.tipo_usuario,
        id:
          mensaje.tipo_usuario === 'psicologo'
            ? mensaje.id_psicologo!
            : mensaje.id_paciente!,
        nombre: autor?.nombre || 'Usuario',
        apellido: mensaje.tipo_usuario === 'psicologo'
          ? (autor?.apellidoPaterno || 'Desconocido')
          : (autor?.apellido_paterno || 'Desconocido'),
      },
    };
  }


  /**
 * FUNCIÓN 3: listarMensajes (COMPLETA CON DESCIFRADO)
 * Buscar en línea ~280
 */
async listarMensajes(
  idTema: number,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<MensajeResponse>> {
  const offset = (page - 1) * limit;

  const { count, rows } = await MensajeForo.findAndCountAll({
    where: {
      id_tema: idTema,
      eliminado: false  // No mostrar mensajes eliminados
    },
    order: [['fecha_envio', 'ASC']],
    limit,
    offset,
    include: [
      {
        model: Psicologo,
        as: 'psicologo',
        attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
        required: false,  // LEFT JOIN (permite null)
      },
      {
        model: Paciente,
        as: 'paciente',
        attributes: ['id_paciente', 'nombre', 'apellido_paterno'],
        required: false,  // LEFT JOIN (permite null)
      },
    ],
  });

  // ✅ DESCIFRAR TODOS LOS MENSAJES
  const mensajes = rows.map((mensaje) => {
    const autor =
      mensaje.tipo_usuario === 'psicologo'
        ? (mensaje as any).psicologo
        : (mensaje as any).paciente;

    // Descifrar el contenido
    const contenidoDescifrado = decryptMessage(mensaje.contenido);

    // Manejar caso donde autor puede ser null
    if (!autor) {
      return {
        id_mensaje_foro: mensaje.id_mensaje_foro,
        id_tema: mensaje.id_tema,
        contenido: contenidoDescifrado,  // ← Descifrado
        fecha_envio: mensaje.fecha_envio,
        autor: {
          tipo: mensaje.tipo_usuario,
          id: mensaje.tipo_usuario === 'psicologo' ? mensaje.id_psicologo! : mensaje.id_paciente!,
          nombre: 'Usuario',
          apellido: 'Desconocido',
        },
      };
    }

    return {
      id_mensaje_foro: mensaje.id_mensaje_foro,
      id_tema: mensaje.id_tema,
      contenido: contenidoDescifrado,  // ← Descifrado
      fecha_envio: mensaje.fecha_envio,
      autor: {
        tipo: mensaje.tipo_usuario,
        id:
          mensaje.tipo_usuario === 'psicologo'
            ? mensaje.id_psicologo!
            : mensaje.id_paciente!,
        nombre: autor.nombre,
        apellido: mensaje.tipo_usuario === 'psicologo' 
          ? (autor.apellidoPaterno || 'Desconocido')
          : (autor.apellido_paterno || 'Desconocido'),
      },
    };
  });

  return {
    data: mensajes,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}
}

export default new ForoService();