import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ForoService } from '../../../services/foro.service';
import { FormsModule } from '@angular/forms';
import { Foro, Tema, Participante } from '../../../interfaces/foro';
import { AuthService } from '../../../services/auth.service';
import { ModeracionAvanzadaService } from '../../../services/moderacion-avanzada.service';

@Component({
  selector: 'app-detalle-foro',
  standalone: true,
  imports: [CommonModule, RouterModule,FormsModule],
  templateUrl: './detalle-foro.component.html',
  styleUrls: ['./detalle-foro.component.css']
})
export class DetalleForoComponent implements OnInit {
  foro: Foro | null = null;
  temas: Tema[] = [];
  participantes: Participante[] = [];
  
  cargando = true;
  tabActiva: 'temas' | 'participantes' | 'solicitudes' | 'logs' = 'temas';  
  
  usuarioActual: any;
  esAdmin = false;
  esModerador = false;

  totalSolicitudesPendientes = 0;
  cambiarTab(tab: 'temas' | 'participantes' | 'solicitudes' | 'logs'): void {
    this.tabActiva = tab;
    
    //Cargar datos cuando se cambia a la pestaña correspondiente
    if (tab === 'solicitudes' && this.esModerador) {
      this.cargarSolicitudesPendientes();
    }
  }

  cargarSolicitudesPendientes(): void {
    if (this.esModerador) {
      this.moderacionAvanzadaService.listarSolicitudes(this.foro!.id_foro)
        .subscribe({
          next: (solicitudes) => {
            this.totalSolicitudesPendientes = solicitudes.length;
          },
          error: () => {}
        });
    }
  }

  
  temaSeleccionado: Tema | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private foroService: ForoService,
    private authService: AuthService,
    private moderacionAvanzadaService: ModeracionAvanzadaService  
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUserInfo();
    const idForo = parseInt(this.route.snapshot.params['idForo']);
    this.cargarForo(idForo);
    this.cargarSolicitudesPendientes();
    this.cargarTemas(idForo);
    this.cargarParticipantes(idForo);
  }

  cargarForo(idForo: number): void {
    this.foroService.obtenerForo(idForo).subscribe({
      next: (foro) => {
        this.foro = foro;
        this.esAdmin = foro.rol_usuario === 'admin';
        this.esModerador = foro.rol_usuario === 'moderador' || this.esAdmin;
        this.cargando = false;
      },
      error: () => { this.router.navigate(['/foros']); }
    });
  }

  cargarTemas(idForo: number): void {
    this.foroService.listarTemas(idForo).subscribe({
      next: (r) => this.temas = r.data,
      error: (e) => console.error(e)
    });
  }

  cargarParticipantes(idForo: number): void {
    this.foroService.obtenerParticipantes(idForo).subscribe({
      next: (p) => this.participantes = p,
      error: (error) => {
        console.error('Error al cargar participantes:', error);
        // Si es 403, significa que no somos participantes pero podemos ver el foro
        if (error.status === 403 && this.foro?.publico) {
          console.log('Foro público pero no somos participantes - OK');
          this.participantes = []; // Lista vacía, se mostrará botón de unirse
        }
      }
    });
  }

  verTema(tema: Tema): void {
    this.router.navigate(['/foros', this.foro!.id_foro, 'temas', tema.id_tema]);
  }

  crearTema(): void {
    const titulo = prompt('Título del tema:');
    if (!titulo) return;

    this.foroService.crearTema(this.foro!.id_foro, { titulo }).subscribe({
      next: () => { alert('Tema creado'); this.cargarTemas(this.foro!.id_foro); },
      error: () => alert('Error al crear tema')
    });
  }

  eliminarForo(): void {
    if (!confirm('¿Eliminar foro?')) return;
    this.foroService.eliminarForo(this.foro!.id_foro).subscribe({
      next: () => { alert('Foro eliminado'); this.router.navigate(['/foros']); },
      error: () => alert('Error')
    });
  }

  getBadgeRol(rol: string): string {
    return this.foroService.getBadgeRol(rol as any);
  }

  getTextoRol(rol: string): string {
    return this.foroService.getTextoRol(rol as any);
  }
  unirseAlForo(): void {
    if (!this.foro) return;
    
    if (confirm('¿Deseas unirte a este foro?')) {
      this.foroService.unirseAForo(this.foro.id_foro).subscribe({
        next: () => {
          alert('Te has unido al foro exitosamente');
          this.cargarForo(this.foro!.id_foro);
          this.cargarParticipantes(this.foro!.id_foro);
        },
        error: (err) => {
          alert('Error al unirse al foro: ' + (err.error?.error || 'Error desconocido'));
        }
      });
    }
  }

  get esParticipante(): boolean {
    return this.foro?.rol_usuario !== null && this.foro?.rol_usuario !== undefined;
  }
  //Gestión de temas

