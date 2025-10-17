// backend/src/routes/notas.ts

import { Router } from "express";
import {
  getNotasPaciente,
  getNotaPorId,
  crearNota,
  actualizarNota,
  eliminarNota,
  getNotasTest
} from "../controllers/notas";
import validarToken from "./validarToken";

const router = Router();

// ==================== CRUD DE NOTAS ====================
// Obtener todas las notas de un paciente
router.get("/api/psicologo/pacientes/:id_paciente/notas", validarToken, getNotasPaciente);

// Obtener una nota específica
router.get("/api/psicologo/notas/:id_nota", validarToken, getNotaPorId);

// Crear nueva nota
router.post("/api/psicologo/notas", validarToken, crearNota);

// Actualizar nota
router.put("/api/psicologo/notas/:id_nota", validarToken, actualizarNota);

// Eliminar nota
router.delete("/api/psicologo/notas/:id_nota", validarToken, eliminarNota);

// ==================== NOTAS DE TESTS ====================
// Obtener notas relacionadas con una aplicación de test
router.get("/api/psicologo/tests/aplicaciones/:id_aplicacion/notas", validarToken, getNotasTest);

export default router;