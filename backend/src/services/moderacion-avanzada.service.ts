// backend/src/services/moderacion-avanzada.service.ts
import { Op } from 'sequelize';
import ModeracionLog from '../models/foro/moderacion-log';
import MensajeForo from '../models/foro/mensaje-foro';
import Tema from '../models/foro/tema';
import SolicitudUnion from '../models/foro/solicitud-union';
import ForoParticipante from '../models/foro/foro-participante';
import { Psicologo } from '../models/psicologo';
import { Paciente } from '../models/paciente';

interface LogAccionDTO {
  id_foro: number;
  id_moderador: number;
  tipo_accion: string;
  id_objetivo: number;
  tipo_objetivo: 'mensaje' | 'tema' | 'usuario' | 'solicitud';
  detalles?: any;
}

class ModeracionAvanzadaService {
  // ========== GESTIÓN DE MENSAJES ==========

  /**
   * Eliminar mensaje (soft delete)
   */
  async eliminarMensaje(
    idMensaje: number,
    idModerador: number,
    idForo: number
  ): Promise<void> {
    const mensaje = await MensajeForo.findByPk(idMensaje);

    if (!mensaje) {
      throw new Error('Mensaje no encontrado');
    }

    if (mensaje.eliminado) {
      throw new Error('El mensaje ya está eliminado');
    }

    await mensaje.update({
      eliminado: true,
      fecha_eliminacion: new Date(),
      id_moderador_eliminador: idModerador,
    });

    // Registrar en el log
    await this.registrarAccion({
      id_foro: idForo,
      id_moderador: idModerador,
      tipo_accion: 'eliminar_mensaje',
      id_objetivo: idMensaje,
      tipo_objetivo: 'mensaje',
      detalles: {
        contenido_original: mensaje.contenido.substring(0, 100),
      },
    });
  }

  /**
   * Restaurar mensaje eliminado
   */
  async restaurarMensaje(
    idMensaje: number,
    idModerador: number,
    idForo: number
  ): Promise<void> {
    const mensaje = await MensajeForo.findByPk(idMensaje);

    if (!mensaje) {
      throw new Error('Mensaje no encontrado');
    }

    if (!mensaje.eliminado) {
      throw new Error('El mensaje no está eliminado');
    }

    await mensaje.update({
      eliminado: false,
      fecha_eliminacion: undefined,
      id_moderador_eliminador: undefined,
    });

    await this.registrarAccion({
      id_foro: idForo,
      id_moderador: idModerador,
      tipo_accion: 'restaurar_mensaje',
      id_objetivo: idMensaje,
      tipo_objetivo: 'mensaje',
    });
  }

  /**
   * Editar mensaje
   */
  async editarMensaje(
    idMensaje: number,
    nuevoContenido: string,
    idModerador: number,
    idForo: number
  ): Promise<void> {
    const mensaje = await MensajeForo.findByPk(idMensaje);

    if (!mensaje) {
      throw new Error('Mensaje no encontrado');
    }

    if (mensaje.eliminado) {
      throw new Error('No se puede editar un mensaje eliminado');
    }

    const contenidoAnterior = mensaje.contenido;

    await mensaje.update({
      contenido: nuevoContenido,
      editado: true,
      fecha_edicion: new Date(),
    });

    await this.registrarAccion({
      id_foro: idForo,
      id_moderador: idModerador,
      tipo_accion: 'editar_mensaje',
      id_objetivo: idMensaje,
      tipo_objetivo: 'mensaje',
      detalles: {
        contenido_anterior: contenidoAnterior.substring(0, 100),
        contenido_nuevo: nuevoContenido.substring(0, 100),
      },
    });
  }

  // ========== GESTIÓN DE TEMAS ==========

  /**
   * Cerrar tema
   */
  async cerrarTema(
    idTema: number,
    idModerador: number,
    idForo: number
  ): Promise<void> {
    const tema = await Tema.findByPk(idTema);

    if (!tema) {
      throw new Error('Tema no encontrado');
    }

    if (tema.cerrado) {
      throw new Error('El tema ya está cerrado');
    }

    await tema.update({
      cerrado: true,
      fecha_cierre: new Date(),
      id_moderador_cierre: idModerador,
    });

    await this.registrarAccion({
      id_foro: idForo,
      id_moderador: idModerador,
      tipo_accion: 'cerrar_tema',
      id_objetivo: idTema,
      tipo_objetivo: 'tema',
      detalles: { titulo: tema.titulo },
    });
  }

  /**
   * Abrir tema cerrado
   */
  async abrirTema(
    idTema: number,
    idModerador: number,
    idForo: number
  ): Promise<void> {
    const tema = await Tema.findByPk(idTema);

    if (!tema) {
      throw new Error('Tema no encontrado');
    }

    if (!tema.cerrado) {
      throw new Error('El tema no está cerrado');
    }

    await tema.update({
      cerrado: false,
      fecha_cierre: undefined,
      id_moderador_cierre: undefined,
    });

    await this.registrarAccion({
      id_foro: idForo,
      id_moderador: idModerador,
      tipo_accion: 'abrir_tema',
      id_objetivo: idTema,
      tipo_objetivo: 'tema',
      detalles: { titulo: tema.titulo },
    });
  }

