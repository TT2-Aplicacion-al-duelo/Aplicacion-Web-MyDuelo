
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private tokenCheckInterval: any;

  constructor(private router: Router) {
    // Iniciar verificación periódica del token
    this.iniciarVerificacionToken();
  }

  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Verificar si el token ha expirado
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    
    return true;
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    
    // Detener verificación periódica
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
    
    // ✅ Redirigir al login y recargar para limpiar estado
    this.router.navigate(['/iniciar-sesion']).then(() => {
      window.location.reload(); // ✅ Esto forzará el cambio del navbar
    });
  }

  // Verificar si el usuario es administrador
  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return !!payload.rol_admin;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return false;
    }
  }

  // Obtener información del usuario del token
  getUserInfo(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id_psicologo: payload.id_psicologo,
        correo: payload.correo,
        nombre: payload.nombre,
        apellido: payload.apellido,
        rol_admin: payload.rol_admin,
        codigo_vinculacion: payload.codigo_vinculacion
      };
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  // Verificar si el token ha expirado
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milliseconds
      const ahora = Date.now();
      
      return ahora >= exp;
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
      return true;
    }
  }

  // Verificación periódica del token
  private iniciarVerificacionToken(): void {
    // Verificar cada minuto si el token ha expirado
    this.tokenCheckInterval = setInterval(() => {
      if (this.isTokenExpired() && this.getToken()) {
        console.warn('⚠️ Token expirado, cerrando sesión automáticamente');
        this.logout();
      }
    }, 60000); // Cada 60 segundos
  }

  //Obtener tiempo restante del token
  getTimeUntilExpiration(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const ahora = Date.now();
      
      return Math.max(0, exp - ahora);
    } catch (error) {
      return null;
    }
  }
  /* Verifica si el usuario autenticado es un psicólogo
 * @returns true si es psicólogo, false en caso contrario
  */
  isPsicologo(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      return payload && payload.id_psicologo !== undefined;
    } catch (error) {
      return false;
    }
  }
  /**
   * Obtiene el tipo de usuario actual
   * @returns 'psicologo' | 'paciente' | 'admin' | null
   */
  getTipoUsuario(): 'psicologo' | 'paciente' | 'admin' | null {
    if (!this.isAuthenticated()) return null;
    
    if (this.isAdmin()) return 'admin';
    if (this.isPsicologo()) return 'psicologo';

    
    return null;
  }

  /**
   * Método auxiliar para decodificar el token JWT
   * @param token Token JWT a decodificar
   * @returns Payload del token
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }





}