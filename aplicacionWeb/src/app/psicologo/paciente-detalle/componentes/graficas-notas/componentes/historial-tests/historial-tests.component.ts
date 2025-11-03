
import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestsService } from '../../../../../../services/tests.service';
import { PdfGeneratorService } from '../../../../../../services/pdf-generator.service';
import { AplicacionTest, GraficaTest, RespuestaTest } from '../../../../../../interfaces/test';
import { Paciente } from '../../../../../../interfaces/paciente';
import { ToastrService } from 'ngx-toastr';
import { Chart, registerables } from 'chart.js';
import { ITRDInterpretacionHelper } from '../../../../../../services/helpers/itrd-interpretacion.helper';
import { DetalleRespuestasComponent } from '../detalle-respuestas/detalle-respuestas.component';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-historial-tests',
  imports: [CommonModule, FormsModule, DetalleRespuestasComponent],
  templateUrl: './historial-tests.component.html',
  styleUrls: ['./historial-tests.component.css']
})
export class HistorialTestsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() idPaciente!: number;
  @Input() paciente!: Paciente; // ✅ NUEVO: Recibir datos completos del paciente
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  historialTests: AplicacionTest[] = [];
  datosGraficas: GraficaTest[] = [];
  
  cargando: boolean = false;
  cargandoGraficas: boolean = false;

  // Chart.js
  chart: Chart | null = null;
  mostrarGrafica: boolean = false;

  // Filtros
  testsFiltro: { id: number; nombre: string }[] = [];
  filtroTestSeleccionado: number | null = null;

  // ✅ NUEVO: Control del modal de respuestas
  mostrarModalRespuestas: boolean = false;
  aplicacionSeleccionada: AplicacionTest | null = null;

  constructor(
    private testsService: TestsService,
    private pdfService: PdfGeneratorService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  ngAfterViewInit(): void {
    // La gráfica se creará cuando haya datos
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
        this.verificarYCrearGraficaITRD();
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
   * Verificar si hay datos ITRD y crear gráfica
   */
  private verificarYCrearGraficaITRD(): void {
    const aplicacionesITRD = this.historialTests.filter(app => 
      app.test?.nombre && this.esTestITRD(app.test.nombre)
    );

    if (aplicacionesITRD.length > 0) {
      this.mostrarGrafica = true;
      setTimeout(() => {
        this.crearGraficaITRD();
      }, 100);
    }
  }

  /**
   * Crear gráfica de barras para ITRD
   */
  private crearGraficaITRD(): void {
    if (!this.chartCanvas) {
      console.warn('Canvas no disponible aún');
      return;
    }

    const aplicacionesITRD = this.historialTests.filter(app => 
      app.test?.nombre && this.esTestITRD(app.test.nombre)
    );

    const itrdPasado = aplicacionesITRD
      .filter(app => app.test?.nombre.toLowerCase().includes('pasado'))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    const itrdPresente = aplicacionesITRD
      .filter(app => app.test?.nombre.toLowerCase().includes('presente'))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    // Agregar ITRD Pasado (si existe)
    itrdPasado.forEach((app, index) => {
      labels.push(`ITRD Pasado${itrdPasado.length > 1 ? ` (${index + 1})` : ''}`);
      data.push(app.resultado?.puntaje_total ?? 0);
      backgroundColors.push('rgba(255, 99, 132, 0.5)');
      borderColors.push('rgb(255, 99, 132)');
    });

    // Agregar ITRD Presente
    itrdPresente.forEach((app, index) => {
      const fecha = new Date(app.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
      labels.push(`ITRD Presente (${fecha})`);
      data.push(app.resultado?.puntaje_total ?? 0);
      backgroundColors.push('rgba(54, 162, 235, 0.5)');
      borderColors.push('rgb(54, 162, 235)');
    });

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Puntaje Total',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 10
            },
            title: {
              display: true,
              text: 'Puntaje (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Aplicaciones del Test'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Puntaje: ${context.parsed.y}%`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * ✅ NUEVO: Abrir modal de respuestas
   */
  verRespuestas(aplicacion: AplicacionTest): void {
    this.aplicacionSeleccionada = aplicacion;
    this.mostrarModalRespuestas = true;
  }

  /**
   * ✅ NUEVO: Cerrar modal de respuestas
   */
  cerrarModalRespuestas(): void {
    this.mostrarModalRespuestas = false;
    this.aplicacionSeleccionada = null;
  }

  /**
   * ✅ CORREGIDO: Descargar PDF con nombre del paciente
   */
  async descargarPDF(aplicacion: AplicacionTest): Promise<void> {
    this.toastr.info('Generando PDF...', '', { timeOut: 2000 });

    try {
      const respuestas = await this.testsService.getRespuestasTest(aplicacion.id_aplicacion).toPromise();
      
      if (!respuestas) {
        this.toastr.error('No se pudieron cargar las respuestas');
        return;
      }

      let chartImageData: string | undefined = undefined;
      if (this.esTestITRD(aplicacion.test?.nombre || '') && this.chart) {
        chartImageData = this.chart.toBase64Image();
      }

      // ✅ CORREGIDO: Usar nombre completo del paciente
      const nombrePaciente = this.paciente 
        ? `${this.paciente.nombre} ${this.paciente.apellido_paterno} ${this.paciente.apellido_materno}`.trim()
        : 'Paciente';

      await this.pdfService.generarPDFTest(
        aplicacion,
        respuestas,
        nombrePaciente,
        chartImageData
      );

      this.toastr.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.toastr.error('Error al generar el PDF');
    }
  }

  /**
   * Verificar si es test ITRD
   */
  esTestITRD(nombreTest: string): boolean {
    return ITRDInterpretacionHelper.esTestITRD(nombreTest);
  }

  /**
   * Obtener color según puntaje
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

  /**
   * Cleanup al destruir el componente
   */
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}






