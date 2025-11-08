
import { Response } from 'express';
import { RequestWithUser } from '../middlewares/auth.middlewares';
import moderacionAvanzadaService from '../services/moderacion-avanzada.service';

export class ModeracionAvanzadaController {
  // ========== GESTIÓN DE MENSAJES ==========

  /**
   * DELETE /api/foros/:idForo/mensajes/:idMensaje
   * Eliminar mensaje (soft delete)
   */
  async eliminarMensaje(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const idMensaje = parseInt(req.params.idMensaje);

      await moderacionAvanzadaService.eliminarMensaje(
        idMensaje,
        req.user!.id,
        idForo
      );

      res.json({
        success: true,
        message: 'Mensaje eliminado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al eliminar mensaje',
      });
    }
  }

  /**
   * POST /api/foros/:idForo/mensajes/:idMensaje/restaurar
   * Restaurar mensaje eliminado
   */
  async restaurarMensaje(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const idMensaje = parseInt(req.params.idMensaje);

      await moderacionAvanzadaService.restaurarMensaje(
        idMensaje,
        req.user!.id,
        idForo
      );

      res.json({
        success: true,
        message: 'Mensaje restaurado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al restaurar mensaje',
      });
    }
  }

  /**
   * PUT /api/foros/:idForo/mensajes/:idMensaje
   * Editar mensaje
   */
  async editarMensaje(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const idMensaje = parseInt(req.params.idMensaje);
      const { contenido } = req.body;

      if (!contenido || contenido.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'El contenido no puede estar vacío',
        });
        return;
      }

      await moderacionAvanzadaService.editarMensaje(
        idMensaje,
        contenido.trim(),
        req.user!.id,
        idForo
      );

      res.json({
        success: true,
        message: 'Mensaje editado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al editar mensaje',
      });
    }
  }

  // ========== GESTIÓN DE TEMAS ==========

  /**
   * POST /api/foros/:idForo/temas/:idTema/cerrar
   * Cerrar tema
   */
  async cerrarTema(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const idTema = parseInt(req.params.idTema);

      await moderacionAvanzadaService.cerrarTema(
        idTema,
        req.user!.id,
        idForo
      );

      res.json({
        success: true,
        message: 'Tema cerrado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al cerrar tema',
      });
    }
  }

  /**
   * POST /api/foros/:idForo/temas/:idTema/abrir
   * Abrir tema cerrado
   */
  async abrirTema(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const idTema = parseInt(req.params.idTema);

      await moderacionAvanzadaService.abrirTema(
        idTema,
        req.user!.id,
        idForo
      );

      res.json({
        success: true,
        message: 'Tema abierto exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al abrir tema',
      });
    }
  }

  /**
   * POST /api/foros/:idForo/temas/:idTema/fijar
   * Fijar tema
   */
  async fijarTema(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const idTema = parseInt(req.params.idTema);

      await moderacionAvanzadaService.fijarTema(
        idTema,
        req.user!.id,
        idForo
      );

      res.json({
        success: true,
        message: 'Tema fijado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al fijar tema',
      });
    }
  }

  /**
   * POST /api/foros/:idForo/temas/:idTema/desfijar
   * Desfijar tema
   */
  async desfijarTema(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const idTema = parseInt(req.params.idTema);

      await moderacionAvanzadaService.desfijarTema(
        idTema,
        req.user!.id,
        idForo
      );

      res.json({
        success: true,
        message: 'Tema desfijado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al desfijar tema',
      });
    }
  }

  // ========== SOLICITUDES DE UNIÓN ==========

  /**
   * POST /api/foros/:idForo/solicitar-union
   * Crear solicitud para unirse a un foro
   */
  async crearSolicitud(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const { mensaje } = req.body;

      const solicitud = await moderacionAvanzadaService.crearSolicitud(
        idForo,
        req.user!.tipo,
        req.user!.id,
        mensaje
      );

      res.status(201).json({
        success: true,
        message: 'Solicitud enviada exitosamente',
        data: solicitud,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear solicitud',
      });
    }
  }

  /**
   * GET /api/foros/:idForo/solicitudes
   * Listar solicitudes pendientes de un foro
   */
  async listarSolicitudes(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);

      const solicitudes =
        await moderacionAvanzadaService.listarSolicitudesPendientes(idForo);

      res.json({
        success: true,
        data: solicitudes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al listar solicitudes',
      });
    }
  }

  /**
   * POST /api/foros/:idForo/solicitudes/:idSolicitud/aprobar
   * Aprobar solicitud de unión
   */
  async aprobarSolicitud(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idSolicitud = parseInt(req.params.idSolicitud);

      await moderacionAvanzadaService.aprobarSolicitud(
        idSolicitud,
        req.user!.id
      );

      res.json({
        success: true,
        message: 'Solicitud aprobada exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al aprobar solicitud',
      });
    }
  }

  /**
   * POST /api/foros/:idForo/solicitudes/:idSolicitud/rechazar
   * Rechazar solicitud de unión
   */
  async rechazarSolicitud(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idSolicitud = parseInt(req.params.idSolicitud);
      const { razon } = req.body;

      await moderacionAvanzadaService.rechazarSolicitud(
        idSolicitud,
        req.user!.id,
        razon
      );

      res.json({
        success: true,
        message: 'Solicitud rechazada exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al rechazar solicitud',
      });
    }
  }

  // ========== LOG DE MODERACIÓN ==========

  /**
   * GET /api/foros/:idForo/logs
   * Obtener logs de moderación
   */
  async obtenerLogs(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const filtros: any = {};
      if (req.query.tipo_accion) {
        filtros.tipo_accion = req.query.tipo_accion;
      }
      if (req.query.id_moderador) {
        filtros.id_moderador = parseInt(req.query.id_moderador as string);
      }
      if (req.query.fecha_desde) {
        filtros.fecha_desde = new Date(req.query.fecha_desde as string);
      }
      if (req.query.fecha_hasta) {
        filtros.fecha_hasta = new Date(req.query.fecha_hasta as string);
      }

      const result = await moderacionAvanzadaService.obtenerLogs(
        idForo,
        filtros,
        page,
        limit
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener logs',
      });
    }
  }
}

export default new ModeracionAvanzadaController();