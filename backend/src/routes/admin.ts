// backend/src/routes/admin.ts
import { Router } from "express";
import { registroAdmin, verificarAdmin, getAllPsicologos,
        getAllPacientes,      cambiarStatusPsicologo,    eliminarPsicologo,
        validarCedulaConAPI,
        validarCedulaManual
} from "../controllers/admin";
import validarToken from "./validarToken";
import validarAdmin from "./validarAdmin";

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
// Gestión de pacientes
router.get("/api/admin/pacientes", validarAdmin, getAllPacientes);
//  Validación manual de cédula
router.put("/api/admin/psicologos/:id_psicologo/validar-cedula-manual", validarAdmin, validarCedulaManual);
export default router;