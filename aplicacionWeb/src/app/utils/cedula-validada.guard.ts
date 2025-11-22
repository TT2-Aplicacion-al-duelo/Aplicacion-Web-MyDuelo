import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const cedulaValidadaGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Verificar autenticación
  if (!authService.isAuthenticated()) {
    router.navigate(['/iniciar-sesion']);
    return false;
  }

  // Obtener info del usuario
  const userInfo = authService.getUserInfo();
  
  // Si es admin, permitir acceso
  if (userInfo?.rol_admin) {
    return true;
  }

  // Si no tiene cedula_validada, redirigir
  if (!userInfo?.cedula_validada) {
    router.navigate(['/credenciales-no-validadas']);
    return false;
  }

  return true;
};