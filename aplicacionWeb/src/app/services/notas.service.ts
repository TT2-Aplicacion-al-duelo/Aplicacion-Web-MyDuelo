import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Nota, CrearNotaRequest, ActualizarNotaRequest } from '../interfaces/nota';

@Injectable({
  providedIn: 'root'
})
export class NotasService {
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = '/api/psicologo';
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtener todas las notas de un paciente
   */
  getNotasPaciente(idPaciente: number): Observable<Nota[]> {
    return this.http.get<Nota[]>(
      `${this.AppUrl}${this.APIUrl}/pacientes/${idPaciente}/notas`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener una nota específica
   */
  getNotaPorId(idNota: number): Observable<Nota> {
    return this.http.get<Nota>(
      `${this.AppUrl}${this.APIUrl}/notas/${idNota}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crear una nueva nota
   */
  crearNota(nota: CrearNotaRequest): Observable<Nota> {
    return this.http.post<Nota>(
      `${this.AppUrl}${this.APIUrl}/notas`,
      nota,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualizar una nota existente
   */
  actualizarNota(idNota: number, nota: ActualizarNotaRequest): Observable<Nota> {
    return this.http.put<Nota>(
      `${this.AppUrl}${this.APIUrl}/notas/${idNota}`,
      nota,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar una nota
   */
  eliminarNota(idNota: number): Observable<any> {
    return this.http.delete(
      `${this.AppUrl}${this.APIUrl}/notas/${idNota}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener notas relacionadas con un test específico
   */
  getNotasTest(idAplicacion: number): Observable<Nota[]> {
    return this.http.get<Nota[]>(
      `${this.AppUrl}${this.APIUrl}/tests/aplicaciones/${idAplicacion}/notas`,
      { headers: this.getHeaders() }
    );
  }
}