// backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ 
      msg: 'Acceso denegado. No se proporcionó token de autenticación.' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'defaultsecretkey');
    req.body.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      msg: 'Token inválido o expirado' 
    });
  }
};

export const verificarAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body.usuario || !req.body.usuario.rol_admin) {
    res.status(403).json({ 
      msg: 'Acceso denegado. Se requieren privilegios de administrador.' 
    });
    return;
  }
  next();
};