  /**
   * Fijar tema
   */
  async fijarTema(
    idTema: number,
    idModerador: number,
    idForo: number
  ): Promise<void> {
    const tema = await Tema.findByPk(idTema);

    if (!tema) {
      throw new Error('Tema no encontrado');
    }

    if (tema.fijado) {
      throw new Error('El tema ya está fijado');
    }

    await tema.update({ fijado: true });

    await this.registrarAccion({
      id_foro: idForo,
      id_moderador: idModerador,
      tipo_accion: 'fijar_tema',
      id_objetivo: idTema,
      tipo_objetivo: 'tema',
      detalles: { titulo: tema.titulo },
    });
  }

  /**
   * Desfijar tema
   */
  async desfijarTema(
    idTema: number,
    idModerador: number,
    idForo: number
  ): Promise<void> {
    const tema = await Tema.findByPk(idTema);

    if (!tema) {
      throw new Error('Tema no encontrado');
    }

    if (!tema.fijado) {
      throw new Error('El tema no está fijado');
    }

    await tema.update({ fijado: false });

    await this.registrarAccion({
      id_foro: idForo,
      id_moderador: idModerador,
      tipo_accion: 'desfijar_tema',
      id_objetivo: idTema,
      tipo_objetivo: 'tema',
      detalles: { titulo: tema.titulo },
    });
  }

  // ========== SOLICITUDES DE UNIÓN ==========

  /**
   * Crear solicitud de unión
   */
  async crearSolicitud(
    idForo: number,
    tipoUsuario: 'psicologo' | 'paciente',
    idUsuario: number,
    mensaje?: string
  ): Promise<any> {
    // Verificar que no exista una solicitud pendiente
    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: tipoUsuario,
      estado: 'pendiente',
    };

    if (tipoUsuario === 'psicologo') {
      whereClause.id_psicologo = idUsuario;
    } else {
      whereClause.id_paciente = idUsuario;
    }

    const solicitudExistente = await SolicitudUnion.findOne({
      where: whereClause,
    });

    if (solicitudExistente) {
      throw new Error('Ya tienes una solicitud pendiente para este foro');
    }

    // Verificar que no sea ya participante
    const participanteExistente = await ForoParticipante.findOne({
      where: {
        id_foro: idForo,
        tipo_usuario: tipoUsuario,
        ...(tipoUsuario === 'psicologo'
          ? { id_psicologo: idUsuario }
          : { id_paciente: idUsuario }),
      },
    });

    if (participanteExistente) {
      throw new Error('Ya eres participante de este foro');
    }

    const solicitud = await SolicitudUnion.create({
      id_foro: idForo,
      tipo_usuario: tipoUsuario,
      mensaje,
      ...(tipoUsuario === 'psicologo'
        ? { id_psicologo: idUsuario }
        : { id_paciente: idUsuario }),
    });

