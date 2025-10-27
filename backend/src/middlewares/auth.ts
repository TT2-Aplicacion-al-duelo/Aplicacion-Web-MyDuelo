// backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserAuth, RequestWithUser } from '../types/foro';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_aqui';

/**
 * Middleware para verificar el token JWT
 */
export const verificarToken = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token no proporcionado',
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserAuth;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado',
    });
  }
};

/**
 * Middleware para verificar que el usuario es un psicólogo
 */
export const esPsicologo = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.tipo !== 'psicologo') {
    res.status(403).json({
      success: false,
      error: 'Solo los psicólogos pueden realizar esta acción',
    });
    return;
  }
  next();
};

/**
 * Middleware para verificar que el usuario es un paciente
 */
export const esPaciente = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.tipo !== 'paciente') {
    res.status(403).json({
      success: false,
      error: 'Solo los pacientes pueden realizar esta acción',
    });
    return;
  }
  next();
};

