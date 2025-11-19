import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Paciente } from '../interfaces/paciente';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {

  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = "/api/psicologo";
  }

  //  MÉTODO SIMPLIFICADO - El token se agrega automáticamente por el interceptor
  getPacientesPorPsicologo(): Observable<Paciente[]> {
    // El interceptor ya agrega el token Bearer automáticamente
    return this.http.get<Paciente[]>(`${this.AppUrl}${this.APIUrl}/lista-pacientes`);
  }

  // Nuevo método para obtener un paciente específico
  getPacientePorId(idPaciente: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.AppUrl}${this.APIUrl}/paciente/${idPaciente}`);
  }

  // ⭐ AGREGAR este método dentro de la clase PacienteService

  /**
   * Obtener URL de foto de perfil del paciente
   */
  getFotoPerfil(idPaciente: number): Observable<{ foto_url: string | null }> {
    return this.http.get<{ foto_url: string | null }>(
      `${this.AppUrl}${this.APIUrl}/paciente/${idPaciente}/foto-perfil`,
      { headers: this.getHeaders() }
    );
  }
  /**
   * Obtener headers con token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'token': token || ''
    });
  }
}

  

