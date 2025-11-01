// backend/src/middlewares/foro.middleware.ts
import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth.middlewares';
import { Op } from 'sequelize';

// Importar los modelos
import ForoParticipante from '../models/foro/foro-participante';
import Foro from '../models/foro/foro';
import ForoBaneo from '../models/foro/foro-baneo';
import Tema from '../models/foro/tema';

/**
 * 🆕 FASE 2: Verifica que el usuario es participante del foro AL QUE PERTENECE EL TEMA
 * Este middleware es CRÍTICO para los endpoints de mensajes
 */
export const esParticipanteForoDelTema = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idTema = parseInt(req.params.idTema);
    const user = req.user;

    console.log('========================================');
    console.log('🔍 Middleware: esParticipanteForoDelTema');
    console.log('📋 ID Tema:', idTema);
    console.log('👤 Usuario:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('❌ ERROR: Usuario no autenticado');
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    if (!idTema || isNaN(idTema)) {
      console.log('❌ ERROR: ID de tema inválido');
      res.status(400).json({
        success: false,
        error: 'ID de tema inválido',
      });
      return;
    }

    // 1️⃣ Obtener el tema y su foro
    const tema = await Tema.findByPk(idTema, {
      attributes: ['id_tema', 'id_foro'],
    });

    if (!tema) {
      console.log('❌ ERROR 404: Tema no encontrado');
      res.status(404).json({
        success: false,
        error: 'Tema no encontrado',
      });
      return;
    }

    const idForo = tema.id_foro;
    console.log('📂 Foro del tema:', idForo);

    // 2️⃣ Verificar que el usuario es participante del foro
    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: user.tipo
    };

    if (user.tipo === 'psicologo') {
      whereClause.id_psicologo = user.id_psicologo || user.id;
    } else {
      whereClause.id_paciente = user.id_paciente || user.id;
    }

    console.log('🔎 Buscando participante con whereClause:', JSON.stringify(whereClause, null, 2));

    const participante = await ForoParticipante.findOne({
      where: whereClause,
    });

    console.log('📊 Participante encontrado:', participante ? 'SÍ' : 'NO');

    if (!participante) {
      console.log('❌ ERROR 403: No eres participante de este foro');
      res.status(403).json({
        success: false,
        error: 'No eres participante de este foro',
      });
      return;
    }

    // 3️⃣ Guardar datos en la request para uso posterior
    (req as any).participante = participante;
    (req as any).foro = { id_foro: idForo };
    
    console.log('✅ Middleware esParticipanteForoDelTema: APROBADO');
    console.log('========================================\n');
    next();
  } catch (error) {
    console.error('💥 Error en esParticipanteForoDelTema:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar participación en el foro',
    });
  }
};

/**
 * Verifica que el usuario es participante del foro
 */
export const esParticipanteForo = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idForo = parseInt(req.params.idForo || req.body?.id_foro);
    const user = req.user;

    console.log('========================================');
    console.log('🔍 Middleware: esParticipanteForo');
    console.log('📋 ID Foro:', idForo);
    console.log('👤 Usuario:', JSON.stringify(user, null, 2));
    console.log('========================================');

    if (!user) {
      console.log('❌ ERROR: Usuario no autenticado');
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    if (!idForo || isNaN(idForo)) {
      console.log('❌ ERROR: ID de foro inválido');
      res.status(400).json({
        success: false,
        error: 'ID de foro inválido',
      });
      return;
    }

    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: user.tipo
    };

    if (user.tipo === 'psicologo') {
      whereClause.id_psicologo = user.id_psicologo || user.id;
    } else {
      whereClause.id_paciente = user.id_paciente || user.id;
    }

    console.log('🔎 Buscando participante con whereClause:', JSON.stringify(whereClause, null, 2));

    const participante = await ForoParticipante.findOne({
      where: whereClause,
    });

    console.log('📊 Participante encontrado:', participante ? 'SÍ' : 'NO');

    if (!participante) {
      console.log('❌ ERROR 403: No eres participante de este foro');
      res.status(403).json({
        success: false,
        error: 'No eres participante de este foro',
      });
      return;
    }

    (req as any).participante = participante;
    console.log('✅ Middleware esParticipanteForo: APROBADO');
    console.log('========================================\n');
    next();
  } catch (error) {
    console.error('💥 Error en esParticipanteForo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar participación en el foro',
    });
  }
};

/**
 * Verifica que el usuario tiene rol de admin en el foro
 */
export const esAdminForo = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idForo = parseInt(req.params.idForo || req.body?.id_foro);
    const user = req.user;

    console.log('========================================');
    console.log('🔍 Middleware: esAdminForo');
    console.log('📋 ID Foro:', idForo);
    console.log('👤 Usuario:', JSON.stringify(user, null, 2));
    console.log('========================================');

    if (!user) {
      console.log('❌ ERROR: Usuario no autenticado');
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    if (!idForo || isNaN(idForo)) {
      console.log('❌ ERROR: ID de foro inválido');
      res.status(400).json({
        success: false,
        error: 'ID de foro inválido',
      });
      return;
    }

    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: user.tipo,
      rol: 'admin'
    };

    if (user.tipo === 'psicologo') {
      whereClause.id_psicologo = user.id_psicologo || user.id;
    } else {
      whereClause.id_paciente = user.id_paciente || user.id;
    }

    console.log('🔎 Buscando admin con whereClause:', JSON.stringify(whereClause, null, 2));

    const participante = await ForoParticipante.findOne({
      where: whereClause,
    });

    console.log('📊 Admin encontrado:', participante ? 'SÍ' : 'NO');

    if (!participante) {
      console.log('❌ ERROR 403: No eres administrador de este foro');
      res.status(403).json({
        success: false,
        error: 'No eres administrador de este foro',
      });
      return;
    }

    (req as any).participante = participante;
    console.log('✅ Middleware esAdminForo: APROBADO');
    console.log('========================================\n');
    next();
  } catch (error) {
    console.error('💥 Error en esAdminForo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos de administrador',
    });
  }
};

