import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ModeracionAvanzadaService } from '../../../services/moderacion-avanzada.service';
import { SolicitudUnion } from '../../../interfaces/foro';

@Component({
  selector: 'app-solicitudes-foro',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './solicitudes-foro.component.html',
  styleUrls: ['./solicitudes-foro.component.css']
})
export class SolicitudesForoComponent implements OnInit {
  solicitudes: SolicitudUnion[] = [];
  cargando = true;
  idForo!: number;

  constructor(
    private route: ActivatedRoute,
    private moderacionService: ModeracionAvanzadaService
  ) {}

  ngOnInit(): void {
    this.idForo = parseInt(this.route.snapshot.params['idForo']);
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.moderacionService.listarSolicitudes(this.idForo).subscribe({
      next: (solicitudes) => {
        this.solicitudes = solicitudes;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  aprobar(solicitud: SolicitudUnion): void {
    if (!confirm(`¿Aprobar la solicitud de ${solicitud.usuario.nombre}?`)) return;

    this.moderacionService.aprobarSolicitud(this.idForo, solicitud.id_solicitud)
      .subscribe({
        next: () => {
          alert('Solicitud aprobada');
          this.cargarSolicitudes();
        },
        error: () => alert('Error al aprobar solicitud')
      });
  }

  rechazar(solicitud: SolicitudUnion): void {
    const razon = prompt('Razón del rechazo (opcional):');
    if (razon === null) return;

    this.moderacionService.rechazarSolicitud(
      this.idForo,
      solicitud.id_solicitud,
      razon || undefined
    ).subscribe({
      next: () => {
        alert('Solicitud rechazada');
        this.cargarSolicitudes();
      },
      error: () => alert('Error al rechazar solicitud')
    });
  }
}