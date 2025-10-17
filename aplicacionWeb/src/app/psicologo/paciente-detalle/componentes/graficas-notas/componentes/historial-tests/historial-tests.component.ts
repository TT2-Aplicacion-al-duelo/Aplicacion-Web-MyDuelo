import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestsService } from '../../../../../../services/tests.service';
import { AplicacionTest, GraficaTest } from '../../../../../../interfaces/test';
import { DetalleRespuestasComponent } from '../detalle-respuestas/detalle-respuestas.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-historial-tests',
  imports: [CommonModule, FormsModule, DetalleRespuestasComponent],
  templateUrl: './historial-tests.component.html',
  styleUrls: ['./historial-tests.component.css']
})
export class HistorialTestsComponent implements OnInit {
  @Input() idPaciente!: number;

  historialTests: AplicacionTest[] = [];
  datosGraficas: GraficaTest[] = [];
  aplicacionSeleccionada: AplicacionTest | null = null;
  
  cargando: boolean = false;
  cargandoGraficas: boolean = false;
  mostrarDetalleRespuestas: boolean = false;

  // Filtros
  testsFiltro: { id: number; nombre: string }[] = [];
  filtroTestSeleccionado: number | null = null;

  constructor(
    private testsService: TestsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
    this.cargarDatosGraficas();
  }

  /**
   * Cargar historial de tests del paciente
   */
  cargarHistorial(): void {
    this.cargando = true;
    this.testsService.getHistorialTests(this.idPaciente).subscribe({
      next: (historial) => {
        this.historialTests = historial;
        this.extraerTestsParaFiltro();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.toastr.error('Error al cargar el historial de tests');
        this.cargando = false;
      }
    });
  }

  /**
   * Cargar datos para las gráficas
   */
  cargarDatosGraficas(idTest?: number): void {
    this.cargandoGraficas = true;
    this.testsService.getDatosGraficas(this.idPaciente, idTest).subscribe({
      next: (datos) => {
        this.datosGraficas = datos;
        this.cargandoGraficas = false;
      },
      error: (error) => {
        console.error('Error al cargar datos de gráficas:', error);
        this.cargandoGraficas = false;
      }
    });
  }

  /**
   * Extraer tests únicos para el filtro
   */
  private extraerTestsParaFiltro(): void {
    const testsMap = new Map<number, string>();
    this.historialTests.forEach(aplicacion => {
      if (aplicacion.test && !testsMap.has(aplicacion.test.id_test)) {
        testsMap.set(aplicacion.test.id_test, aplicacion.test.nombre);
      }
    });
    
    this.testsFiltro = Array.from(testsMap.entries()).map(([id, nombre]) => ({
      id,
      nombre
    }));
  }

  /**
   * Aplicar filtro de test
   */
  aplicarFiltro(): void {
    this.cargarDatosGraficas(this.filtroTestSeleccionado || undefined);
  }

  /**
   * Limpiar filtro
   */
  limpiarFiltro(): void {
    this.filtroTestSeleccionado = null;
    this.cargarDatosGraficas();
  }

  /**
   * Ver respuestas de un test
   */
  verRespuestas(aplicacion: AplicacionTest): void {
    this.aplicacionSeleccionada = aplicacion;
    this.mostrarDetalleRespuestas = true;
  }

  /**
   * Cerrar detalle de respuestas
   */
  cerrarDetalleRespuestas(): void {
    this.mostrarDetalleRespuestas = false;
    this.aplicacionSeleccionada = null;
  }

  /**
   * Descargar PDF de respuestas
   */
  descargarPDF(aplicacion: AplicacionTest): void {
    const nombreArchivo = `Test_${aplicacion.test?.nombre}_${new Date(aplicacion.fecha).toLocaleDateString()}.pdf`;
    this.testsService.descargarPDF(aplicacion.id_aplicacion, nombreArchivo);
    this.toastr.success('Descargando PDF...');
  }

  /**
   * Obtener color según puntaje (para visualización)
   */
  getColorPuntaje(puntaje: number): string {
    if (puntaje < 30) return 'success';
    if (puntaje < 60) return 'warning';
    return 'danger';
  }

  /**
   * Obtener badge de estado
   */
  getEstadoBadge(estado: string): string {
    return estado === 'completado' ? 'success' : 'warning';
  }

  /**
   * Obtener tests aplicados filtrados
   */
  get historialFiltrado(): AplicacionTest[] {
    if (!this.filtroTestSeleccionado) {
      return this.historialTests;
    }
    return this.historialTests.filter(
      aplicacion => aplicacion.id_test === this.filtroTestSeleccionado
    );
  }
}