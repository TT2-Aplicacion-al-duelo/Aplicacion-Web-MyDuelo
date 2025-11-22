// backend/src/routes/admin.ts
import { Router } from "express";
import { registroAdmin, verificarAdmin, getAllPsicologos,
        cambiarStatusPsicologo,    eliminarPsicologo,
        validarCedulaConAPI,
        validarCedulaManual,
        getAllPacientesAdmin,
        reasignarPaciente,
        cambiarEstadoPaciente,
        eliminarPaciente
} from "../controllers/admin";
import validarToken from "./validarToken";
import validarAdmin from "./validarAdmin";
import { uploadFotoPerfil } from "../config/multer.config";
import { eliminarFotoPerfil, obtenerPerfil, subirFotoPerfil } from "../controllers/psicologo";

const router = Router();

// ===== RUTAS PÚBLICAS (SOLO PARA SETUP INICIAL) =====
//  NOTA: En producción, esta ruta debería estar protegida o removida
router.post("/api/psicologo/registro-admin", registroAdmin);

// ===== RUTAS PROTEGIDAS PARA ADMINISTRADORES =====
// Verificar que el token es de un administrador
router.get("/api/admin/verificar", validarToken, verificarAdmin);

// Gestión de psicólogos
router.get("/api/admin/psicologos", validarAdmin, getAllPsicologos);
//router.put("/api/admin/psicologos/:id_psicologo/validar-cedula", validarAdmin, validarCedula);
router.put("/api/admin/psicologos/:id_psicologo/status", validarAdmin, cambiarStatusPsicologo);
router.delete("/api/admin/psicologos/:id_psicologo", validarAdmin, eliminarPsicologo);

router.post("/api/admin/psicologos/:id_psicologo/validar-cedula-api", validarAdmin, validarCedulaConAPI);
//  Validación manual de cédula
router.put("/api/admin/psicologos/:id_psicologo/validar-cedula-manual", validarAdmin, validarCedulaManual);
// Gestión de pacientes
router.get("/api/admin/pacientes", validarAdmin, getAllPacientesAdmin);
router.put("/api/admin/pacientes/:id_paciente/reasignar", validarAdmin, reasignarPaciente);
router.put("/api/admin/pacientes/:id_paciente/status", validarAdmin, cambiarEstadoPaciente);

router.post("/api/admin/subir-foto-perfil", validarAdmin, uploadFotoPerfil.single('foto'), subirFotoPerfil);
router.delete("/api/admin/eliminar-foto-perfil", validarAdmin, eliminarFotoPerfil);
router.get("/api/admin/perfil", validarAdmin, obtenerPerfil);

router.delete("/api/admin/pacientes/:id_paciente", validarAdmin, eliminarPaciente);
export default router;