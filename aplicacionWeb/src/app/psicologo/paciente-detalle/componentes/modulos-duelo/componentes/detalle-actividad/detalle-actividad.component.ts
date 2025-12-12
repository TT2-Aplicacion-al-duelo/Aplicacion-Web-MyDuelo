import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisorEvidenciaComponent } from '../visor-evidencia/visor-evidencia.component';
//import { ActividadModulo, Evidencia } from '../../modulos-duelo.component';
import { ToastrService } from 'ngx-toastr';
import { ActividadModulo, Evidencia } from '../../../../../../interfaces/moduloDuelo';
import { environment } from '../../../../../../../environments/environment';

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

  // ngOnInit(): void {
  //   // Si hay evidencias y está permitido verlas, mostrar tab de evidencias
  //   if (this.tieneEvidenciasVisibles()) {
  //     this.tabActiva = 'evidencias';
  //   }
  // }
  ngOnInit(): void {
  console.log('🔍 DIAGNÓSTICO - Actividad recibida:', this.actividad);
  console.log('📋 Evidencias:', this.actividad.evidencias);
  console.log('👁️ Visible para psicólogo:', this.actividad.visible_para_psicologo);
  console.log('📊 Cantidad de evidencias:', this.actividad.evidencias?.length);
  console.log('✅ tieneEvidenciasVisibles():', this.tieneEvidenciasVisibles());
  
  // Si hay evidencias y está permitido verlas, mostrar tab de evidencias
  if (this.tieneEvidenciasVisibles()) {
    this.tabActiva = 'evidencias';
    console.log('✅ Cambiando a tab de evidencias');
  } else {
    console.log('❌ NO hay evidencias visibles');
  }
}

  cerrarModal(): void {
    this.cerrar.emit();
  }

  cambiarTab(tab: 'detalles' | 'evidencias'): void {
    this.tabActiva = tab;
  }

  // tieneEvidenciasVisibles(): boolean {
  //   return (
  //     this.actividad.evidencias !== undefined &&
  //     this.actividad.evidencias.length > 0 &&
  //     this.actividad.visible_para_psicologo
  //   );
  // }
tieneEvidenciasVisibles(): boolean {
  const tieneEvidencias = this.actividad.evidencias !== undefined;
  const hayEvidencias = (this.actividad.evidencias?.length ?? 0) > 0; // ✅ Añadir ?? 0
  const esVisible = this.actividad.visible_para_psicologo;
  
  console.log('🔍 tieneEvidenciasVisibles() - Diagnóstico:');
  console.log('  - evidencias !== undefined:', tieneEvidencias);
  console.log('  - evidencias.length:', this.actividad.evidencias?.length); // ✅ Cambiado
  console.log('  - hayEvidencias > 0:', hayEvidencias); // ✅ Cambiado
  console.log('  - visible_para_psicologo:', esVisible);
  console.log('  - Resultado final:', tieneEvidencias && hayEvidencias && esVisible);
  
  return (
    tieneEvidencias &&
    hayEvidencias &&
    esVisible
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

  descargarEvidencia(evidencia: Evidencia): void {
    // Validar que existe archivo_url
    if (!evidencia.archivo_url) {
      this.toastr.warning('Esta evidencia no tiene archivo para descargar');
      return;
    }

    // Crear un elemento <a> temporal para forzar la descarga
    const link = document.createElement('a');
    link.href = this.obtenerUrlCompleta(evidencia.archivo_url); // ✅ CAMBIO AQUÍ
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
    // Validar que existe archivo_url
    if (!evidencia.archivo_url) {
      this.toastr.warning('Esta evidencia no tiene archivo para abrir');
      return;
    }
    
    window.open(this.obtenerUrlCompleta(evidencia.archivo_url), '_blank'); // ✅ CAMBIO AQUÍ
  }

  /**
   * Obtener la URL completa para archivos de evidencia
   */
 obtenerUrlCompleta(url: string): string {
  console.log('🔍 obtenerUrlCompleta - URL recibida:', url); // ✅ DEBUG
  
  if (!url) return '';
  
  // Si la URL ya es completa (comienza con http), retornarla tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ URL ya es completa:', url); // ✅ DEBUG
    return url;
  }
  
  // Limpiar URLs duplicadas (ej: uploads/uploads/)
  const urlLimpia = url.replace(/^uploads\/uploads\//, 'uploads/');
  console.log('🧹 URL limpia:', urlLimpia); // ✅ DEBUG
  
  // Construir URL base del servidor
  let baseUrl = environment.apiUrl || 'http://localhost:3017';
  console.log('🌐 Base URL desde environment:', baseUrl); // ✅ DEBUG
  
  // Remover slash final si existe
  baseUrl = baseUrl.replace(/\/$/, '');
  console.log('🌐 Base URL limpia:', baseUrl); // ✅ DEBUG
  
  // Si la URL limpia no empieza con slash, agregarlo
  const path = urlLimpia.startsWith('/') ? urlLimpia : `/${urlLimpia}`;
  
  const urlFinal = `${baseUrl}${path}`;
  console.log('🎯 URL FINAL construida:', urlFinal); // ✅ DEBUG
  
  return urlFinal;
}

  /**
   * Obtener nombre legible del tipo de evidencia
   */
  obtenerNombreTipoEvidencia(tipo: string): string {
    const nombres: { [key: string]: string } = {
      'texto': 'Texto',
      'imagen': 'Imagen',
      'cronometro': 'Cronómetro',
      'documento': 'Documento',
      'video': 'Video',
      'audio': 'Audio',
      'otro': 'Otro'
    };
    
    return nombres[tipo] || 'Evidencia';
  }

  /**
   * Formatear duración en segundos a formato legible
   */
  formatearDuracion(segundos: number): string {
    if (!segundos) return '0s';
    
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    
    if (minutos > 0) {
      return `${minutos}m ${segs}s`;
    }
    
    return `${segs}s`;
  }

  /**
   * Manejar error al cargar imagen
   */
  onImageError(event: any): void {
    console.error('Error al cargar imagen:', event);
    event.target.src = 'assets/images/image-error.png'; // Imagen por defecto si hay error
    // O simplemente ocultar la imagen
    event.target.style.display = 'none';
  }

  /**
   * Verificar si una evidencia tiene contenido para mostrar
   */
  tieneContenido(evidencia: any): boolean {
    return !!(
      evidencia.contenido || 
      evidencia.archivo_url || 
      evidencia.duracion_segundos
    );
  }

  /**
   * Obtener icono según tipo de evidencia
   */
  obtenerIconoEvidencia(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'texto': 'bi-card-text',
      'imagen': 'bi-image',
      'cronometro': 'bi-stopwatch',
      'documento': 'bi-file-earmark',
      'video': 'bi-camera-video',
      'audio': 'bi-music-note',
      'otro': 'bi-paperclip'
    };
    
    return iconos[tipo] || 'bi-paperclip';
  }

  /**
   * Obtener clase de color según tipo de evidencia
   */
  obtenerColorEvidencia(tipo: string): string {
    const colores: { [key: string]: string } = {
      'texto': 'text-primary',
      'imagen': 'text-success',
      'cronometro': 'text-warning',
      'documento': 'text-secondary',
      'video': 'text-info',
      'audio': 'text-danger',
      'otro': 'text-muted'
    };
    
    return colores[tipo] || 'text-muted';
  }
  
}