// // aplicacionWeb/src/app/services/actividad.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { Actividad, ActividadAsignada, AsignarActividadRequest } from '../interfaces/actividad';
// import { environment } from '../../environments/environment';

// @Injectable({
//   providedIn: 'root'
// })


// export class ActividadService {
  
//   private AppUrl: string;
//   private APIUrl: string;

//   constructor(private http: HttpClient) {
//     this.AppUrl = environment.apiUrl;
//     this.APIUrl = "/api/psicologo";
//   }

//   private getHeaders(): HttpHeaders {
//     const token = localStorage.getItem('token');
//     return new HttpHeaders({
//       'Authorization': `Bearer ${token}`
//     });
//   }

//   // ==================== PLANTILLAS GLOBALES ====================
  
//   /**
//    * Obtener todas las plantillas de actividades del psicólogo
//    */
//   getActividadesGlobales(): Observable<Actividad[]> {
//     return this.http.get<Actividad[]>(`${this.AppUrl}${this.APIUrl}/actividades`, {
//       headers: this.getHeaders()
//     });
//   }

//   /**
//    * Crear una nueva plantilla de actividad
//    */
//   crearActividadGlobal(actividad: Partial<Actividad>): Observable<Actividad> {
//     return this.http.post<Actividad>(`${this.AppUrl}${this.APIUrl}/actividades`, actividad, {
//       headers: this.getHeaders()
//     });
//   }

//   /**
//    * Actualizar una plantilla de actividad
//    */
//   actualizarActividadGlobal(id: number, actividad: Partial<Actividad>): Observable<Actividad> {
//     return this.http.put<Actividad>(`${this.AppUrl}${this.APIUrl}/actividades/${id}`, actividad, {
//       headers: this.getHeaders()
//     });
//   }

//   /**
//    * Eliminar una plantilla de actividad
//    */
//   eliminarActividadGlobal(id: number): Observable<any> {
//     return this.http.delete(`${this.AppUrl}${this.APIUrl}/actividades/${id}`, {
//       headers: this.getHeaders()
//     });
//   }

//   // ==================== ASIGNACIÓN DE ACTIVIDADES ====================
  
//   /**
//    * Obtener actividades asignadas a un paciente específico
//    */
//   getActividadesPaciente(idPaciente: number): Observable<ActividadAsignada[]> {
//     return this.http.get<ActividadAsignada[]>(`${this.AppUrl}${this.APIUrl}/paciente/${idPaciente}/actividades`, {
//       headers: this.getHeaders()
//     });
//   }

//   /**
//    * Asignar una o varias actividades a uno o varios pacientes
//    */
//   asignarActividad(data: AsignarActividadRequest): Observable<any> {
//     return this.http.post(`${this.AppUrl}${this.APIUrl}/actividades/asignar`, data, {
//       headers: this.getHeaders()
//     });
//   }

//   /**
//    * Actualizar una actividad asignada
//    */
//   actualizarActividadAsignada(id: number, data: Partial<ActividadAsignada>): Observable<ActividadAsignada> {
//     return this.http.put<ActividadAsignada>(`${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}`, data, {
//       headers: this.getHeaders()
//     });
//   }

//   /**
//    * Eliminar una actividad asignada
//    */
//   eliminarActividadAsignada(id: number): Observable<any> {
//     return this.http.delete(`${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}`, {
//       headers: this.getHeaders()
//     });
//   }

//   /**
//    * Enviar recordatorio de actividad
//    */
//   enviarRecordatorio(id: number): Observable<any> {
//     return this.http.post(`${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}/recordatorio`, {}, {
//       headers: this.getHeaders()
//     });
//   }
// }

// aplicacionWeb/src/app/services/actividad.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Actividad, ActividadAsignada, AsignarActividadRequest, CrearActividadRequest, ActualizarActividadRequest } from '../interfaces/actividad';
import { environment } from '../../environments/environment';

/**
 * SERVICIO UNIFICADO DE ACTIVIDADES
 * Maneja todas las operaciones relacionadas con actividades globales y personalizadas
 */
