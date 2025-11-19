import { Router } from "express";
import { getFotoPerfilPaciente, getPacientePorId, getPacientes, getProximaCitaPaciente, registroPaciente } from "../controllers/paciente";
import validarToken from './validarToken';

const router = Router();
router.post("/api/paciente/registro", registroPaciente);
router.get("/api/psicologo/lista-pacientes", validarToken, getPacientes);
router.get("/api/psicologo/paciente/:id", validarToken, getPacientePorId);
router.get("/api/psicologo/paciente/:id/proxima-cita", validarToken, getProximaCitaPaciente);
router.get("/api/psicologo/paciente/:id/foto-perfil", validarToken, getFotoPerfilPaciente);

export default router;