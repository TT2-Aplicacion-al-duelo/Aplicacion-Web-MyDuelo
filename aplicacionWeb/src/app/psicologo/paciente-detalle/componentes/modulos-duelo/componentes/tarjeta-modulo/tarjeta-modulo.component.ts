// sub-componentes/tarjeta-modulo/tarjeta-modulo.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleActividadComponent } from '../detalle-actividad/detalle-actividad.component';
import { ActividadModulo, ModuloDuelo } from '../../../../../../interfaces/moduloDuelo';
//import { ModuloDuelo, ActividadModulo } from '../../modulos-duelo.component';

@Component({
  selector: 'app-tarjeta-modulo',
  standalone: true,
  imports: [
    CommonModule,
    DetalleActividadComponent
  ],
  templateUrl: './tarjeta-modulo.component.html',
  styleUrls: ['./tarjeta-modulo.component.css']
})
export class TarjetaModuloComponent {
  @Input() modulo!: ModuloDuelo;
  @Input() color: string = 'primary';
  @Input() icono: string = 'bi-circle';
  @Input() idPaciente!: number;
  @Output() moduloActualizado = new EventEmitter<void>();

  expandido: boolean = false;
  actividadSeleccionada: ActividadModulo | null = null;
  mostrarDetalleModal: boolean = false;

  toggleExpandir(): void {
    this.expandido = !this.expandido;
  }

  obtenerColorProgreso(progreso: number): string {
    if (progreso < 30) return 'danger';
    if (progreso < 70) return 'warning';
    return 'success';
  }

  obtenerEstadoBadge(estado: string): string {
    const badges: Record<string, string> = {
      'no_asignada': 'secondary',
      'en_proceso': 'warning',
      'finalizada': 'success'
    };
    return badges[estado] || 'secondary';
  }

  obtenerTextoEstado(estado: string): string {
    const textos: Record<string, string> = {
      'no_asignada': 'No Asignada',
      'en_proceso': 'En Proceso',
      'finalizada': 'Completada'
    };
    return textos[estado] || estado;
  }

  verDetalleActividad(actividad: ActividadModulo): void {
    if (actividad.estado === 'no_asignada') return;
    
    this.actividadSeleccionada = actividad;
    this.mostrarDetalleModal = true;
  }

  cerrarModal(): void {
    this.mostrarDetalleModal = false;
    this.actividadSeleccionada = null;
  }

  onActividadActualizada(): void {
    this.moduloActualizado.emit();
    this.cerrarModal();
  }

  contarActividadesPorEstado(estado: string): number {
    return this.modulo.actividades.filter(act => act.estado === estado).length;
  }
}