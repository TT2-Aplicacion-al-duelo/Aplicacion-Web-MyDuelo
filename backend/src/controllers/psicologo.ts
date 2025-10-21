import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Psicologo } from '../models/psicologo';
import { Token } from '../models/token';
import emailService from '../services/email.service';
import { Op } from 'sequelize';

// Función auxiliar para validar edad (18-90 años)
const validarEdad = (fechaNacimiento: string): boolean => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    return (edad - 1) >= 18 && (edad - 1) <= 90;
  }
  
  return edad >= 18 && edad <= 90;
};

// Función auxiliar para validar formato de cédula (7-10 dígitos)
const validarCedula = (cedula: string): boolean => {
  const regex = /^\d{7,10}$/;
  return regex.test(cedula);
};

// Función auxiliar para validar teléfono (10 dígitos)
const validarTelefono = (telefono: string): boolean => {
  const regex = /^\d{10}$/;
  return regex.test(telefono);
};

// Función auxiliar para validar email
const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Función auxiliar para validar contraseña segura
const validarContrasenaSegura = (contrasena: string): { valida: boolean; mensaje: string } => {
  if (contrasena.length < 8) {
    return { valida: false, mensaje: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!/[A-Z]/.test(contrasena)) {
    return { valida: false, mensaje: 'La contraseña debe contener al menos una letra mayúscula' };
  }
  if (!/[a-z]/.test(contrasena)) {
    return { valida: false, mensaje: 'La contraseña debe contener al menos una letra minúscula' };
  }
  if (!/[0-9]/.test(contrasena)) {
    return { valida: false, mensaje: 'La contraseña debe contener al menos un número' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(contrasena)) {
    return { valida: false, mensaje: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' };
  }
  return { valida: true, mensaje: 'Contraseña válida' };
};

export const registro = async (req: Request, res: Response): Promise<void> => {
  const { 
    nombre, 
    apellidoPaterno, 
    apellidoMaterno, 
    fecha_nacimiento, 
    especialidad, 
    cedula, 
    telefono, 
    correo, 
    contrasena,
    aceptaTerminos 
  } = req.body;

  try {
    // Validación 1: Campos obligatorios
    if (!nombre || !apellidoPaterno || !fecha_nacimiento || !especialidad || !cedula || !telefono || !correo || !contrasena) {
      res.status(400).json({ 
        msg: 'Todos los campos son obligatorios' 
      });
      return;
    }

    // Validación 2: Términos y condiciones
    if (!aceptaTerminos) {
      res.status(400).json({ 
        msg: 'Debes aceptar los términos y condiciones para registrarte' 
      });
      return;
    }

    // Validación 3: Edad (18-90 años)
    if (!validarEdad(fecha_nacimiento)) {
      res.status(400).json({ 
        msg: 'Debes tener entre 18 y 90 años para registrarte' 
      });
      return;
    }

    // Validación 4: Formato de cédula (7-10 dígitos)
    if (!validarCedula(cedula)) {
      res.status(400).json({ 
        msg: 'La cédula profesional debe contener entre 7 y 10 dígitos numéricos' 
      });
      return;
    }

    // Validación 5: Formato de teléfono (10 dígitos)
    if (!validarTelefono(telefono)) {
      res.status(400).json({ 
        msg: 'El teléfono debe contener exactamente 10 dígitos' 
      });
      return;
    }

    // Validación 6: Formato de email
    if (!validarEmail(correo)) {
      res.status(400).json({ 
        msg: 'El formato del correo electrónico no es válido' 
      });
      return;
    }

    // Validación 7: Contraseña segura
    const validacionContrasena = validarContrasenaSegura(contrasena);
    if (!validacionContrasena.valida) {
      res.status(400).json({ 
        msg: validacionContrasena.mensaje 
      });
      return;
    }

    // ✅ Validación 8: Usuario existente por CORREO
    const existeCorreo = await Psicologo.findOne({ where: { correo } });
    if (existeCorreo) {
      res.status(400).json({ 
        msg: 'Ya existe un usuario registrado con ese correo electrónico',
        campo: 'correo'
      });
      return;
    }

    // ✅ Validación 9: Usuario existente por CÉDULA
    const existeCedula = await Psicologo.findOne({ where: { cedula } });
    if (existeCedula) {
      res.status(400).json({ 
        msg: 'Ya existe un usuario registrado con esa cédula profesional',
        campo: 'cedula'
      });
      return;
    }

    // ✅ Validación 10: Usuario existente por TELÉFONO
    const existeTelefono = await Psicologo.findOne({ where: { telefono } });
    if (existeTelefono) {
      res.status(400).json({ 
        msg: 'Ya existe un usuario registrado con ese número telefónico',
        campo: 'telefono'
      });
      return;
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Crear psicólogo con status "inactivo"
    const nuevoPsicologo = await Psicologo.create({
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      fecha_nacimiento,
      especialidad,
      cedula,
      telefono,
      correo,
      contrasena: hashedPassword,
      status: 'inactivo', // ✅ La cuenta inicia INACTIVA hasta que se active
      cedula_validada: false,
      rol_admin: false
    });

    // Generar token de activación (válido por 48 horas)
    const tokenActivacion = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 48);

    await Token.create({
      id_psicologo: (nuevoPsicologo as any).id_psicologo,
      token: tokenActivacion,
      tipo: 'activacion',
      fecha_expiracion: fechaExpiracion,
      usado: false
    });

    // Enviar correo de activación
    const correoEnviado = await emailService.enviarCorreoActivacion(
      correo, 
      tokenActivacion, 
      nombre
    );

    if (!correoEnviado) {
      console.error('No se pudo enviar el correo de activación');
    }

    res.status(201).json({ 
      msg: 'Registro exitoso. Por favor revisa tu correo electrónico para activar tu cuenta. El enlace expira en 48 horas.',
      correoEnviado 
    });

  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor al registrar el usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const activarCuenta = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  try {
    // Buscar el token
    const tokenRegistro = await Token.findOne({
      where: {
        token,
        tipo: 'activacion',
        usado: false,
        fecha_expiracion: {
          [Op.gt]: new Date() // Token no expirado
        }
      }
    });

    if (!tokenRegistro) {
      res.status(400).json({ 
        msg: 'Token inválido o expirado. Por favor solicita un nuevo enlace de activación.' 
      });
      return;
    }

    // Activar la cuenta del psicólogo
    const tokenData = tokenRegistro as any;
    await Psicologo.update(
      { status: 'activo' },
      { where: { id_psicologo: tokenData.id_psicologo } }
    );

    // Marcar el token como usado
    await Token.update(
      { usado: true },
      { where: { id_token: tokenData.id_token } }
    );

    res.json({ 
      msg: '¡Cuenta activada exitosamente! Ya puedes iniciar sesión en la plataforma.' 
    });

  } catch (error) {
    console.error('Error al activar cuenta:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor al activar la cuenta' 
    });
  }
};

export const reenviarActivacion = async (req: Request, res: Response): Promise<void> => {
  const { correo } = req.body;

  try {
    const psicologo = await Psicologo.findOne({ where: { correo } });

    if (!psicologo) {
      res.status(404).json({ 
        msg: 'No existe un usuario registrado con ese correo' 
      });
      return;
    }

    const psicologoData = psicologo as any;

    if (psicologoData.status === 'activo') {
      res.status(400).json({ 
        msg: 'Esta cuenta ya está activada. Puedes iniciar sesión normalmente.' 
      });
      return;
    }

    // Invalidar tokens anteriores
    await Token.update(
      { usado: true },
      { 
        where: { 
          id_psicologo: psicologoData.id_psicologo,
          tipo: 'activacion',
          usado: false
        } 
      }
    );

    // Generar nuevo token
    const tokenActivacion = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 48);

    await Token.create({
      id_psicologo: psicologoData.id_psicologo,
      token: tokenActivacion,
      tipo: 'activacion',
      fecha_expiracion: fechaExpiracion,
      usado: false
    });

    // Reenviar correo
    await emailService.enviarCorreoActivacion(
      correo,
      tokenActivacion,
      psicologoData.nombre
    );

    res.json({ 
      msg: 'Se ha enviado un nuevo correo de activación. Revisa tu bandeja de entrada.' 
    });

  } catch (error) {
    console.error('Error al reenviar activación:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor' 
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { correo, contrasena } = req.body;

  try {
    // Validar campos
    if (!correo || !contrasena) {
      res.status(400).json({ 
        msg: 'El correo y la contraseña son obligatorios' 
      });
      return;
    }

    // Buscar usuario
    const psicologo = await Psicologo.findOne({ where: { correo } });

    if (!psicologo) {
      res.status(404).json({ 
        msg: 'Usuario o contraseña incorrectos' 
      });
      return;
    }

    const psicologoData = psicologo as any;

    // Verificar que la cuenta esté activa
    if (psicologoData.status === 'inactivo') {
      res.status(403).json({ 
        msg: 'No has activado tu cuenta. Por favor revisa tu correo electrónico y activa tu cuenta usando el enlace que te enviamos.',
        requiereActivacion: true
      });
      return;
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(contrasena, psicologoData.contrasena);

    if (!passwordValida) {
      res.status(401).json({ 
        msg: 'Usuario o contraseña incorrectos' 
      });
      return;
    }

    // Verificar validación de cédula (solo si no es admin)
    if (!psicologoData.rol_admin && !psicologoData.cedula_validada) {
      const fechaCreacion = new Date(psicologoData.createdAt);
      const fechaActual = new Date();
      const diasTranscurridos = Math.floor((fechaActual.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
      const diasRestantes = 7 - diasTranscurridos;

      // Si pasaron más de 7 días sin validación, incluir advertencia en el token
      if (diasTranscurridos > 7) {
        const token = jwt.sign(
          {
            id_psicologo: psicologoData.id_psicologo,
            correo: psicologoData.correo,
            nombre: psicologoData.nombre,
            apellido: psicologoData.apellidoPaterno,
            rol_admin: psicologoData.rol_admin,
            cedula_validada: false,
            cuenta_limitada: true
          },
          process.env.SECRET_KEY || 'defaultsecretkey',
          { expiresIn: '24h' }
        );

        res.json({
          msg: 'Inicio de sesión exitoso con acceso limitado',
          token,
          usuario: {
            id_psicologo: psicologoData.id_psicologo,
            nombre: psicologoData.nombre,
            apellidoPaterno: psicologoData.apellidoPaterno,
            correo: psicologoData.correo,
            rol_admin: psicologoData.rol_admin,
            cedula_validada: false
          },
          advertencia: 'Tu cédula no ha sido validada. Tu acceso está limitado. Por favor contacta al administrador.',
          cuenta_limitada: true
        });
        return;
      }

      // Si aún está dentro de los 7 días, mostrar advertencia pero permitir acceso completo
      if (diasRestantes <= 3 && diasRestantes > 0) {
        // Enviar notificación si quedan 3 días o menos
        await emailService.enviarNotificacionCedulaPendiente(
          psicologoData.correo,
          psicologoData.nombre,
          diasRestantes
        );
      }
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id_psicologo: psicologoData.id_psicologo,
        correo: psicologoData.correo,
        nombre: psicologoData.nombre,
        apellido: psicologoData.apellidoPaterno,
        rol_admin: psicologoData.rol_admin,
        cedula_validada: psicologoData.cedula_validada,
        cuenta_limitada: false
      },
      process.env.SECRET_KEY || 'defaultsecretkey',
      { expiresIn: '24h' }
    );

    // Calcular días restantes para validación (si aplica)
    let diasRestantesValidacion = null;
    if (!psicologoData.rol_admin && !psicologoData.cedula_validada) {
      const fechaCreacion = new Date(psicologoData.createdAt);
      const fechaActual = new Date();
      const diasTranscurridos = Math.floor((fechaActual.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
      diasRestantesValidacion = Math.max(0, 7 - diasTranscurridos);
    }

    res.json({
      msg: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id_psicologo: psicologoData.id_psicologo,
        nombre: psicologoData.nombre,
        apellidoPaterno: psicologoData.apellidoPaterno,
        correo: psicologoData.correo,
        rol_admin: psicologoData.rol_admin,
        cedula_validada: psicologoData.cedula_validada
      },
      diasRestantesValidacion,
      cuenta_limitada: false
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor al iniciar sesión' 
    });
  }
};

export const solicitarRecuperacion = async (req: Request, res: Response): Promise<void> => {
  const { correoOTelefono } = req.body;

  try {
    if (!correoOTelefono) {
      res.status(400).json({ 
        msg: 'Debes proporcionar un correo electrónico o número de teléfono' 
      });
      return;
    }

    // Buscar por correo o teléfono
    let psicologo;
    if (validarEmail(correoOTelefono)) {
      psicologo = await Psicologo.findOne({ where: { correo: correoOTelefono } });
    } else if (validarTelefono(correoOTelefono)) {
      psicologo = await Psicologo.findOne({ where: { telefono: correoOTelefono } });
    } else {
      res.status(400).json({ 
        msg: 'Formato inválido. Debes proporcionar un correo electrónico válido o un teléfono de 10 dígitos' 
      });
      return;
    }

    if (!psicologo) {
      // Por seguridad, no revelar si el usuario existe o no
      res.json({ 
        msg: 'Si existe una cuenta con esa información, recibirás un correo con instrucciones para recuperar tu contraseña.' 
      });
      return;
    }

    const psicologoData = psicologo as any;

    // Invalidar tokens de recuperación anteriores
    await Token.update(
      { usado: true },
      { 
        where: { 
          id_psicologo: psicologoData.id_psicologo,
          tipo: 'recuperacion',
          usado: false
        } 
      }
    );

    // Generar token de recuperación (válido por 1 hora)
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 1);

    await Token.create({
      id_psicologo: psicologoData.id_psicologo,
      token: tokenRecuperacion,
      tipo: 'recuperacion',
      fecha_expiracion: fechaExpiracion,
      usado: false
    });

    // Enviar correo de recuperación
    await emailService.enviarCorreoRecuperacion(
      psicologoData.correo,
      tokenRecuperacion,
      psicologoData.nombre
    );

    res.json({ 
      msg: 'Si existe una cuenta con esa información, recibirás un correo con instrucciones para recuperar tu contraseña.',
      esTelefono: validarTelefono(correoOTelefono)
    });

  } catch (error) {
    console.error('Error al solicitar recuperación:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor' 
    });
  }
};

export const verificarTokenRecuperacion = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  try {
    const tokenRegistro = await Token.findOne({
      where: {
        token,
        tipo: 'recuperacion',
        usado: false,
        fecha_expiracion: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!tokenRegistro) {
      res.status(400).json({ 
        msg: 'Token inválido o expirado',
        valido: false 
      });
      return;
    }

    res.json({ 
      msg: 'Token válido',
      valido: true 
    });

  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor' 
    });
  }
};

export const restablecerContrasena = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { nuevaContrasena } = req.body;

  try {
    if (!nuevaContrasena) {
      res.status(400).json({ 
        msg: 'La nueva contraseña es obligatoria' 
      });
      return;
    }

    // Validar contraseña segura
    const validacionContrasena = validarContrasenaSegura(nuevaContrasena);
    if (!validacionContrasena.valida) {
      res.status(400).json({ 
        msg: validacionContrasena.mensaje 
      });
      return;
    }

    // Buscar el token
    const tokenRegistro = await Token.findOne({
      where: {
        token,
        tipo: 'recuperacion',
        usado: false,
        fecha_expiracion: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!tokenRegistro) {
      res.status(400).json({ 
        msg: 'Token inválido o expirado' 
      });
      return;
    }

    const tokenData = tokenRegistro as any;

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar contraseña
    await Psicologo.update(
      { contrasena: hashedPassword },
      { where: { id_psicologo: tokenData.id_psicologo } }
    );

    // Marcar token como usado
    await Token.update(
      { usado: true },
      { where: { id_token: tokenData.id_token } }
    );

    res.json({ 
      msg: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.' 
    });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor' 
    });
  }
};

export const actualizarPerfil = async (req: Request, res: Response): Promise<void> => {
  const { id_psicologo } = req.body.usuario; // Viene del middleware de autenticación
  const { telefono, correo, direccionConsultorio } = req.body;

  try {
    const psicologo = await Psicologo.findByPk(id_psicologo);

    if (!psicologo) {
      res.status(404).json({ 
        msg: 'Psicólogo no encontrado' 
      });
      return;
    }

    const actualizaciones: any = {};

    // Validar y actualizar teléfono
    if (telefono && telefono !== (psicologo as any).telefono) {
      if (!validarTelefono(telefono)) {
        res.status(400).json({ 
          msg: 'El teléfono debe contener exactamente 10 dígitos' 
        });
        return;
      }
      actualizaciones.telefono = telefono;
    }

    // Validar y actualizar correo
    if (correo && correo !== (psicologo as any).correo) {
      if (!validarEmail(correo)) {
        res.status(400).json({ 
          msg: 'El formato del correo electrónico no es válido' 
        });
        return;
      }

      // Verificar que el correo no esté en uso
      const existeCorreo = await Psicologo.findOne({ 
        where: { 
          correo,
          id_psicologo: { [Op.ne]: id_psicologo }
        } 
      });

      if (existeCorreo) {
        res.status(400).json({ 
          msg: 'Este correo ya está en uso por otro usuario' 
        });
        return;
      }

      actualizaciones.correo = correo;
    }

    // Actualizar dirección de consultorio (nuevo campo, agregar a modelo si no existe)
    if (direccionConsultorio !== undefined) {
      actualizaciones.direccion_consultorio = direccionConsultorio;
    }

    // Aplicar actualizaciones
    if (Object.keys(actualizaciones).length > 0) {
      await Psicologo.update(actualizaciones, { 
        where: { id_psicologo } 
      });
    }

    res.json({ 
      msg: 'Perfil actualizado exitosamente',
      actualizaciones 
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor' 
    });
  }
};

export const cambiarContrasena = async (req: Request, res: Response): Promise<void> => {
  const { id_psicologo } = req.body.usuario; // Viene del middleware
  const { contrasenaActual, nuevaContrasena } = req.body;

  try {
    if (!contrasenaActual || !nuevaContrasena) {
      res.status(400).json({ 
        msg: 'La contraseña actual y la nueva contraseña son obligatorias' 
      });
      return;
    }

    const psicologo = await Psicologo.findByPk(id_psicologo);

    if (!psicologo) {
      res.status(404).json({ 
        msg: 'Psicólogo no encontrado' 
      });
      return;
    }

    const psicologoData = psicologo as any;

    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(contrasenaActual, psicologoData.contrasena);

    if (!passwordValida) {
      res.status(401).json({ 
        msg: 'La contraseña actual es incorrecta' 
      });
      return;
    }

    // Validar nueva contraseña
    const validacionContrasena = validarContrasenaSegura(nuevaContrasena);
    if (!validacionContrasena.valida) {
      res.status(400).json({ 
        msg: validacionContrasena.mensaje 
      });
      return;
    }

    // Encriptar y actualizar
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    await Psicologo.update(
      { contrasena: hashedPassword },
      { where: { id_psicologo } }
    );

    res.json({ 
      msg: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      msg: 'Error interno del servidor' 
    });
  }
};