    return this.obtenerSolicitudPorId(solicitud.id_solicitud);
  }

  /**
   * Listar solicitudes pendientes de un foro
   */
  async listarSolicitudesPendientes(idForo: number): Promise<any[]> {
    const solicitudes = await SolicitudUnion.findAll({
      where: {
        id_foro: idForo,
        estado: 'pendiente',
      },
      order: [['fecha_solicitud', 'ASC']],
    });

    return Promise.all(
      solicitudes.map((s) => this.obtenerSolicitudPorId(s.id_solicitud))
    );
  }

  /**
   * Aprobar solicitud
   */
  async aprobarSolicitud(
    idSolicitud: number,
    idModerador: number
  ): Promise<void> {
    const solicitud = await SolicitudUnion.findByPk(idSolicitud);

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new Error('La solicitud ya fue procesada');
    }

    // Agregar como participante
    await ForoParticipante.create({
      id_foro: solicitud.id_foro,
      tipo_usuario: solicitud.tipo_usuario,
      rol: 'miembro',
      ...(solicitud.tipo_usuario === 'psicologo'
        ? { id_psicologo: solicitud.id_psicologo }
        : { id_paciente: solicitud.id_paciente }),
    });

    await solicitud.update({
      estado: 'aprobada',
      fecha_respuesta: new Date(),
      id_moderador_respuesta: idModerador,
    });

    await this.registrarAccion({
      id_foro: solicitud.id_foro,
      id_moderador: idModerador,
      tipo_accion: 'aprobar_solicitud',
      id_objetivo: idSolicitud,
      tipo_objetivo: 'solicitud',
    });
  }

  /**
   * Rechazar solicitud
   */
  async rechazarSolicitud(
    idSolicitud: number,
    idModerador: number,
    razon?: string
  ): Promise<void> {
    const solicitud = await SolicitudUnion.findByPk(idSolicitud);

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new Error('La solicitud ya fue procesada');
    }

    await solicitud.update({
      estado: 'rechazada',
      fecha_respuesta: new Date(),
      id_moderador_respuesta: idModerador,
      razon_rechazo: razon,
    });

    await this.registrarAccion({
      id_foro: solicitud.id_foro,
      id_moderador: idModerador,
      tipo_accion: 'rechazar_solicitud',
      id_objetivo: idSolicitud,
      tipo_objetivo: 'solicitud',
      detalles: { razon },
    });
  }

  /**
   * Obtener solicitud por ID con información completa
   */
  async obtenerSolicitudPorId(idSolicitud: number): Promise<any> {
    const solicitud = await SolicitudUnion.findByPk(idSolicitud);

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    let usuario: any = null;
    if (solicitud.tipo_usuario === 'psicologo' && solicitud.id_psicologo) {
      usuario = await Psicologo.findByPk(solicitud.id_psicologo, {
        attributes: ['id_psicologo', 'nombre', 'apellidoPaterno', 'especialidad'],
      });
    } else if (solicitud.tipo_usuario === 'paciente' && solicitud.id_paciente) {
      usuario = await Paciente.findByPk(solicitud.id_paciente, {
        attributes: ['id_paciente', 'nombre', 'apellido_paterno'],
      });
    }

    let moderador: any = null;
    if (solicitud.id_moderador_respuesta) {
      moderador = await Psicologo.findByPk(solicitud.id_moderador_respuesta, {
        attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
      });
    }

    return {
      id_solicitud: solicitud.id_solicitud,
      id_foro: solicitud.id_foro,
      tipo_usuario: solicitud.tipo_usuario,
      mensaje: solicitud.mensaje,
      estado: solicitud.estado,
      fecha_solicitud: solicitud.fecha_solicitud,
      fecha_respuesta: solicitud.fecha_respuesta,
      razon_rechazo: solicitud.razon_rechazo,
      usuario: {
        id:
          solicitud.tipo_usuario === 'psicologo'
            ? solicitud.id_psicologo!
            : solicitud.id_paciente!,
        nombre: usuario?.nombre || 'Usuario',
        apellido:
          solicitud.tipo_usuario === 'psicologo'
            ? usuario?.apellidoPaterno
            : usuario?.apellido_paterno || 'Desconocido',
        especialidad: usuario?.especialidad,
      },
      moderador: moderador
        ? {
            id: moderador.id_psicologo,
            nombre: moderador.nombre,
            apellido: moderador.apellidoPaterno,
          }
        : null,
    };
  }

  // ========== LOG DE MODERACIÓN ==========

  /**
   * Registrar acción de moderación
   */
  async registrarAccion(data: LogAccionDTO): Promise<void> {
    await ModeracionLog.create({
      id_foro: data.id_foro,
      id_moderador: data.id_moderador,
      tipo_accion: data.tipo_accion as any,
      id_objetivo: data.id_objetivo,
      tipo_objetivo: data.tipo_objetivo,
      detalles: data.detalles,
    });
  }

  /**
   * Obtener logs de moderación de un foro
   */
  async obtenerLogs(
    idForo: number,
    filtros?: {
      tipo_accion?: string;
      id_moderador?: number;
      fecha_desde?: Date;
      fecha_hasta?: Date;
    },
    page: number = 1,
    limit: number = 50
  ): Promise<any> {
    const offset = (page - 1) * limit;
    const whereClause: any = { id_foro: idForo };

    if (filtros?.tipo_accion) {
      whereClause.tipo_accion = filtros.tipo_accion;
    }

    if (filtros?.id_moderador) {
      whereClause.id_moderador = filtros.id_moderador;
    }

    if (filtros?.fecha_desde || filtros?.fecha_hasta) {
      whereClause.fecha_accion = {};
      if (filtros.fecha_desde) {
        whereClause.fecha_accion[Op.gte] = filtros.fecha_desde;
      }
      if (filtros.fecha_hasta) {
        whereClause.fecha_accion[Op.lte] = filtros.fecha_hasta;
      }
    }

    const { count, rows } = await ModeracionLog.findAndCountAll({
      where: whereClause,
      order: [['fecha_accion', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: Psicologo,
          as: 'moderador',
          attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
        },
      ],
    });

    const logs = rows.map((log) => ({
      id_log: log.id_log,
      tipo_accion: log.tipo_accion,
      tipo_objetivo: log.tipo_objetivo,
      id_objetivo: log.id_objetivo,
      detalles: log.detalles,
      fecha_accion: log.fecha_accion,
      moderador: (log as any).moderador
        ? {
            id: (log as any).moderador.id_psicologo,
            nombre: (log as any).moderador.nombre,
            apellido: (log as any).moderador.apellidoPaterno,
          }
        : null,
    }));

    return {
      data: logs,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

export default new ModeracionAvanzadaService();