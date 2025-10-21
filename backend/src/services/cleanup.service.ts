import { Psicologo } from '../models/psicologo';
import { Op } from 'sequelize';
import emailService from './email.service';

class CleanupService {
  /**
   * Eliminar cuentas inactivas después de 30 días sin validar cédula
   */
  async eliminarCuentasInactivasExpiradas(): Promise<void> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30); // 30 días atrás

      // Buscar cuentas inactivas creadas hace más de 30 días
      const cuentasExpiradas = await Psicologo.findAll({
        where: {
          status: 'inactivo',
          cedula_validada: false,
          createdAt: {
            [Op.lt]: fechaLimite
          }
        }
      });

      console.log(`🧹 Encontradas ${cuentasExpiradas.length} cuentas inactivas expiradas`);

      for (const cuenta of cuentasExpiradas) {
        const cuentaData = cuenta as any;
        console.log(`Eliminando cuenta: ${cuentaData.correo}`);
        
        await cuenta.destroy();
      }

      if (cuentasExpiradas.length > 0) {
        console.log(`✅ ${cuentasExpiradas.length} cuentas inactivas eliminadas`);
      }

    } catch (error) {
      console.error('❌ Error en limpieza de cuentas inactivas:', error);
    }
  }

  /**
   * Enviar notificaciones a psicólogos sin cédula validada
   */
  async notificarCedulasPendientes(): Promise<void> {
    try {
      const psicologosSinValidar = await Psicologo.findAll({
        where: {
          status: 'activo',
          cedula_validada: false,
          rol_admin: false
        }
      });

      for (const psicologo of psicologosSinValidar) {
        const psicologoData = psicologo as any;
        const fechaCreacion = new Date(psicologoData.createdAt);
        const fechaActual = new Date();
        const diasTranscurridos = Math.floor(
          (fechaActual.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24)
        );
        const diasRestantes = 7 - diasTranscurridos;

        // Notificar solo si quedan 3 días o menos
        if (diasRestantes > 0 && diasRestantes <= 3) {
          console.log(`📧 Enviando notificación a: ${psicologoData.correo} (${diasRestantes} días restantes)`);
          
          await emailService.enviarNotificacionCedulaPendiente(
            psicologoData.correo,
            psicologoData.nombre,
            diasRestantes
          );
        }
      }

    } catch (error) {
      console.error('❌ Error enviando notificaciones:', error);
    }
  }

  /**
   * Ejecutar todas las tareas de limpieza
   */
  async ejecutarLimpieza(): Promise<void> {
    console.log('🧹 Iniciando tareas de limpieza...');
    await this.eliminarCuentasInactivasExpiradas();
    await this.notificarCedulasPendientes();
    console.log('✅ Tareas de limpieza completadas');
  }
}

export default new CleanupService();