import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private AppUrl: string;
  private APIUrl: string;


  constructor(private http: HttpClient) { 
    this.AppUrl = environment.apiUrl;  // Corregí la coma por punto y coma
    this.APIUrl = "api/psicologo";
  }

   crearCita(payload: any): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/citas`, payload);
  }

  actualizarCita(id_cita: number, payload: any) {
    return this.http.put(`${this.AppUrl}${this.APIUrl}/citas/${id_cita}`, payload);
  }

  eliminarCita(id_cita: number) {
    return this.http.delete(`${this.AppUrl}${this.APIUrl}/citas/${id_cita}`);
  }

  getCitas(id_agenda: number) {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/citas/${id_agenda}`);
  }
  // Agregar este método en el servicio existente
  getProximaCitaPaciente(idPaciente: number): Observable<any> {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/paciente/${idPaciente}/proxima-cita`);
  }
}
