// aplicacionWeb/src/app/psicologo/paciente-detalle/componentes/diario-emociones/diario-emociones.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiarioEmocionesService, EntradaDiario } from '../../../../services/diario-emociones.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-diario-emociones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diario-emociones.component.html',
  styleUrls: ['./diario-emociones.component.css']
})
export class DiarioEmocionesComponent implements OnInit {
  @Input() idPaciente!: number;

  entradas: EntradaDiario[] = [];
  entradasFiltradas: EntradaDiario[] = [];
  cargando: boolean = false;

  // Filtros
  filtroFecha: string = '';
  filtroEmocion: string = '';

  // Emociones disponibles
  emociones = ['Feliz', 'Bien', 'Normal', 'Triste', 'Terrible', 'Enojado'];

  constructor(
    private diarioService: DiarioEmocionesService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarDiario();
  }

  /**
   * Cargar entradas del diario
   */
  cargarDiario(): void {
    this.cargando = true;
    this.diarioService.getDiarioEmociones(this.idPaciente).subscribe({
      next: (entradas) => {
        this.entradas = entradas;
        this.entradasFiltradas = entradas;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar diario:', error);
        this.toastr.error('Error al cargar el diario emocional');
        this.cargando = false;
      }
    });
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros(): void {
    this.entradasFiltradas = this.entradas.filter(entrada => {
      const cumpleFecha = !this.filtroFecha || entrada.fecha === this.filtroFecha;
      const cumpleEmocion = !this.filtroEmocion || entrada.emocion === this.filtroEmocion;
      return cumpleFecha && cumpleEmocion;
    });
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtroFecha = '';
    this.filtroEmocion = '';
    this.entradasFiltradas = this.entradas;
  }

  /**
   * Obtener icono de emoción
   */
  obtenerIconoEmocion(emocion: string): string {
    const iconos: { [key: string]: string } = {
      'Feliz': '😊',
      'Bien': '🙂',
      'Normal': '😐',
      'Triste': '😢',
      'Terrible': '😭',
      'Enojado': '😠'
    };
    return iconos[emocion] || '😐';
  }

  /**
   * Obtener clase CSS de color según emoción
   */
  obtenerColorEmocion(emocion: string): string {
    const colores: { [key: string]: string } = {
      'Feliz': 'emocion-feliz',
      'Bien': 'emocion-bien',
      'Normal': 'emocion-normal',
      'Triste': 'emocion-triste',
      'Terrible': 'emocion-terrible',
      'Enojado': 'emocion-enojado'
    };
    return colores[emocion] || 'emocion-normal';
  }

  /**
   * Formatear fecha a formato legible
   */
  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}