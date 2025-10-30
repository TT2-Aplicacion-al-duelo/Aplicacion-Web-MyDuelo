// backend/src/routes/foro.routes.ts
import { Router } from 'express';
import foroController from '../controllers/foro';
import {
  verificarToken,
  esPsicologo,
  esPaciente,
} from '../middlewares/auth.middlewares';
import {
  esParticipanteForo,
  esAdminForo,
  foroExiste,
  noEstaBaneado,
} from '../middlewares/foro.middleware';

const router = Router();

// ============================================================================
// RUTAS DE FOROS
// ============================================================================

/**
 * GET /api/foros
 * Listar todos los foros
 * Público (sin autenticación) pero con info adicional si está autenticado
 */
router.get(
  '/',
  // Nota: verificarToken es opcional aquí, se puede hacer condicional
  foroController.listarForos.bind(foroController)
);

/**
 * GET /api/foros/:idForo
 * Obtener detalles de un foro
 */
router.get(
  '/:idForo',
  foroExiste,
  foroController.obtenerForo.bind(foroController)
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
 * Unirse a un foro público (solo pacientes)
 */
router.post(
  '/:idForo/unirse',
  verificarToken,
  esPaciente,
  foroExiste,
  foroController.unirseAForo.bind(foroController)
);

/**
 * GET /api/foros/:idForo/participantes
 * Listar participantes de un foro
 */
router.get(
  '/:idForo/participantes',
  verificarToken,
  foroExiste,
  //esParticipanteForo, // si quitamos esta linea ayuda a NO requerir ser participante para ver la lista
  foroController.listarParticipantes.bind(foroController)
);

// ============================================================================
// RUTAS DE INVITACIONES
// ============================================================================

/**
 * POST /api/foros/:idForo/invitar
 * Invitar un psicólogo como moderador (solo admin)
 */
router.post(
  '/:idForo/invitar',
  verificarToken,
  esPsicologo,
  foroExiste,
  esAdminForo,
  foroController.invitarModerador.bind(foroController)
);

/**
 * GET /api/invitaciones
 * Listar invitaciones del psicólogo autenticado
 */
router.get(
  '/invitaciones/mis-invitaciones',
  verificarToken,
  esPsicologo,
  foroController.listarInvitaciones.bind(foroController)
);

/**
 * POST /api/invitaciones/:idInvitacion/responder
 * Responder a una invitación
 */
router.post(
  '/invitaciones/:idInvitacion/responder',
  verificarToken,
  esPsicologo,
  foroController.responderInvitacion.bind(foroController)
);

// ============================================================================
// RUTAS DE TEMAS
// ============================================================================

/**
 * GET /api/foros/:idForo/temas
 * Listar temas de un foro
 */
router.get(
  '/:idForo/temas',
  verificarToken,
  foroExiste,
  //esParticipanteForo,
  foroController.listarTemas.bind(foroController)
);

/**
 * POST /api/foros/:idForo/temas
 * Crear un tema en un foro
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
// RUTAS DE MENSAJES
// ============================================================================

/**
 * GET /api/temas/:idTema/mensajes
 * Listar mensajes de un tema
 */
router.get(
  '/temas/:idTema/mensajes',
  verificarToken,
  // TODO: Agregar middleware para verificar que es participante del foro del tema
  foroController.listarMensajes.bind(foroController)
);

/**
 * POST /api/temas/:idTema/mensajes
 * Crear un mensaje en un tema
 */
router.post(
  '/temas/:idTema/mensajes',
  verificarToken,
  // TODO: Agregar middleware para verificar que es participante del foro del tema
  noEstaBaneado,
  foroController.crearMensaje.bind(foroController)
);

export default router;

// ============================================================================
// DOCUMENTACIÓN DE ENDPOINTS
// ============================================================================

/**
 * RESUMEN DE ENDPOINTS DISPONIBLES EN FASE 1:
 * 
 * FOROS:
 * - GET    /api/foros                      → Listar foros
 * - GET    /api/foros/:idForo              → Ver detalles de un foro
 * - POST   /api/foros                      → Crear foro (psicólogo)
 * - PUT    /api/foros/:idForo              → Actualizar foro (admin)
 * - DELETE /api/foros/:idForo              → Eliminar foro (admin)
 * - POST   /api/foros/:idForo/unirse       → Unirse a foro (paciente)
 * - GET    /api/foros/:idForo/participantes → Ver participantes
 * 
 * INVITACIONES:
 * - POST   /api/foros/:idForo/invitar      → Invitar moderador (admin)
 * - GET    /api/invitaciones/mis-invitaciones → Ver mis invitaciones (psicólogo)
 * - POST   /api/invitaciones/:id/responder → Aceptar/rechazar invitación
 * 
 * TEMAS:
 * - GET    /api/foros/:idForo/temas        → Listar temas del foro
 * - POST   /api/foros/:idForo/temas        → Crear tema (participante)
 * 
 * MENSAJES:
 * - GET    /api/temas/:idTema/mensajes     → Listar mensajes del tema
 * - POST   /api/temas/:idTema/mensajes     → Enviar mensaje (participante)
 */