// backend/src/routes/actividad.ts
import { Router } from "express";
import {
  getActividadesGlobales,
  crearActividadGlobal,
  actualizarActividadGlobal,
  eliminarActividadGlobal,
  getActividadesPaciente,
  asignarActividad,
  actualizarActividadAsignada,
  eliminarActividadAsignada,
  enviarRecordatorio
} from "../controllers/actividad";
import validarToken from "./validarToken";

const router = Router();

// ==================== PLANTILLAS GLOBALES ====================
// Obtener todas las plantillas de actividades del psicólogo
router.get("/api/psicologo/actividades", validarToken, getActividadesGlobales);

// Crear nueva plantilla de actividad
router.post("/api/psicologo/actividades", validarToken, crearActividadGlobal);

// Actualizar plantilla de actividad
router.put("/api/psicologo/actividades/:id_actividad", validarToken, actualizarActividadGlobal);

// Eliminar plantilla de actividad
router.delete("/api/psicologo/actividades/:id_actividad", validarToken, eliminarActividadGlobal);

// ==================== ASIGNACIÓN DE ACTIVIDADES ====================
// Obtener actividades asignadas a un paciente
router.get("/api/psicologo/paciente/:id_paciente/actividades", validarToken, getActividadesPaciente);

// Asignar actividad(es) a paciente(s)
router.post("/api/psicologo/actividades/asignar", validarToken, asignarActividad);

// Actualizar actividad asignada
router.put("/api/psicologo/actividades/asignadas/:id_asignacion", validarToken, actualizarActividadAsignada);

// Actualizar actividad asignada parcialmente (PATCH)
router.patch("/api/psicologo/actividades/asignadas/:id_asignacion", validarToken, actualizarActividadAsignada);

// Eliminar actividad asignada
router.delete("/api/psicologo/actividades/asignadas/:id_asignacion", validarToken, eliminarActividadAsignada);

// Enviar recordatorio
router.post("/api/psicologo/actividades/asignadas/:id_asignacion/recordatorio", validarToken, enviarRecordatorio);

export default router;