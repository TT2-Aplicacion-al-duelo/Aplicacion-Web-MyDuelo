// aplicacionWeb/src/app/psicologo/foros/gestion-participantes/gestion-participantes.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ForoService } from '../../../services/foro.service';
import { ModeracionService } from '../../../services/moderacion.service';
import { Foro, Participante } from '../../../interfaces/foro';
import { Baneo, BanearUsuarioDTO } from '../../../interfaces/moderacion';

@Component({
  selector: 'app-gestion-participantes',
  
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-participantes.component.html',
  styleUrls: ['./gestion-participantes.component.css'],
})
export class GestionParticipantesComponent implements OnInit {
  foro: Foro | null = null;
  participantes: Participante[] = [];
  baneos: Baneo[] = [];

  cargando = true;
  tabActiva: 'participantes' | 'baneos' = 'participantes';

  // Modal de baneo
  mostrarModalBaneo = false;
  participanteSeleccionado: Participante | null = null;
  formBaneo = {
    tipo_baneo: 'silencio' as 'silencio' | 'baneo',
    razon: '',
    dias_duracion: 7,
    es_permanente: false,
  };

  // Permisos del usuario actual
  esAdmin = false;
  esModerador = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private foroService: ForoService,
    private moderacionService: ModeracionService
  ) {}

  ngOnInit(): void {
    const idForo = parseInt(this.route.snapshot.params['idForo']);
    this.cargarDatos(idForo);
  }

  cargarDatos(idForo: number): void {
    this.cargando = true;

    // Cargar foro
    this.foroService.obtenerForo(idForo).subscribe({
      next: (foro) => {
        this.foro = foro;
        this.esAdmin = foro.rol_usuario === 'admin';
        this.esModerador = foro.rol_usuario === 'moderador' || this.esAdmin;

        if (!this.esModerador) {
          alert('No tienes permisos para gestionar participantes');
          this.router.navigate(['/foros', idForo]);
          return;
        }

        // Cargar participantes
        this.foroService.obtenerParticipantes(idForo).subscribe({
          next: (p) => {
            this.participantes = p;
            this.cargando = false;
          },
          error: () => {
            alert('Error al cargar participantes');
            this.cargando = false;
          },
        });

        // Cargar baneos
        this.cargarBaneos();
      },
      error: () => {
        alert('Error al cargar foro');
        this.router.navigate(['/foros']);
      },
    });
  }

  cargarBaneos(): void {
    if (!this.foro) return;

    this.moderacionService.listarBaneos(this.foro.id_foro, true).subscribe({
      next: (result) => {
        this.baneos = result.data;
      },
      error: (err) => console.error('Error al cargar baneos:', err),
    });
  }

  cambiarTab(tab: 'participantes' | 'baneos'): void {
    this.tabActiva = tab;
    if (tab === 'baneos') {
      this.cargarBaneos();
    }
  }

  // ========== FUNCIONES DE BANEO ==========

  abrirModalBaneo(participante: Participante): void {
    // No se puede banear a admins
    if (participante.rol === 'admin') {
      alert('No puedes sancionar a un administrador');
      return;
    }

    // Los moderadores no pueden banear a otros moderadores (solo admins pueden)
    if (participante.rol === 'moderador' && !this.esAdmin) {
      alert('Solo los administradores pueden sancionar a moderadores');
      return;
    }

    this.participanteSeleccionado = participante;
    this.formBaneo = {
      tipo_baneo: 'silencio',
      razon: '',
      dias_duracion: 7,
      es_permanente: false,
    };
    this.mostrarModalBaneo = true;
  }

  cerrarModalBaneo(): void {
    this.mostrarModalBaneo = false;
    this.participanteSeleccionado = null;
  }

  aplicarBaneo(): void {
    if (!this.participanteSeleccionado || !this.foro) return;

    if (this.formBaneo.razon.trim().length < 10) {
      alert('La razón debe tener al menos 10 caracteres');
      return;
    }

    const data: BanearUsuarioDTO = {
      tipo_usuario: this.participanteSeleccionado.tipo_usuario,
      id_usuario: this.participanteSeleccionado.usuario.id,
      tipo_baneo: this.formBaneo.tipo_baneo,
      razon: this.formBaneo.razon.trim(),
      dias_duracion: this.formBaneo.es_permanente
        ? undefined
        : this.formBaneo.dias_duracion,
    };

    this.moderacionService.banearUsuario(this.foro.id_foro, data).subscribe({
      next: () => {
        const accion =
          this.formBaneo.tipo_baneo === 'silencio' ? 'silenciado' : 'baneado';
        alert(`Usuario ${accion} exitosamente`);
        this.cerrarModalBaneo();
        this.cargarDatos(this.foro!.id_foro);
      },
      error: (err) => {
        alert(err.error?.error || 'Error al aplicar sanción');
      },
    });
  }

  levantarBaneo(baneo: Baneo): void {
    if (!confirm('¿Levantar esta sanción?')) return;

    this.moderacionService
      .levantarBaneo(this.foro!.id_foro, baneo.id_baneo)
      .subscribe({
        next: () => {
          alert('Sanción levantada exitosamente');
          this.cargarBaneos();
          this.cargarDatos(this.foro!.id_foro);
        },
        error: (err) => {
          alert(err.error?.error || 'Error al levantar sanción');
        },
      });
  }

  // ========== HELPERS ==========

  getBadgeRol(rol: string): string {
    return this.foroService.getBadgeRol(rol as any);
  }

  getTextoRol(rol: string): string {
    return this.foroService.getTextoRol(rol as any);
  }

  getClaseTipoBaneo(tipo: 'silencio' | 'baneo'): string {
    return this.moderacionService.getClaseTipoBaneo(tipo);
  }

  getTextoTipoBaneo(tipo: 'silencio' | 'baneo'): string {
    return this.moderacionService.getTextoTipoBaneo(tipo);
  }

  formatearDuracion(fechaExpiracion?: Date): string {
    return this.moderacionService.formatearDuracionBaneo(fechaExpiracion);
  }

  getNombreCompleto(participante: Participante): string {
    return `${participante.usuario.nombre} ${participante.usuario.apellido || ''}`;
  }
}