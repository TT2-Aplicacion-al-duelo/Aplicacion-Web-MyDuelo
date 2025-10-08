import { Router } from "express";
import { login, registro } from "../controllers/psicologo";

const router = Router();
router.post("/api/psicologo/registro", registro);
router.post("/api/psicologo/iniciar-sesion", login);

export default router;