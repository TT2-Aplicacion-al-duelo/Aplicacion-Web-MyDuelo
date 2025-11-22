// backend/src/services/email.service.ts
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // SSL/TLS
      auth: {
        user: process.env.EMAIL_USER || 'soporte_tecnico@midueloapp.com',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    });
  }

  async enviarCorreo(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"MiDuelo App" <${process.env.EMAIL_USER || 'soporte_tecnico@midueloapp.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || ''
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar correo:', error);
      return false;
    }
  }

  async enviarCorreoActivacion(correo: string, token: string, nombre: string): Promise<boolean> {
    const urlActivacion = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/activar-cuenta/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a MiDuelo App!</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Gracias por registrarte en MiDuelo App. Para completar tu registro y activar tu cuenta, por favor haz clic en el siguiente botón:</p>
            
            <div style="text-align: center;">
              <a href="${urlActivacion}" class="button">Activar mi cuenta</a>
            </div>
            
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px;">
              ${urlActivacion}
            </p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Este enlace expirará en 48 horas. Si no activas tu cuenta dentro de este período, deberás registrarte nuevamente.
            </div>
            
            <p>Una vez activada tu cuenta, tendrás <strong>7 días</strong> para que un administrador valide tu cédula profesional. Durante este período podrás usar todas las funciones de la aplicación.</p>
            
            <p>Si no solicitaste este registro, por favor ignora este correo.</p>
            
            <p>Saludos cordiales,<br><strong>El equipo de MiDuelo App</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 MiDuelo App. Todos los derechos reservados.</p>
            <p>Si tienes alguna pregunta, contáctanos en soporte_tecnico@midueloapp.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarCorreo({
      to: correo,
      subject: 'Activa tu cuenta en MiDuelo App',
      html,
      text: `Hola ${nombre}, activa tu cuenta en MiDuelo App usando este enlace: ${urlActivacion}. Este enlace expira en 48 horas.`
    });
  }

  async enviarCorreoRecuperacion(correo: string, token: string, nombre: string): Promise<boolean> {
    const urlRecuperacion = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/restablecer-contrasena/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #E94E4E; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #E94E4E; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en MiDuelo App.</p>
            
            <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
            
            <div style="text-align: center;">
              <a href="${urlRecuperacion}" class="button">Restablecer Contraseña</a>
            </div>
            
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px;">
              ${urlRecuperacion}
            </p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.
            </div>
            
            <p><strong>Si no solicitaste este cambio</strong>, tu contraseña está segura y puedes ignorar este correo. Tu contraseña no será modificada.</p>
            
            <p>Saludos cordiales,<br><strong>El equipo de MiDuelo App</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 MiDuelo App. Todos los derechos reservados.</p>
            <p>Si tienes alguna pregunta, contáctanos en soporte_tecnico@midueloapp.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarCorreo({
      to: correo,
      subject: 'Recuperación de Contraseña - MiDuelo App',
      html,
      text: `Hola ${nombre}, restablece tu contraseña en MiDuelo App usando este enlace: ${urlRecuperacion}. Este enlace expira en 1 hora.`
    });
  }

  async enviarNotificacionCedulaPendiente(correo: string, nombre: string, diasRestantes: number): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
          .alert-box { background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Validación de Cédula Pendiente</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            
            <div class="alert-box">
              <h3 style="margin-top: 0; color: #856404;">Acción Requerida</h3>
              <p><strong>Tu cédula profesional aún no ha sido validada.</strong></p>
              <p>Te quedan <strong>${diasRestantes} día(s)</strong> de acceso completo a la plataforma.</p>
            </div>
            
            <p>Para continuar usando MiDuelo App sin restricciones, es necesario que un administrador valide tu cédula profesional.</p>
            
            <h3>¿Qué debes hacer?</h3>
            <ol>
              <li>Contacta al administrador del sistema</li>
              <li>Proporciona tu número de cédula profesional</li>
              <li>Espera la validación (generalmente toma menos de 24 horas)</li>
            </ol>
            
            <p><strong>Información de contacto del administrador:</strong><br>
            📧 Email: soporte_tecnico@midueloapp.com</p>
            
            <p style="color: #dc3545;"><strong>Nota:</strong> Si no se valida tu cédula antes de que expire el período de prueba, algunas funciones de la plataforma quedarán bloqueadas hasta completar la verificación.</p>
            
            <p>Saludos cordiales,<br><strong>El equipo de MiDuelo App</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 MiDuelo App. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarCorreo({
      to: correo,
      subject: `⚠️ Validación de Cédula Pendiente - ${diasRestantes} día(s) restantes`,
      html,
      text: `Hola ${nombre}, tu cédula profesional aún no ha sido validada. Te quedan ${diasRestantes} día(s) de acceso. Por favor contacta al administrador.`
    });
  }

  /**
   * Enviar correo cuando la cédula es validada
   */
  async enviarNotificacionCedulaValidada(correo: string, nombre: string): Promise<boolean> {
    const urlLogin = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/iniciar-sesion`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
          .success-box { background-color: #d4edda; border: 2px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
          .btn { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ ¡Credenciales Validadas!</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            
            <div class="success-box">
              <h3 style="margin-top: 0; color: #155724;">🎉 Tu cédula profesional ha sido validada</h3>
              <p style="font-size: 18px; margin: 0;"><strong>Ya tienes acceso completo a MiDuelo App</strong></p>
            </div>
            
            <p>Nos complace informarte que el administrador ha verificado y validado tu cédula profesional exitosamente.</p>
            
            <h3>¿Qué significa esto?</h3>
            <ul>
              <li>✅ Acceso completo a todas las funcionalidades de la plataforma</li>
              <li>✅ Sin restricciones de tiempo</li>
              <li>✅ Credenciales profesionales verificadas</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${urlLogin}" class="btn">Iniciar Sesión Ahora</a>
            </div>
            
            <p>¡Bienvenido oficialmente a MiDuelo App! Estamos emocionados de que formes parte de nuestra comunidad de profesionales.</p>
            
            <p>Saludos cordiales,<br><strong>El equipo de MiDuelo App</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 MiDuelo App. Todos los derechos reservados.</p>
            <p>Si tienes alguna pregunta, contáctanos en soporte_tecnico@midueloapp.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarCorreo({
      to: correo,
      subject: '✅ Cédula Profesional Validada - Acceso Completo a MiDuelo App',
      html,
      text: `¡Hola ${nombre}! Tu cédula profesional ha sido validada. Ya tienes acceso completo a MiDuelo App. Inicia sesión en: ${urlLogin}`
    });
  }
}

export default new EmailService();