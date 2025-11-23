// backend/src/routes/diario-emociones.ts
import { Router } from "express";
import { getDiarioEmocionesPaciente } from "../controllers/diario-emociones";
import validarToken from "./validarToken";

const router = Router();

// Obtener diario de emociones compartidas de un paciente
router.get(
  "/api/psicologo/paciente/:id_paciente/diario-emociones",
  validarToken,
  getDiarioEmocionesPaciente
);

export default router;