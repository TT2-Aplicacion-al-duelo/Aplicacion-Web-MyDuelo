import { Router } from "express";
import { getReporteGeneral } from "../controllers/reporte-pacientes";
import validarToken from './validarToken';

const router = Router();

// Obtener reporte general de todos los pacientes del psicólogo
router.get("/api/psicologo/reporte-general", validarToken, getReporteGeneral);

export default router;