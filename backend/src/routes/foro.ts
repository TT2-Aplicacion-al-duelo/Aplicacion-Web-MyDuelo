import { Router } from 'express';
import foroController from '../controllers/foro';
import moderacionController from '../controllers/moderacion';
import { verificarToken, esPsicologo } from '../middlewares/auth.middlewares';
import {
  esParticipanteForo,
  esParticipanteForoDelTema,
  esAdminForo,
  esModeradorOAdmin,
  foroExiste,
  noEstaBaneado,
  puedeVerContenidoForo,
  puedeVerMensajesTema,
} from '../middlewares/foro.middleware';

const router = Router();

// ============================================================================
// ⚠️ IMPORTANTE: RUTAS ESPECÍFICAS PRIMERO, GENÉRICAS DESPUÉS
// ============================================================================

// ============================================================================
// ENDPOINTS DE INVITACIONES (FASE 1)
// ============================================================================

/**
 * GET /api/foros/invitaciones/mis-invitaciones
 * Ver invitaciones recibidas (psicólogos)
 */
router.get(
  '/invitaciones/mis-invitaciones',
  verificarToken,
  esPsicologo,
  foroController.listarInvitaciones.bind(foroController)
);

/**
 * POST /api/foros/invitaciones/:id/responder
 * Aceptar o rechazar una invitación
 */
router.post(
  '/invitaciones/:id/responder',
  verificarToken,
  esPsicologo,
  foroController.responderInvitacion.bind(foroController)
);

// ============================================================================
// ENDPOINTS DE MENSAJES (FASE 1)
// ============================================================================

/**
 * GET /api/foros/temas/:idTema/mensajes
 * Listar mensajes de un tema
 * 🆕 PERMITE VER mensajes en foros públicos (solo lectura)
 */
router.get(
  '/temas/:idTema/mensajes',
  verificarToken,
  puedeVerMensajesTema,
  foroController.listarMensajes.bind(foroController)
);

/**
 * POST /api/foros/temas/:idTema/mensajes
 * Crear un mensaje en un tema (solo participantes)
 */
router.post(
  '/temas/:idTema/mensajes',
  verificarToken,
  esParticipanteForoDelTema,
  noEstaBaneado,
  foroController.crearMensaje.bind(foroController)
);

// ============================================================================
// ENDPOINTS DE MODERACIÓN (FASE 2)
// ============================================================================

/**
 * GET /api/foros/moderar/historial/:tipoUsuario/:idUsuario
 * Obtener historial de sanciones de un usuario (moderadores y admins)
 */
router.get(
  '/moderar/historial/:tipoUsuario/:idUsuario',
  verificarToken,
  moderacionController.obtenerHistorialUsuario.bind(moderacionController)
);

/**
 * GET /api/foros/moderar/verificar/:idForo/:tipoUsuario/:idUsuario
 * Verificar si un usuario está baneado
 */
router.get(
  '/moderar/verificar/:idForo/:tipoUsuario/:idUsuario',
  verificarToken,
  moderacionController.verificarBaneo.bind(moderacionController)
);

// ============================================================================
// ENDPOINTS DE FOROS (FASE 1)
// ============================================================================

/**
 * GET /api/foros
 * Listar todos los foros públicos
 */
router.get(
  '/',
  verificarToken,
  foroController.listarForos.bind(foroController)
);

/**
 * POST /api/foros
 * Crear un nuevo foro (solo psicólogos)
 */
router.post(
  '/',
  verificarToken,
  esPsicologo,
  foroController.crearForo.bind(foroController)
);

/**
 * GET /api/foros/:idForo
 * Ver detalles de un foro específico
 */
router.get(
  '/:idForo',
  verificarToken,
  foroExiste,
  foroController.obtenerForo.bind(foroController)
);

/**
 * PUT /api/foros/:idForo
 * Actualizar un foro (solo admin)
 */
router.put(
  '/:idForo',
  verificarToken,
  foroExiste,
  esAdminForo,
  foroController.actualizarForo.bind(foroController)
);

/**
 * DELETE /api/foros/:idForo
 * Eliminar un foro (solo admin)
 */
router.delete(
  '/:idForo',
  verificarToken,
  foroExiste,
  esAdminForo,
  foroController.eliminarForo.bind(foroController)
);

/**
 * POST /api/foros/:idForo/unirse
 * Unirse a un foro (pacientes)
 */
router.post(
  '/:idForo/unirse',
  verificarToken,
  foroExiste,
  foroController.unirseAForo.bind(foroController)
);

/**
 * GET /api/foros/:idForo/participantes
 * Listar participantes de un foro
 * 🆕 Permite ver participantes en foros públicos
 */
router.get(
  '/:idForo/participantes',
  verificarToken,
  foroExiste,
  puedeVerContenidoForo,
  foroController.listarParticipantes.bind(foroController)
);

/**
 * POST /api/foros/:idForo/invitar
 * Invitar a un psicólogo como moderador (solo admin)
 */
router.post(
  '/:idForo/invitar',
  verificarToken,
  foroExiste,
  esAdminForo,
  foroController.invitarModerador.bind(foroController)
);

// ============================================================================
// ENDPOINTS DE TEMAS (FASE 1)
// ============================================================================

/**
 * GET /api/foros/:idForo/temas
 * Listar temas de un foro (público o participantes)
 */
router.get(
  '/:idForo/temas',
  verificarToken,
  foroExiste,
  foroController.listarTemas.bind(foroController)
);

/**
 * POST /api/foros/:idForo/temas
 * Crear un tema en un foro (solo participantes)
 */
router.post(
  '/:idForo/temas',
  verificarToken,
  foroExiste,
  esParticipanteForo,
  noEstaBaneado,
  foroController.crearTema.bind(foroController)
);

// ============================================================================
// ENDPOINTS DE MODERACIÓN (FASE 2) - Con :idForo
// ============================================================================

/**
 * POST /api/foros/:idForo/moderar/banear
 * Banear o silenciar a un usuario (moderadores y admins)
 */
router.post(
  '/:idForo/moderar/banear',
  verificarToken,
  foroExiste,
  esModeradorOAdmin,
  moderacionController.banearUsuario.bind(moderacionController)
);

/**
 * DELETE /api/foros/:idForo/moderar/banear/:idBaneo
 * Levantar un baneo (moderadores y admins)
 */
router.delete(
  '/:idForo/moderar/banear/:idBaneo',
  verificarToken,
  foroExiste,
  esModeradorOAdmin,
  moderacionController.levantarBaneo.bind(moderacionController)
);

/**
 * GET /api/foros/:idForo/moderar/baneos
 * Listar baneos de un foro (moderadores y admins)
 */
router.get(
  '/:idForo/moderar/baneos',
  verificarToken,
  foroExiste,
  esModeradorOAdmin,
  moderacionController.listarBaneos.bind(moderacionController)
);

/**
 * GET /api/foros/:idForo/moderar/estadisticas
 * Obtener estadísticas de moderación (moderadores y admins)
 */
router.get(
  '/:idForo/moderar/estadisticas',
  verificarToken,
  foroExiste,
  esModeradorOAdmin,
  moderacionController.obtenerEstadisticas.bind(moderacionController)
);

export default router;
