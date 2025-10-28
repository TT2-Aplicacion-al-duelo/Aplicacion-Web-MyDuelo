// backend/src/middlewares/foro.middleware.ts
import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth.middlewares';
import { Op } from 'sequelize';

// Importar los modelos correctamente usando import
import ForoParticipante from '../models/foro/foro-participante';
import Foro from '../models/foro/foro';

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

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    // Validar que el idForo es válido
    if (!idForo || isNaN(idForo)) {
      res.status(400).json({
        success: false,
        error: 'ID de foro inválido',
      });
      return;
    }

    // Construir la consulta según el tipo de usuario
    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: user.tipo,
    };

    if (user.tipo === 'psicologo') {
      whereClause.id_psicologo = user.id_psicologo || user.id;
    } else {
      whereClause.id_paciente = user.id_paciente || user.id;
    }

    const participante = await ForoParticipante.findOne({
      where: whereClause,
    });

    if (!participante) {
      res.status(403).json({
        success: false,
        error: 'No eres participante de este foro',
      });
      return;
    }

    // Guardar el participante en la request para uso posterior
    (req as any).participante = participante;
    next();
  } catch (error) {
    console.error('Error en esParticipanteForo:', error);
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

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    // Validar que el idForo es válido
    if (!idForo || isNaN(idForo)) {
      res.status(400).json({
        success: false,
        error: 'ID de foro inválido',
      });
      return;
    }

    // Construir la consulta según el tipo de usuario
    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: user.tipo,
      rol: 'admin',
    };

    if (user.tipo === 'psicologo') {
      whereClause.id_psicologo = user.id_psicologo || user.id;
    } else {
      whereClause.id_paciente = user.id_paciente || user.id;
    }

    const participante = await ForoParticipante.findOne({
      where: whereClause,
    });

    if (!participante) {
      res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden realizar esta acción',
      });
      return;
    }

    (req as any).participante = participante;
    next();
  } catch (error) {
    console.error('Error en esAdminForo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos de administrador',
    });
  }
};

/**
 * Verifica que el usuario tiene rol de admin o moderador en el foro
 */
export const esModeradorOAdmin = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idForo = parseInt(req.params.idForo || req.body?.id_foro);
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    // Validar que el idForo es válido
    if (!idForo || isNaN(idForo)) {
      res.status(400).json({
        success: false,
        error: 'ID de foro inválido',
      });
      return;
    }

    // Construir la consulta según el tipo de usuario  
    const whereClause: any = {
      id_foro: idForo,
      tipo_usuario: user.tipo,
      rol: {
        [Op.or]: ['admin', 'moderador']
      }
    };

    if (user.tipo === 'psicologo') {
      whereClause.id_psicologo = user.id_psicologo || user.id;
    } else {
      whereClause.id_paciente = user.id_paciente || user.id;
    }

    const participante = await ForoParticipante.findOne({
      where: whereClause,
    });

    if (!participante) {
      res.status(403).json({
        success: false,
        error: 'Solo los moderadores y administradores pueden realizar esta acción',
      });
      return;
    }

    (req as any).participante = participante;
    next();
  } catch (error) {
    console.error('Error en esModeradorOAdmin:', error);
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

    // Validar que el idForo es válido
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

    // Guardar el foro en la request
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
 * Verifica que el usuario no está baneado del foro (para futuras fases)
 */
export const noEstaBaneado = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Por ahora solo pasa, se implementará en Fase 2
  next();
};