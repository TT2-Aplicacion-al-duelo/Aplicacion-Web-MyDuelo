import { Router } from 'express';
import {
  getNotificaciones,
  getCountNoLeidas,
  marcarComoLeida,
  marcarTodasLeidas,
  eliminarNotificacion
} from '../controllers/notificaciones';
import validarToken from './validarToken';

const router = Router();

// Obtener notificaciones
router.get('/api/psicologo/notificaciones', validarToken, getNotificaciones);

// Obtener cantidad de no leídas
router.get('/api/psicologo/notificaciones/no-leidas/count', validarToken, getCountNoLeidas);

// Marcar como leída
router.put('/api/psicologo/notificaciones/:id_notificacion/marcar-leida', validarToken, marcarComoLeida);

// Marcar todas como leídas
router.put('/api/psicologo/notificaciones/marcar-todas-leidas', validarToken, marcarTodasLeidas);

// Eliminar notificación
router.delete('/api/psicologo/notificaciones/:id_notificacion', validarToken, eliminarNotificacion);

export default router;