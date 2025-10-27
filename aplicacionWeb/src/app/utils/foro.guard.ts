import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard para verificar autenticación
export const foroAuthGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (!auth.isAuthenticated()) {
    router.navigate(['/iniciar-sesion']);
    return false;
  }
  return true;
};

// Guard para verificar que es psicólogo
export const psicologoGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (!auth.isAuthenticated()) {
    router.navigate(['/iniciar-sesion']);
    return false;
  }
  
  const userInfo = auth.getUserInfo();
  if (!userInfo?.id_psicologo) {
    router.navigate(['/']);
    return false;
  }
  
  return true;
};