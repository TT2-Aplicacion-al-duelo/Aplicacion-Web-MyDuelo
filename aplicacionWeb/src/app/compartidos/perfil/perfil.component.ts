import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PsicologoService } from '../../services/psicologo.service';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr'; 
import { environment } from '../../../environments/environment'; 
import { HttpHeaders } from '@angular/common/http';  

interface DatosPerfil {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  especialidad?: string;
  cedula?: string;
  cedula_validada?: boolean;
  direccionConsultorio?: string;
  codigoVinculacion?: string;
  rol_admin?: boolean;
  foto_perfil?: string | null;  
  esAdmin?: boolean;  
  tipo: 'psicologo' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  
  perfil: DatosPerfil | null = null;
  cargando: boolean = true;
  error: string = '';
  fotoPerfilUrl: string | null = null;
  uploadingFoto: boolean = false;
  usuarioInfo: any = null;

  constructor(
    private authService: AuthService,
    private psicologoService: PsicologoService,
    private location: Location,
    private adminService: AdminService,
    private toastr: ToastrService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  /**
   * Cargar perfil según el tipo de usuario
   */
  // cargarPerfil(): void {
  //   if (this.cargando && this.perfil) return; // Prevenir múltiples llamadas
    
  //   this.cargando = true;
  //   this.error = '';
    
  //   this.usuarioInfo = this.authService.getUserInfo();
    
  //   if (!this.usuarioInfo) {
  //     this.error = 'No se pudo obtener la información del usuario';
  //     this.cargando = false;
  //     return;
  //   }

  //   // Detectar si es admin o psicólogo
  //   if (this.authService.isAdmin()) {
  //     this.cargarPerfilAdmin();
  //   } else {
  //     this.cargarPerfilPsicologo();
  //   }
  // }
  cargarPerfil(): void {
  this.cargando = true;
  
  // Detectar si es admin
  const token = localStorage.getItem('token');
  let esAdmin = false;
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      esAdmin = payload.rol_admin === true;
    } catch (error) {
      console.error('Error al decodificar token:', error);
    }
  }
  
  // Usar el servicio correcto
  const servicio = esAdmin ? this.adminService : this.psicologoService;
  
