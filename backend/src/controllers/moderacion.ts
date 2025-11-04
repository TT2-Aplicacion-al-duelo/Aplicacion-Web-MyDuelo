// backend/src/controllers/moderacion.controller.ts
import { Response } from 'express';
import { RequestWithUser } from '../middlewares/auth.middlewares';
import moderacionService from '../services/moderacion.service';

class ModeracionController {
  /**
   * POST /api/foros/:idForo/moderar/banear
   * Banear o silenciar un usuario
   */
  async banearUsuario(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const {
        tipo_usuario,
        id_usuario,
        tipo_baneo,
        razon,
        dias_duracion,
      } = req.body;

      // Validaciones
      if (!tipo_usuario || !id_usuario || !tipo_baneo || !razon) {
        res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: tipo_usuario, id_usuario, tipo_baneo, razon',
        });
        return;
      }

      if (!['psicologo', 'paciente'].includes(tipo_usuario)) {
        res.status(400).json({
          success: false,
          error: 'tipo_usuario debe ser "psicologo" o "paciente"',
        });
        return;
      }

      if (!['silencio', 'baneo'].includes(tipo_baneo)) {
        res.status(400).json({
          success: false,
          error: 'tipo_baneo debe ser "silencio" o "baneo"',
        });
        return;
      }

      if (razon.trim().length < 10) {
        res.status(400).json({
          success: false,
          error: 'La razón debe tener al menos 10 caracteres',
        });
        return;
      }

      // Obtener ID del moderador desde el token
      const idModerador = req.user!.id_psicologo || req.user!.id;

      const baneo = await moderacionService.banearUsuario({
        id_foro: idForo,
        tipo_usuario,
        id_usuario: parseInt(id_usuario),
        id_moderador: idModerador,
        tipo_baneo,
        razon: razon.trim(),
        dias_duracion: dias_duracion ? parseInt(dias_duracion) : undefined,
      });

      res.status(201).json({
        success: true,
        message: tipo_baneo === 'silencio' 
          ? 'Usuario silenciado exitosamente' 
          : 'Usuario baneado exitosamente',
        data: baneo,
      });
    } catch (error: any) {
      console.error('Error al banear usuario:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al banear usuario',
      });
    }
  }

  /**
   * DELETE /api/foros/:idForo/moderar/banear/:idBaneo
   * Levantar un baneo (desbanear)
   */
  async levantarBaneo(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idBaneo = parseInt(req.params.idBaneo);
      const idModerador = req.user!.id_psicologo || req.user!.id;

      const baneo = await moderacionService.levantarBaneo(idBaneo, idModerador);

      res.json({
        success: true,
        message: 'Sanción levantada exitosamente',
        data: baneo,
      });
    } catch (error: any) {
      console.error('Error al levantar baneo:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al levantar baneo',
      });
    }
  }

  /**
   * GET /api/foros/:idForo/moderar/baneos
   * Listar baneos de un foro
   */
  async listarBaneos(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const soloActivos = req.query.soloActivos !== 'false';

      const result = await moderacionService.listarBaneos(
        idForo,
        soloActivos,
        page,
        limit
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      console.error('Error al listar baneos:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al listar baneos',
      });
    }
  }

  /**
   * GET /api/moderar/historial/:tipoUsuario/:idUsuario
   * Obtener historial de sanciones de un usuario
   */
  async obtenerHistorialUsuario(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const tipoUsuario = req.params.tipoUsuario as 'psicologo' | 'paciente';
      const idUsuario = parseInt(req.params.idUsuario);

      if (!['psicologo', 'paciente'].includes(tipoUsuario)) {
        res.status(400).json({
          success: false,
          error: 'tipoUsuario debe ser "psicologo" o "paciente"',
        });
        return;
      }

      const historial = await moderacionService.obtenerHistorialUsuario(
        tipoUsuario,
        idUsuario
      );

      res.json({
        success: true,
        data: historial,
      });
    } catch (error: any) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener historial de sanciones',
      });
    }
  }

  /**
   * GET /api/foros/:idForo/moderar/estadisticas
   * Obtener estadísticas de moderación de un foro
   */
  async obtenerEstadisticas(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);

      const estadisticas = await moderacionService.obtenerEstadisticasModeracion(idForo);

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  /**
   * GET /api/moderar/verificar/:idForo/:tipoUsuario/:idUsuario
   * Verificar si un usuario está baneado
   */
  async verificarBaneo(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const tipoUsuario = req.params.tipoUsuario as 'psicologo' | 'paciente';
      const idUsuario = parseInt(req.params.idUsuario);

      const baneo = await moderacionService.verificarBaneoActivo(
        idForo,
        tipoUsuario,
        idUsuario
      );

      if (baneo) {
        res.json({
          success: true,
          esta_baneado: true,
          data: {
            tipo_baneo: baneo.tipo_baneo,
            razon: baneo.razon,
            fecha_baneo: baneo.fecha_baneo,
            fecha_expiracion: baneo.fecha_expiracion,
          },
        });
      } else {
        res.json({
          success: true,
          esta_baneado: false,
        });
      }
    } catch (error: any) {
      console.error('Error al verificar baneo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al verificar baneo',
      });
    }
  }
}

export default new ModeracionController();