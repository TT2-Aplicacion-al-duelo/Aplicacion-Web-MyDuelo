import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificacionesService, Notificacion } from '../../services/notificaciones.service';
import { Subscription } from 'rxjs';
import { PsicologoService } from '../../services/psicologo.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar-psicologo',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar-psicologo.component.html',
  styleUrls: ['./navbar-psicologo.component.css']
})
export class NavbarPsicologoComponent implements OnInit, OnDestroy {
  logoPath: string = 'imagenes/branding/logo.png';
  
  // Datos del psicólogo
  psicologoInfo: any = null;
  nombreCompleto: string = '';
  iniciales: string = '';
  codigoVinculacion: string = '';
  
  // Notificaciones
  notificaciones: Notificacion[] = [];
  notificacionesNoLeidas: number = 0;
  mostrarNotificaciones: boolean = false;
  
  // Suscripciones
  private notificacionesSub?: Subscription;
  private countSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificacionesService: NotificacionesService,
    private psicologoService: PsicologoService 
  ) {}

  ngOnInit(): void {
    this.cargarDatosPsicologo();
    this.inicializarNotificaciones();
  }

  ngOnDestroy(): void {
    if (this.notificacionesSub) {
      this.notificacionesSub.unsubscribe();
    }
    if (this.countSub) {
      this.countSub.unsubscribe();
    }
  }

  /**
   * Cerrar panel al hacer clic fuera
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.notificaciones-container');
    
    if (!clickedInside && this.mostrarNotificaciones) {
      this.mostrarNotificaciones = false;
    }
  }

  /**
   * Cargar datos del psicólogo desde el AuthService
   */
  // cargarDatosPsicologo(): void {
  //   this.psicologoInfo = this.authService.getUserInfo();
    
  //   if (this.psicologoInfo) {
  //     // Nombre completo
  //     this.nombreCompleto = `${this.psicologoInfo.nombre} ${this.psicologoInfo.apellido}`;
      
  //     // Iniciales para el avatar
  //     const nombre = this.psicologoInfo.nombre?.charAt(0) || '';
  //     const apellido = this.psicologoInfo.apellido?.charAt(0) || '';
  //     this.iniciales = (nombre + apellido).toUpperCase();
      
  //     // Código de vinculación
  //     this.codigoVinculacion = this.psicologoInfo.codigo_vinculacion || 'N/A';
  //   }
  // }
  /**
 * Cargar datos del psicólogo desde el backend
  */
  cargarDatosPsicologo(): void {
    // Cargar perfil completo con foto desde el backend
    this.psicologoService.obtenerPerfil().subscribe({
      next: (perfil) => {
        this.psicologoInfo = {
          nombre: perfil.nombre,
          apellido: perfil.apellidoPaterno || perfil.apellido,
          correo: perfil.correo,
          codigo_vinculacion: perfil.codigoVinculacion,
          foto_perfil: perfil.foto_perfil,
          ...perfil
        };
        
        // Nombre completo
        this.nombreCompleto = `${this.psicologoInfo.nombre} ${this.psicologoInfo.apellido}`;
        
        // Iniciales para el avatar
        const nombre = this.psicologoInfo.nombre?.charAt(0) || '';
        const apellido = this.psicologoInfo.apellido?.charAt(0) || '';
        this.iniciales = (nombre + apellido).toUpperCase();
        
        // Código de vinculación
        this.codigoVinculacion = this.psicologoInfo.codigo_vinculacion || 'N/A';
        
        console.log('✅ Info del psicólogo cargada:', this.psicologoInfo);
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        // Fallback al AuthService
        this.psicologoInfo = this.authService.getUserInfo();
        if (this.psicologoInfo) {
          this.nombreCompleto = `${this.psicologoInfo.nombre} ${this.psicologoInfo.apellido}`;
          const nombre = this.psicologoInfo.nombre?.charAt(0) || '';
          const apellido = this.psicologoInfo.apellido?.charAt(0) || '';
          this.iniciales = (nombre + apellido).toUpperCase();
          this.codigoVinculacion = this.psicologoInfo.codigo_vinculacion || 'N/A';
        }
      }
    });
  }
  /**
   * Obtener URL de foto de perfil
   */
  obtenerFotoUrl(): string {
    const fotoPerfil = this.psicologoInfo?.foto_perfil;
    
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
  /**
   * Inicializar sistema de notificaciones
   */
  inicializarNotificaciones(): void {
    // Suscribirse a las notificaciones
    this.notificacionesSub = this.notificacionesService.notificaciones$.subscribe(
      notificaciones => {
        this.notificaciones = notificaciones.slice(0, 5); // Solo las últimas 5
      }
    );

    // Suscribirse al contador de no leídas
    this.countSub = this.notificacionesService.countNoLeidas$.subscribe(
      count => {
        this.notificacionesNoLeidas = count;
      }
    );

    // Cargar notificaciones iniciales
    this.notificacionesService.cargarNotificaciones();
    this.notificacionesService.cargarCountNoLeidas();
  }

  /**
   * Toggle del panel de notificaciones
   */
  toggleNotificaciones(event: Event): void {
    event.stopPropagation();
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
    
    if (this.mostrarNotificaciones) {
      // Recargar notificaciones al abrir
      this.notificacionesService.cargarNotificaciones();
    }
  }

  /**
   * Marcar notificación como leída y navegar
   */
  irANotificacion(notificacion: Notificacion, event: Event): void {
    event.stopPropagation();
    
    if (!notificacion.leida) {
      this.notificacionesService.marcarComoLeida(notificacion.id_notificacion).subscribe({
        next: () => {
          // Recargar notificaciones
          this.notificacionesService.cargarNotificaciones();
          this.notificacionesService.cargarCountNoLeidas();
        },
        error: (error) => console.error('Error al marcar como leída:', error)
      });
    }
    
    this.mostrarNotificaciones = false;
    
    if (notificacion.enlace) {
      this.router.navigate([notificacion.enlace]);
    }
  }

  /**
   * Marcar todas como leídas
   */
  marcarTodasLeidas(event: Event): void {
    event.stopPropagation();
    
    this.notificacionesService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notificacionesService.cargarNotificaciones();
        this.notificacionesService.cargarCountNoLeidas();
      },
      error: (error) => console.error('Error al marcar todas:', error)
    });
  }

  /**
   * Formatear tiempo transcurrido
   */
  tiempoTranscurrido(fecha: string): string {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diferencia = ahora.getTime() - fechaNotif.getTime();
    const minutos = Math.floor(diferencia / 60000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos}m`;
    
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas}h`;
    
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias}d`;
    
    return fechaNotif.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  /**
   * Navegar a perfil
   */
  irAPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  /**
   * Navegar a configuración
   */
  irAConfiguracion(): void {
    this.router.navigate(['/configuracion-perfil']);
  }

  /**
   * Ver todas las notificaciones
   */
  verTodasNotificaciones(): void {
    this.mostrarNotificaciones = false;
    // Por ahora redirige a una ruta placeholder
    // Puedes crear un componente completo de notificaciones después
    console.log('Ver todas las notificaciones');
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/iniciar-sesion']);
  }
}