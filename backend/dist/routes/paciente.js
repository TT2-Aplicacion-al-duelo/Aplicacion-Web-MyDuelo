"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paciente_1 = require("../controllers/paciente");
const validarToken_1 = __importDefault(require("./validarToken"));
const router = (0, express_1.Router)();
router.post("/api/paciente/registro", paciente_1.registroPaciente);
router.get("/api/psicologo/lista-pacientes", validarToken_1.default, paciente_1.getPacientes);
router.get("/api/psicologo/paciente/:id", validarToken_1.default, paciente_1.getPacientePorId);
router.get("/api/psicologo/paciente/:id/proxima-cita", validarToken_1.default, paciente_1.getProximaCitaPaciente);
exports.default = router;