/**
 * 🆕 FASE 2: Verifica que el usuario tiene rol de admin o moderador en el foro
 */
export const esModeradorOAdmin = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idForo = parseInt(req.params.idForo || req.body?.id_foro);
    const user = req.user;

    console.log('========================================');
    console.log('🔍 Middleware: esModeradorOAdmin');
    console.log('📋 ID Foro:', idForo);
    console.log('👤 Usuario:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('❌ ERROR: Usuario no autenticado');
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    if (!idForo || isNaN(idForo)) {
      console.log('❌ ERROR: ID de foro inválido');
      res.status(400).json({
        success: false,
        error: 'ID de foro inválido',
      });
      return;
    }

    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: user.tipo,
      rol: {
        [Op.in]: ['admin', 'moderador']
      }
    };

    if (user.tipo === 'psicologo') {
      whereClause.id_psicologo = user.id_psicologo || user.id;
    } else {
      whereClause.id_paciente = user.id_paciente || user.id;
    }

    console.log('🔎 Buscando moderador/admin con whereClause:', JSON.stringify(whereClause, null, 2));

    const participante = await ForoParticipante.findOne({
      where: whereClause,
    });

    console.log('📊 Moderador/Admin encontrado:', participante ? 'SÍ' : 'NO');

    if (!participante) {
      console.log('❌ ERROR 403: Solo moderadores y admins pueden realizar esta acción');
      res.status(403).json({
        success: false,
        error: 'Solo los moderadores y administradores pueden realizar esta acción',
      });
      return;
    }

    (req as any).participante = participante;
    console.log('✅ Middleware esModeradorOAdmin: APROBADO');
    console.log('========================================\n');
    next();
  } catch (error) {
    console.error('💥 Error en esModeradorOAdmin:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos de moderación',
    });
  }
};

/**
 * Verifica que el foro existe y está activo
 */
export const foroExiste = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idForo = parseInt(req.params.idForo || req.body?.id_foro);

    if (!idForo || isNaN(idForo)) {
      res.status(400).json({
        success: false,
        error: 'ID de foro inválido',
      });
      return;
    }

    const foro = await Foro.findOne({
      where: {
        id_foro: idForo,
        activo: true,
      },
    });

    if (!foro) {
      res.status(404).json({
        success: false,
        error: 'Foro no encontrado',
      });
      return;
    }

    (req as any).foro = foro;
    next();
  } catch (error) {
    console.error('Error en foroExiste:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar existencia del foro',
    });
  }
};

/**
 * 🆕 FASE 2: Verifica que el usuario NO está baneado del foro
 */
export const noEstaBaneado = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    
    // Obtener id_foro desde diferentes fuentes posibles
    const idForo = parseInt(
      req.params.idForo || 
      req.body?.id_foro || 
      (req as any).foro?.id_foro
    );

    console.log('========================================');
    console.log('🔍 Middleware: noEstaBaneado');
    console.log('📋 ID Foro:', idForo);
    console.log('👤 Usuario:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('❌ ERROR: Usuario no autenticado');
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    if (!idForo || isNaN(idForo)) {
      console.log('❌ ERROR: ID de foro inválido');
      res.status(400).json({
        success: false,
        error: 'ID de foro inválido',
      });
      return;
    }

    // Verificar si existe un baneo activo
    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: user.tipo,
      activo: true,
      [Op.or]: [
        { fecha_expiracion: null }, // Baneo permanente
        { fecha_expiracion: { [Op.gt]: new Date() } } // Baneo temporal aún vigente
      ]
    };

    if (user.tipo === 'psicologo') {
      whereClause.id_psicologo = user.id_psicologo || user.id;
    } else {
      whereClause.id_paciente = user.id_paciente || user.id;
    }

    console.log('🔎 Buscando baneo activo con whereClause:', JSON.stringify(whereClause, null, 2));

    const baneo = await ForoBaneo.findOne({
      where: whereClause,
      order: [['fecha_baneo', 'DESC']],
    });

    console.log('📊 Baneo encontrado:', baneo ? 'SÍ' : 'NO');

    if (baneo) {
      console.log('❌ ERROR 403: Usuario está baneado');
      
      let mensaje = '';
      if (baneo.tipo_baneo === 'silencio') {
        mensaje = 'Has sido silenciado en este foro';
      } else {
        mensaje = 'Has sido baneado de este foro';
      }

      if (baneo.fecha_expiracion) {
        const diasRestantes = Math.ceil(
          (baneo.fecha_expiracion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        mensaje += `. Tu sanción expira en ${diasRestantes} día(s)`;
      } else {
        mensaje += '. Esta sanción es permanente';
      }

      mensaje += `. Motivo: ${baneo.razon}`;

      res.status(403).json({
        success: false,
        error: mensaje,
        baneoInfo: {
          tipo: baneo.tipo_baneo,
          razon: baneo.razon,
          fecha_baneo: baneo.fecha_baneo,
          fecha_expiracion: baneo.fecha_expiracion,
        },
      });
      return;
    }

    console.log('✅ Middleware noEstaBaneado: APROBADO');
    console.log('========================================\n');
    next();
  } catch (error) {
    console.error('💥 Error en noEstaBaneado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar estado de baneo',
    });
  }
};