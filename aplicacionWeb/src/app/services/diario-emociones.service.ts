// aplicacionWeb/src/app/services/diario-emociones.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EntradaDiario {
  id_diario: number;
  id_paciente: number;
  fecha: string;
  emocion: 'Feliz' | 'Bien' | 'Normal' | 'Triste' | 'Terrible' | 'Enojado';
  nota: string;
  compartido: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface FiltrosDiario {
  fecha?: string;
  emocion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiarioEmocionesService {
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = '/api/psicologo';
  }

  /**
   * Obtener entradas del diario emocional de un paciente
   */
  getDiarioEmociones(idPaciente: number, filtros?: FiltrosDiario): Observable<EntradaDiario[]> {
    let params = new HttpParams();

    if (filtros?.fecha) {
      params = params.set('fecha', filtros.fecha);
    }

    if (filtros?.emocion) {
      params = params.set('emocion', filtros.emocion);
    }

    return this.http.get<EntradaDiario[]>(
      `${this.AppUrl}${this.APIUrl}/paciente/${idPaciente}/diario-emociones`,
      { params }
    );
  }
}