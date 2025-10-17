// backend/src/routes/modulos.ts
import { Router } from "express";
import { 
  getModulosPorPaciente, 
  getDetalleModulo,
  getEvidenciasActividad,
  marcarActividadRevisada
} from "../controllers/modulos";
import { verificarToken } from "../middlewares/auth";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas de módulos
router.get('/pacientes/:id_paciente/modulos', getModulosPorPaciente);
router.get('/pacientes/:id_paciente/modulos/:id_modulo', getDetalleModulo);

// Rutas de evidencias
router.get('/actividades/asignadas/:id_asignacion/evidencias', getEvidenciasActividad);

// Rutas de revisión
router.put('/actividades/asignadas/:id_asignacion/revisar', marcarActividadRevisada);

export default router;