  servicio.obtenerPerfil().subscribe({
    next: (data) => {
      this.perfil = data;
      esAdmin: esAdmin 
      this.cargando = false;
      console.log('✅ Perfil cargado:', this.perfil);
    },
    error: (error) => {
      console.error('❌ Error al cargar perfil:', error);
      this.error = 'Error al cargar el perfil';
      this.cargando = false;
    }
  });
}

  /**
   * Cargar perfil del psicólogo
   */
  private cargarPerfilPsicologo(): void {
    this.psicologoService.obtenerPerfil().subscribe({
      next: (data) => {
        this.perfil = {
          id: data.id_psicologo,
          nombre: data.nombre,
          apellido: data.apellido,
          correo: data.correo,
          telefono: data.telefono,
          especialidad: data.especialidad,
          cedula: data.cedula,
          cedula_validada: data.cedula_validada,
          direccionConsultorio: data.direccion_consultorio,
          tipo: 'psicologo',
          codigoVinculacion: `${data.codigoVinculacion}`,
          rol_admin: false,
          foto_perfil: data.foto_perfil  // ⭐ AGREGAR
        };
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        // Si falla, usar datos del token
        this.perfil = {
          id: this.usuarioInfo.id_psicologo,
          nombre: this.usuarioInfo.nombre,
          apellido: this.usuarioInfo.apellido,
          correo: this.usuarioInfo.correo,
          tipo: 'psicologo',
          codigoVinculacion: `PSI-${this.usuarioInfo.id_psicologo?.toString().padStart(4, '0')}`,
          rol_admin: false
        };
        this.cargando = false;
      }
    });
  }

  /**
   * Cargar perfil del administrador
   */
  private cargarPerfilAdmin(): void {
    this.adminService.verificarAdmin().subscribe({
      next: (response) => {
        const admin = response.admin;
        this.perfil = {
          id: admin.id_psicologo,
          nombre: admin.nombre,
          apellido: admin.apellido,
          correo: admin.correo,
          telefono: admin.telefono,
          tipo: 'admin',
          rol_admin: true,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
          foto_perfil: admin.foto_perfil  // ⭐ AGREGAR
        };
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar perfil de admin:', err);
        this.error = 'No se pudo cargar el perfil del administrador';
        this.cargando = false;
      }
    });
  }

  /**
   * Obtener iniciales del nombre
   */
  getIniciales(): string {
    if (!this.perfil) return '??';
    const nombre = this.perfil.nombre?.charAt(0) || '';
    const apellido = this.perfil.apellido?.charAt(0) || '';
    return (nombre + apellido).toUpperCase();
  }

  /**
   * Navegar a configuración de perfil
   */
  irAConfiguracion(): void {
    this.router.navigate(['/configuracion-perfil']);
  }

  /**
   * Volver atrás
   */
  volver(): void {
    if (this.perfil?.tipo === 'admin') {
      this.router.navigate(['/admin/psicologos']);
    } else {
      this.router.navigate(['/agenda']);
    }
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Copiar código de vinculación
   */
  copiarCodigo(): void {
    if (this.perfil?.codigoVinculacion) {
      navigator.clipboard.writeText(this.perfil.codigoVinculacion).then(() => {
        this.toastr.success('Código copiado al portapapeles');
      }).catch(err => {
        console.error('Error al copiar:', err);
        this.toastr.error('Error al copiar el código');
      });
    }
  }

    /**
   * Obtener URL de foto de perfil
   */
  obtenerFotoUrl(): string {
    const fotoPerfil = this.perfil?.foto_perfil;
    
    if (fotoPerfil) {
      // Si ya es una URL completa
      if (fotoPerfil.startsWith('http')) {
        return fotoPerfil;
      }
      // Si es solo el nombre del archivo
      const baseUrl = environment.production
        ? 'https://api.midueloapp.com'
        : 'http://localhost:3017';
      return `${baseUrl}/uploads/${fotoPerfil}`;
    }
    
    // ⭐ CAMBIO: Retornar una cadena vacía para mostrar el avatar con iniciales
    return '';
  }

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.toastr.error('Por favor selecciona una imagen válida');
      event.target.value = '';
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      this.toastr.error('La imagen no debe superar los 5MB');
      event.target.value = '';
      return;
    }

    this.subirFoto(file);
    event.target.value = ''; // Limpiar input
  }

  /**
   * Subir foto de perfil
   */
  // subirFoto(file: File): void {
  //   this.uploadingFoto = true;
    
  //   console.log('📤 Subiendo foto:', file.name, file.size, file.type);
    
  //   this.psicologoService.subirFotoPerfil(file).subscribe({
  //     next: (response) => {
  //       console.log('✅ Respuesta del servidor:', response);
  //       this.toastr.success('Foto de perfil actualizada correctamente');
        
  //       // Actualizar el perfil con la nueva foto
  //       if (this.perfil) {
  //         this.perfil.foto_perfil = response.foto_url;
  //       }
        
  //       this.uploadingFoto = false;
        
  //       // NO recargar todo el perfil, solo actualizar la foto
  //     },
  //     error: (error) => {
  //       console.error('❌ Error al subir foto:', error);
  //       console.error('Status:', error.status);
  //       console.error('Mensaje:', error.message);
  //       console.error('Error del servidor:', error.error);
        
  //       let mensajeError = 'Error al subir la foto de perfil';
        
  //       if (error.status === 404) {
  //         mensajeError = 'Endpoint no encontrado. Verifica que el backend esté corriendo.';
  //       } else if (error.status === 401) {
  //         mensajeError = 'No autorizado. Por favor inicia sesión nuevamente.';
  //       } else if (error.error?.msg) {
  //         mensajeError = error.error.msg;
  //       }
        
  //       this.toastr.error(mensajeError);
  //       this.uploadingFoto = false;
  //     }
  //   });
  // }

  subirFoto(file: File): void {
    this.uploadingFoto = true;
    
    console.log('📤 Subiendo foto:', file.name, file.size, file.type);
    
    // Detectar si es admin
    const esAdmin = this.perfil?.esAdmin || false;
    const servicio = esAdmin ? this.adminService : this.psicologoService;
    
    servicio.subirFotoPerfil(file).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        this.toastr.success('Foto de perfil actualizada correctamente');
        
        if (this.perfil) {
          this.perfil.foto_perfil = response.foto_url;
        }
        
        this.uploadingFoto = false;
      },
      error: (error) => {
        console.error('❌ Error al subir foto:', error);
        
        let mensajeError = 'Error al subir la foto de perfil';
        
        if (error.status === 404) {
          mensajeError = 'Endpoint no encontrado.';
        } else if (error.status === 401) {
          mensajeError = 'No autorizado.';
        } else if (error.error?.msg) {
          mensajeError = error.error.msg;
        }
        
        this.toastr.error(mensajeError);
        this.uploadingFoto = false;
      }
    });
  }
  /**
   * Eliminar foto de perfil
   */
  // eliminarFoto(): void {
  //   if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) return;
    
  //   this.psicologoService.eliminarFotoPerfil().subscribe({
  //     next: () => {
  //       this.toastr.success('Foto de perfil eliminada');
        
  //       // Actualizar el perfil
  //       if (this.perfil) {
  //         this.perfil.foto_perfil = undefined;
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error al eliminar foto:', error);
  //       this.toastr.error('Error al eliminar la foto');
  //     }
  //   });
  // }
  eliminarFoto(): void {
    if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) {
      return;
    }

    // Detectar si es admin
    const esAdmin = this.perfil?.esAdmin || false;
    const servicio = esAdmin ? this.adminService : this.psicologoService;

    servicio.eliminarFotoPerfil().subscribe({
      next: () => {
        this.toastr.success('Foto eliminada correctamente');
        if (this.perfil) {
          this.perfil.foto_perfil = null;
        }
      },
      error: (error) => {
        console.error('Error al eliminar foto:', error);
        this.toastr.error('Error al eliminar la foto');
      }
    });
  }


  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    // ⭐ CAMBIO: Ocultar la imagen y mostrar el avatar con iniciales
    imgElement.style.display = 'none';
  }
}