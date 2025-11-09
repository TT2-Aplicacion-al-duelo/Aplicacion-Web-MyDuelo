// aplicacionWeb/src/app/services/psicologo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Psicologo } from '../interfaces/piscologo';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PsicologoService {
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = "/api/psicologo";
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  registrarUsuario(usuario: Psicologo): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/registro`, usuario);
  }

  iniciarSesion(usuario: Psicologo): Observable<any> {
    return this.http.post<any>(`${this.AppUrl}${this.APIUrl}/iniciar-sesion`, usuario);
  }

  activarCuenta(token: string): Observable<any> {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/activar/${token}`);
  }

  reenviarActivacion(correo: string): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/reenviar-activacion`, { correo });
  }

  solicitarRecuperacion(correoOTelefono: string): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/recuperar-contrasena`, { 
      correoOTelefono 
    });
  }

  verificarTokenRecuperacion(token: string): Observable<any> {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/verificar-token/${token}`);
  }

  restablecerContrasena(token: string, nuevaContrasena: string): Observable<any> {
    return this.http.post(`${this.AppUrl}${this.APIUrl}/restablecer-contrasena/${token}`, {
      nuevaContrasena
    });
  }

  actualizarPerfil(datos: any): Observable<any> {
    return this.http.put(
      `${this.AppUrl}${this.APIUrl}/actualizar-perfil`, 
      datos, 
      { headers: this.getHeaders() }
    );
  }

  cambiarContrasena(contrasenaActual: string, nuevaContrasena: string): Observable<any> {
    return this.http.put(
      `${this.AppUrl}${this.APIUrl}/cambiar-contrasena`,
      { contrasenaActual, nuevaContrasena },
      { headers: this.getHeaders() }
    );
  }

    /**
   * Obtener perfil completo del psicólogo
   */
  obtenerPerfil(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Decodificar token para obtener datos
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Simular respuesta con datos del token
      // En el futuro puedes crear un endpoint en el backend
      return new Observable(observer => {
        observer.next({
          id_psicologo: payload.id_psicologo,
          nombre: payload.nombre,
          apellido: payload.apellido || payload.apellidoPaterno,
          correo: payload.correo,
          telefono: payload.telefono,
          especialidad: payload.especialidad,
          cedula: payload.cedula,
          cedula_validada: payload.cedula_validada,
          rol_admin: payload.rol_admin
        });
        observer.complete();
      });
    } catch (error) {
      return this.http.get(`${this.AppUrl}${this.APIUrl}/perfil`, {
        headers: this.getHeaders()
      });
    }
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }
}