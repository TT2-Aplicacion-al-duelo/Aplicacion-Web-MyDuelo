import { Request, Response } from 'express';
import { Notificacion } from '../models/notificacion';
import { Psicologo } from '../models/psicologo';
import { Paciente } from '../models/paciente';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: {
    id_psicologo: number;
    tipo: string;
  };
}

/**
 * GET /api/psicologo/notificaciones
 * Obtener notificaciones del psicólogo
 */
export const getNotificaciones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_psicologo = req.user?.id_psicologo;
    const { limite = '20', solo_no_leidas = 'false' } = req.query;

    if (!id_psicologo) {
      res.status(401).json({ msg: 'No autorizado' });
      return;
    }

    const whereClause: any = { id_psicologo };
    
    if (solo_no_leidas === 'true') {
      whereClause.leida = 0;
    }

    const notificaciones = await Notificacion.findAll({
      where: whereClause,
      order: [['fecha_creacion', 'DESC']],
      limit: parseInt(limite as string)
    });

    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ msg: 'Error al obtener notificaciones' });
  }
};

/**
 * GET /api/psicologo/notificaciones/no-leidas/count
 * Obtener cantidad de notificaciones no leídas
 */
export const getCountNoLeidas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_psicologo = req.user?.id_psicologo;

    if (!id_psicologo) {
      res.status(401).json({ msg: 'No autorizado' });
      return;
    }

    const count = await Notificacion.count({
      where: {
        id_psicologo,
        leida: 0
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error al contar notificaciones:', error);
    res.status(500).json({ msg: 'Error al contar notificaciones' });
  }
};

/**
 * PUT /api/psicologo/notificaciones/:id_notificacion/marcar-leida
 * Marcar una notificación como leída
 */
export const marcarComoLeida = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_psicologo = req.user?.id_psicologo;
    const { id_notificacion } = req.params;

    if (!id_psicologo) {
      res.status(401).json({ msg: 'No autorizado' });
      return;
    }

    const notificacion = await Notificacion.findOne({
      where: {
        id_notificacion,
        id_psicologo
      }
    });

    if (!notificacion) {
      res.status(404).json({ msg: 'Notificación no encontrada' });
      return;
    }

    await notificacion.update({
      leida: 1,
      fecha_leida: new Date()
    });

    res.json({ msg: 'Notificación marcada como leída', notificacion });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ msg: 'Error al marcar notificación' });
  }
};

/**
 * PUT /api/psicologo/notificaciones/marcar-todas-leidas
 * Marcar todas las notificaciones como leídas
 */
export const marcarTodasLeidas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_psicologo = req.user?.id_psicologo;

    if (!id_psicologo) {
      res.status(401).json({ msg: 'No autorizado' });
      return;
    }

    await Notificacion.update(
      {
        leida: 1,
        fecha_leida: new Date()
      },
      {
        where: {
          id_psicologo,
          leida: 0
        }
      }
    );

    res.json({ msg: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    res.status(500).json({ msg: 'Error al marcar notificaciones' });
  }
};

/**
 * DELETE /api/psicologo/notificaciones/:id_notificacion
 * Eliminar una notificación
 */
export const eliminarNotificacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_psicologo = req.user?.id_psicologo;
    const { id_notificacion } = req.params;

    if (!id_psicologo) {
      res.status(401).json({ msg: 'No autorizado' });
      return;
    }

    const result = await Notificacion.destroy({
      where: {
        id_notificacion,
        id_psicologo
      }
    });

    if (result === 0) {
      res.status(404).json({ msg: 'Notificación no encontrada' });
      return;
    }

    res.json({ msg: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ msg: 'Error al eliminar notificación' });
  }
};

/**
 * FUNCIÓN AUXILIAR: Crear notificación
 * Se puede llamar desde otros controladores
 */
export const crearNotificacion = async (datos: {
  id_psicologo: number;
  tipo: 'chat' | 'actividad' | 'cita' | 'foro' | 'recordatorio' | 'sistema';
  titulo: string;
  mensaje: string;
  id_relacionado?: number;
  enlace?: string;
}): Promise<void> => {
  try {
    await Notificacion.create(datos);
    console.log(`Notificación creada para psicólogo ${datos.id_psicologo}: ${datos.titulo}`);
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};