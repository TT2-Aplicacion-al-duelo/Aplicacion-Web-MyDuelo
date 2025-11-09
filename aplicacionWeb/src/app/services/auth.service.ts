
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

  // ✅ NUEVO: Verificación periódica del token
  private iniciarVerificacionToken(): void {
    // Verificar cada minuto si el token ha expirado
    this.tokenCheckInterval = setInterval(() => {
      if (this.isTokenExpired() && this.getToken()) {
        console.warn('⚠️ Token expirado, cerrando sesión automáticamente');
        this.logout();
      }
    }, 60000); // Cada 60 segundos
  }

  // ✅ NUEVO: Obtener tiempo restante del token
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
}