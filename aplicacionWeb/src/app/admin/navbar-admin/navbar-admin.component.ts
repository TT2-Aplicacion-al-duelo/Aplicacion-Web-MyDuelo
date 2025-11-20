import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar-admin',
  imports: [RouterModule,CommonModule],
  templateUrl: './navbar-admin.component.html',
  styleUrl: './navbar-admin.component.css'
})
export class NavbarAdminComponent {
  logoPath: string = 'imagenes/branding/logo.png'; 
  adminInfo: any = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private adminService: AdminService
  ) {
    this.cargarInfoAdmin();
  }

  cargarInfoAdmin(): void {
    const token = this.authService.getToken();
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Cargar perfil completo con foto
        this.adminService.obtenerPerfil().subscribe({
          next: (perfil) => {
            this.adminInfo = {
              nombre: perfil.nombre,
              apellido: perfil.apellidoPaterno || perfil.apellido,
              foto_perfil: perfil.foto_perfil,
              ...perfil
            };
            console.log('✅ Info del admin cargada:', this.adminInfo);
          },
          error: (error) => {
            console.error('Error al cargar perfil admin:', error);
            // Fallback al token
            this.adminInfo = {
              nombre: payload.nombre,
              apellido: payload.apellidoPaterno || payload.apellido
            };
          }
        });
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/iniciar-sesion']); 
  }

  // Método para obtener iniciales del nombre
  getIniciales(): string {
    if (!this.adminInfo) return 'A';
    return `${this.adminInfo.nombre?.charAt(0) || ''}${this.adminInfo.apellido?.charAt(0) || ''}`.toUpperCase();
  }

  /**
   * Obtener URL de foto de perfil
   */
  obtenerFotoUrl(): string {
    const fotoPerfil = this.adminInfo?.foto_perfil;
    
    if (!fotoPerfil) {
      return '';
    }
    
    // Si ya es URL completa
    if (fotoPerfil.startsWith('http')) {
      return fotoPerfil;
    }
    
    // Construir URL del servidor
    const baseUrl = environment.apiUrl || 'http://localhost:3017';
    return `${baseUrl}/uploads/${fotoPerfil}`;
  }

  /**
   * Manejar error de imagen
   */
  onImageError(event: any): void {
    event.target.style.display = 'none';
  }
}