@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = "/api/psicologo";
  }

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtiene el ID del psicólogo actual desde localStorage
   */
  private getPsicologoId(): number {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return usuario.id_psicologo || 0;
  }

  // ==================== PLANTILLAS GLOBALES / ACTIVIDADES GLOBALES ====================
  
  /**
   * Obtener todas las plantillas de actividades del psicólogo
   * (Anteriormente: obtenerActividadesGlobales en actividades.service.ts)
   */
  getActividadesGlobales(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.AppUrl}${this.APIUrl}/actividades`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.procesarActividades(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Alias para compatibilidad con código existente
   */
  obtenerActividadesGlobales(): Observable<Actividad[]> {
    return this.getActividadesGlobales();
  }

  /**
   * Obtener las actividades creadas por el psicólogo actual
   */
  obtenerActividadesDelPsicologo(): Observable<Actividad[]> {
    const psicologoId = this.getPsicologoId();
    return this.http.get<Actividad[]>(`${this.AppUrl}${this.APIUrl}/actividades?psicologo=${psicologoId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.procesarActividades(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener una actividad específica por ID
   */
  obtenerActividad(id: number): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.AppUrl}${this.APIUrl}/actividades/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crear una nueva plantilla de actividad
   */
  crearActividadGlobal(actividad: CrearActividadRequest | Partial<Actividad>): Observable<Actividad> {
    const psicologoId = this.getPsicologoId();
    const actividadConPsicologo = {
      ...actividad,
      id_psicologo_creador: psicologoId,
      origen: 'personalizada' as const
    };

    return this.http.post<Actividad>(`${this.AppUrl}${this.APIUrl}/actividades`, actividadConPsicologo, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Alias para compatibilidad
   */
  crearActividad(actividad: CrearActividadRequest | Partial<Actividad>): Observable<Actividad> {
    return this.crearActividadGlobal(actividad);
  }

  /**
   * Actualizar una plantilla de actividad
   */
  actualizarActividadGlobal(id: number, actividad: ActualizarActividadRequest | Partial<Actividad>): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.AppUrl}${this.APIUrl}/actividades/${id}`, actividad, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Alias para compatibilidad
   */
  actualizarActividad(id: number, actividad: ActualizarActividadRequest | Partial<Actividad>): Observable<Actividad> {
    return this.actualizarActividadGlobal(id, actividad);
  }

  /**
   * Eliminar una plantilla de actividad
   */
  eliminarActividadGlobal(id: number): Observable<any> {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/actividades/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Alias para compatibilidad
   */
  eliminarActividad(id: number): Observable<any> {
    return this.eliminarActividadGlobal(id);
  }

  // ==================== ASIGNACIÓN DE ACTIVIDADES A PACIENTES ====================
  
  /**
   * Obtener actividades asignadas a un paciente específico
   */
  getActividadesPaciente(idPaciente: number): Observable<ActividadAsignada[]> {
    return this.http.get<ActividadAsignada[]>(`${this.AppUrl}${this.APIUrl}/paciente/${idPaciente}/actividades`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.procesarActividadesAsignadas(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Alias para compatibilidad
   */
  obtenerActividadesDelPaciente(idPaciente: number): Observable<ActividadAsignada[]> {
    return this.getActividadesPaciente(idPaciente);
  }

  /**
   * Asignar una o varias actividades a uno o varios pacientes
   */
  asignarActividad(data: AsignarActividadRequest): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/actividades/asignar`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Asignar una actividad a múltiples pacientes
   */
  asignarActividadMultiple(asignaciones: Array<{
    id_actividad: number;
    id_paciente: number;
    fecha_limite?: string;
    instrucciones_personalizadas?: string;
    prioridad?: 'baja' | 'media' | 'alta';
  }>): Observable<any> {
    // Convertir array de asignaciones al formato que espera el endpoint
    const promesas = asignaciones.map(asignacion => 
      this.asignarActividad({
        id_actividad: asignacion.id_actividad,
        pacientes: [asignacion.id_paciente],
        fecha_limite: asignacion.fecha_limite,
        instrucciones_personalizadas: asignacion.instrucciones_personalizadas,
        prioridad: asignacion.prioridad
      }).toPromise()
    );

    return new Observable(observer => {
      Promise.all(promesas)
        .then(resultados => {
          observer.next(resultados);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Actualizar una actividad asignada
   */
  actualizarActividadAsignada(id: number, data: Partial<ActividadAsignada>): Observable<ActividadAsignada> {
    return this.http.put<ActividadAsignada>(`${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar el estado de una actividad asignada
   */
  actualizarEstadoActividad(idAsignacion: number, estado: 'en_proceso' | 'finalizada'): Observable<any> {
    return this.http.patch(
      `${this.AppUrl}${this.APIUrl}/actividades/asignadas/${idAsignacion}/estado`,
      { estado },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar una actividad asignada
   */
  eliminarActividadAsignada(id: number): Observable<any> {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Alias para compatibilidad
   */
  eliminarAsignacion(idAsignacion: number): Observable<any> {
    return this.eliminarActividadAsignada(idAsignacion);
  }

  // ==================== EVIDENCIAS ====================

  /**
   * Obtener las evidencias de una actividad asignada
   */
  obtenerEvidencias(idAsignacion: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.AppUrl}${this.APIUrl}/actividades/asignadas/${idAsignacion}/evidencias`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Subir una evidencia para una actividad asignada
   */
  subirEvidencia(idAsignacion: number, evidencia: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const httpOptionsFormData = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
        // NO incluir 'Content-Type' para FormData, el navegador lo establece automáticamente
      })
    };
    
    return this.http.post(
      `${this.AppUrl}${this.APIUrl}/actividades/asignadas/${idAsignacion}/evidencia`,
      evidencia,
      httpOptionsFormData
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== BÚSQUEDA Y ESTADÍSTICAS ====================

  /**
   * Buscar actividades por término
   */
  buscarActividades(termino: string): Observable<Actividad[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Actividad[]>(
      `${this.AppUrl}${this.APIUrl}/actividades/buscar`,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => this.procesarActividades(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener estadísticas de actividades de un paciente
   */
  obtenerEstadisticasActividades(idPaciente: number): Observable<any> {
    return this.http.get(
      `${this.AppUrl}${this.APIUrl}/paciente/${idPaciente}/actividades/estadisticas`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Enviar recordatorio de actividad
   */
  enviarRecordatorio(id: number): Observable<any> {
    return this.http.post(
      `${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}/recordatorio`, 
      {}, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Procesa el array de actividades para asegurar tipos correctos
   */
  private procesarActividades(actividades: any[]): Actividad[] {
    if (!Array.isArray(actividades)) {
      return [];
    }
    
    return actividades.map(actividad => ({
      ...actividad,
      obligatoria: Boolean(actividad.obligatoria),
      repetitiva: Boolean(actividad.repetitiva),
      periodo: actividad.periodo ? Number(actividad.periodo) : undefined,
      fecha_creacion: actividad.fecha_creacion ? new Date(actividad.fecha_creacion) : undefined
    }));
  }

  /**
   * Procesa el array de actividades asignadas para asegurar tipos correctos
   */
  private procesarActividadesAsignadas(asignaciones: any[]): ActividadAsignada[] {
    if (!Array.isArray(asignaciones)) {
      return [];
    }

    return asignaciones.map(asignacion => ({
      ...asignacion,
      fecha_asignacion: asignacion.fecha_asignacion ? new Date(asignacion.fecha_asignacion) : new Date(),
      fecha_limite: asignacion.fecha_limite ? new Date(asignacion.fecha_limite) : undefined,
      fecha_completada: asignacion.fecha_completada ? new Date(asignacion.fecha_completada) : undefined
    }));
  }

  /**
   * Maneja los errores de las peticiones HTTP
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Ha ocurrido un error al procesar la solicitud';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      console.error(`Error ${error.status}:`, error);
      
      if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor. Verifique su conexión.';
      } else if (error.status === 401) {
        errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos para realizar esta acción.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor.';
      } else if (error.error && error.error.mensaje) {
        errorMessage = error.error.mensaje;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
    
    console.error('Error en ActividadService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
