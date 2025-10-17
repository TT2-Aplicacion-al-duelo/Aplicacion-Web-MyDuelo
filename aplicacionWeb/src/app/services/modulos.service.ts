// services/modulos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModuloDuelo } from '../interfaces/moduloDuelo';
//import { ModuloDuelo } from '../app/psicologo/paciente-detalle/componentes/modulos-duelo/modulos-duelo.component';

@Injectable({
  providedIn: 'root'
})
export class ModulosService {
  private apiUrl = `${environment.apiUrl}/api/psicologo`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener los módulos de duelo con su progreso para un paciente específico
   */
  getModulosPorPaciente(idPaciente: number): Observable<ModuloDuelo[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ModuloDuelo[]>(
      `${this.apiUrl}/pacientes/${idPaciente}/modulos`,
      { headers }
    );
  }

  /**
   * Obtener detalles de un módulo específico con todas sus actividades
   */
  getDetalleModulo(idPaciente: number, idModulo: number): Observable<ModuloDuelo> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ModuloDuelo>(
      `${this.apiUrl}/pacientes/${idPaciente}/modulos/${idModulo}`,
      { headers }
    );
  }

  /**
   * Marcar una actividad de módulo como revisada por el psicólogo
   */
  marcarActividadRevisada(idAsignacion: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(
      `${this.apiUrl}/actividades/asignadas/${idAsignacion}/revisar`,
      {},
      { headers }
    );
  }

  /**
   * Obtener evidencias de una actividad específica
   */
  getEvidenciasActividad(idAsignacion: number): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(
      `${this.apiUrl}/actividades/asignadas/${idAsignacion}/evidencias`,
      { headers }
    );
  }
}