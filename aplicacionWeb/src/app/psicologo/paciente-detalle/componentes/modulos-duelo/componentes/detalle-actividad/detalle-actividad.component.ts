// ============================================
// detalle-actividad.component.ts
// ============================================
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisorEvidenciaComponent } from '../visor-evidencia/visor-evidencia.component';
//import { ActividadModulo, Evidencia } from '../../modulos-duelo.component';
import { ToastrService } from 'ngx-toastr';
import { ActividadModulo, Evidencia } from '../../../../../../interfaces/moduloDuelo';

@Component({
  selector: 'app-detalle-actividad',
  standalone: true,
  imports: [CommonModule, VisorEvidenciaComponent],
  templateUrl: './detalle-actividad.component.html',
  styleUrls: ['./detalle-actividad.component.css']
})
export class DetalleActividadComponent implements OnInit {
  @Input() actividad!: ActividadModulo;
  @Input() idPaciente!: number;
  @Input() colorModulo: string = 'primary';
  @Output() cerrar = new EventEmitter<void>();
  @Output() actividadActualizada = new EventEmitter<void>();

  evidenciaSeleccionada: Evidencia | null = null;
  mostrarVisorEvidencia: boolean = false;
  tabActiva: 'detalles' | 'evidencias' = 'detalles';

  constructor(private toastr: ToastrService) {}

  ngOnInit(): void {
    // Si hay evidencias y está permitido verlas, mostrar tab de evidencias
    if (this.tieneEvidenciasVisibles()) {
      this.tabActiva = 'evidencias';
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  cambiarTab(tab: 'detalles' | 'evidencias'): void {
    this.tabActiva = tab;
  }

  tieneEvidenciasVisibles(): boolean {
    return (
      this.actividad.evidencias !== undefined &&
      this.actividad.evidencias.length > 0 &&
      this.actividad.visible_para_psicologo
    );
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

  verEvidencia(evidencia: Evidencia): void {
    this.evidenciaSeleccionada = evidencia;
    this.mostrarVisorEvidencia = true;
  }

  cerrarVisorEvidencia(): void {
    this.mostrarVisorEvidencia = false;
    this.evidenciaSeleccionada = null;
  }

  obtenerIconoTipoArchivo(tipo: string): string {
    const iconos: Record<string, string> = {
      'imagen': 'bi-file-earmark-image',
      'video': 'bi-file-earmark-play',
      'audio': 'bi-file-earmark-music',
      'documento': 'bi-file-earmark-text',
      'otro': 'bi-file-earmark'
    };
    return iconos[tipo] || 'bi-file-earmark';
  }

  obtenerColorTipoArchivo(tipo: string): string {
    const colores: Record<string, string> = {
      'imagen': 'primary',
      'video': 'danger',
      'audio': 'warning',
      'documento': 'info',
      'otro': 'secondary'
    };
    return colores[tipo] || 'secondary';
  }

  /**
   * Descargar evidencia
   */
  descargarEvidencia(evidencia: Evidencia): void {
    // Crear un elemento <a> temporal para forzar la descarga
    const link = document.createElement('a');
    link.href = evidencia.archivo_url;
    link.target = '_blank';
    
    // Extraer el nombre del archivo de la URL
    const nombreArchivo = evidencia.archivo_url.split('/').pop() || 'evidencia';
    link.download = nombreArchivo;
    
    // Forzar click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Abrir evidencia en nueva pestaña
   */
  abrirEnNuevaPestana(evidencia: Evidencia): void {
    window.open(evidencia.archivo_url, '_blank');
  }
}