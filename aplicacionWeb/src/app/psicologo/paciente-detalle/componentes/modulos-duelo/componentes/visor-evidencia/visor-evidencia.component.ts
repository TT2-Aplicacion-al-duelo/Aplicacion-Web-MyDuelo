// visor-evidencia.component.ts - CORREGIDO
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Evidencia } from '../../../../../../interfaces/moduloDuelo';

@Component({
  selector: 'app-visor-evidencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visor-evidencia.component.html',
  styleUrls: ['./visor-evidencia.component.css']
})
export class VisorEvidenciaComponent implements OnInit {
  @Input() evidencia!: Evidencia;
  @Input() colorModulo: string = 'primary';
  @Output() cerrar = new EventEmitter<void>();

  urlSegura: SafeResourceUrl | null = null;
  tipoVisualizacion: 'imagen' | 'video' | 'audio' | 'iframe' | 'enlace' = 'enlace';
  errorCarga: boolean = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.determinarTipoVisualizacion();
  }

  determinarTipoVisualizacion(): void {
    // CORRECCIÓN: Validar que archivo_url existe
    if (!this.evidencia.archivo_url) {
      this.tipoVisualizacion = 'enlace';
      return;
    }

    const url = this.evidencia.archivo_url.toLowerCase();
    const tipo = this.evidencia.tipo_archivo;

    // Determinar por tipo de archivo
    if (tipo === 'imagen' || this.esImagen(url)) {
      this.tipoVisualizacion = 'imagen';
    } else if (tipo === 'video' || this.esVideo(url)) {
      this.tipoVisualizacion = 'video';
    } else if (tipo === 'audio' || this.esAudio(url)) {
      this.tipoVisualizacion = 'audio';
    } else if (this.esPDFoDocumento(url)) {
      this.tipoVisualizacion = 'iframe';
      this.urlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.evidencia.archivo_url
      );
    } else {
      this.tipoVisualizacion = 'enlace';
    }
  }

  esImagen(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(url);
  }

  esVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|mov|avi)$/i.test(url) || 
           url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com');
  }

  esAudio(url: string): boolean {
    return /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(url);
  }

  esPDFoDocumento(url: string): boolean {
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url) || 
           url.includes('/document/') || 
           url.includes('docs.google.com');
  }

  obtenerURLYoutube(): SafeResourceUrl | null {
    // CORRECCIÓN: Validar que archivo_url existe
    if (!this.evidencia.archivo_url) {
      return null;
    }

    const url = this.evidencia.archivo_url;
    let videoId = '';

    // Extraer ID de diferentes formatos de YouTube
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0] || '';
    }

    if (videoId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );
    }

    return null;
  }

  obtenerURLVimeo(): SafeResourceUrl | null {
    // CORRECCIÓN: Validar que archivo_url existe
    if (!this.evidencia.archivo_url) {
      return null;
    }

    const url = this.evidencia.archivo_url;
    const match = url.match(/vimeo\.com\/(\d+)/);
    
    if (match && match[1]) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://player.vimeo.com/video/${match[1]}`
      );
    }

    return null;
  }

  cerrarVisor(): void {
    this.cerrar.emit();
  }

  /**
   * Abrir en nueva pestaña
   */
  abrirEnNuevaPestana(): void {
    // CORRECCIÓN: Validar que archivo_url existe
    if (!this.evidencia.archivo_url) {
      console.warn('No hay URL para abrir');
      return;
    }
    
    window.open(this.evidencia.archivo_url, '_blank');
  }

  /**
   * Descargar archivo
   */
  descargarArchivo(): void {
    // CORRECCIÓN: Validar que archivo_url existe
    if (!this.evidencia.archivo_url) {
      console.warn('No hay URL para descargar');
      return;
    }

    // Usar fetch para forzar descarga
    fetch(this.evidencia.archivo_url)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.obtenerNombreArchivo();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error al descargar:', error);
        // Fallback: abrir en nueva pestaña
        this.abrirEnNuevaPestana();
      });
  }

  manejarErrorCarga(): void {
    this.errorCarga = true;
  }

  obtenerNombreArchivo(): string {
    // CORRECCIÓN: Validar que archivo_url existe
    if (!this.evidencia.archivo_url) {
      return 'archivo';
    }

    const url = this.evidencia.archivo_url;
    const partes = url.split('/');
    return partes[partes.length - 1] || 'archivo';
  }
}