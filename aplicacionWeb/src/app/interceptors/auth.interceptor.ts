import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // ✅ Si es 401 (No autorizado) - Token inválido/expirado
        if (error.status === 401) {
          console.warn('⚠️ Token inválido o expirado (401), cerrando sesión');
          
          this.toastr.warning(
            'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            'Sesión Expirada',
            { 
              timeOut: 5000,
              closeButton: true
            }
          );
          
          setTimeout(() => {
            this.authService.logout();
          }, 500);
        }
        
        // ✅ Si es 403 (Prohibido) - NO cerrar sesión automáticamente
        // Puede ser un error legítimo de permisos (ej: acceder a un foro privado)
        if (error.status === 403) {
          console.warn('⚠️ Acceso prohibido (403) - Sin permisos suficientes');
          
          // Solo mostrar mensaje si NO es un error de foros
          const esForo = req.url.includes('/foros/') || req.url.includes('/temas/');
          
          if (!esForo) {
            this.toastr.error(
              'No tienes permisos para realizar esta acción.',
              'Acceso Denegado',
              { timeOut: 3000 }
            );
          }
          // Si es un error de foros, el componente lo manejará
        }
        
        return throwError(() => error);
      })
    );
  }
}