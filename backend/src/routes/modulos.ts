import { Router } from "express";
import { 
  getModulosPorPaciente, 
  getDetalleModulo,
  getEvidenciasActividad,
  marcarActividadRevisada
} from "../controllers/modulos";
import validarToken from "./validarToken";

const router = Router();

// Todas las rutas requieren autenticación
router.use(validarToken);

// ===== RUTAS DE MÓDULOS =====
// Obtener módulos por paciente
router.get('/api/psicologo/pacientes/:id_paciente/modulos', getModulosPorPaciente);

// Obtener detalle de un módulo específico
router.get('/api/psicologo/pacientes/:id_paciente/modulos/:id_modulo', getDetalleModulo);

// ===== RUTAS DE EVIDENCIAS =====
// Obtener evidencias de una actividad asignada
router.get('/api/psicologo/actividades/asignadas/:id_asignacion/evidencias', getEvidenciasActividad);

// ===== RUTAS DE REVISIÓN =====
// Marcar actividad como revisada
router.put('/api/psicologo/actividades/asignadas/:id_asignacion/revisar', marcarActividadRevisada);

export default router;