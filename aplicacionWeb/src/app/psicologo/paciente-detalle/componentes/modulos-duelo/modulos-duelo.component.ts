// modulos-duelo.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaModulosComponent } from './componentes/lista-modulos/lista-modulos.component';
import { ModulosService } from '../../../../services/modulos.service';
import { ToastrService } from 'ngx-toastr';
import { ModuloDuelo } from '../../../../interfaces/moduloDuelo';
import { Evidencia } from '../../../../interfaces/actividad';



@Component({
  selector: 'app-modulos-duelo',
  standalone: true,
  imports: [CommonModule, ListaModulosComponent],
  templateUrl: './modulos-duelo.component.html',
  styleUrls: ['./modulos-duelo.component.css']
})
export class ModulosDueloComponent implements OnInit {
  @Input() idPaciente!: number;

  modulos: ModuloDuelo[] = [];
  cargando: boolean = true;
  progresoGeneral: number = 0;

  constructor(
    private modulosService: ModulosService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarModulos();
  }

  cargarModulos(): void {
    this.cargando = true;
    this.modulosService.getModulosPorPaciente(this.idPaciente).subscribe({
      next: (modulos: ModuloDuelo[]) => {
        this.modulos = modulos;
        this.calcularProgresoGeneral();
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar módulos:', error);
        this.toastr.error('Error al cargar los módulos de duelo');
        this.cargando = false;
      }
    });
  }

  calcularProgresoGeneral(): void {
    if (this.modulos.length === 0) {
      this.progresoGeneral = 0;
      return;
    }

    const sumaProgresos = this.modulos.reduce((sum, modulo) => sum + modulo.progreso, 0);
    this.progresoGeneral = Math.round(sumaProgresos / this.modulos.length);
  }

  obtenerColorProgreso(progreso: number): string {
    if (progreso < 30) return 'danger';
    if (progreso < 70) return 'warning';
    return 'success';
  }

    /**
   * Descargar archivo de evidencia
   */
  descargarEvidencia(evidencia: Evidencia): void {
    const link = document.createElement('a');
    link.href = evidencia.archivo_url;
    link.download = this.obtenerNombreArchivo(evidencia.archivo_url);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Obtener nombre del archivo de la URL
   */
  private obtenerNombreArchivo(url: string): string {
    const partes = url.split('/');
    return partes[partes.length - 1] || 'evidencia';
  }
}