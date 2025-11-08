import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ForoService } from '../../../services/foro.service';
import { Foro, Tema, Participante } from '../../../interfaces/foro';
import { AuthService } from '../../../services/auth.service';
import { ModeracionAvanzadaService } from '../../../services/moderacion-avanzada.service';

@Component({
  selector: 'app-detalle-foro',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-foro.component.html',
  styleUrls: ['./detalle-foro.component.css']
})
export class DetalleForoComponent implements OnInit {
  foro: Foro | null = null;
  temas: Tema[] = [];
  participantes: Participante[] = [];
  
  cargando = true;
  tabActiva: 'temas' | 'participantes' = 'temas';
  
  
  usuarioActual: any;
  esAdmin = false;
  esModerador = false;

  totalSolicitudesPendientes = 0;
  cambiarTab(tab: 'temas' | 'participantes'): void {
  this.tabActiva = tab;
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
}