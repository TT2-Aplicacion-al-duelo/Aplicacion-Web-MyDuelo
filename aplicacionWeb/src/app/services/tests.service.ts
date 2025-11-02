import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Test,
  AplicacionTest,
  RespuestaTest,
  ResultadoTest,
  PreguntaTest,
  GraficaTest,
  AplicarTestRequest
} from '../interfaces/test';

@Injectable({
  providedIn: 'root'
})
export class TestsService {
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

  // ==================== TESTS DISPONIBLES ====================

  /**
   * Obtener todos los tests disponibles
   */
  getTestsDisponibles(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.AppUrl}${this.APIUrl}/tests`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener detalles de un test específico con sus preguntas
   */
  getDetalleTest(idTest: number): Observable<Test & { preguntas: PreguntaTest[] }> {
    return this.http.get<Test & { preguntas: PreguntaTest[] }>(
      `${this.AppUrl}${this.APIUrl}/tests/${idTest}`,
      { headers: this.getHeaders() }
    );
  }

  // ==================== APLICACIÓN DE TESTS ====================

  /**
   * Aplicar un test a un paciente (el psicólogo aplica el test)
   */
  aplicarTest(data: AplicarTestRequest): Observable<AplicacionTest> {
    return this.http.post<AplicacionTest>(
      `${this.AppUrl}${this.APIUrl}/tests/aplicar`,
      data,
      { headers: this.getHeaders() }
    );
  }

  // ==================== HISTORIAL DE TESTS ====================

  /**
   * Obtener historial de tests aplicados a un paciente
   */
  getHistorialTests(idPaciente: number): Observable<AplicacionTest[]> {
    return this.http.get<AplicacionTest[]>(
      `${this.AppUrl}${this.APIUrl}/pacientes/${idPaciente}/tests`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener datos para gráficas de evolución de tests
   */
  getDatosGraficas(idPaciente: number, idTest?: number): Observable<GraficaTest[]> {
    let url = `${this.AppUrl}${this.APIUrl}/pacientes/${idPaciente}/tests/graficas`;
    if (idTest) {
      url += `?id_test=${idTest}`;
    }
    return this.http.get<GraficaTest[]>(url, {
      headers: this.getHeaders()
    });
  }

  // ==================== RESPUESTAS Y RESULTADOS ====================

  /**
   * Generar PDF de respuestas de un test
   */
  generarPDFRespuestas(idAplicacion: number): Observable<Blob> {
    return this.http.get(
      `${this.AppUrl}${this.APIUrl}/tests/aplicaciones/${idAplicacion}/pdf`,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    );
  }


    /**
   * Obtener respuestas de una aplicación de test
   */
  getRespuestasTest(idAplicacion: number): Observable<RespuestaTest[]> {
    return this.http.get<RespuestaTest[]>(
      `${this.AppUrl}${this.APIUrl}/tests/aplicaciones/${idAplicacion}/respuestas`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener resultado de una aplicación de test
   */
  getResultadoTest(idAplicacion: number): Observable<ResultadoTest> {
    return this.http.get<ResultadoTest>(
      `${this.AppUrl}${this.APIUrl}/tests/aplicaciones/${idAplicacion}/resultado`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Descargar PDF de respuestas (método auxiliar)
   */
  descargarPDF(idAplicacion: number, nombreArchivo: string): void {
    const url = `${this.AppUrl}${this.APIUrl}/tests/aplicaciones/${idAplicacion}/pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
  }

}