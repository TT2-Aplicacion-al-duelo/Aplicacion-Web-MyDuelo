// backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender la interfaz Request para incluir el usuario
export interface RequestWithUser extends Request {
  user?: {
    id: number;
    tipo: 'psicologo' | 'paciente';
    id_psicologo?: number;
    id_paciente?: number;
    nombre?: string;
    correo?: string;
    email?: string;
    rol_admin?: boolean;
    [key: string]: any;
  };
}

/**
 * Middleware para verificar el token JWT y normalizar la estructura del usuario
 */
export const verificarToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization || req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '').split(' ')[0];

    if (!token) {
      res.status(401).json({
        success: false,
        msg: 'Token no proporcionado',
        error: 'Token no proporcionado',
      });
      return;
    }

    

    // Verificar el token con la misma clave que usa el sistema actual
    const SECRET_KEY = process.env.SECRET_KEY || 'defaultsecretkey';
    const decoded = jwt.verify(token, SECRET_KEY) as any;

    // ✅ Verificar expiración explícitamente
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      res.status(401).json({
        success: false,
        msg: 'Token expirado',
        error: 'Token expirado',
      });
      return;
    }
    // Normalizar la estructura del usuario según el tipo
    let normalizedUser: any = {
      nombre: decoded.nombre,
      correo: decoded.correo || decoded.email,
    };

    // Detectar si es psicólogo o paciente y normalizar
    if (decoded.id_psicologo !== undefined) {
      // Es un psicólogo
      normalizedUser = {
        ...normalizedUser,
        id: decoded.id_psicologo,
        tipo: 'psicologo',
        id_psicologo: decoded.id_psicologo,
        rol_admin: decoded.rol_admin || false,
        cedula_validada: decoded.cedula_validada,
        apellido: decoded.apellido || decoded.apellidoPaterno,
      };
    } else if (decoded.sub !== undefined || decoded.id_paciente !== undefined) {
      // Es un paciente (el login de pacientes usa 'sub' como id)
      const pacienteId = decoded.sub || decoded.id_paciente;
      normalizedUser = {
        ...normalizedUser,
        id: pacienteId,
        tipo: 'paciente',
        id_paciente: pacienteId,
        email: decoded.email,
        role: decoded.role,
      };
    } else {
      // Token inválido o estructura no reconocida
      res.status(401).json({
        success: false,
        msg: 'Token inválido: estructura no reconocida',
        error: 'Token inválido',
      });
      return;
    }

    // Adjuntar el usuario normalizado a la request
    (req as RequestWithUser).user = normalizedUser;
    
    // ✅ FIX: Solo establecer req.body.usuario si req.body existe
    // Inicializar req.body si no existe
    if (!req.body) {
      req.body = {};
    }
    req.body.usuario = decoded;
    
    next();
  } catch (error: any) {
    console.error('Error en verificarToken:', error.message);
    res.status(401).json({
      success: false,
      msg: 'Token inválido',
      error: 'Token inválido',
    });
  }
};

/**
 * Middleware para verificar que el usuario es un psicólogo
 */
export const esPsicologo = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const reqWithUser = req as RequestWithUser;
  
  if (!reqWithUser.user) {
    res.status(401).json({
      success: false,
      msg: 'No autenticado',
      error: 'No autenticado',
    });
    return;
  }

  if (reqWithUser.user.tipo !== 'psicologo') {
    res.status(403).json({
      success: false,
      msg: 'Solo los psicólogos pueden realizar esta acción',
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
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const reqWithUser = req as RequestWithUser;
  
  if (!reqWithUser.user) {
    res.status(401).json({
      success: false,
      msg: 'No autenticado',
      error: 'No autenticado',
    });
    return;
  }

  if (reqWithUser.user.tipo !== 'paciente') {
    res.status(403).json({
      success: false,
      msg: 'Solo los pacientes pueden realizar esta acción',
      error: 'Solo los pacientes pueden realizar esta acción',
    });
    return;
  }
  
  next();
};

/**
 * Middleware para verificar si el usuario es administrador
 */
export const verificarAdmin = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const reqWithUser = req as RequestWithUser;
  
  if (!reqWithUser.user || !reqWithUser.user.rol_admin) {
    res.status(403).json({ 
      msg: 'Acceso denegado. Se requieren privilegios de administrador.' 
    });
    return;
  }
  
  next();
};

// Exportar también con los nombres antiguos para mantener compatibilidad
export { verificarToken as verificarTokenJWT };

// Mantener compatibilidad con el sistema existente que usa este middleware
export const verificarTokenOriginal = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ 
      msg: 'Acceso denegado. No se proporcionó token de autenticación.' 
    });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'defaultsecretkey');
    if (!req.body) {
      req.body = {};
    }
    req.body.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      msg: 'Token inválido o expirado' 
    });
  }
};