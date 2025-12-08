import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReporteGeneral } from '../interfaces/reporte-general';

@Injectable({
  providedIn: 'root'
})
export class ReportePacientesService {
  private myAppUrl: string;
  private myApiUrl: string;

  constructor(private http: HttpClient) {
    this.myAppUrl = environment.apiUrl;
    this.myApiUrl = 'api/psicologo/';
  }

  /**
   * Obtener reporte general de todos los pacientes
   */
  getReporteGeneral(): Observable<ReporteGeneral> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    return this.http.get<ReporteGeneral>(
      `${this.myAppUrl}${this.myApiUrl}reporte-general`,
      { headers }
    );
  }

  /**
   * Descargar reporte en PDF
   * (Esta funcionalidad se puede implementar en una fase 2)
   */
  descargarReportePDF(): Observable<Blob> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    return this.http.get(
      `${this.myAppUrl}${this.myApiUrl}reporte-general/pdf`,
      { 
        headers,
        responseType: 'blob'
      }
    );
  }
}