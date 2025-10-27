import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ForoService } from '../../../services/foro.service';
import { Invitacion } from '../../../interfaces/foro';

@Component({
  selector: 'app-invitaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invitaciones.component.html',
  styleUrls: ['./invitaciones.component.css']
})
export class InvitacionesComponent implements OnInit {
  invitaciones: Invitacion[] = [];
  cargando = true;

  constructor(private foroService: ForoService) {}

  ngOnInit(): void {
    this.cargarInvitaciones();
  }

  cargarInvitaciones(): void {
    this.cargando = true;
    this.foroService.listarInvitaciones().subscribe({
      next: (invs) => {
        this.invitaciones = invs;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  responder(inv: Invitacion, aceptar: boolean): void {
    const accion = aceptar ? 'aceptar' : 'rechazar';
    if (!confirm(`¿Deseas ${accion} la invitación?`)) return;

    this.foroService.responderInvitacion(inv.id_invitacion, { aceptar }).subscribe({
      next: () => {
        alert(aceptar ? 'Invitación aceptada' : 'Invitación rechazada');
        this.cargarInvitaciones();
      },
      error: () => alert('Error al responder')
    });
  }

  getBadgeEstado(estado: string): string {
    return {
      'pendiente': 'bg-warning',
      'aceptada': 'bg-success',
      'rechazada': 'bg-danger'
    }[estado] || 'bg-secondary';
  }
}