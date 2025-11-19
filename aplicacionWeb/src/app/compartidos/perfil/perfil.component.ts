import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PsicologoService } from '../../services/psicologo.service';
import { AdminService } from '../../services/admin.service';

interface DatosPerfil {
  // Datos comunes
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  
  // Datos específicos de psicólogo
  especialidad?: string;
  cedula?: string;
  cedula_validada?: boolean;
  direccionConsultorio?: string;
  codigoVinculacion?: string;
  
  // Datos específicos de admin
  rol_admin?: boolean;
  
  // Metadata
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
  
  // Información básica del token
  usuarioInfo: any = null;

  constructor(
    private authService: AuthService,
    private psicologoService: PsicologoService,
    private adminService: AdminService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  /**
   * Cargar perfil según el tipo de usuario
   */
  cargarPerfil(): void {
    this.cargando = true;
    this.error = '';
    
    // Obtener información básica del token
    this.usuarioInfo = this.authService.getUserInfo();
    
    if (!this.usuarioInfo) {
      this.error = 'No se pudo obtener la información del usuario';
      this.cargando = false;
      return;
    }

    // Detectar si es admin o psicólogo
    if (this.authService.isAdmin()) {
      this.cargarPerfilAdmin();
    } else {
      this.cargarPerfilPsicologo();
    }
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
          rol_admin: false
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
          updatedAt: admin.updatedAt
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
        alert('Código copiado al portapapeles');
      }).catch(err => {
        console.error('Error al copiar:', err);
      });
    }
  }


  /**
 * Obtener URL de foto de perfil
 */
obtenerFotoUrl(): string {
  if (this.psicologo?.foto_perfil) {
    // Si ya es una URL completa
    if (this.psicologo.foto_perfil.startsWith('http')) {
      return this.psicologo.foto_perfil;
    }
    // Si es solo el nombre del archivo
    const baseUrl = environment.production
      ? 'https://api.midueloapp.com'
      : 'http://localhost:3017';
    return `${baseUrl}/uploads/${this.psicologo.foto_perfil}`;
  }
  return '/assets/default-avatar.png';
}

/**
 * Manejar selección de archivo
 */
onFileSelected(event: any): void {
  const file = event.target.files[0];
  if (file) {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.toastr.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      this.toastr.error('La imagen no debe superar los 5MB');
      return;
    }

    this.subirFoto(file);
  }
}

  /**
   * Subir foto de perfil
   */
  subirFoto(file: File): void {
    this.uploadingFoto = true;
    
    this.psicologoService.subirFotoPerfil(file).subscribe({
      next: (response) => {
        this.toastr.success('Foto de perfil actualizada correctamente');
        this.fotoPerfilUrl = response.foto_url;
        
        // Actualizar el objeto psicologo
        if (this.psicologo) {
          this.psicologo.foto_perfil = file.name;
        }
        
        this.uploadingFoto = false;
      },
      error: (error) => {
        console.error('Error al subir foto:', error);
        this.toastr.error('Error al subir la foto de perfil');
        this.uploadingFoto = false;
      }
    });
  }

  /**
   * Eliminar foto de perfil
   */
  eliminarFoto(): void {
    if (confirm('¿Estás seguro de eliminar tu foto de perfil?')) {
      this.psicologoService.eliminarFotoPerfil().subscribe({
        next: () => {
          this.toastr.success('Foto de perfil eliminada');
          this.fotoPerfilUrl = null;
          if (this.psicologo) {
            this.psicologo.foto_perfil = null;
          }
        },
        error: (error) => {
          console.error('Error al eliminar foto:', error);
          this.toastr.error('Error al eliminar la foto');
        }
      });
    }
  }


}