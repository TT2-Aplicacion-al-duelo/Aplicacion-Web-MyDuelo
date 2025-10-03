// aplicacionWeb/src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { PsicologoAdmin } from '../interfaces/psicologoAdmin';
import { ValidacionCedulaResponse  } from '../interfaces/validacionCedulaResponse';




@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = "api/admin";
  }

  /**
   * Verificar que el usuario actual es administrador
   */
  verificarAdmin(): Observable<any> {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/verificar`);
  }

  /**
   * Obtener todos los psicólogos
   */
  getAllPsicologos(): Observable<any> {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/psicologos`);
  }

   /**
   * Obtener un psicólogo específico por ID
   */
  getPsicologoById(id: number): Observable<PsicologoAdmin> {
    return this.http.get<PsicologoAdmin>(`${this.AppUrl}${this.APIUrl}/psicologos/${id}`);
  }

  /**
   * Obtener todos los pacientes
   */
  getAllPacientes(): Observable<any> {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/pacientes`);
  }

  /**
   * Validar cédula profesional de un psicólogo
   */
  validarCedula(idPsicologo: number, cedulaValidada: boolean): Observable<any> {
    return this.http.put(`${this.AppUrl}${this.APIUrl}/psicologos/${idPsicologo}/validar-cedula`, {
      cedula_validada: cedulaValidada
    });
  }
  




/**
 *  MÉTODO CORREGIDO: Validar cédula profesional con API
 */
validarCedulaProfesional(idPsicologo: number, cedula: string): Observable<any> {
  return this.http.post(`${this.AppUrl}${this.APIUrl}/psicologos/${idPsicologo}/validar-cedula-api`, {
    cedula: cedula
  });
}

/**
 *  MÉTODO NUEVO: Validar cédula manualmente
 */
    validarCedulaManual(idPsicologo: number): Observable<any> {
      return this.http.put(
        `${this.AppUrl}${this.APIUrl}/psicologos/${idPsicologo}/validar-cedula-manual`, 
        {}
      );
    } 

  /**
   * Cambiar status de un psicólogo (activo/inactivo)
   */
  cambiarEstadoPsicologo(idPsicologo: number, nuevoEstado: 'activo' | 'inactivo'): Observable<any> {
  return this.http.put(`${this.AppUrl}${this.APIUrl}/psicologos/${idPsicologo}/status`, {  // ✅ Cambiar "estado" por "status"
    status: nuevoEstado
  });
}

  /**
   * Eliminar un psicólogo
   */
  eliminarPsicologo(idPsicologo: number): Observable<any> {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/psicologos/${idPsicologo}`);
  }

  
  registrarAdmin(datosAdmin: any): Observable<any> {
    return this.http.post(`${this.AppUrl}api/psicologo/registro-admin`, datosAdmin);
  }

  /**
   * Obtener estadísticas del dashboard
   */
  getEstadisticas(): Observable<any> {
    // Simular datos por ahora, después implementar endpoint real
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          totalPsicologos: 25,
          psicologosActivos: 20,
          psicologosInactivos: 5,
          totalPacientes: 150,
          cedulasValidadas: 18,
          cedulasPendientes: 7,
          mensajesHoy: 45,
          citasHoy: 12
        });
        observer.complete();
      }, 1000);
    });
  }
  /**
   * Actualizar perfil de administrador
   */
  actualizarPerfilAdmin(datos: any): Observable<any> {
    return this.http.put(`${this.AppUrl}${this.APIUrl}/perfil`, datos);
  }

  /**
   * Cambiar contraseña de administrador
   */
  cambiarContrasenaAdmin(contrasenaActual: string, nuevaContrasena: string): Observable<any> {
    return this.http.put(`${this.AppUrl}${this.APIUrl}/cambiar-contrasena`, {
      contrasena_actual: contrasenaActual,
      nueva_contrasena: nuevaContrasena
    });
  }

  /**
   * Solicitar cambio de correo (envía email de confirmación)
   */
  solicitarCambioCorreo(nuevoCorreo: string): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/solicitar-cambio-correo`, {
      nuevo_correo: nuevoCorreo
    });
  }

  /**
   * Confirmar cambio de correo con token
   */
  confirmarCambioCorreo(token: string): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/confirmar-cambio-correo`, {
      token: token
    });
  }
}