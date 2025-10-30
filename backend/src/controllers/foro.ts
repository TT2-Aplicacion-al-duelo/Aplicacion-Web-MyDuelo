// backend/src/controllers/foro.controller.ts
import { Response } from 'express';
import { RequestWithUser } from '../middlewares/auth.middlewares';
import { 
  CreateForoRequest,
  ForoResponse,

} from '../types/foro';
import foroService from '../services/foro.service';

export class ForoController {
  /**
   * GET /api/foros
   * Listar todos los foros
   */
  async listarForos(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const result = await foroService.listarForos(
        req.query,
        req.user?.id,
        req.user?.tipo
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al listar foros',
      });
    }
  }

  /**
   * GET /api/foros/:idForo
   * Obtener detalles de un foro específico
   */
  async obtenerForo(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const foro = await foroService.obtenerForoPorId(
        idForo,
        req.user?.id,
        req.user?.tipo
      );

      res.json({
        success: true,
        data: foro,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || 'Foro no encontrado',
      });
    }
  }

  /**
   * POST /api/foros
   * Crear un nuevo foro (solo psicólogos)
   */
  async crearForo(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { titulo, descripcion, publico } = req.body;

      if (!titulo || titulo.trim().length < 3) {
        res.status(400).json({
          success: false,
          error: 'El título debe tener al menos 3 caracteres',
        });
        return;
      }

      const foro = await foroService.crearForo({
        titulo: titulo.trim(),
        descripcion: descripcion?.trim(),
        publico: publico !== false, // Por defecto es público
        id_psicologo_creador: req.user!.id,
      });

      res.status(201).json({
        success: true,
        message: 'Foro creado exitosamente',
        data: foro,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el foro',
      });
    }
  }

  /**
   * PUT /api/foros/:idForo
   * Actualizar un foro (solo admin del foro)
   */
  async actualizarForo(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const { titulo, descripcion, publico } = req.body;

      const updates: any = {};
      if (titulo) updates.titulo = titulo.trim();
      if (descripcion !== undefined) updates.descripcion = descripcion?.trim();
      if (publico !== undefined) updates.publico = publico;

      const foro = await foroService.actualizarForo(idForo, updates);

      res.json({
        success: true,
        message: 'Foro actualizado exitosamente',
        data: foro,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar el foro',
      });
    }
  }

  /**
   * DELETE /api/foros/:idForo
   * Eliminar un foro (solo admin del foro)
   */
  async eliminarForo(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      await foroService.eliminarForo(idForo);

      res.json({
        success: true,
        message: 'Foro eliminado exitosamente',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar el foro',
      });
    }
  }

  /**
   * POST /api/foros/:idForo/unirse
   * Unirse a un foro público (solo pacientes)
   */
  async unirseAForo(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      await foroService.unirseAForo(idForo, req.user!.id);

      res.json({
        success: true,
        message: 'Te has unido al foro exitosamente',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('Ya eres') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al unirse al foro',
      });
    }
  }

  /**
   * GET /api/foros/:idForo/participantes
   * Listar participantes de un foro
   */
  
  // Agregar al inicio de listarParticipantes():
  async listarParticipantes(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      
      // ✅ LOG DE DIAGNÓSTICO
      console.log('============================================');
      console.log('🔍 listarParticipantes - Iniciando');
      console.log('ID Foro:', idForo);
      console.log('Usuario:', req.user);
      console.log('============================================');
      
      const participantes = await foroService.listarParticipantes(idForo);
      
      // ✅ LOG DE ÉXITO
      console.log(`✅ Participantes encontrados: ${participantes.length}`);
      
      res.json({
        success: true,
        data: participantes,
      });
    } catch (error: any) {
      // ✅ LOG DE ERROR DETALLADO
      console.error('❌ ERROR en listarParticipantes:');
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      console.error('============================================');
      
      res.status(500).json({
        success: false,
        error: error.message || 'Error al listar participantes',
      });
    }
  }
  // ========== INVITACIONES ==========

  /**
   * POST /api/foros/:idForo/invitar
   * Invitar un psicólogo como moderador (solo admin)
   */
  async invitarModerador(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const { id_psicologo_invitado, mensaje } = req.body;

      if (!id_psicologo_invitado) {
        res.status(400).json({
          success: false,
          error: 'Debes especificar el ID del psicólogo a invitar',
        });
        return;
      }

      if (id_psicologo_invitado === req.user!.id) {
        res.status(400).json({
          success: false,
          error: 'No puedes invitarte a ti mismo',
        });
        return;
      }

      const invitacion = await foroService.invitarModerador(
        idForo,
        id_psicologo_invitado,
        req.user!.id,
        mensaje
      );

      res.status(201).json({
        success: true,
        message: 'Invitación enviada exitosamente',
        data: invitacion,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al enviar invitación',
      });
    }
  }

  /**
   * GET /api/invitaciones
   * Listar invitaciones del psicólogo autenticado
   */
  async listarInvitaciones(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const estado = req.query.estado as 'pendiente' | 'aceptada' | 'rechazada' | undefined;
      
      const invitaciones = await foroService.listarInvitacionesPsicologo(
        req.user!.id,
        estado
      );

      res.json({
        success: true,
        data: invitaciones,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al listar invitaciones',
      });
    }
  }

  /**
   * POST /api/invitaciones/:idInvitacion/responder
   * Responder a una invitación (aceptar/rechazar)
   */
  async responderInvitacion(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idInvitacion = parseInt(req.params.idInvitacion);
      const { aceptar } = req.body;

      if (aceptar === undefined) {
        res.status(400).json({
          success: false,
          error: 'Debes especificar si aceptas o rechazas la invitación',
        });
        return;
      }

      await foroService.responderInvitacion(
        idInvitacion,
        req.user!.id,
        aceptar
      );

      res.json({
        success: true,
        message: aceptar
          ? 'Invitación aceptada. Ahora eres moderador del foro'
          : 'Invitación rechazada',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al responder invitación',
      });
    }
  }

  // ========== TEMAS ==========

  /**
   * POST /api/foros/:idForo/temas
   * Crear un tema en un foro (participantes)
   */
  async crearTema(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idForo = parseInt(req.params.idForo);
      const { titulo, descripcion } = req.body;

      if (!titulo || titulo.trim().length < 3) {
        res.status(400).json({
          success: false,
          error: 'El título debe tener al menos 3 caracteres',
        });
        return;
      }

      const tema = await foroService.crearTema(
        idForo,
        titulo.trim(),
        descripcion?.trim()
      );

      res.status(201).json({
        success: true,
        message: 'Tema creado exitosamente',
        data: tema,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el tema',
      });
    }
  }

  /**
   * GET /api/foros/:idForo/temas
   * Listar temas de un foro
   */
  async listarTemas(req: RequestWithUser, res: Response): Promise<void> {
  try {
    const idForo = parseInt(req.params.idForo);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // ✅ LOG DE DIAGNÓSTICO
    console.log('============================================');
    console.log('🔍 listarTemas - Iniciando');
    console.log('ID Foro:', idForo);
    console.log('Page:', page, 'Limit:', limit);
    console.log('============================================');
    
    const result = await foroService.listarTemas(idForo, page, limit);
    
    // ✅ LOG DE ÉXITO
    console.log(`✅ Temas encontrados: ${result.data.length}`);
    
    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    // ✅ LOG DE ERROR DETALLADO
    console.error('❌ ERROR en listarTemas:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('============================================');
    
    res.status(500).json({
      success: false,
      error: error.message || 'Error al listar temas',
    });
  }
}

  // ========== MENSAJES ==========

  /**
   * POST /api/temas/:idTema/mensajes
   * Crear un mensaje en un tema (participantes)
   */
  async crearMensaje(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idTema = parseInt(req.params.idTema);
      const { contenido } = req.body;

      if (!contenido || contenido.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'El mensaje no puede estar vacío',
        });
        return;
      }

      const mensaje = await foroService.crearMensaje(
        idTema,
        contenido.trim(),
        req.user!.tipo,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        data: mensaje,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar el mensaje',
      });
    }
  }

  /**
   * GET /api/temas/:idTema/mensajes
   * Listar mensajes de un tema
   */
  async listarMensajes(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const idTema = parseInt(req.params.idTema);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await foroService.listarMensajes(idTema, page, limit);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al listar mensajes',
      });
    }
  }
}

export default new ForoController();