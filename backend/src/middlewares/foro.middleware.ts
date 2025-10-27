import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../types/foro';
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
    const idForo = parseInt(req.params.idForo || req.body.id_foro);
    const user = req.user!;

    const participante = await ForoParticipante.findOne({
      where: {
        id_foro: idForo,
        tipo_usuario: user.tipo,
        ...(user.tipo === 'psicologo' 
          ? { id_psicologo: user.id }
          : { id_paciente: user.id }
        ),
      },
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
    const idForo = parseInt(req.params.idForo || req.body.id_foro);
    const user = req.user!;

    const participante = await ForoParticipante.findOne({
      where: {
        id_foro: idForo,
        tipo_usuario: user.tipo,
        rol: 'admin',
        ...(user.tipo === 'psicologo' 
          ? { id_psicologo: user.id }
          : { id_paciente: user.id }
        ),
      },
    });

    if (!participante) {
      res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden realizar esta acción',
      });
      return;
    }

    next();
  } catch (error) {
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
    const idForo = parseInt(req.params.idForo || req.body.id_foro);
    const user = req.user!;

    const participante = await ForoParticipante.findOne({
      where: {
        id_foro: idForo,
        tipo_usuario: user.tipo,
        rol: ['admin', 'moderador'],
        ...(user.tipo === 'psicologo' 
          ? { id_psicologo: user.id }
          : { id_paciente: user.id }
        ),
      },
    });

    if (!participante) {
      res.status(403).json({
        success: false,
        error: 'Solo los moderadores y administradores pueden realizar esta acción',
      });
      return;
    }

    next();
  } catch (error) {
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
    const idForo = parseInt(req.params.idForo || req.body.id_foro);

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