// backend/src/routes/tests.ts

import { Router } from "express";
import {
  getTestsDisponibles,
  getDetalleTest,
  aplicarTest,
  getHistorialTests,
  getDatosGraficas,
  getRespuestasTest,
  getResultadoTest,
  generarPDFRespuestas
} from "../controllers/tests";
import validarToken from "./validarToken";

const router = Router();

// ==================== TESTS DISPONIBLES ====================
// Obtener todos los tests disponibles
router.get("/api/psicologo/tests", validarToken, getTestsDisponibles);

// Obtener detalles de un test con sus preguntas
router.get("/api/psicologo/tests/:id_test", validarToken, getDetalleTest);

// ==================== APLICACIÓN DE TESTS ====================
// Aplicar un test a un paciente
router.post("/api/psicologo/tests/aplicar", validarToken, aplicarTest);

// ==================== HISTORIAL Y GRÁFICAS ====================
// Obtener historial de tests de un paciente
router.get("/api/psicologo/pacientes/:id_paciente/tests", validarToken, getHistorialTests);

// Obtener datos para gráficas
router.get("/api/psicologo/pacientes/:id_paciente/tests/graficas", validarToken, getDatosGraficas);

// ==================== RESPUESTAS Y RESULTADOS ====================
// Obtener respuestas de una aplicación
router.get("/api/psicologo/tests/aplicaciones/:id_aplicacion/respuestas", validarToken, getRespuestasTest);

// Obtener resultado de una aplicación
router.get("/api/psicologo/tests/aplicaciones/:id_aplicacion/resultado", validarToken, getResultadoTest);

// Generar PDF de respuestas
router.get("/api/psicologo/tests/aplicaciones/:id_aplicacion/pdf", validarToken, generarPDFRespuestas);

export default router;