cerrarTema(tema: Tema): void {
  if (!confirm('¿Cerrar este tema?')) return;

  this.moderacionAvanzadaService.cerrarTema(this.foro!.id_foro, tema.id_tema)
    .subscribe({
      next: () => {
        alert('Tema cerrado');
        this.cargarTemas(this.foro!.id_foro);
      },
      error: () => alert('Error al cerrar tema')
    });
}

abrirTema(tema: Tema): void {
  this.moderacionAvanzadaService.abrirTema(this.foro!.id_foro, tema.id_tema)
    .subscribe({
      next: () => {
        alert('Tema abierto');
        this.cargarTemas(this.foro!.id_foro);
      },
      error: () => alert('Error al abrir tema')
    });
}

fijarTema(tema: Tema): void {
  this.moderacionAvanzadaService.fijarTema(this.foro!.id_foro, tema.id_tema)
    .subscribe({
      next: () => {
        alert('Tema fijado');
        this.cargarTemas(this.foro!.id_foro);
      },
      error: () => alert('Error al fijar tema')
    });
}

  desfijarTema(tema: Tema): void {
    this.moderacionAvanzadaService.desfijarTema(this.foro!.id_foro, tema.id_tema)
      .subscribe({
        next: () => {
          alert('Tema desfijado');
          this.cargarTemas(this.foro!.id_foro);
        },
        error: () => alert('Error al desfijar tema')
      });
  }

  solicitarUnion(): void {
    const mensaje = prompt('Mensaje opcional para los moderadores:');
    
    this.moderacionAvanzadaService.crearSolicitud(
      this.foro!.id_foro,
      { mensaje: mensaje || undefined }
    ).subscribe({
      next: () => {
        alert('Solicitud enviada. Los moderadores la revisarán pronto.');
      },
      error: (err) => {
        alert(err.error?.error || 'Error al enviar solicitud');
      }
    });
  }
  // ========== MÉTODOS PARA SOLICITUDES ==========
  
  solicitudes: any[] = [];
  cargandoSolicitudes = false;
  
  cargarSolicitudesCompletas(): void {
    if (!this.esModerador) return;
    
    this.cargandoSolicitudes = true;
    this.moderacionAvanzadaService.listarSolicitudes(this.foro!.id_foro)
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes = solicitudes;
          this.totalSolicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
          this.cargandoSolicitudes = false;
        },
        error: (err) => {
          console.error('Error al cargar solicitudes:', err);
          this.solicitudes = [];
          this.cargandoSolicitudes = false;
        }
      });
  }
  
  aprobarSolicitud(solicitud: any): void {
    if (!confirm(`¿Aprobar solicitud de ${solicitud.usuario.nombre}?`)) return;
    
    this.moderacionAvanzadaService.aprobarSolicitud(this.foro!.id_foro, solicitud.id_solicitud)
      .subscribe({
        next: () => {
          alert('Solicitud aprobada');
          this.cargarSolicitudesCompletas();
          this.cargarParticipantes(this.foro!.id_foro);
        },
        error: () => alert('Error al aprobar solicitud')
      });
  }
  
  rechazarSolicitud(solicitud: any): void {
    const razon = prompt('Razón del rechazo (opcional):');
    
    this.moderacionAvanzadaService.rechazarSolicitud(this.foro!.id_foro, solicitud.id_solicitud, razon || undefined)
      .subscribe({
        next: () => {
          alert('Solicitud rechazada');
          this.cargarSolicitudesCompletas();
        },
        error: () => alert('Error al rechazar solicitud')
      });
  }
  
  getEstadoBadge(estado: string): string {
    const badges: Record<string, string> = {
      'pendiente': 'warning',
      'aprobada': 'success',
      'rechazada': 'danger'
    };
    return badges[estado] || 'secondary';
  }
  
  getEstadoTexto(estado: string): string {
    const textos: Record<string, string> = {
      'pendiente': 'Pendiente',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada'
    };
    return textos[estado] || estado;
  }
  
  // ========== MÉTODOS PARA LOGS ==========
  
  logs: any[] = [];
  cargandoLogs = false;
  logsFiltros = {
    tipo_accion: '',
    fecha_desde: '',
    fecha_hasta: ''
  };
  
  tiposAccion = [
    { value: '', label: 'Todas las acciones' },
    { value: 'eliminar_mensaje', label: 'Eliminar mensaje' },
    { value: 'restaurar_mensaje', label: 'Restaurar mensaje' },
    { value: 'editar_mensaje', label: 'Editar mensaje' },
    { value: 'cerrar_tema', label: 'Cerrar tema' },
    { value: 'abrir_tema', label: 'Abrir tema' },
    { value: 'fijar_tema', label: 'Fijar tema' },
    { value: 'desfijar_tema', label: 'Desfijar tema' },
    { value: 'banear_usuario', label: 'Banear usuario' },
    { value: 'desbanear_usuario', label: 'Desbanear usuario' }
  ];
  
  logsPage = 1;
  logsLimit = 10;
  logsTotalPages = 0;
  logsTotal = 0;
  
  cargarLogs(): void {
    if (!this.esModerador) return;
    
    this.cargandoLogs = true;
    
    const filtrosAplicados: any = {};
    if (this.logsFiltros.tipo_accion) filtrosAplicados.tipo_accion = this.logsFiltros.tipo_accion;
    if (this.logsFiltros.fecha_desde) filtrosAplicados.fecha_desde = this.logsFiltros.fecha_desde;
    if (this.logsFiltros.fecha_hasta) filtrosAplicados.fecha_hasta = this.logsFiltros.fecha_hasta;
    
    this.moderacionAvanzadaService.obtenerLogs(this.foro!.id_foro, filtrosAplicados, this.logsPage, this.logsLimit)
      .subscribe({
        next: (response) => {
          this.logs = response?.data || [];
          this.logsTotal = response?.meta?.total || 0;
          this.logsTotalPages = response?.meta?.totalPages || 0;
          this.cargandoLogs = false;
        },
        error: (err) => {
          console.error('Error al cargar logs:', err);
          this.logs = [];
          this.cargandoLogs = false;
        }
      });
  }
  
  aplicarFiltrosLogs(): void {
    this.logsPage = 1;
    this.cargarLogs();
  }
  
  limpiarFiltrosLogs(): void {
    this.logsFiltros = {
      tipo_accion: '',
      fecha_desde: '',
      fecha_hasta: ''
    };
    this.logsPage = 1;
    this.cargarLogs();
  }
  
  cambiarPaginaLogs(newPage: number): void {
    if (newPage >= 1 && newPage <= this.logsTotalPages) {
      this.logsPage = newPage;
      this.cargarLogs();
    }
  }
  
  getTextoAccion(tipo: string): string {
    return this.moderacionAvanzadaService.getTextoAccion(tipo);
  }
}