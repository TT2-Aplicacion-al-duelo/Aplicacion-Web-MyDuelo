// actividades.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Actividad {
  id_actividad: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  obligatoria: boolean;
  repetitiva: boolean;
  periodo?: number;
  archivo_url?: string;
  origen: 'personalizada' | 'modulo';
  id_psicologo_creador?: number;
  fecha_creacion?: Date;
}

export interface AsignacionActividad {
  id_actividad: number;
  id_paciente: number;
  fecha_limite?: string;
  instrucciones_personalizadas?: string;
  prioridad?: 'baja' | 'media' | 'alta';
}

export interface ActividadAsignada {
  id_asignacion: number;
  id_actividad: number;
  id_paciente: number;
  estado: 'en_proceso' | 'finalizada';
  fecha_asignacion: Date;
  fecha_limite?: Date;
  instrucciones_personalizadas?: string;
  prioridad: 'baja' | 'media' | 'alta';
  actividad?: Actividad;
  evidencias?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ActividadesService {
  
  private apiUrl = `${environment.apiUrl}/api/actividades`;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    })
  };

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las actividades globales disponibles
   */
  obtenerActividadesGlobales(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/globales`, this.httpOptions)
      .pipe(
        map(response => this.procesarActividades(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene las actividades creadas por el psicólogo actual
   */
  obtenerActividadesDelPsicologo(): Observable<Actividad[]> {
    const psicologoId = this.getPsicologoId();
    return this.http.get<Actividad[]>(`${this.apiUrl}/psicologo/${psicologoId}`, this.httpOptions)
      .pipe(
        map(response => this.procesarActividades(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene una actividad específica por ID
   */
  obtenerActividad(id: number): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crea una nueva actividad
   */
  crearActividad(actividad: Partial<Actividad>): Observable<Actividad> {
    const psicologoId = this.getPsicologoId();
    const actividadConPsicologo = {
      ...actividad,
      id_psicologo_creador: psicologoId
    };
    
    return this.http.post<Actividad>(this.apiUrl, actividadConPsicologo, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza una actividad existente
   */
  actualizarActividad(id: number, actividad: Partial<Actividad>): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.apiUrl}/${id}`, actividad, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Elimina una actividad
   */
  eliminarActividad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Asigna una actividad a un paciente
   */
  asignarActividad(asignacion: AsignacionActividad): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignar`, asignacion, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Asigna una actividad a múltiples pacientes
   */
  asignarActividadMultiple(asignaciones: AsignacionActividad[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignar-multiple`, asignaciones, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene las actividades asignadas a un paciente
   */
  obtenerActividadesDelPaciente(idPaciente: number): Observable<ActividadAsignada[]> {
    return this.http.get<ActividadAsignada[]>(
      `${this.apiUrl}/paciente/${idPaciente}/asignadas`, 
      this.httpOptions
    ).pipe(
      map(response => this.procesarActividadesAsignadas(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza el estado de una actividad asignada
   */
  actualizarEstadoActividad(idAsignacion: number, estado: 'en_proceso' | 'finalizada'): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/asignacion/${idAsignacion}/estado`,
      { estado },
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene las evidencias de una actividad asignada
   */
  obtenerEvidencias(idAsignacion: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/asignacion/${idAsignacion}/evidencias`,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Sube una evidencia para una actividad asignada
   */
  subirEvidencia(idAsignacion: number, evidencia: FormData): Observable<any> {
    const httpOptionsFormData = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.getToken()}`
      })
    };
    
    return this.http.post(
      `${this.apiUrl}/asignacion/${idAsignacion}/evidencia`,
      evidencia,
      httpOptionsFormData
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una asignación de actividad
   */
  eliminarAsignacion(idAsignacion: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/asignacion/${idAsignacion}`,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Busca actividades por término
   */
  buscarActividades(termino: string): Observable<Actividad[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Actividad[]>(
      `${this.apiUrl}/buscar`,
      { ...this.httpOptions, params }
    ).pipe(
      map(response => this.procesarActividades(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene estadísticas de actividades de un paciente
   */
  obtenerEstadisticasActividades(idPaciente: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/paciente/${idPaciente}/estadisticas`,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Procesa el array de actividades para asegurar tipos correctos
   */
  private procesarActividades(actividades: any[]): Actividad[] {
    return actividades.map(actividad => ({
      ...actividad,
      obligatoria: Boolean(actividad.obligatoria),
      repetitiva: Boolean(actividad.repetitiva),
      periodo: actividad.periodo ? Number(actividad.periodo) : null,
      fecha_creacion: actividad.fecha_creacion ? new Date(actividad.fecha_creacion) : null
    }));
  }

  /**
   * Procesa el array de actividades asignadas
   */
  private procesarActividadesAsignadas(asignaciones: any[]): ActividadAsignada[] {
    return asignaciones.map(asignacion => ({
      ...asignacion,
      fecha_asignacion: new Date(asignacion.fecha_asignacion),
      fecha_limite: asignacion.fecha_limite ? new Date(asignacion.fecha_limite) : null
    }));
  }

  /**
   * Obtiene el token del localStorage
   */
  private getToken(): string {
    return localStorage.getItem('token') || '';
  }

  /**
   * Obtiene el ID del psicólogo actual
   */
  private getPsicologoId(): number {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return usuario.id_psicologo || 0;
  }

  /**
   * Maneja los errores de las peticiones HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Error ${error.status}: ${error.message}`;
      
      if (error.error && error.error.mensaje) {
        errorMessage = error.error.mensaje;
      }
    }
    
    console.error('Error en ActividadesService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}