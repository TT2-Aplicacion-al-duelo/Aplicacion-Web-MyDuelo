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
        
        // ✅ Si el servidor responde 401 (No autorizado) o 403 (Prohibido)
        if (error.status === 401 || error.status === 403) {
          console.warn('⚠️ Token inválido o expirado (401/403), cerrando sesión');
          
          // Mostrar mensaje solo una vez
          this.toastr.warning(
            'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            'Sesión Expirada',
            { 
              timeOut: 5000,
              closeButton: true
            }
          );
          
          // Cerrar sesión automáticamente
          setTimeout(() => {
            this.authService.logout();
          }, 500);
        }
        
        return throwError(() => error);
      })
    );
  }
}