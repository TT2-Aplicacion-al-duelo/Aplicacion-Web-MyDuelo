// backend/src/services/moderacion.service.ts
import { Op } from 'sequelize';
import ForoBaneo from '../models/foro/foro-baneo';
import ForoParticipante from '../models/foro/foro-participante';
// ✅ CORRECTO: Estos modelos usan export const, no export default
import { Psicologo } from '../models/psicologo';
import { Paciente } from '../models/paciente';
import sequelize from '../database/connection';

interface BaneoDTO {
  id_foro: number;
  tipo_usuario: 'psicologo' | 'paciente';
  id_usuario: number;
  id_moderador: number;
  tipo_baneo: 'silencio' | 'baneo';
  razon: string;
  dias_duracion?: number; // Si no se proporciona, es permanente
}

interface BaneoResponse {
  id_baneo: number;
  id_foro: number;
  tipo_usuario: 'psicologo' | 'paciente';
  tipo_baneo: 'silencio' | 'baneo';
  razon: string;
  fecha_baneo: Date;
  fecha_expiracion?: Date;
  activo: boolean;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
  };
  moderador: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

class ModeracionService {
  /**
   * Banear o silenciar un usuario
   */
  async banearUsuario(data: BaneoDTO): Promise<BaneoResponse> {
    // Validar que el usuario es participante del foro
    const whereParticipante: any = {
      id_foro: data.id_foro,
      tipo_usuario: data.tipo_usuario,
    };

    if (data.tipo_usuario === 'psicologo') {
      whereParticipante.id_psicologo = data.id_usuario;
    } else {
      whereParticipante.id_paciente = data.id_usuario;
    }

    const participante = await ForoParticipante.findOne({
      where: whereParticipante,
    });

    if (!participante) {
      throw new Error('El usuario no es participante del foro');
    }

    // Verificar que no existe un baneo activo
    const baneoExistente = await this.verificarBaneoActivo(
      data.id_foro,
      data.tipo_usuario,
      data.id_usuario
    );

    if (baneoExistente) {
      throw new Error('El usuario ya tiene una sanción activa en este foro');
    }

    // Calcular fecha de expiración si se proporcionaron días
    let fechaExpiracion: Date | undefined = undefined;
    if (data.dias_duracion && data.dias_duracion > 0) {
      fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + data.dias_duracion);
    }

    // Crear el baneo
    const baneo = await ForoBaneo.create({
      id_foro: data.id_foro,
      tipo_usuario: data.tipo_usuario,
      ...(data.tipo_usuario === 'psicologo'
        ? { id_psicologo: data.id_usuario }
        : { id_paciente: data.id_usuario }),
      id_moderador: data.id_moderador,
      tipo_baneo: data.tipo_baneo,
      razon: data.razon,
      fecha_expiracion: fechaExpiracion,
      activo: true,
    });

