// aplicacionWeb/src/app/services/actividad.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Actividad, ActividadAsignada, AsignarActividadRequest } from '../interfaces/actividad';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})


export class ActividadService {
  
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = "api/psicologo";
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ==================== PLANTILLAS GLOBALES ====================
  
  /**
   * Obtener todas las plantillas de actividades del psicólogo
   */
  getActividadesGlobales(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.AppUrl}${this.APIUrl}/actividades`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Crear una nueva plantilla de actividad
   */
  crearActividadGlobal(actividad: Partial<Actividad>): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.AppUrl}${this.APIUrl}/actividades`, actividad, {
      headers: this.getHeaders()
    });
  }

  /**
   * Actualizar una plantilla de actividad
   */
  actualizarActividadGlobal(id: number, actividad: Partial<Actividad>): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.AppUrl}${this.APIUrl}/actividades/${id}`, actividad, {
      headers: this.getHeaders()
    });
  }

  /**
   * Eliminar una plantilla de actividad
   */
  eliminarActividadGlobal(id: number): Observable<any> {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/actividades/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== ASIGNACIÓN DE ACTIVIDADES ====================
  
  /**
   * Obtener actividades asignadas a un paciente específico
   */
  getActividadesPaciente(idPaciente: number): Observable<ActividadAsignada[]> {
    return this.http.get<ActividadAsignada[]>(`${this.AppUrl}${this.APIUrl}/paciente/${idPaciente}/actividades`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Asignar una o varias actividades a uno o varios pacientes
   */
  asignarActividad(data: AsignarActividadRequest): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/actividades/asignar`, data, {
      headers: this.getHeaders()
    });
  }

  /**
   * Actualizar una actividad asignada
   */
  actualizarActividadAsignada(id: number, data: Partial<ActividadAsignada>): Observable<ActividadAsignada> {
    return this.http.put<ActividadAsignada>(`${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  /**
   * Eliminar una actividad asignada
   */
  eliminarActividadAsignada(id: number): Observable<any> {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Enviar recordatorio de actividad
   */
  enviarRecordatorio(id: number): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/actividades/asignadas/${id}/recordatorio`, {}, {
      headers: this.getHeaders()
    });
  }
}


