import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient, private _authService: AuthService) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = "/api/psicologo";
  }

  private getHeaders() {
    const token = this._authService.getToken();
    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
  }

  // ===== MÉTODOS DE AGENDA =====
  getCitas(id_agenda: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.AppUrl}${this.APIUrl}/citas/${id_agenda}`, this.getHeaders());
  }

  crearCita(cita: any) {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/citas`, cita, this.getHeaders());
  }

  actualizarCita(id_cita: number, cita: any) {
    return this.http.put(`${this.AppUrl}${this.APIUrl}/citas/${id_cita}`, cita, this.getHeaders());
  }

  eliminarCita(id_cita: number) {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/citas/${id_cita}`, this.getHeaders());
  }

  crearAgenda(agenda: any) {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/agenda`, agenda, this.getHeaders());
  }

  getAgenda(id_psicologo: number) {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/agenda/${id_psicologo}`, this.getHeaders());
  }

  // ===== NUEVOS MÉTODOS DE DISPONIBILIDAD =====
  
  /**
   * Obtener disponibilidad de un psicólogo
   */
  getDisponibilidad(id_psicologo: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.AppUrl}${this.APIUrl}/disponibilidad/${id_psicologo}`, this.getHeaders());
  }

  /**
   * Crear nueva disponibilidad
   */
  crearDisponibilidad(disponibilidad: any): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/disponibilidad`, disponibilidad, this.getHeaders());
  }

  /**
   * Eliminar disponibilidad específica
   */
  eliminarDisponibilidad(id_psicologo: number, dia_semana: string, hora_inicio: string): Observable<any> {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/disponibilidad/${id_psicologo}/${dia_semana}/${hora_inicio}`, this.getHeaders());
  }

  /**
   * Actualizar disponibilidad
   */
  actualizarDisponibilidad(id_disponibilidad: number, disponibilidad: any): Observable<any> {
    return this.http.put(`${this.AppUrl}${this.APIUrl}/disponibilidad/${id_disponibilidad}`, disponibilidad, this.getHeaders());
  }

  // ===== MÉTODOS DE EXCEPCIONES (OPCIONAL) =====
  
  /**
   * Crear excepción de disponibilidad (para bloquear fechas específicas)
   */
  crearExcepcion(excepcion: any): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/excepcion`, excepcion, this.getHeaders());
  }

  /**
   * Obtener excepciones de un psicólogo
   */
  getExcepciones(id_psicologo: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.AppUrl}${this.APIUrl}/excepcion/${id_psicologo}`, this.getHeaders());
  }

  /**
   * Eliminar excepción
   */
  eliminarExcepcion(id_excepcion: number): Observable<any> {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/excepcion/${id_excepcion}`, this.getHeaders());
  }
}