    return this.obtenerBaneoPorId(baneo.id_baneo);
  }

  /**
   * Levantar un baneo (desbanear)
   */
  async levantarBaneo(
    idBaneo: number,
    idModeradorLevantamiento: number
  ): Promise<BaneoResponse> {
    const baneo = await ForoBaneo.findByPk(idBaneo);

    if (!baneo) {
      throw new Error('Baneo no encontrado');
    }

    if (!baneo.activo) {
      throw new Error('El baneo ya no está activo');
    }

    await baneo.update({
      activo: false,
      fecha_levantamiento: new Date(),
      id_moderador_levantamiento: idModeradorLevantamiento,
    });

    return this.obtenerBaneoPorId(idBaneo);
  }

  /**
   * Listar baneos de un foro
   */
  async listarBaneos(
    idForo: number,
    soloActivos: boolean = true,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: BaneoResponse[]; meta: any }> {
    const offset = (page - 1) * limit;
    const whereClause: any = { id_foro: idForo };

    if (soloActivos) {
      whereClause.activo = true;
    }

    const { count, rows } = await ForoBaneo.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['fecha_baneo', 'DESC']],
    });

    const baneosConInfo = await Promise.all(
      rows.map((baneo) => this.obtenerBaneoPorId(baneo.id_baneo))
    );

    return {
      data: baneosConInfo,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Obtener historial de sanciones de un usuario
   */
  async obtenerHistorialUsuario(
    tipoUsuario: 'psicologo' | 'paciente',
    idUsuario: number
  ): Promise<BaneoResponse[]> {
    const whereClause: any = {
      tipo_usuario: tipoUsuario,
    };

    if (tipoUsuario === 'psicologo') {
      whereClause.id_psicologo = idUsuario;
    } else {
      whereClause.id_paciente = idUsuario;
    }

    const baneos = await ForoBaneo.findAll({
      where: whereClause,
      order: [['fecha_baneo', 'DESC']],
    });

    return Promise.all(
      baneos.map((baneo) => this.obtenerBaneoPorId(baneo.id_baneo))
    );
  }

  /**
   * Verificar si un usuario está baneado en un foro
   */
  async verificarBaneoActivo(
    idForo: number,
    tipoUsuario: 'psicologo' | 'paciente',
    idUsuario: number
  ): Promise<ForoBaneo | null> {
    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: tipoUsuario,
      activo: true,
      [Op.or]: [
        { fecha_expiracion: null },
        { fecha_expiracion: { [Op.gt]: new Date() } },
      ],
    };

    if (tipoUsuario === 'psicologo') {
      whereClause.id_psicologo = idUsuario;
    } else {
      whereClause.id_paciente = idUsuario;
    }

    return ForoBaneo.findOne({
      where: whereClause,
      order: [['fecha_baneo', 'DESC']],
    });
  }

  /**
   * Obtener baneo por ID con información completa
   */
  async obtenerBaneoPorId(idBaneo: number): Promise<BaneoResponse> {
    const baneo = await ForoBaneo.findByPk(idBaneo);

    if (!baneo) {
      throw new Error('Baneo no encontrado');
    }

    // Obtener información del usuario baneado
    let usuario: any = null;
    if (baneo.tipo_usuario === 'psicologo' && baneo.id_psicologo) {
      usuario = await Psicologo.findByPk(baneo.id_psicologo, {
        attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
      });
    } else if (baneo.tipo_usuario === 'paciente' && baneo.id_paciente) {
      usuario = await Paciente.findByPk(baneo.id_paciente, {
        attributes: ['id_paciente', 'nombre', 'apellido_paterno'],
      });
    }

    // Obtener información del moderador
    const moderador = await Psicologo.findByPk(baneo.id_moderador, {
      attributes: ['id_psicologo', 'nombre', 'apellidoPaterno'],
    });

    return {
      id_baneo: baneo.id_baneo,
      id_foro: baneo.id_foro,
      tipo_usuario: baneo.tipo_usuario,
      tipo_baneo: baneo.tipo_baneo,
      razon: baneo.razon,
      fecha_baneo: baneo.fecha_baneo,
      fecha_expiracion: baneo.fecha_expiracion,
      activo: baneo.activo,
      usuario: {
        id: baneo.tipo_usuario === 'psicologo' ? baneo.id_psicologo! : baneo.id_paciente!,
        nombre: usuario?.nombre || 'Usuario',
        // ✅ CORRECTO: Paciente usa apellido_paterno (snake_case), Psicologo usa apellidoPaterno (camelCase)
        apellido: baneo.tipo_usuario === 'psicologo' 
          ? (usuario?.apellidoPaterno || 'Desconocido')
          : (usuario?.apellido_paterno || 'Desconocido'),
      },
      moderador: {
        id: moderador?.id_psicologo || 0,
        nombre: moderador?.nombre || 'Moderador',
        apellido: moderador?.apellidoPaterno || 'Desconocido',
      },
    };
  }

  /**
   * Expirar baneos automáticamente (llamado por un cron job)
   */
  async expirarBaneosVencidos(): Promise<number> {
    // ✅ SOLUCIÓN: Usar condiciones simples sin Op.and
    // Sequelize interpreta múltiples condiciones en el mismo objeto como AND implícito
    const [affectedCount] = await ForoBaneo.update(
      {
        activo: false,
        fecha_levantamiento: new Date(),
      },
      {
        where: {
          activo: true,
          fecha_expiracion: {
            [Op.lte]: new Date(),  // fecha <= ahora
            [Op.ne]: null as any   // fecha != null (cast explícito para TypeScript)
          }
        },
      }
    );

    console.log(`✅ ${affectedCount} baneos expirados automáticamente`);
    return affectedCount;
  }

  /**
   * Estadísticas de moderación de un foro
   */
  async obtenerEstadisticasModeracion(idForo: number): Promise<any> {
    const totalBaneos = await ForoBaneo.count({
      where: { id_foro: idForo },
    });

    const baneosActivos = await ForoBaneo.count({
      where: { id_foro: idForo, activo: true },
    });

    const silencios = await ForoBaneo.count({
      where: { id_foro: idForo, tipo_baneo: 'silencio' },
    });

    const baneosPermanentes = await ForoBaneo.count({
      where: { id_foro: idForo, tipo_baneo: 'baneo' },
    });

    return {
      total_sanciones: totalBaneos,
      sanciones_activas: baneosActivos,
      silencios,
      baneos_permanentes: baneosPermanentes,
    };
  }
}

export default new ModeracionService();